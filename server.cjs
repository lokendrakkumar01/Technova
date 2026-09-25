const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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
    db = client.db(process.env.DB_NAME || 'techdecode');
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
    timestamp: new Date().toISOString(),
  });
});

// ─── PARTICIPANTS & TEAMS ─────────────────────────────────────────────────────
app.post('/api/participants/register', async (req, res) => {
  try {
    const participant = {
      ...req.body,
      registeredAt: new Date(),
    };

    if (isMongoConnected && db) {
      const result = await db.collection('participants').insertOne(participant);
      return res.status(201).json({ success: true, id: result.insertedId, participant });
    }

    participant.id = crypto.randomUUID();
    localParticipants.push(participant);
    writeLocalData('participants.json', localParticipants);
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
    !q || ![1, 2, 3].includes(Number(q.round)) || !Array.isArray(q.options) || q.options.length !== 4 ||
    q.options.some((option) => typeof option !== 'string' || !option.trim()) ||
    typeof q.correctAnswer !== 'string' || !q.options.includes(q.correctAnswer) ||
    typeof q.pictogram !== 'string' || !q.pictogram.trim() || typeof q.question !== 'string' || !q.question.trim()
  )) return res.status(400).json({ error: 'Question bank contains an invalid question.' });
  try {
    if (isMongoConnected && db) await db.collection('settings').replaceOne({ _id: 'question-bank' }, { _id: 'question-bank', questions, updatedAt: new Date() }, { upsert: true });
    else writeLocalData('questions.json', questions);
    res.json({ success: true, count: questions.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const scores = await db
        .collection('leaderboard')
        .find()
        .sort({ score: -1 })
        .limit(50)
        .toArray();
      return res.json(scores);
    }

    res.json(localLeaderboard.sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leaderboard/update', async (req, res) => {
  try {
    const { id, name, score, correctAnswers, mode } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const entry = { id: id || name, name, score: Number(score) || 0, correctAnswers: Number(correctAnswers) || 0, mode: mode || 'individual', updatedAt: new Date() };
    if (isMongoConnected && db) {
      await db.collection('leaderboard').updateOne(
        { id: entry.id },
        { $set: entry },
        { upsert: true }
      );
    } else {
      localLeaderboard = [entry, ...localLeaderboard.filter((item) => item.id !== entry.id)].sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 50);
      writeLocalData('leaderboard.json', localLeaderboard);
    }

    res.json({ success: true, name, score });
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
      return res.json(list);
    }
    res.json(localMemories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
    if (cloudinaryConfigured) {
      try {
        const resourceType = type === 'video' ? 'video' : 'image';
        const cloudRes = await cloudinary.uploader.upload(file.path, { resource_type: resourceType, folder: 'techdecode_memories' });
        if (cloudRes?.secure_url) { finalUrl = cloudRes.secure_url; isCloudinary = true; fs.unlink(file.path, () => {}); }
      } catch (cloudErr) { console.warn('Cloudinary upload fallback to local storage:', cloudErr.message); }
    }

    const memoryItem = {
      type: type || 'photo',
      title: title || 'Fest Moment',
      description: description || '',
      url: finalUrl,
      isCloudinary,
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
    const item = { type: 'link', title: title || parsed.hostname, description: description || '', url: parsed.toString(), eventTag: eventTag || 'Highlight', author: author || 'Admin', createdAt: new Date() };
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
