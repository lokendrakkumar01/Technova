# ⚡ TECHNOVA — The Ultimate Technical Pictogram Game Show

> **DECODE. THINK. COMPETE. CONQUER.**  
> Can you decode technology before time runs out?

TECHNOVA is a production-quality, full-stack interactive technical game show platform engineered for college technical festivals with **60–100 participants**. Built with a futuristic game-show aesthetic, live scoring engine, auditorium projector display, live MongoDB Atlas synchronization, Cloudinary media storage, and YouTube fest recap embeds.

---

## 🚀 Key Highlights & Features

- **🎮 Dual Contestant Modes**:
  - **Individual Mode**: Solo coder profile with college/department tracking.
  - **Team Mode**: Squad registration with 2–5 members and Captain assignment.
- **⏱️ Game Engine & Rules**:
  - **30 Progressive Questions** across 3 rounds (`Code Language`, `Think Like a Computer`, `Tech Arena`).
  - **⚡ Final Showdown**: 5 rapid-fire sudden-death questions with 10s timer and penalty scoring (+20 / -10).
  - **20s Precision Timers**: Dynamic color transitions (Cyan → Amber at 10s → Pulsing Red at 5s) and auto-locking at 0s.
  - **Tactical Lifelines**: `50/50` (eliminates 2 wrong options), `TECH HINT` (-5 pts clue penalty), `+10 SECONDS` (one-time emergency time boost).
  - **Scoring Engine**: Easy (+10), Medium (+20), Hard (+30), Hint (-5), Showdown (+20 / -10).
- **🎙️ Event Marshal Console (`/host`)**:
  - PIN: `1234`
  - Complete control: Start Game, Pause, Resume, Next Question, Reveal Solution, Skip, Reset, and Score Arbitration (+/- points).
- **📺 Auditorium Projector Mode (`/host/display`)**:
  - Giant typography (10rem+ pictograms, 8rem countdown timers) with zero UI clutter, readable from the back of any college auditorium.
- **🏆 Live Leaderboard (`/leaderboard`)**:
  - Top 3 podium highlights with gold, silver, and bronze trophies.
  - Real-time MongoDB score sync.
- **🎉 Champion Ceremony (`/results`)**:
  - Full-screen multi-burst confetti celebration.
  - Comprehensive metrics: Final score, accuracy %, fastest decode, and round breakdowns.
- **📸 Fest Memories & Media Gallery (`/memories`)**:
  - Upload photos & videos directly to Cloudinary or persistent storage.
  - Embed YouTube video highlights (`watch?v=...` or `youtu.be/...`).
  - One-click Desktop Archive Download.
- **⚙️ Admin Question Vault (`/admin`)**:
  - PIN: `9999`
  - Real-time question management with JSON import/export.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v3, Framer Motion, Lucide Icons, Canvas-Confetti
- **State Management**: Zustand with persistent storage
- **Backend**: Node.js & Express.js
- **Database**: MongoDB Atlas (`technova` cluster)
- **Media Engine**: Cloudinary v2 (Photos & Videos) + YouTube Iframe Embed API

---

## 🌐 Routes Overview

| Route | Page | Purpose |
|---|---|---|
| `/` | Landing Page | Cinematic hero with floating technical particles & CTAs |
| `/how-to-play` | Rules & Instructions | Scoring rules, penalties, and lifeline mechanics |
| `/mode` | Mode Selection | Choose between Solo Operative or Squad Mode |
| `/register` | Registration | Register details, generate security code & sync with MongoDB |
| `/ready` | Ready Launchpad | Pre-game countdown & contest benchmark review |
| `/game` | Main Arena | 30 questions, timers, lifelines, answer reveals |
| `/host` | Host Dashboard | Marshalling console (`PIN: 1234`) |
| `/host/display` | Projector Mode | Ultra-clean large format display for auditorium projection |
| `/leaderboard` | Live Standings | Real-time podium and score table |
| `/results` | Results Ceremony | Confetti animation & performance breakdown |
| `/memories` | Fest Gallery | Photos, videos, YouTube embeds & desktop download |
| `/admin` | Question Vault | Administrative question editor (`PIN: 9999`) |

---

## 💻 Local Setup & Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/lokendrakkumar01/Technova.git
   cd Technova
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://lkkl88994_db_user:Uf2FEvtMd5Z2H9sF@cluster0.3pfglig.mongodb.net/technova?retryWrites=true&w=majority&appName=Cluster0
   DB_NAME=technova

   # Cloudinary Credentials
   CLOUDINARY_CLOUD_NAME=kt2upmou
   CLOUDINARY_API_KEY=972468326573411
   CLOUDINARY_API_SECRET=XMNZ8FtOfkuQ06tgvv9b8zR33fs

   # Client API URL
   VITE_API_URL=http://localhost:5000
   ```

4. **Run Backend & Frontend**:
   - Backend API:
     ```bash
     npm run server
     ```
   - Frontend Dev Server:
     ```bash
     npm run dev
     ```
   Open `http://localhost:3000` in your browser.

---

## 🚀 Render Deployment Guide (Step-by-Step)

The project is structured so **one single Render Web Service** runs both the Express backend and serves the production React frontend statically!

### Step 1: Login to Render
1. Go to [render.com](https://render.com/) and sign in with your GitHub account.

### Step 2: Create a New Web Service
1. In your Render Dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub repository: `https://github.com/lokendrakkumar01/Technova`.

### Step 3: Configure Service Settings
- **Name**: `technova-game-show` (or any preferred name)
- **Region**: Choose the closest region (e.g. `Singapore` or `Frankfurt`)
- **Branch**: `main`
- **Root Directory**: Leave blank (root of repository)
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  npm install --legacy-peer-deps && npm run build
  ```
- **Start Command**:
  ```bash
  npm run dev:server
  ```
  *(or `node server.cjs`)*

### Step 4: Add Environment Variables in Render
In the **Environment Variables** section on Render, add:

| Key | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `PORT` | `10000` *(Render sets this automatically)* |
| `MONGODB_URI` | `mongodb+srv://lkkl88994_db_user:Uf2FEvtMd5Z2H9sF@cluster0.3pfglig.mongodb.net/technova?retryWrites=true&w=majority&appName=Cluster0` |
| `DB_NAME` | `technova` |
| `CLOUDINARY_CLOUD_NAME` | `kt2upmou` |
| `CLOUDINARY_API_KEY` | `972468326573411` |
| `CLOUDINARY_API_SECRET` | `XMNZ8FtOfkuQ06tgvv9b8zR33fs` |

### Step 5: Deploy
Click **Create Web Service**. Render will:
1. Clone your repo
2. Run `npm install --legacy-peer-deps && npm run build`
3. Start `node server.cjs`
4. Provide a free live URL: `https://technova-game-show.onrender.com`!

---

## 🔒 Security Credentials & Access Passcodes

| Portal | Route | Default Access Key |
|---|---|---|
| **Host Marshal Console** | `/host` | `1234` |
| **Admin Question Vault** | `/admin` | `9999` |

---

Built with ❤️ for college technical fests and hackathons.
