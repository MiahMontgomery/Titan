# Titan Client for Vercel

This is the client-side application for the Titan AI Project Management System, specifically configured for deployment on Vercel.

## Deployment Configuration

When deploying this client to Vercel, use the following settings:

1. **Framework Preset**: Other (Custom)
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`
5. **Development Command**: `npm run dev`
6. **Root Directory**: Set to `vercel/client` (not the repository root)

## Environment Variables

The following environment variables should be set in your Vercel deployment:

- `VITE_API_URL`: The URL to your backend API (deployed separately)
- `VITE_APP_NAME`: The application name (defaults to "Titan")
- `VITE_APP_VERSION`: The application version

## Local Development

To run this client locally:

```bash
cd vercel/client
npm install
npm run dev
```

## Branch Integration

This client automatically integrates with the main repository through CI/CD workflows, ensuring any changes to the main client codebase are reflected in this deployment-specific client.