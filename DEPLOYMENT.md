# Deployment Guide: Tarik Bhai AI

This guide explains how to deploy the "Tarik Bhai AI" system. You can deploy it as a single full-stack app on Render, or split it between Netlify (Frontend) and Render (Backend).

## Option 1: Single Deployment on Render (Recommended & Easiest)

Since the app is built with Express and Vite, it can serve both the backend API and the frontend from a single Render Web Service.

1. Push your code to a GitHub repository.
2. Go to [Render](https://render.com/) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add all your Environment Variables from `.env.example` in the Render dashboard.
6. Click **Deploy**. Render will build the frontend, obfuscate the code, and start the Express server.

---

## Option 2: Split Deployment (Netlify + Render)

If you prefer hosting the frontend on Netlify and the backend on Render.

### Step 1: Deploy Backend to Render
1. Push your code to GitHub.
2. Create a new **Web Service** on Render.
3. Configure the service:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add your Environment Variables.
5. Deploy and copy the provided Render URL (e.g., `https://tarik-bhai-api.onrender.com`).

### Step 2: Deploy Frontend to Netlify
1. Open the `netlify.toml` file in the root of your project.
2. Replace `YOUR_RENDER_BACKEND_URL.onrender.com` with your actual Render backend URL.
3. Push the changes to GitHub.
4. Go to [Netlify](https://www.netlify.com/) and create a new site from your GitHub repository.
5. Configure the site:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
6. Click **Deploy**. Netlify will build the frontend and automatically proxy all `/api/*` requests to your Render backend.

---

## Security Notes
- **API Keys:** Your OpenAI, Gemini, Hugging Face, and Telegram keys are strictly kept on the backend. They will never be exposed to the frontend.
- **Obfuscation:** The frontend JavaScript is automatically obfuscated during the build process (`npm run build`) to prevent reverse engineering.
- **Anti-Inspect:** The frontend includes logic to disable right-click, F12, and common developer shortcuts.
