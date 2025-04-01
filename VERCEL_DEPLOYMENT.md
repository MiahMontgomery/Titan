# Vercel Deployment Guide for Titan Client

This guide will help you deploy the Titan client application to Vercel.

## Option 1: Simplified Deployment (Recommended)

I've created a simplified version of the client specifically for Vercel deployment.

### Steps:

1. Log in to your Vercel account
2. Click "Add New..." → "Project"
3. Connect to your GitHub repository (MiahMontgomery/Titan)
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `vercel/client`
   - Leave other settings as default

5. Add Environment Variables:
   - `VITE_API_URL`: Your backend URL (e.g., https://titan-api.onrender.com)
   - `VITE_FIREBASE_API_KEY`: Your Firebase API key
   - `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `VITE_FIREBASE_APP_ID`: Your Firebase app ID

6. Click "Deploy"

This approach uses a simplified version of the client that's specifically formatted for Vercel deployment. It contains all the essential code but removes any potential configuration issues.

## Option 2: Direct Client Deployment

If you prefer to deploy the main client code directly:

### Steps:

1. Log in to your Vercel account
2. Click "Add New..." → "Project"
3. Connect to your GitHub repository (MiahMontgomery/Titan)
4. Configure the project:
   - **Framework Preset**: Other (not Vite)
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`

5. Add the same environment variables as in Option 1
6. Click "Deploy"

## Troubleshooting

If you encounter the "Command 'vite build' exited with 127" error:

1. Try Option 1 (simplified deployment) which is specifically designed to avoid this error
2. In Vercel project settings, try changing the "Framework Preset" to "Other" instead of "Vite"
3. Make sure Node.js version is set to 16.x or higher in the Vercel project settings
4. Check deployment logs for more specific error messages

## After Deployment

Once deployed, your client will be available at the Vercel-assigned URL. Update your environment variables in the server deployment to point CORS settings to this new URL.