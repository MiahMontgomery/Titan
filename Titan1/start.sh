#!/bin/bash

# FINDOM / Titan Startup Script
# This script initializes and runs the application on a VM

echo "Starting FINDOM / Titan application..."

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY not set. Please add it to your environment variables."
  echo "You can create a .env file with this variable or set it directly."
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if data directory exists
if [ ! -d "./data" ]; then
  echo "Creating data directory..."
  mkdir -p data/dumps
fi

# Check if db.json exists in the data/dumps directory
if [ ! -f "./data/dumps/db.json" ]; then
  echo "No db.json found in data/dumps, checking for data/db.json..."
  
  # Check if db.json exists in data directory
  if [ -f "./data/db.json" ]; then
    echo "Found db.json in data directory, copying to data/dumps..."
    cp ./data/db.json ./data/dumps/db.json
  else
    echo "No db.json found. A new database will be initialized when the application starts."
  fi
else
  echo "Using existing db.json from data/dumps directory..."
  cp ./data/dumps/db.json ./data/db.json
fi

# Start the application
echo "Starting application..."
NODE_ENV=production npm run build && npm start

# If you want to watch for file changes (development mode)
# npm run dev