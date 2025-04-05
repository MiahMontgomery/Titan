/**
 * Webhook Server for Titan
 * 
 * This server listens for GitHub webhook events, pulls the latest code,
 * and restarts PM2 processes when changes are detected.
 */

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');

// Load environment variables
dotenv.config();

// Constants
const PORT = process.env.WEBHOOK_PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const GIT_REPO = process.env.GIT_REPO || 'https://github.com/MiahMontgomery/Titan.git';
const GIT_BRANCH = process.env.GIT_BRANCH || 'main';
const APP_DIRECTORY = process.env.APP_DIRECTORY || '.';

// Create Express app
const app = express();
app.use(bodyParser.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Verify GitHub webhook signature
 * 
 * @param {Object} req - Express request object
 * @param {string} secret - Webhook secret
 * @returns {boolean} - True if signature is valid
 */
function verifySignature(req, secret) {
  if (!secret) {
    console.warn('WEBHOOK_SECRET not set, skipping signature verification');
    return true;
  }

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    console.error('X-Hub-Signature-256 header missing');
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Pull latest code from GitHub
 * 
 * @returns {Promise<boolean>} - True if pull was successful
 */
async function pullLatestCode() {
  try {
    const git = simpleGit(APP_DIRECTORY);
    console.log(`Pulling latest code from ${GIT_REPO} (${GIT_BRANCH})`);
    await git.pull('origin', GIT_BRANCH);
    console.log('Pull successful');
    return true;
  } catch (error) {
    console.error('Error pulling code:', error.message);
    return false;
  }
}

/**
 * Restart PM2 processes
 * 
 * @returns {Promise<boolean>} - True if restart was successful
 */
async function restartProcesses() {
  return new Promise((resolve) => {
    console.log('Restarting PM2 processes...');
    exec('pm2 reload all', (error, stdout, stderr) => {
      if (error) {
        console.error('Error restarting processes:', error.message);
        console.error(stderr);
        resolve(false);
      } else {
        console.log('PM2 processes restarted successfully');
        console.log(stdout);
        resolve(true);
      }
    });
  });
}

/**
 * Install dependencies
 * 
 * @returns {Promise<boolean>} - True if installation was successful
 */
async function installDependencies() {
  return new Promise((resolve) => {
    console.log('Installing dependencies...');
    exec('npm install', { cwd: APP_DIRECTORY }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error installing dependencies:', error.message);
        console.error(stderr);
        resolve(false);
      } else {
        console.log('Dependencies installed successfully');
        console.log(stdout);
        resolve(true);
      }
    });
  });
}

/**
 * Build the application
 * 
 * @returns {Promise<boolean>} - True if build was successful
 */
async function buildApplication() {
  return new Promise((resolve) => {
    console.log('Building application...');
    exec('npm run build', { cwd: APP_DIRECTORY }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error building application:', error.message);
        console.error(stderr);
        resolve(false);
      } else {
        console.log('Application built successfully');
        console.log(stdout);
        resolve(true);
      }
    });
  });
}

// GitHub webhook endpoint
app.post('/webhook/github', async (req, res) => {
  try {
    // Verify signature
    if (!verifySignature(req, WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Unauthorized');
    }

    // Check if it's a push event to the target branch
    const event = req.headers['x-github-event'];
    if (event !== 'push') {
      console.log(`Ignoring GitHub event: ${event}`);
      return res.status(200).send('Event ignored');
    }

    const payload = req.body;
    const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : '';
    
    if (branch !== GIT_BRANCH) {
      console.log(`Ignoring push to branch: ${branch}`);
      return res.status(200).send('Branch ignored');
    }

    console.log(`Processing push to ${branch} by ${payload.pusher?.name || 'unknown'}`);
    
    // Respond immediately to GitHub
    res.status(200).send('Webhook received');
    
    // Process webhook asynchronously
    const pullSuccess = await pullLatestCode();
    if (!pullSuccess) {
      console.error('Failed to pull latest code');
      return;
    }

    const installSuccess = await installDependencies();
    if (!installSuccess) {
      console.error('Failed to install dependencies');
      return;
    }

    const buildSuccess = await buildApplication();
    if (!buildSuccess) {
      console.error('Failed to build application');
      return;
    }

    const restartSuccess = await restartProcesses();
    if (!restartSuccess) {
      console.error('Failed to restart processes');
      return;
    }

    console.log('Webhook processing completed successfully');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Health check endpoint
app.get('/webhook/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`GitHub webhook endpoint: http://localhost:${PORT}/webhook/github`);
  console.log(`Health check endpoint: http://localhost:${PORT}/webhook/health`);
});