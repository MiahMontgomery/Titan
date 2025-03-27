/**
 * Task Manager
 * 
 * This component manages the project tasks, including:
 * - Creating and organizing tasks from project plan
 * - Tracking task dependencies and prerequisites
 * - Prioritizing tasks for execution
 * - Monitoring task status and progress
 */

import { v4 as uuidv4 } from 'uuid';
import { MemoryManager } from '../memory/memory_manager';
import { Logger } from '../logging/logger';
import { ProjectPlan, Milestone } from '../core/project_analyzer';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export enum TaskPriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  OPTIMIZATION = 5
}

export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[]; // IDs of tasks that must be completed first
  estimatedEffort: number; // In hours
  milestoneId: string;
  requiresConfirmation: boolean;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failureCount: number;
  context?: any; // Additional context or data for the task
  testCriteria?: string[]; // Criteria to validate task completion
  result?: any; // Output from task execution
}

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private memory: MemoryManager;
  private logger: Logger;
  
  constructor(memory: MemoryManager, logger: Logger) {
    this.memory = memory;
    this.logger = logger;
  }
  
  /**
   * Generate initial tasks from project plan
   */
  public async generateInitialTasks(plan: ProjectPlan): Promise<void> {
    this.logger.info('Generating initial tasks from project plan...');
    
    // Convert milestones to tasks
    for (const milestone of plan.milestones) {
      await this.createTaskFromMilestone(milestone);
    }
    
    this.logger.info(`Generated ${this.tasks.size} initial tasks`);
  }
  
  /**
   * Create a task from a milestone
   */
  private async createTaskFromMilestone(milestone: Milestone): Promise<string> {
    const taskId = uuidv4();
    
    const task: Task = {
      id: taskId,
      name: milestone.name,
      description: milestone.description,
      status: TaskStatus.PENDING,
      priority: milestone.priority as TaskPriority,
      dependencies: milestone.dependencies,
      estimatedEffort: milestone.estimatedEffort,
      milestoneId: milestone.id,
      requiresConfirmation: milestone.priority <= TaskPriority.HIGH, // Require confirmation for high priority tasks
      createdAt: new Date(),
      failureCount: 0,
      testCriteria: []
    };
    
    this.tasks.set(taskId, task);
    
    // Generate subtasks if needed
    await this.generateSubtasks(task);
    
    return taskId;
  }
  
  /**
   * Generate subtasks for a parent task
   */
  private async generateSubtasks(parentTask: Task): Promise<void> {
    // Check if task is complex enough to need subtasks
    if (parentTask.estimatedEffort <= 4) {
      // Simple task, no subtasks needed
      return;
    }
    
    // For complex tasks, break it down into subtasks
    const subtaskCount = Math.ceil(parentTask.estimatedEffort / 4); // Create a subtask for every ~4 hours of effort
    
    this.logger.info(`Breaking down task "${parentTask.name}" into ${subtaskCount} subtasks`);
    
    // Generate a prompt to create subtasks for this task
    const prompt = `
      Task: ${parentTask.name}
      Description: ${parentTask.description}
      
      Break this task into ${subtaskCount} smaller, more manageable subtasks.
      For each subtask, provide:
      1. A clear, specific name
      2. A detailed description of what needs to be done
      3. Estimated effort in hours (total should be roughly ${parentTask.estimatedEffort} hours)
      
      Format as a JSON array:
      [
        {
          "name": "subtask name",
          "description": "detailed description",
          "estimatedEffort": hours
        },
        ...
      ]
    `;
    
    try {
      // Here we would send this prompt to an AI to generate subtasks
      // For now, we'll create some simple placeholder subtasks
      
      const subtaskNames = [
        `Research for ${parentTask.name}`,
        `Design for ${parentTask.name}`,
        `Implementation of ${parentTask.name}`,
        `Testing for ${parentTask.name}`,
        `Documentation for ${parentTask.name}`
      ];
      
      // Only use as many subtask names as we need
      const usedSubtaskNames = subtaskNames.slice(0, subtaskCount);
      
      // Create subtasks
      for (let i = 0; i < subtaskCount; i++) {
        const effortPerTask = parentTask.estimatedEffort / subtaskCount;
        
        const subtaskId = uuidv4();
        const subtask: Task = {
          id: subtaskId,
          name: usedSubtaskNames[i] || `Subtask ${i+1} for ${parentTask.name}`,
          description: `Part ${i+1} of "${parentTask.name}": ${parentTask.description}`,
          status: TaskStatus.PENDING,
          priority: parentTask.priority,
          dependencies: [parentTask.id], // Depend on parent task
          estimatedEffort: effortPerTask,
          milestoneId: parentTask.milestoneId,
          requiresConfirmation: false, // Only parent tasks require confirmation
          createdAt: new Date(),
          failureCount: 0,
          context: {
            parentTaskId: parentTask.id,
            subtaskIndex: i,
            totalSubtasks: subtaskCount
          },
          testCriteria: []
        };
        
        this.tasks.set(subtaskId, subtask);
      }
      
      // Update parent task status
      this.tasks.set(parentTask.id, {
        ...parentTask,
        status: TaskStatus.IN_PROGRESS, // Parent task is "in progress" while subtasks are being worked on
      });
    } catch (error) {
      this.logger.error(`Failed to generate subtasks for "${parentTask.name}": ${error}`);
    }
  }
  
  /**
   * Get the next task to work on based on dependencies and priority
   */
  public async getNextTask(): Promise<Task | null> {
    // Get all pending tasks
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === TaskStatus.PENDING);
    
    if (pendingTasks.length === 0) {
      return null;
    }
    
    // Filter tasks whose dependencies are all satisfied
    const availableTasks = pendingTasks.filter(task => {
      if (task.dependencies.length === 0) {
        return true;
      }
      
      // Check if all dependencies are completed
      return task.dependencies.every(depId => {
        const depTask = this.tasks.get(depId);
        return depTask && depTask.status === TaskStatus.COMPLETED;
      });
    });
    
    if (availableTasks.length === 0) {
      this.logger.info('No tasks available to work on - all pending tasks have unmet dependencies');
      return null;
    }
    
    // Sort by priority (lower number = higher priority)
    availableTasks.sort((a, b) => a.priority - b.priority);
    
    // Return highest priority task
    const nextTask = availableTasks[0];
    
    // Mark as in progress
    this.tasks.set(nextTask.id, {
      ...nextTask,
      status: TaskStatus.IN_PROGRESS,
      startedAt: new Date()
    });
    
    this.logger.info(`Selected next task: "${nextTask.name}" (Priority ${nextTask.priority})`);
    return nextTask;
  }
  
  /**
   * Get all tasks
   */
  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
  
  /**
   * Get a specific task by ID
   */
  public getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }
  
  /**
   * Get tasks by status
   */
  public getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values())
      .filter(task => task.status === status);
  }
  
  /**
   * Get tasks by milestone
   */
  public getTasksByMilestone(milestoneId: string): Task[] {
    return Array.from(this.tasks.values())
      .filter(task => task.milestoneId === milestoneId);
  }
  
  /**
   * Mark a task as completed
   */
  public async completeTask(taskId: string, result?: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    this.tasks.set(taskId, {
      ...task,
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      result
    });
    
    this.logger.success(`Completed task "${task.name}"`);
    
    // Record task execution in memory
    await this.memory.recordTaskExecution(taskId, true, result);
    
    // Check for parent task completion
    if (task.context?.parentTaskId) {
      await this.checkParentTaskCompletion(task.context.parentTaskId);
    }
  }
  
  /**
   * Mark a task as failed
   */
  public async failTask(taskId: string, error: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    const failureCount = task.failureCount + 1;
    
    this.tasks.set(taskId, {
      ...task,
      status: TaskStatus.FAILED,
      failureCount
    });
    
    this.logger.error(`Failed task "${task.name}" (Attempt ${failureCount}): ${error}`);
    
    // Record task execution in memory
    await this.memory.recordTaskExecution(taskId, false, null, error);
  }
  
  /**
   * Skip a task (mark as skipped)
   */
  public async skipTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    this.tasks.set(taskId, {
      ...task,
      status: TaskStatus.SKIPPED,
      completedAt: new Date()
    });
    
    this.logger.info(`Skipped task "${task.name}"`);
    
    // Record task execution in memory
    await this.memory.recordTaskExecution(taskId, false, null, 'Task skipped by user');
  }
  
  /**
   * Increment the failure count for a task
   */
  public async incrementFailureCount(taskId: string): Promise<number> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    const newFailureCount = task.failureCount + 1;
    
    this.tasks.set(taskId, {
      ...task,
      failureCount: newFailureCount
    });
    
    return newFailureCount;
  }
  
  /**
   * Requeue a failed task for retry
   */
  public async requeueTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    this.tasks.set(taskId, {
      ...task,
      status: TaskStatus.PENDING
    });
    
    this.logger.info(`Requeued task "${task.name}" for retry`);
  }
  
  /**
   * Update the context for a task
   */
  public async updateTaskContext(taskId: string, context: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    this.tasks.set(taskId, {
      ...task,
      context: {
        ...task.context,
        ...context
      }
    });
  }
  
  /**
   * Check if all subtasks of a parent task are completed
   */
  private async checkParentTaskCompletion(parentTaskId: string): Promise<void> {
    const parentTask = this.tasks.get(parentTaskId);
    if (!parentTask) {
      return;
    }
    
    // Find all subtasks
    const subtasks = Array.from(this.tasks.values())
      .filter(task => task.context?.parentTaskId === parentTaskId);
    
    // Check if all subtasks are completed
    const allCompleted = subtasks.every(task => task.status === TaskStatus.COMPLETED);
    
    if (allCompleted && parentTask.status !== TaskStatus.COMPLETED) {
      // Mark parent task as completed
      await this.completeTask(parentTaskId, {
        subtaskResults: subtasks.map(t => t.result)
      });
    }
  }
  
  /**
   * Get count of high priority tasks that are not completed
   */
  public async getHighPriorityTaskCount(): Promise<number> {
    return Array.from(this.tasks.values())
      .filter(task => 
        task.priority <= TaskPriority.HIGH && 
        task.status !== TaskStatus.COMPLETED &&
        task.status !== TaskStatus.SKIPPED
      )
      .length;
  }
  
  /**
   * Create a new task
   */
  public async createTask(
    name: string,
    description: string,
    priority: TaskPriority,
    dependencies: string[] = [],
    estimatedEffort: number,
    milestoneId: string,
    requiresConfirmation: boolean = false,
    testCriteria: string[] = []
  ): Promise<string> {
    const taskId = uuidv4();
    
    const task: Task = {
      id: taskId,
      name,
      description,
      status: TaskStatus.PENDING,
      priority,
      dependencies,
      estimatedEffort,
      milestoneId,
      requiresConfirmation,
      createdAt: new Date(),
      failureCount: 0,
      testCriteria
    };
    
    this.tasks.set(taskId, task);
    this.logger.info(`Created new task: "${name}"`);
    
    return taskId;
  }
}