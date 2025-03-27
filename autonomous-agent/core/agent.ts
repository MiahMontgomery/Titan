/**
 * Core Autonomous Agent System
 * 
 * This is the main controller for the autonomous agent system. It coordinates
 * all subsystems including:
 * - Project analysis and planning
 * - Task management and scheduling
 * - Code generation
 * - Testing and debugging
 * - User interaction and logging
 */

import { MemoryManager } from '../memory/memory_manager';
import { TaskManager } from '../tasks/task_manager';
import { CodeGenerator } from '../code_gen/code_generator';
import { DebugSystem } from '../debugging/debug_system';
import { Logger } from '../logging/logger';
import { ProjectAnalyzer } from './project_analyzer';
import { UserInterface } from '../ui/user_interface';
import { ProjectState } from '../memory/project_state';
import { OpenAIConnector } from './openai_connector';

export class AutonomousAgent {
  private memory: MemoryManager;
  private taskManager: TaskManager;
  private codeGenerator: CodeGenerator;
  private debugSystem: DebugSystem;
  private logger: Logger;
  private analyzer: ProjectAnalyzer;
  private ui: UserInterface;
  private ai: OpenAIConnector;
  private projectState: ProjectState;
  private isRunning: boolean = false;

  constructor() {
    // Initialize all subsystems
    this.memory = new MemoryManager();
    this.projectState = new ProjectState();
    this.ai = new OpenAIConnector();
    this.logger = new Logger();
    this.analyzer = new ProjectAnalyzer(this.ai, this.logger);
    this.taskManager = new TaskManager(this.memory, this.logger);
    this.codeGenerator = new CodeGenerator(this.ai, this.memory, this.logger);
    this.debugSystem = new DebugSystem(this.memory, this.codeGenerator, this.logger);
    this.ui = new UserInterface(this.logger);
  }

  /**
   * Start the autonomous agent with a project description
   */
  public async start(projectDescription: string): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Agent is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting autonomous agent...');
    this.logger.info(`Project description: ${projectDescription}`);
    
    try {
      // Analyze the project and generate initial plan
      this.logger.info('Analyzing project requirements...');
      const projectPlan = await this.analyzer.analyzeProject(projectDescription);
      
      // Store project plan in memory
      await this.memory.saveProjectPlan(projectPlan);
      
      // Generate initial tasks based on project plan
      this.logger.info('Generating project milestones and tasks...');
      await this.taskManager.generateInitialTasks(projectPlan);
      
      // Begin autonomous execution loop
      await this.executeLoop();
    } catch (error) {
      this.logger.error(`Error starting agent: ${error}`);
      this.isRunning = false;
    }
  }

  /**
   * Main execution loop for the autonomous agent
   */
  private async executeLoop(): Promise<void> {
    this.logger.info('Beginning autonomous execution...');
    
    while (this.isRunning) {
      try {
        // Get the next highest priority task
        const nextTask = await this.taskManager.getNextTask();
        
        if (!nextTask) {
          this.logger.info('No more tasks to complete. Project is finished!');
          this.isRunning = false;
          break;
        }
        
        this.logger.info(`Working on task: ${nextTask.name}`);
        
        // If this is a major decision point, confirm with user
        if (nextTask.requiresConfirmation) {
          const confirmation = await this.ui.requestConfirmation(
            `Ready to implement: ${nextTask.name}. Proceed?`, 
            nextTask.description
          );
          
          if (!confirmation) {
            this.logger.info('User chose not to proceed with this task. Marking as skipped.');
            await this.taskManager.skipTask(nextTask.id);
            continue;
          }
        }
        
        // Execute the task
        const codeResult = await this.codeGenerator.generateCode(nextTask);
        
        // Test and debug the generated code
        const debugResult = await this.debugSystem.testAndDebug(
          codeResult.code, 
          codeResult.filePath, 
          nextTask.testCriteria
        );
        
        if (debugResult.success) {
          // Update project state with the new code
          await this.projectState.updateFiles(codeResult.filePath, debugResult.finalCode);
          
          // Mark task as complete
          await this.taskManager.completeTask(nextTask.id, {
            code: debugResult.finalCode,
            filePath: codeResult.filePath,
            metrics: debugResult.metrics
          });
          
          this.logger.success(`Completed task: ${nextTask.name}`);
        } else {
          // Handle failed task
          this.logger.error(`Failed to complete task: ${nextTask.name}`);
          this.logger.error(`Debug result: ${debugResult.error}`);
          
          // Retry or escalate based on error
          await this.handleFailedTask(nextTask, debugResult.error);
        }
        
        // Periodic check if we should continue running
        if (await this.shouldStop()) {
          this.isRunning = false;
          break;
        }
      } catch (error) {
        this.logger.error(`Error in execution loop: ${error}`);
        // Implement recovery mechanism
        await this.recoverFromError(error);
      }
    }
    
    this.logger.info('Autonomous execution completed');
  }
  
  /**
   * Handle a failed task by retrying or escalating
   */
  private async handleFailedTask(task: any, error: string): Promise<void> {
    // Increment failure count for this task
    const failureCount = await this.taskManager.incrementFailureCount(task.id);
    
    if (failureCount < 3) {
      // Retry with a different approach
      this.logger.info(`Retrying task (attempt ${failureCount + 1}): ${task.name}`);
      await this.taskManager.requeueTask(task.id);
    } else {
      // Escalate to user for assistance
      this.logger.warn(`Task failed after ${failureCount} attempts: ${task.name}`);
      const userInput = await this.ui.requestUserAssistance(
        `I'm having trouble with this task: ${task.name}`,
        error,
        task.description || 'No description available'
      );
      
      if (userInput) {
        // Add user's guidance to task context
        await this.taskManager.updateTaskContext(task.id, userInput);
        
        // Requeue the task
        await this.taskManager.requeueTask(task.id);
      } else {
        // If user provides no input, skip the task
        this.logger.info(`Skipping task due to lack of user guidance: ${task.name}`);
        await this.taskManager.skipTask(task.id);
      }
    }
  }
  
  /**
   * Recover from a system error
   */
  private async recoverFromError(error: any): Promise<void> {
    this.logger.error('Attempting to recover from system error...');
    
    // Check if AI system is working
    const aiStatus = await this.ai.checkStatus();
    if (!aiStatus.available) {
      this.logger.error('AI system is unavailable. Pausing execution.');
      this.isRunning = false;
      return;
    }
    
    // Save error to memory for learning
    await this.memory.recordError(error);
    
    // Continue with the next task
    this.logger.info('Recovered from error. Continuing execution.');
  }
  
  /**
   * Check if the agent should stop executing
   */
  private async shouldStop(): Promise<boolean> {
    // Check if user has requested to stop
    if (await this.ui.checkForStopRequest()) {
      this.logger.info('Received stop request from user');
      return true;
    }
    
    // Check if all high-priority tasks are complete
    const remainingPriorityTasks = await this.taskManager.getHighPriorityTaskCount();
    if (remainingPriorityTasks === 0) {
      // Check with user if they want to continue with low-priority tasks
      const continueLowPriority = await this.ui.requestConfirmation(
        'All high-priority tasks are complete. Continue with optimization tasks?',
        'These tasks aren\'t essential but will improve the project.'
      );
      
      return !continueLowPriority;
    }
    
    return false;
  }
  
  /**
   * Stop the autonomous agent
   */
  public stop(): void {
    this.logger.info('Stopping autonomous agent...');
    this.isRunning = false;
    // Perform any cleanup
  }
}