/**
 * User Interface
 * 
 * This component handles interactions with the user, including:
 * - Confirmation prompts for major decisions
 * - Input requests for additional information
 * - Progress updates and status reports
 * - Displaying results and logs
 */

import * as readline from 'readline';
import { Logger } from '../logging/logger';

interface ConfirmationOptions {
  timeout?: number; // Timeout in milliseconds
  defaultValue?: boolean; // Default value if user doesn't respond in time
  cancelOnTimeout?: boolean; // Whether to treat timeout as cancellation
}

interface InputOptions {
  timeout?: number; // Timeout in milliseconds
  defaultValue?: string; // Default value if user doesn't respond in time
  cancelOnTimeout?: boolean; // Whether to treat timeout as cancellation
  validator?: (input: string) => boolean | string; // Validation function
}

interface ProgressUpdate {
  taskName: string;
  percentComplete: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message?: string;
}

export class UserInterface {
  private logger: Logger;
  private rl: readline.Interface | null = null;
  private isInteractive: boolean = true;
  private stopRequested: boolean = false;
  private progressUpdates: Map<string, ProgressUpdate> = new Map();
  
  constructor(logger: Logger) {
    this.logger = logger;
    
    // Try to detect if we're in an interactive environment
    this.isInteractive = process.stdout.isTTY && process.stdin.isTTY;
    
    // Setup readline interface if in interactive mode
    if (this.isInteractive) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
  }
  
  /**
   * Request confirmation from the user
   */
  public async requestConfirmation(
    question: string, 
    details?: string,
    options: ConfirmationOptions = {}
  ): Promise<boolean> {
    if (!this.isInteractive) {
      // In non-interactive mode, return default value or true
      return options.defaultValue ?? true;
    }
    
    if (details) {
      console.log(details);
    }
    
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Set timeout if specified
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          console.log(`\nTimed out waiting for response. Using default: ${options.defaultValue ? 'Yes' : 'No'}`);
          if (this.rl) {
            this.rl.removeAllListeners('line');
          }
          resolve(options.defaultValue ?? false);
        }, options.timeout);
      }
      
      // Prompt the user
      if (this.rl) {
        this.rl.question(`${question} (Y/n): `, (answer) => {
          // Clear timeout if it was set
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // Parse the answer
          const normalized = answer.trim().toLowerCase();
          
          if (normalized === '' || normalized === 'y' || normalized === 'yes') {
            resolve(true);
          } else if (normalized === 'n' || normalized === 'no') {
            resolve(false);
          } else {
            console.log('Invalid response. Please enter Y or N.');
            // Ask again
            resolve(this.requestConfirmation(question, undefined, options));
          }
        });
      } else {
        // Fallback in case readline wasn't initialized
        resolve(options.defaultValue ?? true);
      }
    });
  }
  
  /**
   * Request input from the user
   */
  public async requestInput(
    prompt: string, 
    options: InputOptions = {}
  ): Promise<string | null> {
    if (!this.isInteractive) {
      // In non-interactive mode, return default value or null
      return options.defaultValue ?? null;
    }
    
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Set timeout if specified
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          console.log(`\nTimed out waiting for input. Using default: ${options.defaultValue || 'None'}`);
          if (this.rl) {
            this.rl.removeAllListeners('line');
          }
          
          if (options.cancelOnTimeout) {
            resolve(null);
          } else {
            resolve(options.defaultValue || null);
          }
        }, options.timeout);
      }
      
      // Prompt the user
      if (this.rl) {
        this.rl.question(`${prompt}: `, (answer) => {
          // Clear timeout if it was set
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // Validate the answer if a validator is provided
          if (options.validator) {
            const validationResult = options.validator(answer);
            
            if (typeof validationResult === 'string') {
              console.log(validationResult);
              // Ask again
              resolve(this.requestInput(prompt, options));
              return;
            } else if (validationResult === false) {
              console.log('Invalid input. Please try again.');
              // Ask again
              resolve(this.requestInput(prompt, options));
              return;
            }
          }
          
          resolve(answer);
        });
      } else {
        // Fallback in case readline wasn't initialized
        resolve(options.defaultValue ?? null);
      }
    });
  }
  
  /**
   * Request assistance from the user on a failed task
   */
  public async requestUserAssistance(
    message: string,
    error: string,
    context?: string
  ): Promise<string> {
    const header = `\n=== USER ASSISTANCE REQUIRED ===\n`;
    const errorMsg = `ERROR: ${error}\n`;
    const contextMsg = context ? `CONTEXT: ${context}\n` : '';
    
    console.log(header);
    console.log(message);
    console.log(errorMsg);
    console.log(contextMsg);
    
    const guidance = await this.requestInput(
      'Please provide guidance on how to resolve this issue',
      { defaultValue: 'Skip this task and continue' }
    );
    
    return guidance || 'Skip this task and continue';
  }
  
  /**
   * Display progress update for a task
   */
  public updateProgress(update: ProgressUpdate): void {
    this.progressUpdates.set(update.taskName, update);
    
    if (this.isInteractive) {
      this.renderProgressBar(update);
    } else {
      // Log the progress update
      const message = `${update.taskName}: ${update.percentComplete}% complete - ${update.status}${update.message ? ` - ${update.message}` : ''}`;
      
      if (update.status === 'completed') {
        this.logger.success(message);
      } else if (update.status === 'failed') {
        this.logger.error(message);
      } else {
        this.logger.info(message);
      }
    }
  }
  
  /**
   * Display a simple progress bar in the terminal
   */
  private renderProgressBar(update: ProgressUpdate): void {
    const width = 30; // Width of the progress bar
    const percent = Math.min(100, Math.max(0, update.percentComplete));
    const filled = Math.round(width * percent / 100);
    const empty = width - filled;
    
    // Create the progress bar
    const bar = '[' + '='.repeat(filled) + ' '.repeat(empty) + ']';
    
    // Create status indicator
    let statusIndicator: string;
    switch (update.status) {
      case 'completed':
        statusIndicator = '\x1b[32m✓\x1b[0m'; // Green checkmark
        break;
      case 'failed':
        statusIndicator = '\x1b[31m✗\x1b[0m'; // Red X
        break;
      case 'in_progress':
        statusIndicator = '\x1b[33m⋯\x1b[0m'; // Yellow ellipsis
        break;
      default:
        statusIndicator = '\x1b[36m⋯\x1b[0m'; // Cyan ellipsis
    }
    
    // Format the line
    const line = `${statusIndicator} ${update.taskName}: ${bar} ${percent}%${update.message ? ` - ${update.message}` : ''}`;
    
    // Clear the line and write the progress bar
    process.stdout.write(`\r\x1b[K${line}`);
    
    // Add newline if completed or failed
    if (update.status === 'completed' || update.status === 'failed') {
      process.stdout.write('\n');
    }
  }
  
  /**
   * Display a summary of all current tasks
   */
  public displayTaskSummary(): void {
    if (this.progressUpdates.size === 0) {
      console.log('No tasks in progress.');
      return;
    }
    
    console.log('\n=== TASK SUMMARY ===');
    
    // Count tasks by status
    const counts = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      failed: 0
    };
    
    // Calculate overall progress
    let totalPercent = 0;
    
    for (const update of this.progressUpdates.values()) {
      counts[update.status]++;
      totalPercent += update.percentComplete;
    }
    
    const averagePercent = totalPercent / this.progressUpdates.size;
    
    // Display summary
    console.log(`Overall progress: ${averagePercent.toFixed(1)}%`);
    console.log(`Pending: ${counts.pending}`);
    console.log(`In progress: ${counts.in_progress}`);
    console.log(`Completed: ${counts.completed}`);
    console.log(`Failed: ${counts.failed}`);
    console.log('');
    
    // Display individual tasks
    for (const [taskName, update] of this.progressUpdates.entries()) {
      let statusIcon: string;
      
      switch (update.status) {
        case 'completed':
          statusIcon = '\x1b[32m✓\x1b[0m'; // Green checkmark
          break;
        case 'failed':
          statusIcon = '\x1b[31m✗\x1b[0m'; // Red X
          break;
        case 'in_progress':
          statusIcon = '\x1b[33m⋯\x1b[0m'; // Yellow ellipsis
          break;
        default:
          statusIcon = '\x1b[36m⋅\x1b[0m'; // Cyan dot
      }
      
      console.log(`${statusIcon} ${taskName}: ${update.percentComplete}%${update.message ? ` - ${update.message}` : ''}`);
    }
    
    console.log('');
  }
  
  /**
   * Check if the user has requested to stop the agent
   */
  public async checkForStopRequest(): Promise<boolean> {
    return this.stopRequested;
  }
  
  /**
   * Display the results of the agent's work
   */
  public displayResults(results: any): void {
    console.log('\n=== RESULTS ===\n');
    
    if (typeof results === 'string') {
      console.log(results);
    } else {
      try {
        console.log(JSON.stringify(results, null, 2));
      } catch (error) {
        console.log('Could not stringify results:', results);
      }
    }
    
    console.log('\n');
  }
  
  /**
   * Clean up and close the interface
   */
  public close(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }
  
  /**
   * Request the agent to stop
   */
  public requestStop(): void {
    this.stopRequested = true;
  }
}