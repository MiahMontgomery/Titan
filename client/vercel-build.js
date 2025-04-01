// Simple build script for Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log the current directory
console.log('Current directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync('.'));

try {
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build the project
  console.log('Building the project...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}