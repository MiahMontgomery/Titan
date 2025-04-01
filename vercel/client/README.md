# Titan Client - Simplified Vercel Deployment

This is a simplified version of the Titan client application specifically prepared for Vercel deployment.

## Deployment Instructions

1. Create a new Vercel project
2. Connect to your GitHub repository
3. Set the root directory to `vercel/client`
4. Add the following environment variables:
   - `VITE_API_URL`: Your backend URL (e.g., https://titan-api.onrender.com)
   - `VITE_FIREBASE_API_KEY`: Your Firebase API key
   - `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `VITE_FIREBASE_APP_ID`: Your Firebase app ID

Vercel should automatically detect the Vite framework and deploy correctly.

## Important Notes

- This is a simplified version of the client designed for reliable deployment
- If you need to update the client code, update the files in the main `client` directory and then copy the updated files to this directory
- After making changes, commit and push to GitHub to trigger a deployment