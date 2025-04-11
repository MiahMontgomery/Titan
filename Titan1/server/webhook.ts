import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { log, error } from './helpers';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Create a webhook router
export const webhookRouter = express.Router();

/**
 * Verify GitHub webhook signature
 * 
 * @param req - Express request object
 * @param secret - Webhook secret
 * @returns boolean - True if signature is valid
 */
function verifySignature(req: Request, secret: string): boolean {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature || typeof signature !== 'string') {
    return false;
  }

  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

/**
 * Pull latest code from GitHub
 */
async function pullLatestCode(): Promise<boolean> {
  try {
    log('Pulling latest code from GitHub');
    const { stdout } = await execAsync('git pull');
    log(`Git pull result: ${stdout}`);
    return true;
  } catch (err: any) {
    error(`Failed to pull code: ${err.message}`);
    return false;
  }
}

/**
 * Restart PM2 processes
 */
async function restartProcesses(): Promise<boolean> {
  try {
    log('Restarting PM2 processes');
    const { stdout } = await execAsync('pm2 reload all');
    log(`PM2 restart result: ${stdout}`);
    return true;
  } catch (err: any) {
    error(`Failed to restart processes: ${err.message}`);
    return false;
  }
}

/**
 * Install dependencies
 */
async function installDependencies(): Promise<boolean> {
  try {
    log('Installing dependencies');
    const { stdout } = await execAsync('npm install');
    log(`npm install result: ${stdout}`);
    return true;
  } catch (err: any) {
    error(`Failed to install dependencies: ${err.message}`);
    return false;
  }
}

/**
 * Build the application
 */
async function buildApplication(): Promise<boolean> {
  try {
    log('Building application');
    const { stdout } = await execAsync('npm run build');
    log(`Build result: ${stdout}`);
    return true;
  } catch (err: any) {
    error(`Failed to build application: ${err.message}`);
    return false;
  }
}

// GitHub webhook handler
webhookRouter.post('/github', async (req: Request, res: Response) => {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    error('GitHub webhook secret not set');
    return res.status(500).json({ success: false, error: 'Webhook secret not configured' });
  }
  
  // Verify signature
  if (!verifySignature(req, webhookSecret)) {
    error('Invalid GitHub webhook signature');
    return res.status(403).json({ success: false, error: 'Invalid signature' });
  }
  
  const event = req.headers['x-github-event'];
  
  // Only process push events
  if (event !== 'push') {
    log(`Ignoring GitHub event: ${event}`);
    return res.status(200).json({ success: true, message: `Event ${event} ignored` });
  }
  
  // Process the webhook asynchronously
  res.status(200).json({ 
    success: true, 
    message: 'Webhook received, processing update in background' 
  });
  
  // Start the update process in the background
  (async () => {
    try {
      const pullSuccess = await pullLatestCode();
      if (!pullSuccess) {
        error('Failed to pull latest code, aborting update');
        return;
      }
      
      const installSuccess = await installDependencies();
      if (!installSuccess) {
        error('Failed to install dependencies, proceeding with restart');
      }
      
      const buildSuccess = await buildApplication();
      if (!buildSuccess) {
        error('Failed to build application, proceeding with restart');
      }
      
      const restartSuccess = await restartProcesses();
      if (!restartSuccess) {
        error('Failed to restart processes');
        return;
      }
      
      log('GitHub webhook update completed successfully');
    } catch (err: any) {
      error(`Error processing webhook: ${err.message}`);
    }
  })();
});

// Health check for webhook server
webhookRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'webhook',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});