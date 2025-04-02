#!/usr/bin/env node
/**
 * Custom build script to override the Vite output directory
 * This script runs Vite build with a custom output directory
 */
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting custom build process...');

try {
  // Set environment variables to override output directory
  const env = {
    ...process.env,
    VITE_CUSTOM_OUT_DIR: path.resolve(__dirname, 'dist')
  };
  
  console.log(`Setting output directory to: ${env.VITE_CUSTOM_OUT_DIR}`);
  
  // Run the Vite build command
  execSync('npx vite build', { 
    stdio: 'inherit',
    env 
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}