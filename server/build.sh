#!/bin/bash

# Server build script
echo "Building server..."

# Ensure the output directory exists
mkdir -p dist/server

# Build server using esbuild
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

echo "Server build complete!"