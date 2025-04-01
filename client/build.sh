#!/bin/bash

# Client build script
echo "Building Titan client..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the client
npm run build

echo "Client build complete. Output is in ../dist-client"