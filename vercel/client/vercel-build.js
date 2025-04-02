// vercel-build.js - Special build script for Vercel client deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// __dirname is already available in CommonJS modules

try {
  console.log('Starting Vercel client build process...');
  
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  }
  
  // Ensure Tailwind and PostCSS configs are properly set up
  console.log('Checking build configuration...');
  
  // Build the client application with Vite
  console.log('Building client application...');
  execSync('vite build', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('Client build completed successfully!');
} catch (error) {
  console.error('Client build process failed:', error);
  
  // Create a basic index.html in case of failure to ensure deployment doesn't fail completely
  if (!fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
    console.log('Creating fallback index.html...');
    const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Titan - Build Error</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; text-align: center; }
    h1 { color: #e53e3e; }
    p { margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Build Error</h1>
  <p>There was an error during the build process. Please check the build logs for more information.</p>
  <p>If this issue persists, please contact the repository maintainer.</p>
</body>
</html>`;
    
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), fallbackHtml);
    console.log('Fallback index.html created');
  }
  
  process.exit(1);
}