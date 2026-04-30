# Frontend Deployment Guide (Vercel)

This guide walks you through deploying the Sugar Intake Tracker frontend to Vercel. Vercel is a cloud platform optimized for frontend frameworks like React and Vite, and offers a generous free tier.

## Prerequisites

Before starting, make sure you have:

- A [GitHub](https://github.com) account with your project pushed to a repository
- The backend already deployed to Render ([see the backend deployment guide](./backend-deployment-render.md))
- Your Render backend URL ready (e.g., `https://sugar-tracker-api.onrender.com`)

## Table of Contents

1. [Create a Vercel Account](#1-create-a-vercel-account)
2. [Import Your Project](#2-import-your-project)
3. [Configure the Build Settings](#3-configure-the-build-settings)
4. [Set Environment Variables](#4-set-environment-variables)
5. [Deploy](#5-deploy)
6. [Update the Backend CORS Setting](#6-update-the-backend-cors-setting)
7. [Verify the Deployment](#7-verify-the-deployment)

---

## 1. Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Sign up using your **GitHub account** (recommended — this makes importing your repository easier)
4. Authorize Vercel to access your GitHub repositories when prompted

## 2. Import Your Project

1. From the Vercel dashboard, click **Add New...** and select **Project**
2. You'll see a list of your GitHub repositories
3. Find your Sugar Intake Tracker repository and click **Import**

## 3. Configure the Build Settings

Vercel usually auto-detects Vite projects, but verify these settings:

| Setting | Value |
|---------|-------|
| **Project Name** | `sugar-tracker` (or any name you prefer) |
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

> **Important**: Set the **Root Directory** to `frontend` since the frontend code lives in the `frontend/` folder of the repository. Click **Edit** next to Root Directory to change it.

## 4. Set Environment Variables

1. Expand the **Environment Variables** section on the configuration page
2. Add the following variable:

| Key | Value | Description |
|-----|-------|-------------|
| `VITE_API_URL` | `https://sugar-tracker-api.onrender.com/api` | Your Render backend URL with `/api` appended |

> **Important**: The variable name must start with `VITE_` for Vite to include it in the frontend build. Without this prefix, the variable won't be available in the browser.

> **Note**: Replace `sugar-tracker-api.onrender.com` with your actual Render service URL from the backend deployment.

## 5. Deploy

1. Click **Deploy**
2. Vercel will automatically:
   - Clone your repository
   - Navigate to the `frontend` directory
   - Run `npm install` to install dependencies
   - Run `npm run build` to create the production build
   - Deploy the contents of the `dist` folder
3. The deployment takes 1–3 minutes
4. Once complete, Vercel gives you a URL like:

   ```
   https://sugar-tracker.vercel.app
   ```

## 6. Update the Backend CORS Setting

After deploying the frontend, you need to tell the backend to accept requests from your Vercel URL.

1. Go to your Render dashboard at [dashboard.render.com](https://dashboard.render.com)
2. Click on your backend service (`sugar-tracker-api`)
3. Go to **Environment**
4. Update the `FRONTEND_URL` variable:

   ```
   FRONTEND_URL=https://sugar-tracker.vercel.app
   ```

   > Use your actual Vercel URL. Do **not** include a trailing slash.

5. Click **Save Changes**
6. Render will automatically redeploy with the updated environment variable

## 7. Verify the Deployment

1. Open your Vercel URL in a browser (e.g., `https://sugar-tracker.vercel.app`)
2. You should see the Sugar Intake Tracker calendar interface
3. Test the following:
   - The daily prompt ("Did you eat sugar today?") appears
   - Clicking Yes or No records an entry
   - The calendar updates with the correct emoji/color
   - Navigating between months works
   - Clicking on past days opens the update dialog

If you see errors, check the [troubleshooting guide](./troubleshooting.md).

---

## Automatic Deployments

Vercel automatically redeploys your frontend whenever you push changes to the connected branch. Each deployment gets a unique URL, and the latest deployment is always available at your primary domain.

## Custom Domain (Optional)

If you want a custom domain instead of `*.vercel.app`:

1. Go to your project settings in Vercel
2. Click **Domains**
3. Add your custom domain and follow the DNS configuration instructions

## Free Tier Details

Vercel's free tier (Hobby plan) includes:

- **Unlimited deployments** for personal projects
- **100 GB bandwidth** per month
- **Automatic HTTPS** on all deployments
- **Global CDN** for fast loading worldwide
- **Preview deployments** for every pull request

Unlike Render's free tier, Vercel does **not** spin down on inactivity — your frontend is always fast.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check that the Root Directory is set to `frontend` and the build command is `npm run build` |
| Blank page after deployment | Open browser dev tools (F12) → Console tab. Look for errors. Usually means `VITE_API_URL` is not set. |
| "Failed to fetch" errors | The backend URL in `VITE_API_URL` may be wrong, or the backend is spun down (wait 30–60 seconds and refresh) |
| CORS errors | Make sure `FRONTEND_URL` on Render matches your Vercel URL exactly |
| Environment variable not working | Variable names must start with `VITE_`. After changing env vars, you need to redeploy (Vercel doesn't hot-reload env vars). |

---

## Next Steps

- [Troubleshooting guide](./troubleshooting.md) for common issues
- [README](../README.md) for project overview
