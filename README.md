# TECHDECODE

A responsive technical pictogram game for individual and team competitions. Admin-managed questions feed the live game, and the Memories gallery displays saved photos, videos, and links.

## Run locally

1. Install Node.js 20 or newer and run npm install.
2. Copy .env.example to .env. Set distinct private ADMIN_PIN and HOST_PIN values.
3. Optionally set MONGODB_URI for persistent shared participants, scores, questions, and gallery metadata. Set Cloudinary credentials for durable photo/video hosting.
4. Start the API with npm run server and the frontend with npm run dev.
5. Open http://localhost:3000.

Vite proxies API requests to port 5000. For production, run npm run build and then npm run dev:server.

## Main screens

- /: Home
- /mode and /register: Individual and team signup
- /game: Live quiz using the saved admin question bank
- /host and /host/display: Host controls and projector view
- /leaderboard and /results: Real completed scores
- /memories: Saved photos, videos, YouTube clips, and external links
- /admin and /admin-login: Question management and media uploads

## Admin and host access

Set ADMIN_PIN and HOST_PIN in the server environment. Login issues an expiring session token; question updates and media uploads require the admin token. Never commit real environment values.

Each question needs a round from 1 to 3, a pictogram, four answer options, and a correct answer matching one of those options. Add, edit, delete, or import questions in the admin panel; saved questions become the live game bank.

Media uploads support photos, videos, YouTube URLs, and HTTP(S) links. MongoDB stores metadata. Configure Cloudinary for durable media hosting. Local JSON and local disk storage are development fallbacks and may not persist on hosted services with ephemeral disks.

## Commands

- npm run dev: Frontend development server
- npm run server: Express API
- npm run build: Production frontend build
- npm run lint: Oxlint checks
