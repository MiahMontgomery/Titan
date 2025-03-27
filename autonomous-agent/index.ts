/**
 * Autonomous Agent System
 * 
 * This is the main entry point for the autonomous agent system. It initializes
 * all necessary components and starts the agent with the provided project description.
 */

import { AutonomousAgent } from './core/agent';
import { Logger } from './logging/logger';
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import config from './config';
import chalk from 'chalk';

// Create a logger instance for the main process
const logger = new Logger();

// Banner display
function displayBanner(): void {
  const banner = `
  ████████╗██╗████████╗ █████╗ ███╗   ██╗
  ╚══██╔══╝██║╚══██╔══╝██╔══██╗████╗  ██║
     ██║   ██║   ██║   ███████║██╔██╗ ██║
     ██║   ██║   ██║   ██╔══██║██║╚██╗██║
     ██║   ██║   ██║   ██║  ██║██║ ╚████║
     ╚═╝   ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝
                                         
  Autonomous Software Development System
  --------------------------------------
  `;
  
  console.log(chalk.blue(banner));
}

// Check for environment variables and configuration
function checkEnvironment(): boolean {
  if (!config.openai.apiKey) {
    logger.error(`Missing required OpenAI API key.`);
    logger.info('Please set the OPENAI_API_KEY environment variable or update your .env file.');
    return false;
  }
  
  // Create output directories if they don't exist
  try {
    fs.ensureDirSync(config.project.outputDir);
    fs.ensureDirSync(path.dirname(config.agent.memoryFilePath));
  } catch (error) {
    logger.error(`Failed to create required directories: ${error}`);
    return false;
  }
  
  return true;
}

/**
 * Handle a project file input (load a project from file)
 */
async function handleProjectFile(filePath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(filePath)) {
      logger.error(`Project file not found: ${filePath}`);
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    logger.info(`Loaded project description from ${filePath}`);
    return fileContent;
  } catch (error) {
    logger.error(`Failed to read project file: ${error}`);
    return null;
  }
}

/**
 * Main function to start the agent
 */
async function main(): Promise<void> {
  displayBanner();
  
  // Set up command line parsing with commander
  const program = new Command();
  
  program
    .name('titan')
    .description('Autonomous software development system')
    .version('1.0.0');
  
  program
    .option('-p, --project <description>', 'Project description')
    .option('-f, --file <path>', 'Load project description from file')
    .option('-o, --output <directory>', 'Output directory for generated code')
    .option('-m, --memory <path>', 'Path to memory file')
    .option('-y, --yes', 'Auto-confirm all prompts')
    .option('-v, --verbose', 'Enable verbose logging');
  
  program.parse(process.argv);
  
  const options = program.opts();
  
  // Apply command line options to config
  if (options.output) {
    config.project.outputDir = options.output;
  }
  
  if (options.memory) {
    config.agent.memoryFilePath = options.memory;
  }
  
  if (options.yes) {
    config.agent.autoConfirm = true;
  }
  
  if (options.verbose) {
    config.agent.logLevel = 'DEBUG';
  }
  
  // Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  // Get project description from file or command line
  let description: string;
  
  if (options.file) {
    const fileContent = await handleProjectFile(options.file);
    if (!fileContent) {
      process.exit(1);
    }
    description = fileContent;
  } else if (options.project) {
    description = options.project;
  } else {
    console.log('Please provide a project description using --project or --file.');
    program.help();
    return;
  }
  
  logger.info('Starting autonomous agent system...');
  logger.info(`Project: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`);
  
  // Create and start the agent
  const agent = new AutonomousAgent();
  
  try {
    // Register handlers for graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT. Shutting down...');
      agent.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM. Shutting down...');
      agent.stop();
      process.exit(0);
    });
    
    // Start the agent
    await agent.start(description);
    
    logger.info('Agent has completed execution.');
  } catch (error: any) {
    logger.critical(`Failed to execute agent: ${error.message || error}`);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { AutonomousAgent };