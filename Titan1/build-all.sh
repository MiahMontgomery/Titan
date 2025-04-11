#!/bin/bash

# Master build script for Titan project
# Builds both client and server for deployment

echo "=== TITAN BUILD PROCESS ==="

echo ""
echo "Stage 1: Building Server"
echo "========================"
cd server
./build.sh

echo ""
echo "Stage 2: Building Client"
echo "========================"
cd ../client
./build.sh

echo ""
echo "Build Complete!"
echo "==============="
echo "Server files: ./dist-server/"
echo "Client files: ./dist-client/"
echo ""
echo "To deploy:"
echo "1. Server: Upload dist-server to a Node.js hosting service (e.g., Render.com)"
echo "2. Client: Upload dist-client to a static hosting service (e.g., Vercel, Netlify, or GitHub Pages)"
echo ""
echo "Make sure to set the appropriate environment variables on both deployments."
echo "=== BUILD FINISHED ==="