#!/bin/bash

# Simple script to push changes to GitHub

# Add all changed files
git add .

# Commit with timestamped message or custom message
if [ -z "$1" ]; then
  git commit -m "Update Titan project $(date '+%Y-%m-%d %H:%M:%S')"
else
  git commit -m "$1"
fi

# Push to GitHub
git push origin main

echo "Changes pushed to GitHub successfully!"