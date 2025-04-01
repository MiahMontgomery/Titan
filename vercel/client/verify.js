#!/usr/bin/env node

/**
 * Vercel Client Build Verification
 * 
 * This script verifies that the Vercel client build environment has all
 * required dependencies and configuration.
 */

// Use CommonJS for maximum compatibility
const fs = require('fs');
const path = require('path');

console.log("Verifying Vercel client build environment...");

const requiredFiles = [
  'package.json',
  'vite.config.js',
  'vercel.json',
  'index.html'
];

let hasAllFiles = true;

// List all files in current directory
console.log("Files in directory:");
try {
  const dirFiles = fs.readdirSync(__dirname);
  console.log(dirFiles.join(', '));
} catch (error) {
  console.error('Error listing directory files:', error.message);
}

for (const file of requiredFiles) {
  try {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    if (!exists) {
      console.error(`❌ Missing required file: ${file}`);
      hasAllFiles = false;
    } else {
      console.log(`✅ Found required file: ${file}`);
    }
  } catch (error) {
    console.error(`Error checking file ${file}:`, error.message);
    hasAllFiles = false;
  }
}

// Check package.json contains required scripts
try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonData);

  if (!packageJson.scripts || !packageJson.scripts.build) {
    console.error('❌ package.json is missing the "build" script');
    hasAllFiles = false;
  } else {
    console.log('✅ package.json has the "build" script');
  }
} catch (error) {
  console.error('Error checking package.json:', error.message);
  hasAllFiles = false;
}

// Success message if all checks pass
if (hasAllFiles) {
  console.log("✅ All verification checks passed!");
  process.exit(0);
} else {
  console.error("❌ Verification failed - see errors above");
  process.exit(1);
}