#!/usr/bin/env node
// Special build script for Vercel deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  console.log('Starting build process for Vercel deployment...');
  
  // Create a basic .env file for build if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, '.env'))) {
    console.log('Creating basic .env file for build...');
    fs.writeFileSync(path.join(__dirname, '.env'), 'NODE_ENV=production\n');
  }

  // Always install client dependencies to ensure Vite is available
  console.log('Installing client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });

  // Build the frontend with explicit path and ensure node_modules/.bin is in PATH
  console.log('Building frontend...');
  execSync('cd client && PATH="$PATH:$(pwd)/node_modules/.bin" npm run build', { stdio: 'inherit' });
  
  // Ensure public directory exists in dist
  const distPublicDir = path.join(__dirname, 'dist', 'public');
  if (!fs.existsSync(distPublicDir)) {
    fs.mkdirSync(distPublicDir, { recursive: true });
  }
  
  // Copy client build to dist/public
  console.log('Copying client build to dist/public...');
  execSync('cp -r client/dist/* dist/public/', { stdio: 'inherit' });
  
  // Build the server
  console.log('Building backend...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  // Create a server.js file in dist for Vercel serverless functions
  console.log('Creating serverless function entry point...');
  const serverlessContent = `
// Vercel serverless function entry point
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import express from 'express';

// Import the server app
import { app } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// For Vercel serverless environment
export default async function handler(req, res) {
  // Pass the request to our Express app
  return app(req, res);
}
  `;

  fs.writeFileSync(path.join(__dirname, 'dist', 'server.js'), serverlessContent);
  
  console.log('Build process completed successfully!');
} catch (error) {
  console.error('Build process failed:', error);
  process.exit(1);
}