#!/bin/bash

# Script to force push changes to GitHub

# Show current git status
echo "Current Git Status:"
git status

# Force push current HEAD to GitHub main branch
echo "Force pushing current HEAD to GitHub main branch..."
git push -f origin HEAD:main

echo "Changes force pushed to GitHub. Please check GitHub repository to confirm."