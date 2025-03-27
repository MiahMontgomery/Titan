/**
 * Memory Manager
 * 
 * This component handles all persistent state and memory for the agent, including:
 * - Project plan and architecture
 * - Task history and status
 * - Generated code and file structure
 * - Errors and their resolutions
 * - User preferences and feedback
 */

import { ProjectPlan } from '../core/project_analyzer';
import { ProjectState } from './project_state';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TaskExecution {
  taskId: string;
  timestamp: Date;
  success: boolean;
  output?: any;
  errorDetails?: string;
  retryCount: number;
}

interface ErrorRecord {
  timestamp: Date;
  errorMessage: string;
  context: any;
  resolution?: string;
}

interface MemoryData {
  projectPlan?: ProjectPlan;
  taskHistory: TaskExecution[];
  errors: ErrorRecord[];
  userPreferences: Record<string, any>;
  userFeedback: {
    messages: { timestamp: Date; message: string; }[];
    ratings: { feature: string; rating: number; }[];
  };
  sessionId: string;
  startTime: Date;
}

export class MemoryManager {
  private data: MemoryData;
  private projectState: ProjectState;
  private memoryPath: string;
  
  constructor() {
    this.memoryPath = path.join(process.cwd(), 'autonomous-agent', 'memory', 'data');
    
    // Initialize with default empty state
    this.data = {
      taskHistory: [],
      errors: [],
      userPreferences: {},
      userFeedback: {
        messages: [],
        ratings: []
      },
      sessionId: this.generateSessionId(),
      startTime: new Date()
    };
    
    this.projectState = new ProjectState();
    
    // Create memory directory if it doesn't exist
    this.initializeMemoryStorage();
  }
  
  /**
   * Initialize memory storage directories
   */
  private async initializeMemoryStorage(): Promise<void> {
    try {
      await fs.mkdir(this.memoryPath, { recursive: true });
      console.log(`Memory storage initialized at ${this.memoryPath}`);
    } catch (error) {
      console.error(`Failed to initialize memory storage: ${error}`);
    }
  }
  
  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * Save the project plan to memory
   */
  public async saveProjectPlan(plan: ProjectPlan): Promise<void> {
    this.data.projectPlan = plan;
    
    // Save to file system
    await this.persistData('project_plan.json', plan);
    
    // Also initialize project state
    await this.projectState.initializeProject(plan);
  }
  
  /**
   * Get the current project plan
   */
  public async getProjectPlan(): Promise<ProjectPlan | undefined> {
    if (this.data.projectPlan) {
      return this.data.projectPlan;
    }
    
    // Try to load from file system
    try {
      const planData = await this.loadData('project_plan.json');
      if (planData) {
        this.data.projectPlan = planData as ProjectPlan;
        return this.data.projectPlan;
      }
    } catch (error) {
      console.error(`Failed to load project plan: ${error}`);
    }
    
    return undefined;
  }
  
  /**
   * Record a task execution in memory
   */
  public async recordTaskExecution(
    taskId: string,
    success: boolean,
    output?: any,
    errorDetails?: string
  ): Promise<void> {
    // Check if this task has been executed before
    const existingIndex = this.data.taskHistory.findIndex(t => t.taskId === taskId);
    
    const execution: TaskExecution = {
      taskId,
      timestamp: new Date(),
      success,
      output,
      errorDetails,
      retryCount: existingIndex >= 0 ? this.data.taskHistory[existingIndex].retryCount + 1 : 0
    };
    
    if (existingIndex >= 0) {
      // Update existing record
      this.data.taskHistory[existingIndex] = execution;
    } else {
      // Add new record
      this.data.taskHistory.push(execution);
    }
    
    // Persist task history
    await this.persistData('task_history.json', this.data.taskHistory);
  }
  
  /**
   * Get the execution history for a specific task
   */
  public async getTaskExecutionHistory(taskId: string): Promise<TaskExecution[]> {
    return this.data.taskHistory.filter(t => t.taskId === taskId);
  }
  
  /**
   * Record an error in memory
   */
  public async recordError(
    errorMessage: string,
    context: any = {},
    resolution?: string
  ): Promise<void> {
    const errorRecord: ErrorRecord = {
      timestamp: new Date(),
      errorMessage,
      context,
      resolution
    };
    
    this.data.errors.push(errorRecord);
    
    // Persist errors
    await this.persistData('errors.json', this.data.errors);
  }
  
  /**
   * Get all recorded errors
   */
  public async getErrors(): Promise<ErrorRecord[]> {
    return this.data.errors;
  }
  
  /**
   * Get errors similar to a specific error message
   */
  public async getSimilarErrors(errorMessage: string): Promise<ErrorRecord[]> {
    // Simple string matching - could be improved with fuzzy matching
    return this.data.errors.filter(e => 
      e.errorMessage.includes(errorMessage) || errorMessage.includes(e.errorMessage)
    );
  }
  
  /**
   * Save user preferences
   */
  public async saveUserPreference(key: string, value: any): Promise<void> {
    this.data.userPreferences[key] = value;
    await this.persistData('user_preferences.json', this.data.userPreferences);
  }
  
  /**
   * Get a user preference
   */
  public getUserPreference(key: string): any {
    return this.data.userPreferences[key];
  }
  
  /**
   * Add user feedback
   */
  public async addUserFeedback(message: string): Promise<void> {
    this.data.userFeedback.messages.push({
      timestamp: new Date(),
      message
    });
    
    await this.persistData('user_feedback.json', this.data.userFeedback);
  }
  
  /**
   * Add a feature rating from the user
   */
  public async addFeatureRating(feature: string, rating: number): Promise<void> {
    this.data.userFeedback.ratings.push({ feature, rating });
    await this.persistData('user_feedback.json', this.data.userFeedback);
  }
  
  /**
   * Get the project state
   */
  public getProjectState(): ProjectState {
    return this.projectState;
  }
  
  /**
   * Save data to the file system
   */
  private async persistData(filename: string, data: any): Promise<void> {
    try {
      const filePath = path.join(this.memoryPath, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to persist data to ${filename}: ${error}`);
    }
  }
  
  /**
   * Load data from the file system
   */
  private async loadData(filename: string): Promise<any> {
    try {
      const filePath = path.join(this.memoryPath, filename);
      const fileContent = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist yet, which is okay
        return null;
      }
      throw error;
    }
  }
  
  /**
   * Create a snapshot of the current memory state
   */
  public async createMemorySnapshot(): Promise<string> {
    const snapshotId = `snapshot_${Date.now()}`;
    const snapshotDir = path.join(this.memoryPath, 'snapshots', snapshotId);
    
    try {
      // Create snapshot directory
      await fs.mkdir(snapshotDir, { recursive: true });
      
      // Save current memory state
      await fs.writeFile(
        path.join(snapshotDir, 'memory_state.json'),
        JSON.stringify(this.data, null, 2),
        'utf8'
      );
      
      // Get project state snapshot
      const projectSnapshot = await this.projectState.createSnapshot();
      await fs.writeFile(
        path.join(snapshotDir, 'project_state.json'),
        JSON.stringify(projectSnapshot, null, 2),
        'utf8'
      );
      
      return snapshotId;
    } catch (error) {
      console.error(`Failed to create memory snapshot: ${error}`);
      throw error;
    }
  }
  
  /**
   * Restore memory from a snapshot
   */
  public async restoreFromSnapshot(snapshotId: string): Promise<boolean> {
    const snapshotDir = path.join(this.memoryPath, 'snapshots', snapshotId);
    
    try {
      // Check if snapshot exists
      const stats = await fs.stat(snapshotDir);
      if (!stats.isDirectory()) {
        throw new Error(`Snapshot ${snapshotId} does not exist`);
      }
      
      // Load memory state
      const memoryStateFile = path.join(snapshotDir, 'memory_state.json');
      const memoryStateContent = await fs.readFile(memoryStateFile, 'utf8');
      this.data = JSON.parse(memoryStateContent);
      
      // Load project state
      const projectStateFile = path.join(snapshotDir, 'project_state.json');
      const projectStateContent = await fs.readFile(projectStateFile, 'utf8');
      await this.projectState.restoreFromSnapshot(JSON.parse(projectStateContent));
      
      return true;
    } catch (error) {
      console.error(`Failed to restore from snapshot ${snapshotId}: ${error}`);
      return false;
    }
  }
}