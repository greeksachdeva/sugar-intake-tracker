# Sugar Intake Tracker 🍬

A web application that helps you monitor your daily sugar consumption through a visual calendar interface. Answer a simple daily question — "Did you eat sugar today?" — and track your progress over time with color-coded feedback and emojis.

## Features

- **Daily Prompt** — Answer whether you consumed sugar today with a single click
- **Calendar View** — See your entire month at a glance with visual indicators:
  - 😊 Green for sugar-free days
  - 😔 Red tint for days with sugar
  - Neutral for days with no entry
- **Historical Tracking** — Navigate between months and update past entries
- **Background Images** — Clean interface with images fetched from the backend
- **Mobile Friendly** — Fully responsive design that works on phones, tablets, and desktops
- **No Login Required** — Start tracking immediately without creating an account

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, CSS Modules |
| **Backend** | Node.js, Express |
| **Database** | MongoDB (Mongoose ODM) |
| **Frontend Hosting** | Vercel (free tier) |
| **Backend Hosting** | Render (free tier) |
| **Database Hosting** | MongoDB Atlas (free tier) |
| **Testing** | Jest, Vitest, React Testing Library, fast-check |

## Quick Start (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) version 16 or higher
- [Git](https://git-scm.com/)
- A MongoDB database (local or [MongoDB Atlas free tier](docs/mongodb-atlas-setup.md))

### 1. Clone the Repository

```bash
git clone https://github.com/greeksachdeva/sugar-intake-tracker.git
cd sugar-intake-tracker
```

### 2. Set Up MongoDB Atlas (Free)

You need a MongoDB database. The easiest option is MongoDB Atlas (free tier):

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a free cluster (M0)
3. Create a database user with a password
4. Go to **Network Access** → **Add IP Address** → **Allow Access from Anywhere**
5. Click **Connect** → **Drivers** → copy the connection string

For detailed steps, see the [MongoDB Atlas setup guide](docs/mongodb-atlas-setup.md).

### 3. Set Up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set your MongoDB Atlas connection string:

```
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sugar-tracker?retryWrites=true&w=majority&appName=Cluster0
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
```

The backend runs at [http://localhost:5001](http://localhost:5001). Verify it's working:

```bash
curl http://localhost:5001/api/health
```

You should see: `{"status":"ok","timestamp":"..."}`

### 4. Set Up the Frontend

Open a **second terminal**:

```bash
cd frontend
npm install
cp .env.example .env
```

The default `frontend/.env` points to the local backend:

```
VITE_API_URL=http://localhost:5001
```

> **Important:** Do NOT include `/api` at the end — the API client adds it automatically.

Start the frontend:

```bash
npm run dev
```

The app opens at [http://localhost:3000](http://localhost:3000).

### 5. Seed Sample Images (Optional)

To populate the database with sample background images:

```bash
cd backend
node src/scripts/seedImages.js
```

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Deployment

The app runs entirely on free-tier hosting. You need three services:

### Step 1: MongoDB Atlas (Database)

Already done if you followed the local setup. Your Atlas cluster works for both local and production.

### Step 2: Deploy Backend to Render

1. Go to [render.com](https://render.com) → sign up with GitHub
2. Click **New** → **Web Service** → connect your GitHub repo
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Add environment variables:
   - `MONGODB_URI` = your Atlas connection string
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = (set after deploying frontend)
5. Click **Create Web Service** — note the URL (e.g., `https://sugar-tracker-api.onrender.com`)

### Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub
2. Click **Add New** → **Project** → import your repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (e.g., `https://sugar-tracker-api.onrender.com`)
   - **Do NOT** include `/api` at the end
5. Click **Deploy** — note the URL (e.g., `https://sugar-tracker.vercel.app`)

### Step 4: Update Backend CORS

Go back to Render → your backend service → **Environment** → set `FRONTEND_URL` to your Vercel URL (e.g., `https://sugar-tracker.vercel.app`). Render will auto-redeploy.

For detailed step-by-step guides with troubleshooting:
- [MongoDB Atlas Setup](docs/mongodb-atlas-setup.md)
- [Backend Deployment (Render)](docs/backend-deployment-render.md)
- [Frontend Deployment (Vercel)](docs/frontend-deployment-vercel.md)
- [Troubleshooting Guide](docs/troubleshooting.md)

## Deployed Application

| Service | URL |
|---------|-----|
| Frontend | *Add your Vercel URL here after deployment* |
| Backend API | *Add your Render URL here after deployment* |
| Health Check | *Add your Render URL here*/api/health |

## Project Structure

```
sugar-intake-tracker/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # MongoDB connection setup
│   │   ├── middleware/
│   │   │   ├── errorHandler.js # Global error handling
│   │   │   └── requestLogger.js# Request logging
│   │   ├── models/
│   │   │   ├── Entry.js        # Sugar entry data model
│   │   │   └── Image.js        # Image data model
│   │   ├── routes/
│   │   │   ├── entries.js      # CRUD endpoints for entries
│   │   │   ├── health.js       # Health check endpoint
│   │   │   └── images.js       # Image retrieval endpoint
│   │   ├── scripts/
│   │   │   └── seedImages.js   # Database seed script
│   │   └── server.js           # Express app setup
│   ├── .env.example            # Environment variable template
│   └── package.json
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Calendar/       # Monthly calendar grid
│   │   │   ├── DailyPrompt/    # Daily sugar question
│   │   │   ├── DayCell/        # Individual calendar day
│   │   │   ├── ErrorBoundary/  # React error boundary
│   │   │   ├── ImageDisplay/   # Background images
│   │   │   └── UpdateDialog/   # Past entry update modal
│   │   ├── services/
│   │   │   └── apiClient.js    # Backend API client
│   │   ├── utils/
│   │   │   └── calendarUtils.js# Date/calendar helpers
│   │   ├── App.jsx             # Root component
│   │   └── main.jsx            # App entry point
│   ├── .env.example            # Environment variable template
│   ├── vite.config.js          # Vite configuration
│   └── package.json
│
├── docs/                       # Deployment documentation
│   ├── mongodb-atlas-setup.md
│   ├── backend-deployment-render.md
│   ├── frontend-deployment-vercel.md
│   └── troubleshooting.md
│
└── README.md                   # This file
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/entries?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Get entries for a date range |
| `POST` | `/api/entries` | Create a new entry |
| `PUT` | `/api/entries/:date` | Update an entry by date |
| `GET` | `/api/images` | Get background images |

## License

MIT
