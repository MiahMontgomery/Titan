// Test script to verify Vercel deployment configuration
// This file doesn't need to be deployed, it's just for testing

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration validation
console.log('Vercel Configuration Test');
console.log('========================');

// Check package.json
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  console.log('✓ package.json exists');
  
  if (packageJson.scripts && packageJson.scripts['vercel-build']) {
    console.log('✓ vercel-build script exists in package.json');
  } else {
    console.log('✗ vercel-build script is missing in package.json');
  }
  
  // Check if Vite is in devDependencies
  if (packageJson.devDependencies && packageJson.devDependencies.vite) {
    console.log('✓ vite is in devDependencies');
  } else if (packageJson.dependencies && packageJson.dependencies.vite) {
    console.log('⚠ vite is in dependencies, not devDependencies');
  } else {
    console.log('✗ vite is not found in dependencies or devDependencies');
  }
} catch (err) {
  console.error('✗ Error reading package.json:', err.message);
}

// Check vite.config.ts
try {
  const viteConfig = fs.readFileSync(path.join(__dirname, 'vite.config.ts'), 'utf8');
  console.log('✓ vite.config.ts exists');
  
  if (viteConfig.includes('outDir: "dist"')) {
    console.log('✓ vite.config.ts has correct output directory setting');
  } else if (viteConfig.includes('outDir:') && !viteConfig.includes('outDir: "dist"')) {
    console.log('✗ vite.config.ts has incorrect output directory setting');
  } else {
    console.log('⚠ vite.config.ts does not specify output directory');
  }
} catch (err) {
  console.error('✗ Error reading vite.config.ts:', err.message);
}

// Check vercel.json
try {
  const vercelJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
  console.log('✓ vercel.json exists');
  
  if (vercelJson.buildCommand === 'npm run vercel-build') {
    console.log('✓ vercel.json has correct buildCommand');
  } else if (vercelJson.buildCommand) {
    console.log(`⚠ vercel.json has buildCommand "${vercelJson.buildCommand}", should be "npm run vercel-build"`);
  } else {
    console.log('⚠ vercel.json does not specify buildCommand');
  }
  
  if (vercelJson.outputDirectory === 'dist') {
    console.log('✓ vercel.json has correct outputDirectory');
  } else if (vercelJson.outputDirectory) {
    console.log(`⚠ vercel.json has outputDirectory "${vercelJson.outputDirectory}", should be "dist"`);
  } else {
    console.log('⚠ vercel.json does not specify outputDirectory');
  }
  
  if (vercelJson.routes) {
    console.log('✓ vercel.json contains route configuration for SPA');
  } else {
    console.log('⚠ vercel.json does not contain route configuration');
  }
} catch (err) {
  console.error('✗ Error reading vercel.json:', err.message);
}

// Check vercel-build.js
try {
  const vercelBuild = fs.readFileSync(path.join(__dirname, 'vercel-build.js'), 'utf8');
  console.log('✓ vercel-build.js exists');
  
  if (vercelBuild.includes('vite build')) {
    console.log('✓ vercel-build.js runs vite build');
  } else {
    console.log('⚠ vercel-build.js might not run vite build');
  }
} catch (err) {
  console.error('✗ Error reading vercel-build.js:', err.message);
}

// Summary of what's needed to fix Vercel deployment
console.log('\nVercel Deployment Summary:');
console.log('1. Vite is installed as a dev dependency in client/package.json');
console.log('2. "vercel-build" script is defined in client/package.json');
console.log('3. vite.config.ts is configured to build to "dist"');
console.log('4. vercel.json is configured with the proper build settings and routes');
console.log('5. Remember to update the following in the Vercel deployment settings:');
console.log('   - Set Root Directory to "client"');
console.log('   - Set Build Command to "npm run vercel-build"');
console.log('   - Set Output Directory to "dist"');
console.log('\nRun this file with: node vercel-config-test.js');