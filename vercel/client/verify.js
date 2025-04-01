/**
 * Vercel Client Build Verification
 * 
 * This script verifies that the Vercel client build environment has all
 * required dependencies and configuration.
 */

console.log("Verifying Vercel client build environment...");

// Check for essential files
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  'vite.config.js',
  'vercel.json',
  'index.html'
];

let hasAllFiles = true;

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    console.error(`❌ Missing required file: ${file}`);
    hasAllFiles = false;
  } else {
    console.log(`✅ Found required file: ${file}`);
  }
}

// Check package.json contains required scripts
const packageJson = require('./package.json');

if (!packageJson.scripts || !packageJson.scripts.build) {
  console.error('❌ package.json is missing the "build" script');
  hasAllFiles = false;
} else {
  console.log('✅ package.json has the "build" script');
}

// Success message if all checks pass
if (hasAllFiles) {
  console.log("✅ All verification checks passed!");
  process.exit(0);
} else {
  console.error("❌ Verification failed - see errors above");
  process.exit(1);
}