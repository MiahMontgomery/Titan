#!/usr/bin/env node

/**
 * Vercel Client Custom Build Script
 * 
 * This script handles the build process for the Vercel client,
 * with better error handling and reporting.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("Starting Vercel client build process...");

// Check for essential files
const requiredFiles = [
  'package.json',
  'vite.config.js',
  'vercel.json',
  'index.html'
];

console.log("Checking for required files:");
let hasRequiredFiles = true;

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    console.error(`❌ Missing required file: ${file}`);
    hasRequiredFiles = false;
  } else {
    console.log(`✅ Found required file: ${file}`);
  }
}

if (!hasRequiredFiles) {
  console.error("❌ Missing required files. Cannot proceed with build.");
  process.exit(1);
}

// Run the build command
try {
  console.log("Running Vite build...");
  execSync('npx vite build', { 
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log("✅ Build completed successfully!");
  process.exit(0);
} catch (error) {
  console.error(`❌ Build failed: ${error.message}`);
  process.exit(1);
}