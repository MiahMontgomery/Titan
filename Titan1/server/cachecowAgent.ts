/**
 * CACHECOW Agent 
 * 
 * Manages the freelance automation aspects of the platform, including:
 * - Job discovery on freelance platforms
 * - Proposal automation
 * - Project workflow management
 * - Client communication
 * - Deliverable generation
 */

import { storage } from './storage';
import { log, error } from './helpers';
import { broadcastThinking } from './chatHandler';
import { generateJsonResponse } from './openai';
import { getBrowserClient } from './browserClient';

// Types
interface CachecowAgentConfig {
  autoMode: boolean;
  checkInterval: number;  // minutes
  platformCheckInterval: number; // minutes
  targetPlatforms: string[];
  jobTypes: string[];
  qualificationLevel: string;
  responseTime: number; // minutes
  maxActiveJobs: number;
  bidRange: {
    min: number;
    max: number;
  };
  workingHours: {
    start: number; // 0-23
    end: number;   // 0-23
  };
}

interface JobListing {
  id: string;
  platform: string;
  title: string;
  description: string;
  budget: number | null;
  skills: string[];
  createdAt: Date;
  url: string;
  status: 'new' | 'evaluated' | 'applied' | 'rejected' | 'accepted' | 'completed';
  confidence: number; // 0-1 match confidence
  notes: string;
}

interface ActiveProject {
  id: string;
  jobId: string;
  platform: string;
  clientId: string;
  title: string;
  description: string;
  startDate: Date;
  deadline: Date | null;
  budget: number;
  status: 'active' | 'paused' | 'completed' | 'delivered' | 'paid';
  milestones: {
    id: string;
    title: string;
    description: string;
    deadline: Date | null;
    status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'paid';
  }[];
  communications: {
    id: string;
    timestamp: Date;
    sender: 'client' | 'agent';
    message: string;
  }[];
  notes: string;
}

/**
 * CACHECOW Agent class
 * Manages the autonomous operation of the freelance automation platform
 */
export class CachecowAgent {
  private projectId: number;
  private config: CachecowAgentConfig;
  private isRunning: boolean = false;
  private jobListings: Map<string, JobListing> = new Map();
  private activeProjects: Map<string, ActiveProject> = new Map();
  private platformCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private mainInterval: NodeJS.Timeout | null = null;
  private lastStatusUpdate: Date = new Date();
  
  constructor(projectId: number) {
    this.projectId = projectId;
    this.config = {
      autoMode: false,
      checkInterval: 30,
      platformCheckInterval: 15,
      targetPlatforms: ['upwork', 'fiverr', 'freelancer'],
      jobTypes: ['web development', 'app development', 'writing', 'design'],
      qualificationLevel: 'intermediate',
      responseTime: 120,
      maxActiveJobs: 5,
      bidRange: {
        min: 25,
        max: 75
      },
      workingHours: {
        start: 9, // 9 AM
        end: 17   // 5 PM
      }
    };
    
    this.logThinking('CACHECOW Agent initialized');
  }
  
  /**
   * Load configuration from storage
   */
  async loadConfig(): Promise<void> {
    try {
      const project = await storage.getProject(this.projectId);
      if (!project) {
        throw new Error(`Project ID ${this.projectId} not found`);
      }
      
      // If project has agent config, use it
      if (project.agentConfig) {
        const agentConfig = project.agentConfig as any;
        if (agentConfig.cachecowAgent) {
          this.logThinking('Loaded CACHECOW agent configuration from project');
          this.config = {
            ...this.config,
            ...agentConfig.cachecowAgent
          };
        }
      }
      
      // Update auto mode from project
      this.config.autoMode = project.autoMode;
      
      this.logThinking(`Configuration loaded: autoMode=${this.config.autoMode}, checkInterval=${this.config.checkInterval}m`);
    } catch (error) {
      this.logThinking(`Error loading config: ${error instanceof Error ? error.message : String(error)}`);
      this.logThinking(`Using default configuration`);
    }
  }
  
  /**
   * Save configuration to storage
   */
  async saveConfig(): Promise<void> {
    try {
      const project = await storage.getProject(this.projectId);
      if (!project) {
        throw new Error(`Project ID ${this.projectId} not found`);
      }
      
      const agentConfig = project.agentConfig ? { ...project.agentConfig as any } : {};
      
      // Update cachecow agent config
      agentConfig.cachecowAgent = this.config;
      
      // Save back to project
      await storage.updateProject(this.projectId, {
        agentConfig: agentConfig
      });
      
      this.logThinking('Saved CACHECOW agent configuration to project');
    } catch (error) {
      this.logThinking(`Error saving config: ${error instanceof Error ? error.message : String(error)}`);
      this.logThinking(`Configuration not saved`);
    }
  }
  
  /**
   * Start the CACHECOW agent
   */
  async start(): Promise<boolean> {
    if (this.isRunning) {
      this.logThinking('CACHECOW agent is already running');
      return true;
    }
    
    try {
      // Load configuration
      await this.loadConfig();
      
      // Only start if auto mode is enabled
      if (!this.config.autoMode) {
        this.logThinking('Auto mode is disabled. Agent not started.');
        return false;
      }
      
      this.isRunning = true;
      
      // Set up main interval for agent operations
      this.mainInterval = setInterval(() => {
        this.runAgentCycle().catch(err => {
          this.logThinking(`Error in agent cycle: ${err instanceof Error ? err.message : String(err)}`);
        });
      }, this.config.checkInterval * 60 * 1000);
      
      // Initial agent cycle
      this.runAgentCycle().catch(err => {
        this.logThinking(`Error in initial agent cycle: ${err instanceof Error ? err.message : String(err)}`);
      });
      
      this.logThinking('CACHECOW agent started successfully');
      
      // Set up platform check intervals
      this.setupPlatformChecks();
      
      return true;
    } catch (error) {
      this.logThinking(`Error starting CACHECOW agent: ${error instanceof Error ? error.message : String(error)}`);
      this.isRunning = false;
      return false;
    }
  }
  
  /**
   * Stop the CACHECOW agent
   */
  async stop(): Promise<boolean> {
    if (!this.isRunning) {
      this.logThinking('CACHECOW agent is not running');
      return true;
    }
    
    try {
      // Clear main interval
      if (this.mainInterval) {
        clearInterval(this.mainInterval);
        this.mainInterval = null;
      }
      
      // Clear all platform check intervals
      for (const [platform, interval] of this.platformCheckIntervals.entries()) {
        clearInterval(interval);
        this.logThinking(`Stopped checking ${platform} for new jobs`);
      }
      this.platformCheckIntervals.clear();
      
      this.isRunning = false;
      this.logThinking('CACHECOW agent stopped successfully');
      return true;
    } catch (error) {
      this.logThinking(`Error stopping CACHECOW agent: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Set up platform check intervals
   */
  private setupPlatformChecks(): void {
    // Clear existing intervals
    for (const interval of this.platformCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.platformCheckIntervals.clear();
    
    // Set up new intervals for each platform
    for (const platform of this.config.targetPlatforms) {
      const interval = setInterval(() => {
        this.checkPlatformForJobs(platform).catch(err => {
          this.logThinking(`Error checking ${platform} for jobs: ${err instanceof Error ? err.message : String(err)}`);
        });
      }, this.config.platformCheckInterval * 60 * 1000);
      
      this.platformCheckIntervals.set(platform, interval);
      this.logThinking(`Set up job check for ${platform} every ${this.config.platformCheckInterval} minutes`);
      
      // Initial check
      this.checkPlatformForJobs(platform).catch(err => {
        this.logThinking(`Error in initial ${platform} check: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
  }
  
  /**
   * Run a single agent cycle
   */
  private async runAgentCycle(): Promise<void> {
    if (!this.isRunning) return;
    
    this.logThinking('Running CACHECOW agent cycle...');
    
    try {
      // Update agent status
      await this.updateStatus();
      
      // Process existing job listings
      await this.processJobListings();
      
      // Update active projects
      await this.updateActiveProjects();
      
      // Update the project's last automation run timestamp
      await storage.updateProject(this.projectId, {
        lastAutomationRun: new Date()
      });
      
      this.logThinking('CACHECOW agent cycle completed successfully');
    } catch (error) {
      this.logThinking(`Error in CACHECOW agent cycle: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Check a specific platform for new job listings
   */
  private async checkPlatformForJobs(platform: string): Promise<void> {
    this.logThinking(`Checking ${platform} for new job listings...`);
    
    try {
      // Get browser client for web automation
      const browserClient = getBrowserClient(this.projectId);
      
      // TODO: Implement platform-specific job discovery logic
      
      // Example implementation - will be replaced with platform-specific logic
      const mockJobListings: JobListing[] = [];
      
      // For development/testing purposes only
      if (platform === 'upwork' && Math.random() > 0.7) {
        mockJobListings.push({
          id: `upwork-${Date.now()}`,
          platform: 'upwork',
          title: 'React Developer Needed for E-commerce Project',
          description: 'Looking for an experienced React developer to build an e-commerce store with modern UI/UX.',
          budget: 1000,
          skills: ['react', 'javascript', 'css', 'e-commerce'],
          createdAt: new Date(),
          url: 'https://upwork.com/jobs/example',
          status: 'new',
          confidence: 0.85,
          notes: 'Seems like a good match for my React skills'
        });
      }
      
      // Process discovered job listings
      for (const job of mockJobListings) {
        this.jobListings.set(job.id, job);
        this.logThinking(`New job discovered on ${platform}: ${job.title}`);
      }
      
      this.logThinking(`Completed checking ${platform}. Found ${mockJobListings.length} new jobs.`);
    } catch (error) {
      this.logThinking(`Error checking ${platform} for jobs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Process job listings
   */
  private async processJobListings(): Promise<void> {
    this.logThinking(`Processing ${this.jobListings.size} job listings...`);
    
    // Filter for new job listings that need evaluation
    const newJobListings = Array.from(this.jobListings.values())
      .filter(job => job.status === 'new');
    
    if (newJobListings.length === 0) {
      this.logThinking('No new job listings to process');
      return;
    }
    
    this.logThinking(`Found ${newJobListings.length} new job listings to evaluate`);
    
    // Evaluate each job listing
    for (const job of newJobListings) {
      try {
        await this.evaluateJobListing(job);
      } catch (error) {
        this.logThinking(`Error evaluating job ${job.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Apply to suitable jobs
    const suitableJobs = Array.from(this.jobListings.values())
      .filter(job => job.status === 'evaluated' && job.confidence >= 0.7);
    
    if (suitableJobs.length === 0) {
      this.logThinking('No suitable jobs to apply for');
      return;
    }
    
    this.logThinking(`Found ${suitableJobs.length} suitable jobs to apply for`);
    
    // Check if we're under the max active jobs limit
    const activeJobCount = Array.from(this.activeProjects.values()).length;
    const remainingSlots = this.config.maxActiveJobs - activeJobCount;
    
    if (remainingSlots <= 0) {
      this.logThinking(`Already at maximum active jobs (${this.config.maxActiveJobs}). Not applying to new jobs.`);
      return;
    }
    
    // Sort by confidence
    suitableJobs.sort((a, b) => b.confidence - a.confidence);
    
    // Apply to top jobs based on available slots
    const jobsToApply = suitableJobs.slice(0, remainingSlots);
    
    for (const job of jobsToApply) {
      try {
        await this.applyToJob(job);
      } catch (error) {
        this.logThinking(`Error applying to job ${job.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  /**
   * Evaluate a job listing for suitability
   */
  private async evaluateJobListing(job: JobListing): Promise<void> {
    this.logThinking(`Evaluating job: ${job.title}`);
    
    try {
      // Use AI to evaluate job suitability
      const prompt = `
        As a freelance professional, evaluate the following job posting:
        
        Title: ${job.title}
        Description: ${job.description}
        Budget: ${job.budget || 'Not specified'}
        Required Skills: ${job.skills.join(', ')}
        Platform: ${job.platform}
        
        Please analyze this job posting and provide:
        1. A match score between 0-1 indicating how well this job matches my expertise
        2. A brief explanation of your reasoning
        3. A suggested bid amount if you recommend applying
        
        Output your analysis as a JSON object with 'confidence', 'reasoning', and 'suggestedBid' fields.
      `;
      
      const evaluation = await generateJsonResponse<{
        confidence: number;
        reasoning: string;
        suggestedBid: number | null;
      }>(prompt);
      
      // Update job with evaluation results
      job.confidence = evaluation.confidence;
      job.notes = evaluation.reasoning;
      job.status = 'evaluated';
      
      this.logThinking(`Job evaluated with confidence score: ${job.confidence}`);
      this.logThinking(`Reasoning: ${job.notes}`);
      
      // Update in map
      this.jobListings.set(job.id, job);
    } catch (error) {
      this.logThinking(`Error evaluating job: ${error instanceof Error ? error.message : String(error)}`);
      job.status = 'rejected';
      job.notes = `Evaluation error: ${error instanceof Error ? error.message : String(error)}`;
      this.jobListings.set(job.id, job);
    }
  }
  
  /**
   * Apply to a job
   */
  private async applyToJob(job: JobListing): Promise<void> {
    this.logThinking(`Applying to job: ${job.title}`);
    
    try {
      // Use AI to generate a proposal
      const prompt = `
        As a freelance professional, create a compelling proposal for the following job:
        
        Title: ${job.title}
        Description: ${job.description}
        Budget: ${job.budget || 'Not specified'}
        Required Skills: ${job.skills.join(', ')}
        Platform: ${job.platform}
        
        Create a professional, personalized proposal that:
        1. Demonstrates understanding of the client's needs
        2. Highlights relevant experience
        3. Shows enthusiasm for the project
        4. Includes a proposed timeline and approach
        5. Ends with a clear call to action
        
        Output your proposal as a JSON object with 'proposalText', 'bidAmount', and 'estimatedDuration' fields.
      `;
      
      const proposal = await generateJsonResponse<{
        proposalText: string;
        bidAmount: number;
        estimatedDuration: string;
      }>(prompt);
      
      // TODO: Implement platform-specific job application logic
      
      // For now, just log the proposal
      this.logThinking(`Generated proposal for job ${job.id}`);
      this.logThinking(`Bid amount: $${proposal.bidAmount}`);
      this.logThinking(`Estimated duration: ${proposal.estimatedDuration}`);
      
      // Update job status
      job.status = 'applied';
      job.notes += `\n\nApplied with bid: $${proposal.bidAmount}, Est. duration: ${proposal.estimatedDuration}`;
      this.jobListings.set(job.id, job);
      
      this.logThinking(`Successfully applied to job: ${job.title}`);
    } catch (error) {
      this.logThinking(`Error applying to job: ${error instanceof Error ? error.message : String(error)}`);
      job.notes += `\n\nApplication error: ${error instanceof Error ? error.message : String(error)}`;
      this.jobListings.set(job.id, job);
    }
  }
  
  /**
   * Update active projects
   */
  private async updateActiveProjects(): Promise<void> {
    this.logThinking(`Updating ${this.activeProjects.size} active projects...`);
    
    // Process each active project
    for (const project of this.activeProjects.values()) {
      try {
        await this.updateProject(project);
      } catch (error) {
        this.logThinking(`Error updating project ${project.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  /**
   * Update a specific project
   */
  private async updateProject(project: ActiveProject): Promise<void> {
    this.logThinking(`Updating project: ${project.title}`);
    
    // TODO: Implement project update logic
    
    // Check for client messages
    
    // Update project milestones
    
    // Deliver completed work
    
    // Handle invoicing and payments
  }
  
  /**
   * Update agent status
   */
  private async updateStatus(): Promise<void> {
    // Only update status every 15 minutes to avoid excessive updates
    const now = new Date();
    const timeSinceLastUpdate = now.getTime() - this.lastStatusUpdate.getTime();
    if (timeSinceLastUpdate < 15 * 60 * 1000) {
      return;
    }
    
    this.lastStatusUpdate = now;
    
    const activeJobCount = this.activeProjects.size;
    const evaluatedJobCount = Array.from(this.jobListings.values())
      .filter(job => job.status === 'evaluated').length;
    const appliedJobCount = Array.from(this.jobListings.values())
      .filter(job => job.status === 'applied').length;
    
    const statusUpdate = {
      agent: 'cachecow',
      timestamp: now.toISOString(),
      metrics: {
        activeJobs: activeJobCount,
        evaluatedJobs: evaluatedJobCount,
        appliedJobs: appliedJobCount,
        earnings: {
          today: 0, // TODO: Calculate actual earnings
          week: 0,
          month: 0,
          total: 0
        }
      },
      status: this.isRunning ? 'running' : 'stopped',
      lastCheck: now.toISOString()
    };
    
    // TODO: Save status to project or broadcast via websockets
    
    this.logThinking(`Agent status updated: ${activeJobCount} active jobs, ${appliedJobCount} pending applications`);
  }
  
  /**
   * Get agent information and status
   */
  async getStatus(): Promise<any> {
    return {
      agent: 'cachecow',
      status: this.isRunning ? 'running' : 'stopped',
      config: this.config,
      metrics: {
        jobListings: this.jobListings.size,
        activeProjects: this.activeProjects.size,
        targetPlatforms: this.config.targetPlatforms,
        lastStatusUpdate: this.lastStatusUpdate
      }
    };
  }
  
  /**
   * Log thinking process for full transparency
   */
  private logThinking(message: string): void {
    log(`[CACHECOW] ${message}`);
    
    // Broadcast thinking to clients for this project
    broadcastThinking(this.projectId, `CACHECOW Agent: ${message}`);
  }
}

// Storage for agent instances
const agents: Map<number, CachecowAgent> = new Map();

/**
 * Get or create a CACHECOW agent for a project
 */
export function getCachecowAgent(projectId: number): CachecowAgent {
  if (!agents.has(projectId)) {
    agents.set(projectId, new CachecowAgent(projectId));
  }
  
  return agents.get(projectId)!;
}

/**
 * Initialize CACHECOW agents for all applicable projects
 * Called at server startup
 */
export async function initializeCachecowAgents(): Promise<void> {
  console.log('Initializing CACHECOW agents for all applicable projects...');
  
  try {
    // Find all projects of type 'cachecow'
    const projects = await storage.getAllProjects();
    const cachecowProjects = projects.filter(p => p.projectType === 'cachecow');
    
    console.log(`Found ${cachecowProjects.length} CACHECOW projects`);
    
    // Initialize agent for each project and start if auto mode is enabled
    for (const project of cachecowProjects) {
      const agent = getCachecowAgent(project.id);
      
      // Load agent configuration
      await agent.loadConfig();
      
      // Start agent if auto mode is enabled
      if (project.autoMode) {
        await agent.start();
        console.log(`Started CACHECOW agent for project ${project.name} (ID: ${project.id})`);
      } else {
        console.log(`CACHECOW agent for project ${project.name} (ID: ${project.id}) not started (auto mode disabled)`);
      }
    }
    
    console.log('CACHECOW agent initialization completed');
  } catch (error) {
    console.error('Error initializing CACHECOW agents:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Get all CACHECOW agents
 */
export function getAllCachecowAgents(): Map<number, CachecowAgent> {
  return agents;
}