#!/bin/bash

# Prepare for Vercel deployment
echo "Preparing for Vercel deployment..."

# Make sure our deployment scripts are up to date
git add vercel.json vercel-build.js
git commit -m "Update Vercel deployment configuration"

# Push to GitHub
echo "Pushing changes to GitHub..."
git push origin main

echo "Project is ready for Vercel deployment!"
echo "To deploy on Vercel:"
echo "1. Go to vercel.com and create a new project"
echo "2. Connect to your GitHub repository"
echo "3. Use the following settings:"
echo "   - Framework preset: Other"
echo "   - Build Command: node vercel-build.js"
echo "   - Output Directory: dist"
echo "   - Install Command: npm install"
echo "4. Add environment variables (if needed)"
echo "   - OPENAI_API_KEY"
echo "   - FIREBASE_API_KEY"
echo "   - FIREBASE_APP_ID"
echo "   - FIREBASE_PROJECT_ID"
echo "5. Deploy!"