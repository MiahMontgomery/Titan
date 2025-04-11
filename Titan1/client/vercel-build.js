// Enhanced build script for Vercel with error handling and dependency checks
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log the current directory and environment
console.log('Current directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync('.'));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Vercel build script starting...');

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
    'vite',
    '@vitejs/plugin-react',
    'tailwindcss',
    'postcss',
    'autoprefixer',
    'tailwindcss-animate',
    '@tailwindcss/typography'
  ];

  console.log('Checking critical dependencies...');
  
  // Verify Vite is installed as a dev dependency
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    if (!packageJson.devDependencies || !packageJson.devDependencies.vite) {
      console.log('Vite is not listed as a dev dependency, installing now...');
      execSync('npm install --save-dev vite', { stdio: 'inherit' });
    } else {
      console.log('✓ Vite is already installed as a dev dependency');
    }
  } catch (err) {
    console.warn('Error checking package.json:', err.message);
  }
  
  try {
    // Try to require each dependency to see if it's installed
    criticalDeps.forEach(dep => {
      try {
        require.resolve(dep);
        console.log(`✓ ${dep} is installed`);
      } catch (e) {
        console.log(`✗ ${dep} is not installed, installing now...`);
        if (dep === 'vite' || dep === '@vitejs/plugin-react') {
          execSync(`npm install ${dep} --save-dev`, { stdio: 'inherit' });
        } else {
          execSync(`npm install ${dep} --save`, { stdio: 'inherit' });
        }
      }
    });
  } catch (error) {
    console.warn('Error checking dependencies:', error.message);
    // Continue anyway
  }
}

// Validate the vite.config.ts file has correct output settings
function validateViteConfig() {
  try {
    const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
    if (fs.existsSync(viteConfigPath)) {
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
      console.log('Checking vite.config.ts for correct output directory...');
      if (!viteConfig.includes('outDir: "dist"')) {
        console.warn('Warning: vite.config.ts may not have the correct output directory setting.');
        console.warn('Should be set to "dist" not "dist/public" for Vercel deployment');
      } else {
        console.log('✓ vite.config.ts has correct output directory setting');
      }
    }
  } catch (error) {
    console.warn('Error validating vite.config.ts:', error.message);
  }
}

try {
  // Ensure theme.json exists
  ensureThemeJson();
  
  // Ensure critical dependencies
  ensureDependencies();
  
  // Validate vite.config.ts
  validateViteConfig();
  
  // Install all dependencies
  console.log('Installing all dependencies...');
  execSync('npm install', { 
    stdio: 'inherit',
    // Don't show funding or audit messages
    env: { ...process.env, NPM_CONFIG_FUND: 'false', NPM_CONFIG_AUDIT: 'false' }
  });

  // Build the project
  console.log('Building the project with Vite...');
  // Ensure NODE_ENV is production
  process.env.NODE_ENV = 'production';
  execSync('npx vite build', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  console.log('Vercel build completed successfully!');
  console.log('Output directory: dist');
  
  // List the contents of the dist directory
  if (fs.existsSync('./dist')) {
    console.log('dist directory contents:', fs.readdirSync('./dist'));
  } else {
    console.error('dist directory does not exist after build!');
  }
} catch (error) {
  console.error('Build failed:', error.message);
  console.error('Trying fallback build method...');
  
  try {
    // Ensure NODE_ENV is production
    process.env.NODE_ENV = 'production';
    
    // Try direct vite build command with explicit output directory
    execSync('npx vite build --outDir dist', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    console.log('Fallback build completed successfully!');
  } catch (fallbackError) {
    console.error('Fallback build also failed:', fallbackError.message);
    process.exit(1);
  }
}