# Vercel Deployment Guide for Titan Client

This guide provides step-by-step instructions for deploying the Titan client application to Vercel. The Titan system uses a dual-deployment architecture with the frontend (client) deployed on Vercel and the backend deployed on Render or a similar service.

## Prerequisites

- GitHub account with your Titan repository
- Vercel account (create one at [vercel.com](https://vercel.com) if needed)
- Node.js and npm installed locally for development

## Client Deployment Steps

### 1. Prepare Your Repository

Ensure your repository includes the `/vercel/client` directory with all the necessary files:
- `package.json` with all required dependencies
- `vercel.json` configuration file
- `vercel-build.js` build script
- All frontend source code

### 2. Connect Vercel to GitHub

1. Log in to your Vercel account
2. Click "Add New..." → "Project"
3. Connect to your GitHub account if not already connected
4. Select your Titan repository

### 3. Configure Project Settings

Use the following configuration settings:
- **Framework Preset**: Vite
- **Root Directory**: `vercel/client`
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Development Command**: `npm run dev`

### 4. Configure Environment Variables

Add the following environment variables to your Vercel project:

| Name | Value | Description |
|------|-------|-------------|
| `VITE_API_URL` | `https://your-backend-url.onrender.com` | URL of your backend API |
| `VITE_FIREBASE_API_KEY` | Your Firebase API key | Required for Firebase integration |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID | Required for Firebase integration |
| `VITE_FIREBASE_APP_ID` | Your Firebase app ID | Required for Firebase integration |

### 5. Deploy

Click "Deploy" to start the deployment process. Vercel will build and deploy your client application.

## Automated Deployment

For automated deployments, you can:

1. Use GitHub Actions workflow `.github/workflows/vercel-client.yml`
2. Configure Vercel for automatic deployments when you push to the main branch

## Manual Deployment

To manually deploy the client:

1. Navigate to the `/vercel/client` directory
2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

## Troubleshooting

- **Build Failures**: Check the build logs in Vercel for specific error messages
- **Connection Issues**: Ensure your backend API URL is correctly set in environment variables
- **Styling Problems**: Verify that Tailwind CSS is correctly installed as a dependency

## Architecture Notes

The Titan system uses a dual-deployment architecture:
- **Client (Frontend)**: Deployed on Vercel, handles UI and user interactions
- **Server (Backend)**: Deployed on Render or similar service, handles AI processing, data storage, and API endpoints

This separation allows for independent scaling and maintenance of the frontend and backend components.