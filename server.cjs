const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Ensure local uploads directory exists as fallback
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ─── 1. MONGODB CLIENT CONFIGURATION ──────────────────────────────────────────
const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb+srv://lkkl88994_db_user:Uf2FEvtMd5Z2H9sF@cluster0.3pfglig.mongodb.net/?appName=Cluster0';

const client = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db = null;
let isMongoConnected = false;

async function connectToMongo() {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME || 'technova');
    // Ping confirmation
    await client.db('admin').command({ ping: 1 });
    isMongoConnected = true;
    console.log('>>> [TECHNOVA] MongoDB Atlas Connected Successfully! <<<');
  } catch (err) {
    console.warn('MongoDB connection warning:', err.message);
    isMongoConnected = false;
  }
}
connectToMongo();

// ─── 2. CLOUDINARY CONFIGURATION ──────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'kt2upmou',
  api_key: process.env.CLOUDINARY_API_KEY || '972468326573411',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'XMNZ8FtOfkuQ06tgvv9b8zR33fs',
});

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

function extractYoutubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// ─── 3. API ENDPOINTS ─────────────────────────────────────────────────────────

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'TECHNOVA Game Show Engine',
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

    res.status(200).json({ success: true, message: 'Saved in memory (local)', participant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
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

    res.json([
      { id: '1', name: 'Code Warriors', score: 420, correctAnswers: 18 },
      { id: '2', name: 'Binary Beasts', score: 390, correctAnswers: 16 },
      { id: '3', name: 'Debug Squad', score: 350, correctAnswers: 15 },
      { id: '4', name: 'Syntax Titans', score: 320, correctAnswers: 14 },
      { id: '5', name: 'Algorithm Aces', score: 280, correctAnswers: 12 },
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leaderboard/update', async (req, res) => {
  try {
    const { name, score, correctAnswers, mode } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    if (isMongoConnected && db) {
      await db.collection('leaderboard').updateOne(
        { name },
        {
          $set: {
            name,
            score: Number(score) || 0,
            correctAnswers: Number(correctAnswers) || 0,
            mode: mode || 'individual',
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
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
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memories/upload', upload.single('media'), async (req, res) => {
  try {
    const { title, description, eventTag, author, type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    let finalUrl = `http://localhost:${PORT}/uploads/${file.filename}`;
    let isCloudinary = false;

    // Attempt Cloudinary upload
    try {
      const resourceType = type === 'video' ? 'video' : 'image';
      const cloudRes = await cloudinary.uploader.upload(file.path, {
        resource_type: resourceType,
        folder: 'technova_fest_memories',
      });
      if (cloudRes && cloudRes.secure_url) {
        finalUrl = cloudRes.secure_url;
        isCloudinary = true;
      }
    } catch (cloudErr) {
      console.warn('Cloudinary upload fallback to local storage:', cloudErr.message);
      finalUrl = `http://localhost:${PORT}/uploads/${file.filename}`;
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
    }

    res.status(201).json(memoryItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// YouTube Link Memory
app.post('/api/memories/youtube', async (req, res) => {
  try {
    const { url, title, description, eventTag, author } = req.body;
    const yId = extractYoutubeId(url);

    if (!yId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const item = {
      type: 'youtube',
      title: title || 'TECHNOVA YouTube Recap',
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
    }

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`>>> TECHNOVA Production Server running on port ${PORT} <<<`);
  console.log(`>>> Health check: http://localhost:${PORT}/api/health <<<`);
});
