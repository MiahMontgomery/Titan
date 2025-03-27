/**
 * Logging System
 * 
 * This component handles all logging and output, including:
 * - Console output with colors and formatting
 * - Log file output for persistent records
 * - Different log levels (info, warn, error, success)
 * - Real-time updates on agent progress
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { format } from 'util';
import chalk from 'chalk';

// Use chalk for terminal colors

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARN = 3,
  ERROR = 4,
  CRITICAL = 5
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: any;
}

type LogCallback = (entry: LogEntry) => void;

export class Logger {
  private logFile: string | null = null;
  private minLevel: LogLevel = LogLevel.INFO;
  private callbacks: LogCallback[] = [];
  private buffer: LogEntry[] = [];
  private logToConsole: boolean = true;
  private maxBufferSize: number = 1000;
  
  constructor() {
    // Set up log directory and file
    this.setupLogFile();
  }
  
  /**
   * Set up log file
   */
  private async setupLogFile(): Promise<void> {
    try {
      const logDir = path.join(process.cwd(), 'autonomous-agent', 'logs');
      await fs.mkdir(logDir, { recursive: true });
      
      const today = new Date();
      const dateString = today.toISOString().slice(0, 10);
      this.logFile = path.join(logDir, `agent_${dateString}.log`);
      
      // Test we can write to the file
      await fs.appendFile(this.logFile, '--- Log session started ---\n', 'utf8');
    } catch (error) {
      console.error(`Failed to set up log file: ${error}`);
      this.logFile = null;
    }
  }
  
  /**
   * Set minimum log level
   */
  public setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  /**
   * Enable or disable console logging
   */
  public setConsoleLogging(enabled: boolean): void {
    this.logToConsole = enabled;
  }
  
  /**
   * Register a callback to receive log entries
   */
  public onLog(callback: LogCallback): () => void {
    this.callbacks.push(callback);
    
    // Return a function to unregister the callback
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Log a debug message
   */
  public debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * Log an info message
   */
  public info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  /**
   * Log a success message
   */
  public success(message: string, context?: any): void {
    this.log(LogLevel.SUCCESS, message, context);
  }
  
  /**
   * Log a warning message
   */
  public warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  /**
   * Log an error message
   */
  public error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context);
  }
  
  /**
   * Log a critical error message
   */
  public critical(message: string, context?: any): void {
    this.log(LogLevel.CRITICAL, message, context);
  }
  
  /**
   * Log a message with the specified level
   */
  private log(level: LogLevel, message: string, context?: any): void {
    // Only log if level is high enough
    if (level < this.minLevel) {
      return;
    }
    
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context
    };
    
    // Store in buffer
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift(); // Remove oldest entry if buffer is full
    }
    
    // Log to console if enabled
    if (this.logToConsole) {
      this.writeToConsole(entry);
    }
    
    // Log to file if available
    if (this.logFile) {
      this.writeToFile(entry).catch(error => {
        console.error(`Failed to write to log file: ${error}`);
        this.logFile = null; // Disable file logging on error
      });
    }
    
    // Call registered callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error(`Error in log callback: ${error}`);
      }
    });
  }
  
  /**
   * Write a log entry to the console with nice formatting
   */
  private writeToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString().slice(11, 19); // HH:MM:SS
    let prefix: string;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        prefix = 'DEBUG';
        console.log(
          `${chalk.dim(timestamp)} ${chalk.cyan(prefix)} ${entry.message}`
        );
        break;
      case LogLevel.INFO:
        prefix = 'INFO';
        console.log(
          `${chalk.dim(timestamp)} ${chalk.blue(prefix)} ${entry.message}`
        );
        break;
      case LogLevel.SUCCESS:
        prefix = 'SUCCESS';
        console.log(
          `${chalk.dim(timestamp)} ${chalk.green(prefix)} ${entry.message}`
        );
        break;
      case LogLevel.WARN:
        prefix = 'WARNING';
        console.log(
          `${chalk.dim(timestamp)} ${chalk.yellow(prefix)} ${entry.message}`
        );
        break;
      case LogLevel.ERROR:
        prefix = 'ERROR';
        console.log(
          `${chalk.dim(timestamp)} ${chalk.red(prefix)} ${entry.message}`
        );
        break;
      case LogLevel.CRITICAL:
        prefix = 'CRITICAL';
        console.log(
          `${chalk.dim(timestamp)} ${chalk.red.bold(prefix)} ${entry.message}`
        );
        break;
      default:
        prefix = 'LOG';
        console.log(
          `${chalk.dim(timestamp)} ${chalk.white(prefix)} ${entry.message}`
        );
    }
    
    // If we have context, log it on the next line
    if (entry.context) {
      console.log(chalk.dim('Context:'), entry.context);
    }
  }
  
  /**
   * Write a log entry to the log file
   */
  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.logFile) return;
    
    const timestamp = entry.timestamp.toISOString();
    let level: string;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        level = 'DEBUG';
        break;
      case LogLevel.INFO:
        level = 'INFO';
        break;
      case LogLevel.SUCCESS:
        level = 'SUCCESS';
        break;
      case LogLevel.WARN:
        level = 'WARNING';
        break;
      case LogLevel.ERROR:
        level = 'ERROR';
        break;
      case LogLevel.CRITICAL:
        level = 'CRITICAL';
        break;
      default:
        level = 'LOG';
    }
    
    // Format the log entry as a single line
    let logLine = `${timestamp} [${level}] ${entry.message}`;
    
    // Add context if available
    if (entry.context) {
      try {
        const contextStr = JSON.stringify(entry.context);
        logLine += ` | Context: ${contextStr}`;
      } catch (error) {
        logLine += ' | Context: [Unable to stringify context]';
      }
    }
    
    logLine += '\n';
    
    // Append to log file
    await fs.appendFile(this.logFile, logLine, 'utf8');
  }
  
  /**
   * Get the most recent log entries
   */
  public getRecentLogs(count: number = 100): LogEntry[] {
    const startIndex = Math.max(0, this.buffer.length - count);
    return this.buffer.slice(startIndex);
  }
  
  /**
   * Get all logs with the specified level or higher
   */
  public getLogsByLevel(level: LogLevel, count: number = 100): LogEntry[] {
    const filtered = this.buffer.filter(entry => entry.level >= level);
    const startIndex = Math.max(0, filtered.length - count);
    return filtered.slice(startIndex);
  }
  
  /**
   * Search logs for a specific term
   */
  public searchLogs(term: string, caseSensitive: boolean = false): LogEntry[] {
    const searchTerm = caseSensitive ? term : term.toLowerCase();
    
    return this.buffer.filter(entry => {
      const message = caseSensitive ? entry.message : entry.message.toLowerCase();
      return message.includes(searchTerm);
    });
  }
  
  /**
   * Get logs for a specific time range
   */
  public getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return this.buffer.filter(entry => 
      entry.timestamp >= startTime && 
      entry.timestamp <= endTime
    );
  }
}