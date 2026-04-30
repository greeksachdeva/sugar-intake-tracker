# MongoDB Atlas Setup Guide

This guide walks you through setting up a free MongoDB Atlas database for the Sugar Intake Tracker. No prior database experience is needed.

## Table of Contents

1. [Create a MongoDB Atlas Account](#1-create-a-mongodb-atlas-account)
2. [Create a Free Cluster](#2-create-a-free-cluster)
3. [Create a Database User](#3-create-a-database-user)
4. [Configure Network Access](#4-configure-network-access)
5. [Get Your Connection String](#5-get-your-connection-string)
6. [Verify the Connection](#6-verify-the-connection)

---

## 1. Create a MongoDB Atlas Account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Try Free** or **Register**
3. You can sign up with:
   - Your email address and a password
   - Your Google account
   - Your GitHub account
4. Complete the registration form and verify your email if prompted
5. You may be asked a few onboarding questions (organization name, project name, etc.). You can use any values — for example:
   - Organization: `Personal`
   - Project: `Sugar Tracker`

## 2. Create a Free Cluster

A "cluster" is where your database lives. The free tier (M0) gives you 512 MB of storage, which is more than enough for this project.

1. After signing in, you should see the **Database Deployments** page. If not, click **Database** in the left sidebar.
2. Click **Build a Database** (or **Create** if you already have clusters)
3. Choose the **M0 Free** tier
4. Configure your cluster:
   - **Provider**: Choose any (AWS, Google Cloud, or Azure — all work fine)
   - **Region**: Pick the region closest to where your backend will be hosted. If you're using Render (US), choose a US region like `us-east-1`
   - **Cluster Name**: You can keep the default (`Cluster0`) or name it something like `sugar-tracker`
5. Click **Create Deployment**

The cluster takes 1–3 minutes to provision. You'll see a spinning indicator while it's being created.

## 3. Create a Database User

MongoDB Atlas requires a database user (separate from your Atlas account) to connect to the database.

1. During cluster creation, Atlas may prompt you to create a user. If not, go to **Database Access** in the left sidebar.
2. Click **Add New Database User**
3. Choose **Password** as the authentication method
4. Enter a username and password:
   - **Username**: `sugar-tracker-user` (or any name you prefer)
   - **Password**: Click **Autogenerate Secure Password** and copy it somewhere safe
   
   > **Important**: Save this password! You'll need it for the connection string. Avoid special characters like `@`, `%`, or `/` in the password as they can cause connection issues.

5. Under **Database User Privileges**, select **Read and write to any database**
6. Click **Add User**

## 4. Configure Network Access

Network access controls which IP addresses can connect to your database. For a free-tier project, we'll allow access from anywhere.

1. Go to **Network Access** in the left sidebar
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** — this sets the IP to `0.0.0.0/0`
   
   > **Note**: Allowing access from anywhere is fine for a free-tier personal project. For production applications with sensitive data, you would restrict this to specific IP addresses.

4. Click **Confirm**

The change takes about 1 minute to take effect.

## 5. Get Your Connection String

The connection string is what your backend uses to connect to the database.

1. Go to **Database** in the left sidebar
2. Find your cluster and click **Connect**
3. Choose **Drivers** (or **Connect your application**)
4. Make sure the driver is set to **Node.js** and the version is **5.5 or later**
5. Copy the connection string. It looks like this:

   ```
   mongodb+srv://sugar-tracker-user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

6. Replace `<password>` with the database user password you created in Step 3
7. Add a database name before the `?`. Your final string should look like:

   ```
   mongodb+srv://sugar-tracker-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sugar-tracker?retryWrites=true&w=majority&appName=Cluster0
   ```

   > The `sugar-tracker` part after the `/` is the database name. MongoDB will create it automatically when your app first writes data.

## 6. Verify the Connection

You can test the connection locally before deploying:

1. In your backend project, create a `.env` file (copy from `.env.example`):

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and set the `MONGODB_URI` to your connection string:

   ```
   MONGODB_URI=mongodb+srv://sugar-tracker-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sugar-tracker?retryWrites=true&w=majority&appName=Cluster0
   ```

3. Start the backend:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. If the connection is successful, you'll see a message like:

   ```
   Server running on port 5000
   ```

5. Test the health endpoint in your browser or with curl:

   ```bash
   curl http://localhost:5000/api/health
   ```

   You should get a response like:

   ```json
   { "status": "ok", "timestamp": "2025-01-15T10:30:00Z" }
   ```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Authentication failed" | Double-check your username and password in the connection string. Make sure you replaced `<password>` with the actual password. |
| "Network timeout" or "connection refused" | Check that your IP is allowed in Network Access. Try setting it to `0.0.0.0/0`. |
| "Invalid connection string" | Make sure the connection string starts with `mongodb+srv://` and has no extra spaces. |
| Cluster stuck on "Creating" | Wait a few minutes. If it takes more than 10 minutes, try refreshing the page. |

---

## Next Steps

Once your database is set up and verified:

- [Deploy the backend to Render](./backend-deployment-render.md)
- [Deploy the frontend to Vercel](./frontend-deployment-vercel.md)
