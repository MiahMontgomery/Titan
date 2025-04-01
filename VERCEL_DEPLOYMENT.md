# Vercel Deployment Guide for Titan Client

This guide will help you deploy the Titan client application to Vercel, based on successful deployment configurations.

## Preferred Deployment Method

We've created an optimized version of the client specifically for Vercel deployment in the `vercel/client` directory.

### Steps:

1. Log in to your Vercel account
2. Click "Add New..." → "Project"
3. Connect to your GitHub repository (MiahMontgomery/Titan)
4. Configure the project:
   - **Framework Preset**: Select "Other" (not any specific framework)
   - **Root Directory**: Set to `vercel/client`
   - **Build Command**: Leave as `npm run build` (this will use our custom build script)
   - **Output Directory**: Leave as `dist`
   - **Node.js Version**: Set to "22.x"
   - **Include files outside of the Root Directory**: Enable this option

5. Add Environment Variables:
   - `VITE_API_URL`: Your backend URL (e.g., https://titan-api.onrender.com)
   - `VITE_FIREBASE_API_KEY`: Your Firebase API key
   - `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `VITE_FIREBASE_APP_ID`: Your Firebase app ID

6. Click "Deploy"

The `vercel/client` directory contains a simplified version of the client that's specifically formatted for Vercel deployment with proper configuration in vercel.json and all necessary build scripts.

## Troubleshooting Common Issues

### Build Failures

If you encounter build failures:

1. Check the Node.js version in Settings → General → Node.js Version (use 22.x as shown in the screenshots)
2. Make sure "Include files outside of the Root Directory" is enabled if you have dependencies on shared code
3. Ensure all required environment variables are set correctly
4. Review deployment logs for specific error messages

### Framework Detection Issues

If Vercel incorrectly detects the framework:

1. Manually set Framework Preset to "Other" in the project settings
2. Use the explicit configuration in our `vercel.json` file to override framework-specific settings
3. Make sure the build command uses the custom build script (`npm run build` which runs our `build.js`)

### Missing Dependencies

If you see errors about missing dependencies:

1. Check the CI workflow logs to see if any install steps failed
2. Make sure you're using the `vercel/client` directory which has all dependencies explicitly listed
3. Verify the package.json file is correctly formatted and includes all required dependencies

## Domain Configuration

After successful deployment:

1. Your app will be available at `https://titan-[generated-id].vercel.app`
2. You can add custom domains in the Vercel project settings
3. Update your environment variables in the server deployment to point CORS settings to your Vercel domain

## Configuration Screenshots

The repository contains reference screenshots in `attached_assets` showing the correct Vercel configuration that led to successful deployment. Refer to these if you're uncertain about specific settings.