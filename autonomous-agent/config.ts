/**
 * Configuration for the autonomous agent system.
 * These settings can be overridden with environment variables.
 */
import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file if present
dotenv.config();

// Configuration schema for validation
const ConfigSchema = z.object({
  // OpenAI API configuration
  openai: z.object({
    apiKey: z.string().min(1),
    organization: z.string().optional(),
    model: z.string().default('gpt-4o'), // the newest OpenAI model is "gpt-4o" which was released May, 2024
    maxTokens: z.number().int().positive().default(4000),
    temperature: z.number().min(0).max(2).default(0.7),
  }),
  
  // Agent behavior configuration
  agent: z.object({
    logLevel: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL']).default('INFO'),
    autoConfirm: z.boolean().default(false),
    maxRetryAttempts: z.number().int().nonnegative().default(3),
    planningSteps: z.number().int().positive().default(5),
    memoryFilePath: z.string().default('./data/agent_memory.json'),
  }),
  
  // Project defaults
  project: z.object({
    defaultName: z.string().default('autonomously_generated_project'),
    defaultLanguage: z.string().default('typescript'),
    outputDir: z.string().default('./output'),
    templateDir: z.string().default('./templates'),
  }),
  
  // System constraints
  system: z.object({
    maxConcurrentTasks: z.number().int().positive().default(5),
    timeoutSeconds: z.number().int().positive().default(600),
    maxFileSize: z.number().int().positive().default(10 * 1024 * 1024), // 10MB
  }),
});

// Default configuration
const defaultConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    organization: process.env.OPENAI_ORGANIZATION,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  },
  agent: {
    logLevel: (process.env.LOG_LEVEL || 'INFO') as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    autoConfirm: process.env.AGENT_AUTO_CONFIRM === 'true',
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
    planningSteps: parseInt(process.env.PLANNING_STEPS || '5'),
    memoryFilePath: process.env.MEMORY_FILE_PATH || './data/agent_memory.json',
  },
  project: {
    defaultName: process.env.DEFAULT_PROJECT_NAME || 'autonomously_generated_project',
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'typescript',
    outputDir: process.env.OUTPUT_DIR || './output',
    templateDir: process.env.TEMPLATE_DIR || './templates',
  },
  system: {
    maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS || '5'),
    timeoutSeconds: parseInt(process.env.TIMEOUT_SECONDS || '600'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || (10 * 1024 * 1024).toString()),
  },
};

// Validate configuration
const config = ConfigSchema.parse(defaultConfig);

// Ensure OpenAI API key is provided
if (!config.openai.apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

export default config;