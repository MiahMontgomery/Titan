// Enhanced build script for Vercel with error handling and dependency checks
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log the current directory and environment
console.log('Current directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync('.'));
console.log('NODE_ENV:', process.env.NODE_ENV);

// Ensure theme.json exists
function ensureThemeJson() {
  const themeJsonPath = path.join(process.cwd(), 'theme.json');
  if (!fs.existsSync(themeJsonPath)) {
    console.log('Creating default theme.json file');
    const defaultTheme = {
      primary: "#4a6cf7",
      variant: "professional",
      appearance: "light",
      radius: 0.5
    };
    fs.writeFileSync(themeJsonPath, JSON.stringify(defaultTheme, null, 2));
  } else {
    console.log('theme.json already exists');
  }
}

// Ensure all critical dependencies are installed
function ensureDependencies() {
  const criticalDeps = [
    'tailwindcss',
    'postcss',
    'autoprefixer',
    'tailwindcss-animate',
    '@tailwindcss/typography',
    'vite',
    '@vitejs/plugin-react'
  ];

  console.log('Checking critical dependencies...');
  
  try {
    // Try to require each dependency to see if it's installed
    criticalDeps.forEach(dep => {
      try {
        require.resolve(dep);
        console.log(`✓ ${dep} is installed`);
      } catch (e) {
        console.log(`✗ ${dep} is not installed, installing now...`);
        execSync(`npm install ${dep} --save`, { stdio: 'inherit' });
      }
    });
  } catch (error) {
    console.warn('Error checking dependencies:', error.message);
    // Continue anyway, we'll try to install all below
  }
  
  // Ensure all critical dependencies are installed
  console.log('Installing all critical dependencies to be sure...');
  execSync(`npm install ${criticalDeps.join(' ')} --save`, { 
    stdio: 'inherit',
    // Don't fail if one is already installed
    env: { ...process.env, NPM_CONFIG_FUND: 'false', NPM_CONFIG_AUDIT: 'false' }
  });
}

try {
  // Ensure theme.json exists
  ensureThemeJson();
  
  // Ensure critical dependencies
  ensureDependencies();
  
  // Install all dependencies
  console.log('Installing all dependencies...');
  execSync('npm install', { 
    stdio: 'inherit',
    // Don't show funding or audit messages
    env: { ...process.env, NPM_CONFIG_FUND: 'false', NPM_CONFIG_AUDIT: 'false' }
  });

  // Build the project
  console.log('Building the project...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  console.error('Trying fallback build method...');
  
  try {
    // Ensure NODE_ENV is production
    process.env.NODE_ENV = 'production';
    
    // Try direct vite build command
    execSync('npx vite build', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    console.log('Fallback build completed successfully!');
  } catch (fallbackError) {
    console.error('Fallback build also failed:', fallbackError.message);
    process.exit(1);
  }
}