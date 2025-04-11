# Titan Client

This is the client application for the Titan project.

## Vercel Deployment Instructions

1. Create a new project on Vercel
2. Connect to your GitHub repository
3. Configure the following settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add the following environment variables:
   ```
   VITE_API_URL=https://titan-api.onrender.com
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

5. Deploy

## Alternative Setup Instructions

If you encounter issues with the Vite build, try these alternate steps:

1. Delete the `vercel.json` file in the client directory
2. In the Vercel project settings:
   - Set **Framework Preset** to "Other"
   - Set **Root Directory** to `client`
   - Set **Build Command** to `npm install && npm run build`
   - Set **Output Directory** to `dist`

3. Add the environment variables listed above
4. Deploy