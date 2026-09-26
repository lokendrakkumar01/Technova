const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MAX_PARTICIPANTS = 150;

// Enable CORS and JSON parsing
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '2mb' }));

// Ensure local uploads directory exists as fallback
const uploadDir = path.join(__dirname, 'public', 'uploads');
const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const readLocalData = (name, fallback = []) => {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8')); }
  catch { return fallback; }
};
const writeLocalData = (name, value) => {
  const target = path.join(dataDir, name);
  const temporary = target + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2));
  fs.renameSync(temporary, target);
};
let localLeaderboard = readLocalData('leaderboard.json');
let localParticipants = readLocalData('participants.json');
let localMemories = readLocalData('memories.json');
let liveGameState = readLocalData('live-game-state.json', {
  status: 'registration',
  approvedRound: 1,
  pendingRound: null,
  hostPaused: false,
  actionSequence: 0,
  hostAction: null,
  hostActions: [],
  participants: [],
});
async function saveLiveGameState(nextState) {
  liveGameState = nextState;
  if (isMongoConnected && db) {
    await db.collection('settings').replaceOne(
      { _id: 'live-game-state' },
      { _id: 'live-game-state', ...nextState, updatedAt: new Date() },
      { upsert: true }
    );
  } else {
    writeLocalData('live-game-state.json', nextState);
  }
  return liveGameState;
}
async function getLiveGameState() {
  if (isMongoConnected && db) {
    const saved = await db.collection('settings').findOne({ _id: 'live-game-state' });
    if (saved) {
      const { _id, updatedAt: _updatedAt, ...state } = saved;
      liveGameState = { ...liveGameState, ...state };
    }
  }
  return liveGameState;
}
function publicLiveGameState(state, { includeParticipants = true, afterActionId = 0 } = {}) {
  const participants = state.participants || [];
  const hostActions = Array.isArray(state.hostActions) ? state.hostActions : (state.hostAction ? [state.hostAction] : []);
  return {
    status: state.status,
    approvedRound: Number(state.approvedRound) || 1,
    pendingRound: state.pendingRound || null,
    hostPaused: Boolean(state.hostPaused),
    actionSequence: Number(state.actionSequence) || 0,
    hostAction: state.hostAction || null,
    hostActions: hostActions.filter((action) => Number(action.id) > afterActionId),
    participantCount: participants.length,
    ...(includeParticipants ? { participants: participants.map(({ id, name, mode, score, correctAnswers, totalAnswered, registeredAt, completed }) => ({
      id, name, mode, score: Number(score) || 0, correctAnswers: Number(correctAnswers) || 0,
      totalAnswered: Number(totalAnswered) || 0, registeredAt, completed: Boolean(completed),
    })) } : {}),
    updatedAt: state.updatedAt || null,
  };
}
const publicMemoryId = (item) => String(item.id || item._id || crypto.createHash('sha256').update(`${item.url || ''}:${item.createdAt || ''}`).digest('hex').slice(0, 24));
const memoryIdFilter = (id) => ({ $or: [
  { id },
  ...(/^[a-f\d]{24}$/i.test(id) ? [{ _id: new ObjectId(id) }] : []),
] });

// ─── 1. MONGODB CLIENT CONFIGURATION ──────────────────────────────────────────
const mongoUri = process.env.MONGODB_URI;
const client = mongoUri ? new MongoClient(mongoUri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
}) : null;

let db = null;
let isMongoConnected = false;

async function connectToMongo() {
  if (!client) {
    console.warn('MONGODB_URI is not set; using local JSON persistence.');
    return;
  }
  try {
    await client.connect();
    const databaseName = process.env.DB_NAME || new URL(mongoUri).pathname.replace(/^\/+/, '').split('?')[0] || 'techdecode';
    db = client.db(databaseName);
    // Ping confirmation
    await client.db('admin').command({ ping: 1 });
    isMongoConnected = true;
    console.log('>>> [TECHDECODE] MongoDB Atlas Connected Successfully! <<<');
  } catch (err) {
    console.warn('MongoDB connection warning:', err.message);
    isMongoConnected = false;
  }
}
connectToMongo();

// ─── 2. CLOUDINARY CONFIGURATION ──────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Configure multer
const mediaExtensions = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'image/avif': '.avif',
  'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov', 'video/ogg': '.ogv',
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${mediaExtensions[file.mimetype] || '.bin'}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (mediaExtensions[file.mimetype]) return cb(null, true);
    cb(new Error('Unsupported upload format. Use JPEG, PNG, GIF, WebP, AVIF, MP4, WebM, MOV, or OGG.'));
  },
});

const adminSessions = new Map();
const ADMIN_SESSION_TTL = 8 * 60 * 60 * 1000;

function requireAdmin(req, res, next) {
  const token = req.get('x-admin-token');
  const session = token && adminSessions.get(token);
  if (!session || session.role !== 'admin' || session.expiresAt < Date.now()) {
    if (token) adminSessions.delete(token);
    return res.status(401).json({ error: 'Admin session expired. Please sign in again.' });
  }
  next();
}

function requireHost(req, res, next) {
  const token = req.get('x-host-token');
  const session = token && adminSessions.get(token);
  if (!session || session.role !== 'host' || session.expiresAt < Date.now()) {
    if (token) adminSessions.delete(token);
    return res.status(401).json({ error: 'Host session expired. Please sign in again.' });
  }
  next();
}

function issueSession(req, res, envName) {
  const configuredPin = process.env[envName];
  if (!configuredPin) return res.status(503).json({ error: envName + ' is not configured on the server.' });
  const supplied = Buffer.from(String(req.body?.pin || ''));
  const expected = Buffer.from(configuredPin);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return res.status(401).json({ error: 'Incorrect passcode.' });
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, { expiresAt: Date.now() + ADMIN_SESSION_TTL, role: envName === 'ADMIN_PIN' ? 'admin' : 'host' });
  res.json({ token, expiresIn: ADMIN_SESSION_TTL });
}
app.post('/api/admin/login', (req, res) => issueSession(req, res, 'ADMIN_PIN'));
app.post('/api/host/login', (req, res) => issueSession(req, res, 'HOST_PIN'));

function extractYoutubeId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    let id = '';
    if (host === 'youtu.be') id = parsed.pathname.slice(1);
    else if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      id = parsed.searchParams.get('v') || parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] || '';
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

// ─── 3. API ENDPOINTS ─────────────────────────────────────────────────────────

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'TECHDECODE Game Show Engine',
    mongoConnected: isMongoConnected,
    storage: isMongoConnected ? 'mongodb' : 'local-json',
    durableStorage: isMongoConnected,
    cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
    timestamp: new Date().toISOString(),
  });
});

// ─── PARTICIPANTS & TEAMS ─────────────────────────────────────────────────────
app.get('/api/game/state', async (req, res) => {
  try { res.json(publicLiveGameState(await getLiveGameState(), { includeParticipants: req.query.compact !== '1', afterActionId: Math.max(0, Number(req.query.afterActionId) || 0) })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/host/game/state', requireHost, async (req, res) => {
  try { res.json(publicLiveGameState(await getLiveGameState())); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/host/game/start', requireHost, async (req, res) => {
  try {
    const state = await getLiveGameState();
    if (state.status === 'playing') return res.status(409).json({ error: 'A contest is already in progress. End the current contest before starting another.' });
    if (!(state.participants || []).length) return res.status(409).json({ error: 'Register at least one player or team before starting.' });
    const nextState = {
      ...state,
      status: 'playing',
      approvedRound: 1,
      pendingRound: null,
      hostPaused: false,
      hostAction: null,
      hostActions: [],
      participants: (state.participants || []).map((participant) => ({
        ...participant, score: 0, correctAnswers: 0, totalAnswered: 0, completed: false,
      })),
      updatedAt: new Date().toISOString(),
    };
    await saveLiveGameState(nextState);
    res.json({ success: true, state: publicLiveGameState(nextState) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/host/game/pause', requireHost, async (req, res) => {
  try {
    const state = await getLiveGameState();
    if (state.status !== 'playing') return res.status(409).json({ error: 'Pause and resume controls are available only during an active contest.' });
    const nextState = { ...state, hostPaused: Boolean(req.body?.paused), updatedAt: new Date().toISOString() };
    await saveLiveGameState(nextState);
    res.json({ success: true, state: publicLiveGameState(nextState) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/host/game/finish', requireHost, async (req, res) => {
  try {
    const state = await getLiveGameState();
    const nextState = {
      ...state,
      status: 'finished',
      pendingRound: null,
      hostPaused: false,
      participants: (state.participants || []).map((participant) => ({ ...participant, completed: true })),
      updatedAt: new Date().toISOString(),
    };
    await saveLiveGameState(nextState);
    res.json({ success: true, state: publicLiveGameState(nextState) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/host/game/action', requireHost, async (req, res) => {
  const allowedActions = new Set(['next-question', 'forward-round', 'reveal-answer', 'skip-question', 'reset-question']);
  const action = String(req.body?.action || '');
  if (!allowedActions.has(action)) return res.status(400).json({ error: 'Choose a supported game control.' });
  try {
    const state = await getLiveGameState();
    if (state.status !== 'playing') return res.status(409).json({ error: 'Game controls are available only while a contest is in progress.' });
    const nextState = {
      ...state,
      actionSequence: (Number(state.actionSequence) || 0) + 1,
      hostAction: { id: (Number(state.actionSequence) || 0) + 1, action, createdAt: new Date().toISOString() },
      hostActions: [...(Array.isArray(state.hostActions) ? state.hostActions : []), { id: (Number(state.actionSequence) || 0) + 1, action, createdAt: new Date().toISOString() }].slice(-256),
      updatedAt: new Date().toISOString(),
    };
    await saveLiveGameState(nextState);
    res.json({ success: true, state: publicLiveGameState(nextState) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/host/participant/score', requireHost, async (req, res) => {
  const participantId = String(req.body?.participantId || '').trim();
  const reset = req.body?.reset === true;
  const delta = Number(req.body?.delta);
  if (!participantId) return res.status(400).json({ error: 'Choose a participant first.' });
  if (!reset && (!Number.isInteger(delta) || Math.abs(delta) > 1000)) return res.status(400).json({ error: 'Score adjustments must be whole numbers from -1000 to 1000.' });
  try {
    const state = await getLiveGameState();
    const participant = (state.participants || []).find((item) => item.id === participantId);
    if (!participant) return res.status(404).json({ error: 'Participant was not found in the live session.' });
    const score = reset ? 0 : Math.max(0, (Number(participant.score) || 0) + delta);
    if (isMongoConnected && db) {
      const result = await db.collection('settings').updateOne(
        { _id: 'live-game-state', 'participants.id': participantId },
        { $set: { 'participants.$.score': score, updatedAt: new Date().toISOString() } }
      );
      if (result.matchedCount !== 1) return res.status(404).json({ error: 'Participant was not found in the live session.' });
      await db.collection('leaderboard').updateOne(
        { id: participantId },
        { $set: { id: participantId, name: participant.name, mode: participant.mode, score, correctAnswers: Number(participant.correctAnswers) || 0, updatedAt: new Date(), ...(participant.completed ? { completed: true } : {}) } },
        { upsert: true }
      );
      return res.json({ success: true, score, state: publicLiveGameState(await getLiveGameState()) });
    }
    const participants = state.participants.map((item) => item.id === participantId ? { ...item, score } : item);
    await saveLiveGameState({ ...state, participants, updatedAt: new Date().toISOString() });
    const leaderboardEntry = {
      id: participantId,
      name: participant.name,
      mode: participant.mode,
      score,
      correctAnswers: Number(participant.correctAnswers) || 0,
      ...(participant.completed ? { completed: true } : {}),
      updatedAt: new Date().toISOString(),
    };
    const hasLeaderboardEntry = localLeaderboard.some((item) => item.id === participantId);
    localLeaderboard = hasLeaderboardEntry
      ? localLeaderboard.map((item) => item.id === participantId ? { ...item, ...leaderboardEntry } : item)
      : [...localLeaderboard, leaderboardEntry];
    writeLocalData('leaderboard.json', localLeaderboard);
    res.json({ success: true, score, state: publicLiveGameState(await getLiveGameState()) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/host/game/open-registration', requireHost, async (req, res) => {
  try {
    const state = await getLiveGameState();
    const nextState = {
      ...state,
      status: 'registration',
      approvedRound: 1,
      pendingRound: null,
      hostPaused: false,
      hostAction: null,
      hostActions: [],
      participants: [],
      updatedAt: new Date().toISOString(),
    };
    await saveLiveGameState(nextState);
    res.json({ success: true, state: publicLiveGameState(nextState) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/game/round-ready', async (req, res) => {
  const participantId = String(req.body?.participantId || '').trim();
  const round = Number(req.body?.round);
  if (!participantId || !Number.isInteger(round) || round < 2 || round > 4) {
    return res.status(400).json({ error: 'Participant and valid next round are required.' });
  }
  try {
    if (isMongoConnected && db) {
      const result = await db.collection('settings').updateOne(
        { _id: 'live-game-state', status: 'playing', 'participants.id': participantId, approvedRound: round - 1 },
        { $max: { pendingRound: round }, $set: { updatedAt: new Date().toISOString() } }
      );
      if (result.matchedCount === 0) {
        const state = await getLiveGameState();
        if (state.status !== 'playing') return res.status(409).json({ error: 'The game is not active.' });
        if (!(state.participants || []).some((participant) => participant.id === participantId)) return res.status(404).json({ error: 'Registered participant was not found.' });
      }
      return res.json({ success: true, state: publicLiveGameState(await getLiveGameState(), { includeParticipants: false }) });
    }

    const state = await getLiveGameState();
    if (state.status !== 'playing') return res.status(409).json({ error: 'The game is not active.' });
    if (!(state.participants || []).some((participant) => participant.id === participantId)) return res.status(404).json({ error: 'Registered participant was not found.' });
    if (round > Number(state.approvedRound) && round === Number(state.approvedRound) + 1) {
      await saveLiveGameState({ ...state, pendingRound: Math.max(Number(state.pendingRound) || 0, round), updatedAt: new Date().toISOString() });
    }
    res.json({ success: true, state: publicLiveGameState(await getLiveGameState(), { includeParticipants: false }) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/host/round-approve', requireHost, async (req, res) => {
  const round = Number(req.body?.round);
  if (!Number.isInteger(round) || round < 2 || round > 4) return res.status(400).json({ error: 'A valid round is required.' });
  try {
    const state = await getLiveGameState();
    if (state.status !== 'playing' || Number(state.pendingRound) !== round) {
      return res.status(409).json({ error: 'That round is not waiting for host approval.' });
    }
    const nextState = { ...state, approvedRound: round, pendingRound: null, updatedAt: new Date().toISOString() };
    await saveLiveGameState(nextState);
    res.json({ success: true, state: publicLiveGameState(nextState) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/participants/register', async (req, res) => {
  try {
    const body = req.body || {};
    const mode = body.type === 'team' ? 'team' : body.type === 'individual' ? 'individual' : null;
    if (!mode) return res.status(400).json({ error: 'Choose individual or team mode.' });
    const displayName = String(mode === 'team' ? body.teamName || '' : body.name || '').trim().slice(0, 80);
    if (!displayName) return res.status(400).json({ error: mode === 'team' ? 'A team name is required.' : 'A player name is required.' });

    const teamMembers = mode === 'team' && Array.isArray(body.members)
      ? body.members.map((member) => String(member || '').trim().slice(0, 80))
      : [];
    if (mode === 'team' && (teamMembers.length < 2 || teamMembers.length > 5 || teamMembers.some((member) => !member))) {
      return res.status(400).json({ error: 'A team must include 2 to 5 named members.' });
    }
    const captainName = String(body.captainName || '').trim().slice(0, 80);
    if (mode === 'team' && !captainName) return res.status(400).json({ error: 'A team captain name is required.' });

    const participant = {
      id: crypto.randomUUID(),
      type: mode,
      name: mode === 'individual' ? displayName : undefined,
      teamName: mode === 'team' ? displayName : undefined,
      captainName: mode === 'team' ? captainName : undefined,
      members: mode === 'team' ? teamMembers : undefined,
      college: String(body.college || '').trim().slice(0, 120),
      department: String(body.department || '').trim().slice(0, 80),
      year: String(body.year || '').trim().slice(0, 40),
      registeredAt: new Date().toISOString(),
    };
    const liveParticipant = { id: participant.id, name: displayName, mode, score: 0, correctAnswers: 0, totalAnswered: 0, registeredAt: participant.registeredAt, completed: false };

    if (isMongoConnected && db) {
      const stateCollection = db.collection('settings');
      let registered = false;
      for (let attempt = 0; attempt < 5 && !registered; attempt += 1) {
        const state = await getLiveGameState();
        if (state.status === 'playing') {
          return res.status(409).json({ error: 'Registration is closed while a game is in progress. Ask the host to open registration before the next event.' });
        }
        if ((state.participants || []).length >= MAX_PARTICIPANTS && state.status !== 'finished') {
          return res.status(409).json({ error: `Registration is full. This event supports up to ${MAX_PARTICIPANTS} entries.` });
        }

        if (state.status === 'finished') {
          const result = await stateCollection.updateOne(
            { _id: 'live-game-state', status: 'finished' },
            { $set: { status: 'registration', approvedRound: 1, pendingRound: null, hostPaused: false, hostAction: null, hostActions: [], participants: [liveParticipant], updatedAt: new Date().toISOString() } }
          );
          registered = result.modifiedCount === 1;
        } else {
          const stateDoc = await stateCollection.findOne({ _id: 'live-game-state' }, { projection: { _id: 1 } });
          if (!stateDoc) {
            try {
              await stateCollection.insertOne({
                _id: 'live-game-state', status: 'registration', approvedRound: 1,
                pendingRound: null, hostPaused: false, actionSequence: 0, hostAction: null, hostActions: [], participants: [liveParticipant], updatedAt: new Date().toISOString(),
              });
              registered = true;
            } catch (insertError) {
              if (insertError.code !== 11000) throw insertError;
            }
          } else {
            const result = await stateCollection.updateOne(
              { _id: 'live-game-state', status: { $ne: 'playing' }, 'participants.149': { $exists: false } },
              { $set: { status: 'registration', updatedAt: new Date().toISOString() }, $push: { participants: liveParticipant } }
            );
            registered = result.modifiedCount === 1;
          }
        }
      }
      if (!registered) {
        const latest = await getLiveGameState();
        if (latest.status === 'playing') return res.status(409).json({ error: 'Registration is closed while a game is in progress.' });
        if ((latest.participants || []).length >= MAX_PARTICIPANTS) return res.status(409).json({ error: `Registration is full. This event supports up to ${MAX_PARTICIPANTS} entries.` });
        return res.status(503).json({ error: 'Registration is busy. Please retry in a moment.' });
      }
      try { await db.collection('participants').insertOne(participant); }
      catch (archiveError) { console.warn('Participant archive write failed:', archiveError.message); }
    } else {
      const state = await getLiveGameState();
      if (state.status === 'playing') return res.status(409).json({ error: 'Registration is closed while a game is in progress. Ask the host to open registration before the next event.' });
      const currentParticipants = state.status === 'finished' ? [] : (state.participants || []);
      if (currentParticipants.length >= MAX_PARTICIPANTS) return res.status(409).json({ error: `Registration is full. This event supports up to ${MAX_PARTICIPANTS} entries.` });
      await saveLiveGameState({
        ...state,
        status: 'registration',
        ...(state.status === 'finished' ? { hostAction: null, hostActions: [] } : {}),
        participants: [...currentParticipants, liveParticipant],
        updatedAt: new Date().toISOString(),
      });
      localParticipants.push(participant);
      writeLocalData('participants.json', localParticipants);
    }

    res.status(201).json({ success: true, id: participant.id, participant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
app.get('/api/questions', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const saved = await db.collection('settings').findOne({ _id: 'question-bank' });
      return res.json(saved?.questions || []);
    }
    res.json(readLocalData('questions.json'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/questions', requireAdmin, async (req, res) => {
  const questions = req.body?.questions;
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 200 || questions.some((q) =>
    !q || ![1, 2, 3, 4].includes(Number(q.round)) || !Array.isArray(q.options) || q.options.length !== 4 ||
    q.options.some((option) => typeof option !== 'string' || !option.trim()) ||
    typeof q.correctAnswer !== 'string' || !q.options.includes(q.correctAnswer) ||
    typeof q.pictogram !== 'string' || !q.pictogram.trim() || typeof q.question !== 'string' || !q.question.trim()
  ) || [1, 2, 3, 4].some((round) => !questions.some((question) => Number(question.round) === round))) return res.status(400).json({ error: 'Question bank must contain valid questions in all four rounds.' });
  try {
    const roundPoints = { 2: 15, 3: 20, 4: 30 };
    const normalizedQuestions = questions.map((question) => ({
      ...question,
      round: Number(question.round),
      points: roundPoints[Number(question.round)] ?? Math.max(0, Number(question.points) || 10),
      answerMode: ({ 1: 'choice', 2: 'text', 3: 'emoji', 4: 'text' })[Number(question.round)],
    }));
    if (isMongoConnected && db) await db.collection('settings').replaceOne({ _id: 'question-bank' }, { _id: 'question-bank', questions: normalizedQuestions, updatedAt: new Date() }, { upsert: true });
    else writeLocalData('questions.json', normalizedQuestions);
    res.json({ success: true, count: normalizedQuestions.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const scores = await db
        .collection('leaderboard')
        .find({ id: { $not: /^demo/i }, isDemo: { $ne: true } })
        .sort({ score: -1 })
        .limit(50)
        .toArray();
      return res.json(scores);
    }

    const realScores = localLeaderboard.filter((entry) => !entry?.isDemo && !/^demo/i.test(String(entry?.id || '')));
    res.json(realScores.sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/leaderboard/:id', requireAdmin, async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id || id.length > 160) return res.status(400).json({ error: 'A valid result ID is required.' });
  try {
    if (isMongoConnected && db) {
      const result = await db.collection('leaderboard').deleteOne({ id });
      return res.json({ success: true, deleted: result.deletedCount });
    }
    const previousLength = localLeaderboard.length;
    localLeaderboard = localLeaderboard.filter((entry) => String(entry.id) !== id);
    writeLocalData('leaderboard.json', localLeaderboard);
    res.json({ success: true, deleted: previousLength - localLeaderboard.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/host/leaderboard', requireHost, async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const scores = await db.collection('leaderboard')
        .find({ id: { $not: /^demo/i }, isDemo: { $ne: true } })
        .sort({ score: -1 })
        .limit(500)
        .toArray();
      return res.json(scores);
    }
    const scores = localLeaderboard
      .filter((entry) => !entry?.isDemo && !/^demo/i.test(String(entry?.id || '')))
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 500);
    res.json(scores);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/host/leaderboard/:id', requireHost, async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id || id.length > 160) return res.status(400).json({ error: 'A valid result ID is required.' });
  try {
    let deleted = 0;
    if (isMongoConnected && db) {
      const result = await db.collection('leaderboard').deleteOne({ id });
      deleted = result.deletedCount;
    } else {
      const previousLength = localLeaderboard.length;
      localLeaderboard = localLeaderboard.filter((entry) => String(entry.id) !== id);
      writeLocalData('leaderboard.json', localLeaderboard);
      deleted = previousLength - localLeaderboard.length;
    }
    const state = await getLiveGameState();
    await saveLiveGameState({
      ...state,
      participants: (state.participants || []).filter((participant) => participant.id !== id),
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true, deleted });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/leaderboard/update', async (req, res) => {
  try {
    const { id, name, score, correctAnswers, mode, totalAnswered, completed } = req.body;
    const participantId = typeof id === 'string' ? id.trim().slice(0, 160) : '';
    const cleanName = typeof name === 'string' ? name.trim().slice(0, 80) : '';
    const cleanScore = Number(score);
    if (!participantId) return res.status(400).json({ error: 'A valid participant ID is required.' });
    if (!cleanName) return res.status(400).json({ error: 'Name required' });
    if (!Number.isFinite(cleanScore) || cleanScore < 0 || cleanScore > 1000000) return res.status(400).json({ error: 'Score must be a valid non-negative number.' });

    const entry = {
      id: participantId,
      name: cleanName,
      score: cleanScore,
      correctAnswers: Math.max(0, Math.min(10000, Number(correctAnswers) || 0)),
      totalAnswered: Math.max(0, Math.min(10000, Number(totalAnswered) || 0)),
      mode: mode === 'team' ? 'team' : 'individual',
      updatedAt: new Date(),
    };
    if (isMongoConnected && db) {
      const stateCollection = db.collection('settings');
      const participantUpdate = {
        'participants.$.name': entry.name,
        'participants.$.mode': entry.mode,
        'participants.$.score': entry.score,
        'participants.$.correctAnswers': entry.correctAnswers,
        'participants.$.totalAnswered': entry.totalAnswered,
        updatedAt: new Date().toISOString(),
      };
      if (completed === true) participantUpdate['participants.$.completed'] = true;
      const participantResult = await stateCollection.updateOne(
        { _id: 'live-game-state', 'participants.id': entry.id },
        { $set: participantUpdate }
      );
      if (participantResult.matchedCount !== 1) return res.status(404).json({ error: 'Registered participant was not found in this event.' });

      await db.collection('leaderboard').updateOne(
        { id: entry.id },
        { $set: { ...entry, ...(completed === true ? { completed: true } : {}) } },
        { upsert: true }
      );
      if (completed === true) {
        const current = await stateCollection.findOne({ _id: 'live-game-state' }, { projection: { participants: 1 } });
        const allCompleted = current?.participants?.length > 0 && current.participants.every((participant) => participant.completed);
        if (allCompleted) await stateCollection.updateOne({ _id: 'live-game-state', status: 'playing' }, { $set: { status: 'finished', updatedAt: new Date().toISOString() } });
      }
    } else {
      const state = await getLiveGameState();
      const currentParticipant = (state.participants || []).find((participant) => participant.id === entry.id);
      if (!currentParticipant) return res.status(404).json({ error: 'Registered participant was not found in this event.' });
      const participants = (state.participants || []).map((participant) => participant.id === entry.id
        ? { ...participant, ...entry, completed: completed === true || Boolean(participant.completed) }
        : participant);
      const allCompleted = participants.length > 0 && participants.every((participant) => participant.completed);
      await saveLiveGameState({ ...state, participants, status: allCompleted && state.status === 'playing' ? 'finished' : state.status, updatedAt: new Date().toISOString() });
      localLeaderboard = [entry, ...localLeaderboard.filter((item) => item.id !== entry.id)].sort((a, b) => Number(b.score) - Number(a.score));
      if (completed === true) localLeaderboard = localLeaderboard.map((item) => item.id === entry.id ? { ...item, completed: true } : item);
      writeLocalData('leaderboard.json', localLeaderboard);
    }
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MEMORIES & MEDIA (CLOUDINARY / YOUTUBE / LOCAL) ─────────────────────────
app.get('/api/memories', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const list = await db
        .collection('memories')
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      return res.json(list.map((item) => ({ ...item, id: publicMemoryId(item) })));
    }
    res.json(localMemories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item) => ({ ...item, id: publicMemoryId(item) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/memories/:id', requireAdmin, upload.single('media'), async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id || id.length > 160) return res.status(400).json({ error: 'A valid memory ID is required.' });
  const { title, description, eventTag, author, url } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'A title is required.' });
  try {
    let current;
    if (isMongoConnected && db) {
      current = await db.collection('memories').findOne(memoryIdFilter(id));
    } else {
      current = localMemories.find((item) => publicMemoryId(item) === id);
    }
    if (!current) return res.status(404).json({ error: 'Memory was not found.' });

    const update = {
      title: title.trim().slice(0, 120),
      description: typeof description === 'string' ? description.trim().slice(0, 1000) : '',
      eventTag: typeof eventTag === 'string' ? eventTag.trim().slice(0, 80) : '',
      author: typeof author === 'string' ? author.trim().slice(0, 80) : '',
      updatedAt: new Date(),
    };
    if (req.file) {
      const expectedType = current.type === 'video' ? 'video/' : 'image/';
      if (!['photo', 'video'].includes(current.type) || !req.file.mimetype.startsWith(expectedType)) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: 'Replacement file must match the memory media type.' });
      }
      update.url = `/uploads/${req.file.filename}`;
      update.isCloudinary = false;
      update.cloudinaryPublicId = null;
      const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
      if (cloudinaryConfigured) {
        try {
          const cloudRes = await cloudinary.uploader.upload(req.file.path, {
            resource_type: current.type === 'video' ? 'video' : 'image',
            folder: 'techdecode_memories',
          });
          if (cloudRes?.secure_url) {
            update.url = cloudRes.secure_url;
            update.isCloudinary = true;
            update.cloudinaryPublicId = cloudRes.public_id || null;
            fs.unlink(req.file.path, () => {});
          }
        } catch (cloudErr) { console.warn('Cloudinary replacement fallback to local storage:', cloudErr.message); }
      }
    }
    if (url !== undefined && ['link', 'youtube'].includes(current.type)) {
      let parsed;
      try { parsed = new URL(String(url)); } catch { return res.status(400).json({ error: 'Enter a valid HTTP or HTTPS link.' }); }
      if (!['http:', 'https:'].includes(parsed.protocol)) return res.status(400).json({ error: 'Only HTTP and HTTPS links are supported.' });
      update.url = parsed.toString();
      if (current.type === 'youtube') {
        const youtubeId = extractYoutubeId(update.url);
        if (!youtubeId) return res.status(400).json({ error: 'Enter a valid YouTube link.' });
        update.youtubeId = youtubeId;
      }
    }

    let saved;
    if (isMongoConnected && db) {
      await db.collection('memories').updateOne(memoryIdFilter(id), { $set: update });
      saved = { ...current, ...update, id };
    } else {
      saved = { ...current, ...update, id };
      localMemories = localMemories.map((item) => publicMemoryId(item) === id ? saved : item);
      writeLocalData('memories.json', localMemories);
    }
    if (req.file && current.url !== update.url && typeof current.url === 'string' && current.url.startsWith('/uploads/')) {
      fs.unlink(path.join(uploadDir, path.basename(current.url)), () => {});
    }
    if (req.file && current.isCloudinary && current.cloudinaryPublicId) {
      void cloudinary.uploader.destroy(current.cloudinaryPublicId, { resource_type: current.type === 'video' ? 'video' : 'image' }).catch(() => {});
    }
    res.json(saved);
  } catch (err) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/memories/:id', requireAdmin, async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id || id.length > 160) return res.status(400).json({ error: 'A valid memory ID is required.' });
  try {
    let removed;
    if (isMongoConnected && db) {
      removed = await db.collection('memories').findOne(memoryIdFilter(id));
      if (!removed) return res.status(404).json({ error: 'Memory was not found.' });
      await db.collection('memories').deleteOne(memoryIdFilter(id));
    } else {
      removed = localMemories.find((item) => publicMemoryId(item) === id);
      if (!removed) return res.status(404).json({ error: 'Memory was not found.' });
      localMemories = localMemories.filter((item) => publicMemoryId(item) !== id);
      writeLocalData('memories.json', localMemories);
    }
    if (typeof removed.url === 'string' && removed.url.startsWith('/uploads/')) {
      const filePath = path.join(uploadDir, path.basename(removed.url));
      fs.unlink(filePath, () => {});
    }
    if (removed.isCloudinary && removed.cloudinaryPublicId) {
      void cloudinary.uploader.destroy(removed.cloudinaryPublicId, { resource_type: removed.type === 'video' ? 'video' : 'image' }).catch(() => {});
    }
    res.json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/memories/upload', requireAdmin, upload.single('media'), async (req, res) => {
  try {
    const { title, description, eventTag, author, type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    if (!['photo', 'video'].includes(type)) return res.status(400).json({ error: 'Media type must be photo or video.' });
    const allowedMime = type === 'video' ? file.mimetype.startsWith('video/') : file.mimetype.startsWith('image/');
    if (!allowedMime) { fs.unlink(file.path, () => {}); return res.status(400).json({ error: 'Uploaded file does not match the selected media type.' }); }
    let finalUrl = `/uploads/${file.filename}`;
    let isCloudinary = false;
    let cloudinaryPublicId = null;
    const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
    if (cloudinaryConfigured) {
      try {
        const resourceType = type === 'video' ? 'video' : 'image';
        const cloudRes = await cloudinary.uploader.upload(file.path, { resource_type: resourceType, folder: 'techdecode_memories' });
        if (cloudRes?.secure_url) { finalUrl = cloudRes.secure_url; isCloudinary = true; cloudinaryPublicId = cloudRes.public_id || null; fs.unlink(file.path, () => {}); }
      } catch (cloudErr) { console.warn('Cloudinary upload fallback to local storage:', cloudErr.message); }
    }

    const memoryItem = {
      id: crypto.randomUUID(),
      type: type || 'photo',
      title: title || 'Fest Moment',
      description: description || '',
      url: finalUrl,
      isCloudinary,
      cloudinaryPublicId,
      eventTag: eventTag || 'Fest Highlight',
      author: author || 'Fest Reporter',
      createdAt: new Date(),
    };

    if (isMongoConnected && db) {
      const result = await db.collection('memories').insertOne(memoryItem);
      memoryItem._id = result.insertedId;
    } else {
      localMemories.unshift(memoryItem);
      writeLocalData('memories.json', localMemories);
    }

    res.status(201).json(memoryItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// YouTube Link Memory
app.post('/api/memories/youtube', requireAdmin, async (req, res) => {
  try {
    const { url, title, description, eventTag, author } = req.body;
    const yId = extractYoutubeId(url);

    if (!yId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const item = {
      id: crypto.randomUUID(),
      type: 'youtube',
      title: title || 'TECHDECODE YouTube Recap',
      description: description || '',
      url,
      youtubeId: yId,
      eventTag: eventTag || 'Video Highlight',
      author: author || 'Fest Media Team',
      createdAt: new Date(),
    };

    if (isMongoConnected && db) {
      const result = await db.collection('memories').insertOne(item);
      item._id = result.insertedId;
    } else {
      localMemories.unshift(item);
      writeLocalData('memories.json', localMemories);
    }

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memories/link', requireAdmin, async (req, res) => {
  try {
    const { url, title, description, eventTag, author } = req.body;
    let parsed;
    try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'Enter a valid link.' }); }
    if (!['http:', 'https:'].includes(parsed.protocol)) return res.status(400).json({ error: 'Only HTTP and HTTPS links are supported.' });
    const item = { id: crypto.randomUUID(), type: 'link', title: title || parsed.hostname, description: description || '', url: parsed.toString(), eventTag: eventTag || 'Highlight', author: author || 'Admin', createdAt: new Date() };
    if (isMongoConnected && db) { const result = await db.collection('memories').insertOne(item); item._id = result.insertedId; }
    else { localMemories.unshift(item); writeLocalData('memories.json', localMemories); }
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── 4. PRODUCTION STATIC ASSETS & SPA ROUTING ──────────────────────────────
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Any non-API route returns index.html for React Router (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : (err.status || 400);
  res.status(status).json({ error: status === 413 ? 'File exceeds the 50 MB upload limit.' : 'Invalid request.' });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`>>> TECHDECODE Production Server running on port ${PORT} <<<`);
  console.log(`>>> Health check: http://localhost:${PORT}/api/health <<<`);
});

