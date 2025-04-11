#!/bin/bash

# Git push script with commit message

# Check if a commit message was provided
if [ -z "$1" ]; then
  echo "Error: No commit message provided"
  echo "Usage: ./scripts/push.sh \"Your commit message\""
  exit 1
fi

COMMIT_MESSAGE=$1

# Assuming the repo is already initialized and remote is set up
git add .
git commit -m "$COMMIT_MESSAGE"
git push

echo "Changes pushed to repository with message: $COMMIT_MESSAGE"