#!/bin/bash

# Version update script for Titan
# Updates version numbers in both client and server package.json files

# Check if a version was provided
if [ -z "$1" ]; then
  echo "Error: No version provided"
  echo "Usage: ./scripts/version.sh <version>"
  echo "Example: ./scripts/version.sh 1.2.0"
  exit 1
fi

NEW_VERSION=$1
DATE_TODAY=$(date +"%Y-%m-%d")

echo "Updating version to $NEW_VERSION ($DATE_TODAY)"

# Update server package.json
if [ -f "server/package.json" ]; then
  echo "Updating server version..."
  # Use jq to update the version field
  cat server/package.json | jq ".version = \"$NEW_VERSION\"" > server/package.json.tmp
  mv server/package.json.tmp server/package.json
fi

# Update client package.json
if [ -f "client/package.json" ]; then
  echo "Updating client version..."
  # Use jq to update the version field
  cat client/package.json | jq ".version = \"$NEW_VERSION\"" > client/package.json.tmp
  mv client/package.json.tmp client/package.json
fi

# Create version file with build date
echo "{\"version\":\"$NEW_VERSION\",\"buildDate\":\"$DATE_TODAY\"}" > version.json

echo "Version updated to $NEW_VERSION"
echo "Don't forget to commit the changes:"
echo "git add server/package.json client/package.json version.json"
echo "git commit -m \"chore: bump version to $NEW_VERSION\""
echo "git tag v$NEW_VERSION"
echo "git push && git push --tags"