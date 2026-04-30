# Troubleshooting Guide

This guide covers common issues you might encounter when developing or deploying the Sugar Intake Tracker, along with step-by-step solutions.

## Table of Contents

1. [CORS Errors](#1-cors-errors)
2. [Database Connection Issues](#2-database-connection-issues)
3. [Environment Variable Problems](#3-environment-variable-problems)
4. [Build Failures](#4-build-failures)
5. [Free Tier Limitations](#5-free-tier-limitations)
6. [Frontend Issues](#6-frontend-issues)
7. [Backend Issues](#7-backend-issues)

---

## 1. CORS Errors

CORS (Cross-Origin Resource Sharing) errors happen when the frontend tries to make requests to the backend, but the backend doesn't recognize the frontend's URL as allowed.

### Symptoms

- Browser console shows: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`
- API requests fail even though the backend is running
- The app loads but shows no data

### Solutions

**Check the `FRONTEND_URL` environment variable on Render:**

1. Go to your Render dashboard → your backend service → **Environment**
2. Verify `FRONTEND_URL` matches your Vercel URL exactly
3. Common mistakes:
   - Missing `https://` — use `https://sugar-tracker.vercel.app`, not `sugar-tracker.vercel.app`
   - Trailing slash — use `https://sugar-tracker.vercel.app`, not `https://sugar-tracker.vercel.app/`
   - Wrong URL — copy the URL directly from your Vercel dashboard

**For local development:**

Make sure your `.env` file in the `backend/` directory has:

```
FRONTEND_URL=http://localhost:3000
```

**If you're still getting CORS errors after fixing the URL:**

1. Redeploy the backend on Render (the environment variable change requires a restart)
2. Clear your browser cache or try an incognito/private window
3. Check that the backend is actually running (visit the `/api/health` endpoint)

---

## 2. Database Connection Issues

### Symptoms

- Backend logs show: `MongoServerError: Authentication failed`
- Backend logs show: `MongoNetworkError: connection timed out`
- Backend crashes on startup with database errors
- Health endpoint works but data endpoints return errors

### Solutions

**Authentication failed:**

1. Double-check your `MONGODB_URI` connection string
2. Make sure you replaced `<password>` with your actual database user password
3. Verify the username and password in MongoDB Atlas:
   - Go to Atlas → **Database Access** → check your user exists
   - If unsure about the password, click **Edit** on the user and set a new password
4. Avoid special characters in the password (`@`, `%`, `/`, `#`). If your password contains these, change it to one without them.

**Connection timed out:**

1. Go to MongoDB Atlas → **Network Access**
2. Make sure `0.0.0.0/0` (allow from anywhere) is in the IP access list
3. If you recently added the IP, wait 1–2 minutes for it to take effect
4. Check that your cluster is running (Atlas → **Database** → cluster status should be green)

**Connection string format issues:**

A correct connection string looks like this:

```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/sugar-tracker?retryWrites=true&w=majority&appName=Cluster0
```

Common mistakes:
- Missing the database name (`sugar-tracker`) between the host and the `?`
- Extra spaces in the string
- Using `mongodb://` instead of `mongodb+srv://` (Atlas uses SRV)

---

## 3. Environment Variable Problems

### Symptoms

- App behaves differently in production vs. local development
- `undefined` values appearing in logs or API responses
- Frontend can't connect to backend after deployment

### Solutions

**Backend environment variables (Render):**

Required variables:

| Variable | Example Value |
|----------|---------------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/sugar-tracker?retryWrites=true&w=majority` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://sugar-tracker.vercel.app` |

> `PORT` is automatically set by Render — don't set it manually.

To check your variables:
1. Go to Render dashboard → your service → **Environment**
2. Verify each variable is set and has the correct value
3. After making changes, Render will automatically redeploy

**Frontend environment variables (Vercel):**

Required variables:

| Variable | Example Value |
|----------|---------------|
| `VITE_API_URL` | `https://sugar-tracker-api.onrender.com/api` |

Important notes:
- Variable names **must** start with `VITE_` to be available in the browser
- After changing environment variables in Vercel, you must **redeploy** for changes to take effect (go to Deployments → click the three dots on the latest deployment → Redeploy)
- Make sure the URL includes `/api` at the end

**Local development environment variables:**

1. Copy the example files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Edit each `.env` file with your actual values
3. Never commit `.env` files to Git (they're already in `.gitignore`)

---

## 4. Build Failures

### Frontend Build Failures

**Symptoms:**
- Vercel deployment fails during the build step
- Error messages about missing modules or syntax errors

**Solutions:**

1. **Test the build locally first:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **"Module not found" errors:**
   - Check that all imports use the correct file paths (case-sensitive on Linux/Vercel)
   - Make sure all dependencies are listed in `package.json`
   - Run `npm install` to ensure all packages are installed

3. **Vercel-specific issues:**
   - Verify the Root Directory is set to `frontend`
   - Check that the build command is `npm run build`
   - Check that the output directory is `dist`

### Backend Build Failures

**Symptoms:**
- Render deployment fails during the build step
- `npm install` errors in the deploy logs

**Solutions:**

1. **Test locally first:**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **"Cannot find module" errors:**
   - Make sure the module is in `dependencies` (not `devDependencies`) in `package.json`
   - Render only installs `dependencies` in production by default

3. **Node.js version issues:**
   - The project requires Node.js 16 or higher
   - You can specify the Node version in Render's environment settings by adding a `NODE_VERSION` environment variable (e.g., `18`)

---

## 5. Free Tier Limitations

### Render Free Tier

**Spin-down behavior:**
- Free services spin down after 15 minutes of no traffic
- The first request after spin-down takes 30–60 seconds
- This is normal and expected — not a bug

**What to do about slow first loads:**
- This is a limitation of the free tier and cannot be avoided without upgrading
- Consider adding a loading indicator in the frontend so users know the app is starting up
- The backend health endpoint (`/api/health`) can be used to "wake up" the service

**Monthly limits:**
- 750 hours of running time per month (enough for one always-on service)
- Limited bandwidth

### Vercel Free Tier

- Vercel's free tier does **not** spin down — your frontend is always fast
- 100 GB bandwidth per month
- Unlimited deployments for personal projects

### MongoDB Atlas Free Tier (M0)

- 512 MB storage limit
- Shared RAM and CPU (may be slow under heavy load)
- Limited to 500 connections
- No automatic backups (consider exporting data periodically)

**If you're hitting the storage limit:**
- The Sugar Intake Tracker uses very little storage (each entry is a few bytes)
- 512 MB is enough for years of daily entries
- If you somehow approach the limit, you can delete old data through the Atlas UI

---

## 6. Frontend Issues

### Blank Page After Deployment

1. Open browser developer tools (press `F12` or right-click → **Inspect**)
2. Go to the **Console** tab and look for errors
3. Common causes:
   - `VITE_API_URL` not set → add it in Vercel environment variables and redeploy
   - JavaScript errors → check the console for specific error messages
   - Wrong Root Directory in Vercel → should be `frontend`

### Calendar Not Loading Data

1. Check the browser console for network errors
2. Verify the backend is running by visiting `https://your-backend-url.onrender.com/api/health`
3. If the backend is spun down (free tier), wait 30–60 seconds and refresh
4. Check that `VITE_API_URL` points to the correct backend URL

### Styling Looks Broken

1. Clear your browser cache (`Ctrl+Shift+Delete` or `Cmd+Shift+Delete`)
2. Try a hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`)
3. Check that the build completed successfully in Vercel's deployment logs

---

## 7. Backend Issues

### Server Crashes on Startup

1. Check the logs in Render (Dashboard → your service → **Logs**)
2. Common causes:
   - Invalid `MONGODB_URI` → fix the connection string
   - Missing environment variables → add them in Render's Environment settings
   - Port conflict → don't set `PORT` manually; let Render assign it

### API Returns 500 Errors

1. Check the Render logs for the specific error message
2. Common causes:
   - Database connection lost → check MongoDB Atlas status
   - Invalid data in request → check the request body format
   - Unhandled error in route handler → check the logs for stack traces

### Data Not Persisting

1. Verify the `MONGODB_URI` points to the correct database
2. Check that the database user has read/write permissions (Atlas → Database Access)
3. Try creating an entry via curl to isolate the issue:
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/entries \
     -H "Content-Type: application/json" \
     -d '{"date": "2025-01-15", "sugarConsumed": false}'
   ```

---

## Getting More Help

If you're stuck on an issue not covered here:

1. **Check the logs**: Both Render and Vercel provide detailed deployment and runtime logs
2. **Test locally**: Try reproducing the issue in your local development environment
3. **Check the browser console**: Frontend errors are usually visible in the browser's developer tools
4. **Verify step by step**: Test the backend independently (health endpoint), then the frontend, then the connection between them
