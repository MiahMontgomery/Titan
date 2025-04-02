#!/bin/bash

# Script to deploy the client to Vercel
echo "========================================"
echo "Titan Client Vercel Deployment Utility"
echo "========================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Prepare client for deployment
echo "Preparing client for deployment..."

# Install necessary dependencies
echo "Ensuring all dependencies are installed..."
npm install

# Make sure Tailwind CSS is installed as a regular dependency
if ! grep -q "\"tailwindcss\"" package.json; then
    echo "Adding Tailwind CSS as a dependency..."
    npm install tailwindcss autoprefixer postcss --save
fi

# Set up environment variables for production
echo "Setting up environment variables..."
cat > .env.production << EOL
VITE_API_URL=https://your-backend-url.onrender.com
EOL

echo "Environment set up complete."
echo

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo
echo "Deployment process completed!"
echo "To verify your deployment, visit your Vercel dashboard."