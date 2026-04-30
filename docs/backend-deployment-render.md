# Backend Deployment Guide (Render)

This guide walks you through deploying the Sugar Intake Tracker backend to Render's free tier. Render is a cloud platform that makes it easy to deploy web services directly from a GitHub repository.

## Prerequisites

Before starting, make sure you have:

- A [GitHub](https://github.com) account with your project pushed to a repository
- A MongoDB Atlas database set up ([see the MongoDB Atlas setup guide](./mongodb-atlas-setup.md))
- Your MongoDB connection string ready

## Table of Contents

1. [Create a Render Account](#1-create-a-render-account)
2. [Create a New Web Service](#2-create-a-new-web-service)
3. [Connect Your GitHub Repository](#3-connect-your-github-repository)
4. [Configure the Service](#4-configure-the-service)
5. [Set Environment Variables](#5-set-environment-variables)
6. [Deploy](#6-deploy)
7. [Verify the Deployment](#7-verify-the-deployment)

---

## 1. Create a Render Account

1. Go to [render.com](https://render.com)
2. Click **Get Started for Free**
3. Sign up using your **GitHub account** (recommended — this makes connecting your repository easier)
4. Complete any onboarding steps

## 2. Create a New Web Service

1. From the Render dashboard, click **New** and select **Web Service**
2. You'll be prompted to connect a repository

## 3. Connect Your GitHub Repository

1. If you signed up with GitHub, you should see your repositories listed
2. If not, click **Connect GitHub** and authorize Render to access your repositories
3. Find your Sugar Intake Tracker repository and click **Connect**

## 4. Configure the Service

Fill in the service settings:

| Setting | Value |
|---------|-------|
| **Name** | `sugar-tracker-api` (or any name you prefer) |
| **Region** | Choose the region closest to your MongoDB Atlas cluster |
| **Branch** | `main` (or your default branch name) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

> **Important**: The **Root Directory** must be set to `backend` since the backend code lives in the `backend/` folder of the repository. This tells Render to run commands from that directory.

## 5. Set Environment Variables

Environment variables store sensitive configuration that shouldn't be in your code.

1. Scroll down to the **Environment Variables** section (or find it in the service settings after creation)
2. Add the following variables by clicking **Add Environment Variable** for each:

| Key | Value | Description |
|-----|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/sugar-tracker?retryWrites=true&w=majority` | Your MongoDB Atlas connection string (from the [MongoDB setup guide](./mongodb-atlas-setup.md)) |
| `NODE_ENV` | `production` | Tells the app it's running in production |
| `FRONTEND_URL` | *(set this after deploying the frontend)* | The URL of your Vercel frontend, e.g., `https://sugar-tracker.vercel.app` |

> **Note**: The `PORT` variable is automatically provided by Render — you don't need to set it manually.

> **Important**: After you deploy the frontend to Vercel, come back and update `FRONTEND_URL` with the actual Vercel URL. This is required for CORS (Cross-Origin Resource Sharing) to work correctly.

## 6. Deploy

1. Click **Create Web Service**
2. Render will automatically:
   - Clone your repository
   - Navigate to the `backend` directory
   - Run `npm install` to install dependencies
   - Run `npm start` to start the server
3. Watch the deploy logs for any errors. A successful deployment shows something like:

   ```
   Server running on port 10000
   ```

4. The first deployment takes 2–5 minutes

## 7. Verify the Deployment

1. After deployment, Render gives you a URL like:

   ```
   https://sugar-tracker-api.onrender.com
   ```

2. Test the health endpoint by visiting:

   ```
   https://sugar-tracker-api.onrender.com/api/health
   ```

3. You should see a JSON response:

   ```json
   { "status": "ok", "timestamp": "2025-01-15T10:30:00Z" }
   ```

4. Test the entries endpoint:

   ```
   https://sugar-tracker-api.onrender.com/api/entries?startDate=2025-01-01&endDate=2025-01-31
   ```

   You should see:

   ```json
   { "success": true, "entries": [] }
   ```

---

## Automatic Deployments

By default, Render automatically redeploys your service whenever you push changes to the connected branch. You can disable this in the service settings if you prefer manual deployments.

## Free Tier Limitations

Be aware of these Render free tier behaviors:

- **Spin-down on inactivity**: Free services spin down after 15 minutes of no incoming traffic. The first request after spin-down takes 30–60 seconds while the service restarts.
- **Limited build minutes**: Free accounts get 750 hours of running time per month.
- **No persistent disk**: Free tier doesn't include persistent disk storage (but your data is in MongoDB Atlas, so this doesn't affect you).

> **Tip**: The spin-down behavior means the first visit to your app after a period of inactivity will be slow. This is normal for free-tier hosting.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails with "npm install" errors | Check that `package.json` exists in the `backend/` directory and the Root Directory is set to `backend` |
| "Cannot find module" errors | Make sure all dependencies are listed in `package.json` under `dependencies` (not just `devDependencies`) |
| "MONGODB_URI is not defined" | Verify the environment variable is set correctly in Render's dashboard |
| CORS errors from frontend | Update the `FRONTEND_URL` environment variable to match your Vercel deployment URL exactly (including `https://`) |
| Service keeps restarting | Check the logs for errors. Common causes: invalid MongoDB URI, missing environment variables |

---

## Next Steps

- [Deploy the frontend to Vercel](./frontend-deployment-vercel.md)
- [Troubleshooting guide](./troubleshooting.md)
