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
git clone https://github.com/your-username/sugar-intake-tracker.git
cd sugar-intake-tracker
```

### 2. Set Up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set your MongoDB connection string:

```
MONGODB_URI=mongodb://localhost:27017/sugar-tracker
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

> If using MongoDB Atlas, replace the `MONGODB_URI` with your Atlas connection string. See the [MongoDB Atlas setup guide](docs/mongodb-atlas-setup.md) for details.

Start the backend:

```bash
npm run dev
```

The backend runs at [http://localhost:5000](http://localhost:5000). Verify it's working:

```bash
curl http://localhost:5000/api/health
```

### 3. Set Up the Frontend

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

The default `frontend/.env` should already point to the local backend:

```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The app opens at [http://localhost:3000](http://localhost:3000).

### 4. Seed Sample Images (Optional)

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

The app is designed to run entirely on free-tier hosting services. Follow these guides in order:

1. **[MongoDB Atlas Setup](docs/mongodb-atlas-setup.md)** — Create a free cloud database
2. **[Backend Deployment (Render)](docs/backend-deployment-render.md)** — Deploy the API server
3. **[Frontend Deployment (Vercel)](docs/frontend-deployment-vercel.md)** — Deploy the web interface

Having issues? Check the **[Troubleshooting Guide](docs/troubleshooting.md)**.

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
