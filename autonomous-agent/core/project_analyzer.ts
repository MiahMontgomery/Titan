/**
 * Project Analyzer
 * 
 * This component is responsible for analyzing the project description and breaking
 * it down into:
 * - Core functionalities
 * - Technical requirements
 * - Architecture recommendations
 * - Milestones with effort estimates
 * - Dependencies between components
 */

import { OpenAIConnector } from './openai_connector';
import { Logger } from '../logging/logger';

export interface TechStack {
  frontend: string[];
  backend: string[];
  database: string;
  apis: string[];
  devOps: string[];
}

export interface Architecture {
  components: string[];
  dataFlow: string;
  diagram?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  estimatedEffort: number; // Hours
  dependencies: string[]; // IDs of dependent milestones
  priority: number;
}

export interface ProjectPlan {
  projectName: string;
  projectDescription: string;
  coreFunctionalities: string[];
  techStack: TechStack;
  architecture: Architecture;
  milestones: Milestone[];
  timeline: number; // Estimated days
  monetizationStrategy: string[];
}

export class ProjectAnalyzer {
  private ai: OpenAIConnector;
  private logger: Logger;

  constructor(ai: OpenAIConnector, logger: Logger) {
    this.ai = ai;
    this.logger = logger;
  }

  /**
   * Analyze a project description and generate a comprehensive project plan
   */
  public async analyzeProject(projectDescription: string): Promise<ProjectPlan> {
    this.logger.info('Beginning project analysis...');
    
    try {
      // First, extract core functionalities
      this.logger.info('Extracting core functionalities...');
      const functionalities = await this.extractCoreFunctionalities(projectDescription);
      
      // Then, determine appropriate technology stack
      this.logger.info('Determining technology stack...');
      const techStack = await this.determineTechStack(projectDescription, functionalities);
      
      // Design system architecture
      this.logger.info('Designing system architecture...');
      const architecture = await this.designArchitecture(projectDescription, functionalities, techStack);
      
      // Generate project milestones
      this.logger.info('Generating project milestones...');
      const milestones = await this.generateMilestones(projectDescription, functionalities, architecture);
      
      // Estimate project timeline
      this.logger.info('Estimating project timeline...');
      const timeline = this.estimateTimeline(milestones);
      
      // Determine monetization strategies
      this.logger.info('Identifying monetization strategies...');
      const monetizationStrategy = await this.identifyMonetizationStrategies(projectDescription, functionalities);
      
      // Generate project name if not specified
      const projectName = await this.generateProjectName(projectDescription, functionalities);
      
      const projectPlan: ProjectPlan = {
        projectName,
        projectDescription,
        coreFunctionalities: functionalities,
        techStack,
        architecture,
        milestones,
        timeline,
        monetizationStrategy
      };
      
      this.logger.info('Project analysis completed successfully');
      this.logger.info(`Project name: ${projectPlan.projectName}`);
      this.logger.info(`Estimated timeline: ${projectPlan.timeline} days`);
      this.logger.info(`Number of milestones: ${projectPlan.milestones.length}`);
      
      return projectPlan;
    } catch (error) {
      this.logger.error(`Error analyzing project: ${error}`);
      throw new Error(`Failed to analyze project: ${error}`);
    }
  }
  
  /**
   * Extract core functionalities from the project description
   */
  private async extractCoreFunctionalities(description: string): Promise<string[]> {
    const prompt = `
      Analyze the following project description and extract a list of 5-10 core functionalities.
      Each functionality should be a distinct feature or capability of the system.
      Format the output as a list, with one functionality per line.
      
      Project Description:
      ${description}
    `;
    
    const response = await this.ai.generateResponse(prompt);
    const functionalities = response.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('#'))
      .map(line => {
        // Remove numbers, bullet points, etc.
        return line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '');
      });
    
    return functionalities;
  }
  
  /**
   * Determine the appropriate technology stack for the project
   */
  private async determineTechStack(
    description: string, 
    functionalities: string[]
  ): Promise<TechStack> {
    const functionalitiesText = functionalities.join('\n- ');
    
    const prompt = `
      Based on the following project description and core functionalities, 
      recommend the most appropriate technology stack. Consider scalability, 
      maintainability, and performance requirements.
      
      Project Description:
      ${description}
      
      Core Functionalities:
      - ${functionalitiesText}
      
      Provide recommendations in the following JSON format:
      {
        "frontend": ["framework1", "library1", "etc"],
        "backend": ["language1", "framework1", "etc"],
        "database": "database name/type",
        "apis": ["api1", "api2", "etc"],
        "devOps": ["tool1", "platform1", "etc"]
      }
    `;
    
    const response = await this.ai.generateResponse(prompt);
    
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const techStack = JSON.parse(jsonMatch[0]);
        return techStack as TechStack;
      } else {
        throw new Error('Could not extract tech stack JSON from AI response');
      }
    } catch (error) {
      this.logger.error(`Error parsing tech stack: ${error}`);
      // Fallback to a default tech stack
      return {
        frontend: ['React', 'TypeScript', 'TailwindCSS'],
        backend: ['Node.js', 'Express', 'TypeScript'],
        database: 'MongoDB',
        apis: ['RESTful API'],
        devOps: ['GitHub Actions', 'Docker']
      };
    }
  }
  
  /**
   * Design the system architecture based on functionalities and tech stack
   */
  private async designArchitecture(
    description: string,
    functionalities: string[],
    techStack: TechStack
  ): Promise<Architecture> {
    const functionalitiesText = functionalities.join('\n- ');
    const techStackText = JSON.stringify(techStack, null, 2);
    
    const prompt = `
      Design a system architecture for the following project:
      
      Project Description:
      ${description}
      
      Core Functionalities:
      - ${functionalitiesText}
      
      Technology Stack:
      ${techStackText}
      
      Provide a high-level architecture design in the following JSON format:
      {
        "components": ["component1", "component2", "etc"],
        "dataFlow": "Description of how data flows between components"
      }
    `;
    
    const response = await this.ai.generateResponse(prompt);
    
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const architecture = JSON.parse(jsonMatch[0]);
        return architecture as Architecture;
      } else {
        throw new Error('Could not extract architecture JSON from AI response');
      }
    } catch (error) {
      this.logger.error(`Error parsing architecture: ${error}`);
      // Return a simple default architecture
      return {
        components: [
          'Frontend App', 
          'Backend API', 
          'Database', 
          'Authentication Service'
        ],
        dataFlow: 'Frontend makes requests to Backend API, which interacts with the Database and Authentication Service.'
      };
    }
  }
  
  /**
   * Generate project milestones from functionalities and architecture
   */
  private async generateMilestones(
    description: string,
    functionalities: string[],
    architecture: Architecture
  ): Promise<Milestone[]> {
    const functionalitiesText = functionalities.join('\n- ');
    const componentsText = architecture.components.join('\n- ');
    
    const prompt = `
      Generate a list of project milestones for the following project:
      
      Project Description:
      ${description}
      
      Core Functionalities:
      - ${functionalitiesText}
      
      System Components:
      - ${componentsText}
      
      For each milestone, provide:
      1. A name
      2. A brief description
      3. Estimated effort in hours
      4. Dependencies (IDs of milestones that must be completed before this one)
      5. Priority (1-5, where 1 is highest priority)
      
      Organize milestones in a logical sequence for development.
      Ensure the first few milestones establish core infrastructure and each subsequent milestone adds tangible user value.
      
      Provide the milestones in the following JSON format:
      [
        {
          "id": "M1",
          "name": "milestone name",
          "description": "milestone description",
          "estimatedEffort": hours,
          "dependencies": ["dependency_ids"],
          "priority": priority_number
        },
        ...
      ]
    `;
    
    const response = await this.ai.generateResponse(prompt);
    
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const milestones = JSON.parse(jsonMatch[0]);
        return milestones as Milestone[];
      } else {
        throw new Error('Could not extract milestones JSON from AI response');
      }
    } catch (error) {
      this.logger.error(`Error parsing milestones: ${error}`);
      // Return a simple set of default milestones
      return [
        {
          id: 'M1',
          name: 'Project Setup',
          description: 'Initialize project repository and set up development environment',
          estimatedEffort: 4,
          dependencies: [],
          priority: 1
        },
        {
          id: 'M2',
          name: 'Core Infrastructure',
          description: 'Set up basic application structure and infrastructure',
          estimatedEffort: 8,
          dependencies: ['M1'],
          priority: 1
        },
        {
          id: 'M3',
          name: 'MVP Feature Implementation',
          description: 'Implement minimum viable product features',
          estimatedEffort: 20,
          dependencies: ['M2'],
          priority: 2
        }
      ];
    }
  }
  
  /**
   * Estimate overall project timeline based on milestones
   */
  private estimateTimeline(milestones: Milestone[]): number {
    // Simple calculation: Sum of all estimated efforts, divided by 8 hours per day
    const totalEffort = milestones.reduce((sum, milestone) => sum + milestone.estimatedEffort, 0);
    const daysNeeded = Math.ceil(totalEffort / 8);
    
    // Add 20% buffer for unexpected issues
    return Math.ceil(daysNeeded * 1.2);
  }
  
  /**
   * Identify potential monetization strategies for the project
   */
  private async identifyMonetizationStrategies(
    description: string,
    functionalities: string[]
  ): Promise<string[]> {
    const functionalitiesText = functionalities.join('\n- ');
    
    const prompt = `
      Based on the following project description and core functionalities,
      suggest 3-5 potential monetization strategies. For each strategy, provide
      a brief explanation of how it would work and why it's appropriate for this project.
      
      Project Description:
      ${description}
      
      Core Functionalities:
      - ${functionalitiesText}
      
      Format each strategy as a single line.
    `;
    
    const response = await this.ai.generateResponse(prompt);
    const strategies = response.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('#'))
      .map(line => {
        // Remove numbers, bullet points, etc.
        return line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '');
      });
    
    return strategies;
  }
  
  /**
   * Generate a project name based on the description and functionalities
   */
  private async generateProjectName(
    description: string,
    functionalities: string[]
  ): Promise<string> {
    const functionalitiesText = functionalities.join('\n- ');
    
    const prompt = `
      Generate a catchy, professional name for the following project:
      
      Project Description:
      ${description}
      
      Core Functionalities:
      - ${functionalitiesText}
      
      The name should be:
      1. Memorable and easy to pronounce
      2. Relevant to the project's purpose
      3. Professional and marketable
      4. Not already used by major companies
      
      Provide just the name, without explanation.
    `;
    
    const response = await this.ai.generateResponse(prompt);
    // Take the first line and clean it up
    const projectName = response.split('\n')[0].trim()
      .replace(/"/g, '')
      .replace(/^Name:\s*/i, '');
    
    return projectName;
  }
}