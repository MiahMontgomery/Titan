#!/bin/bash

# Server build script
echo "Building Titan server..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the server
npm run build

echo "Server build complete. Output is in ../dist-server"