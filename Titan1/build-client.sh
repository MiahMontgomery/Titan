#!/bin/bash
# Script to build the client directly in its directory with consistent output

echo "Building client application..."
cd client && npm run build

# Create symlink from dist/public to client/dist for compatibility
echo "Creating compatibility symlinks..."
mkdir -p dist
if [ -d "dist/public" ]; then
  rm -rf dist/public
fi

# Create symlink if client/dist exists
if [ -d "client/dist" ]; then
  echo "Linking client/dist to dist/public for compatibility"
  ln -s ../client/dist dist/public
  echo "Build complete and linked"
else
  echo "Error: client/dist doesn't exist. Build may have failed."
  exit 1
fi