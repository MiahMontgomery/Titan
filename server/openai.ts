import OpenAI from 'openai';
import { storage } from './storage';
import { 
  InsertProject, 
  InsertFeature, 
  InsertMilestone, 
  InsertGoal,
  InsertActivityLog,
  Project,
  Feature,
  Milestone
} from '@shared/schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Models
const GPT_4_TURBO = "gpt-4-turbo";
const GPT_3_5_TURBO = "gpt-3.5-turbo";

/**
 * Project generation system prompt
 */
const PROJECT_GENERATION_PROMPT = `
You are an expert AI project management assistant working on the Titan system, an autonomous AI project management tool that continually improves projects. Your job is to analyze the user's project description and generate a comprehensive project plan with extensive features.

Create a structured plan that includes:

1. A clear and concise project title (use user-provided name if given, otherwise generate one)
2. A detailed project description that explains the project's purpose, key functionalities and target audience
3. A list of AT LEAST 30 FEATURES that would be required to fulfill the project requirements
4. For each feature, generate 3-5 milestones that represent key accomplishments
5. For each milestone, generate 3-5 specific goals or tasks

The project should be designed to continuously evolve and improve over time. Think about features that would make the project robust, scalable, and production-ready. Include extensive technical considerations, quality assurance, performance optimization, and user experience features.

It's crucial to include 30 or more distinct features, as this project requires comprehensive autonomous development. These should be organized into logical categories (core functionality, user interface, backend, performance, security, integrations, etc).

Format the response in a structured JSON object with the following structure:
{
  "project": {
    "name": "Project Title",
    "description": "Detailed project description",
    "projectType": "web|mobile|desktop|api|other",
    "autoMode": true,
    "isWorking": true,
    "progress": 0
  },
  "features": [
    {
      "name": "Feature Name",
      "description": "Feature description",
      "projectId": 0,
      "isWorking": true,
      "priority": 1-10,
      "status": "planning|in-progress|testing|completed",
      "progress": 0,
      "milestones": [
        {
          "name": "Milestone Name",
          "description": "Milestone description",
          "featureId": 0,
          "progress": 0,
          "estimatedHours": 4-40,
          "percentOfFeature": 10-50,
          "goals": [
            {
              "name": "Goal Name",
              "description": "Specific task description with technical details",
              "milestoneId": 0,
              "progress": 0,
              "completed": false,
              "percentOfMilestone": 10-50
            }
          ]
        }
      ]
    }
  ]
}

Remember, this system is designed for continuous autonomous coding and project improvement, so the plan should reflect an "eternally improving" project that is never considered "done".
`;

/**
 * Feature generation system prompt
 */
const FEATURE_GENERATION_PROMPT = `
You are an expert AI software development assistant. Your job is to analyze a project and generate a new feature for it.
Given the project's title, description, and existing features, create a new feature that would enhance the project.

Format the response in a structured JSON object with the following structure:
{
  "feature": {
    "name": "Feature Name",
    "description": "Feature description",
    "projectId": 0,
    "isWorking": false,
    "priority": 1,
    "status": "planning",
    "progress": 0
  },
  "milestones": [
    {
      "name": "Milestone Name",
      "description": "Milestone description",
      "featureId": 0,
      "progress": 0,
      "estimatedHours": 4,
      "percentOfFeature": 30,
      "goals": [
        {
          "name": "Goal Name",
          "description": "Specific task description",
          "milestoneId": 0,
          "progress": 0,
          "completed": false,
          "percentOfMilestone": 40
        }
      ]
    }
  ]
}
`;

/**
 * Code generation system prompt
 */
const CODE_GENERATION_PROMPT = `
You are an expert AI software developer. Your job is to generate code implementations for a specific goal.
Given the project context, feature, milestone, and goal, write code that fulfills the goal's requirements.

Format the response with the following structure:
[explanation of approach]

\`\`\`[language]
[code implementation]
\`\`\`

Include comments to explain complex parts of the code. Make sure your code is complete and functional.
`;

/**
 * Check if OpenAI API key is configured
 * @returns True if OpenAI API key is present
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
}

/**
 * Generate a new project from a user description
 * @param description User's description of the project
 * @returns Generated project structure
 */
export async function generateProject(description: string): Promise<{
  project: InsertProject;
  features: Array<{
    feature: InsertFeature;
    milestones: Array<{
      milestone: InsertMilestone;
      goals: InsertGoal[];
    }>;
  }>;
}> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    console.log('Generating project with OpenAI using API key:', process.env.OPENAI_API_KEY ? 'API key is set' : 'API key not set');
    
    const completion = await openai.chat.completions.create({
      model: GPT_4_TURBO,
      messages: [
        { role: "system", content: PROJECT_GENERATION_PROMPT },
        { role: "user", content: description }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    console.log('OpenAI response received:', responseText.substring(0, 100) + '...');
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError);
      console.error('Received response:', responseText);
      throw new Error('Invalid response format from OpenAI: ' + parseError.message);
    }
    
    // Transform the response to match our schema
    const project: InsertProject = {
      name: responseData.project.name,
      description: responseData.project.description,
      projectType: responseData.project.projectType || 'web',
      autoMode: responseData.project.autoMode || true,
      isWorking: false,
      progress: 0,
      lastUpdated: new Date(),
      priority: 1,
      agentConfig: {},
      checkpoints: {},
    };

    // Transform features
    const features = responseData.features.map((f: any, fIndex: number) => {
      const feature: InsertFeature = {
        name: f.name,
        description: f.description,
        projectId: 0, // Will be updated after project creation
        isWorking: false,
        priority: f.priority || fIndex + 1,
        status: f.status || 'planning',
        progress: 0,
        estimatedDays: f.estimatedDays || null,
        createdAt: new Date(),
        startDate: null,
        endDate: null,
        dependencies: [],
        notes: null,
        optimizationRound: 0
      };

      // Transform milestones for this feature
      const milestones = f.milestones.map((m: any, mIndex: number) => {
        const milestone: InsertMilestone = {
          name: m.name,
          description: m.description,
          featureId: 0, // Will be updated after feature creation
          progress: 0,
          createdAt: new Date(),
          estimatedHours: m.estimatedHours || 4,
          percentOfFeature: m.percentOfFeature || Math.floor(100 / f.milestones.length)
        };

        // Transform goals for this milestone
        const goals = m.goals.map((g: any, gIndex: number) => {
          const goal: InsertGoal = {
            name: g.name,
            description: g.description,
            milestoneId: 0, // Will be updated after milestone creation
            progress: 0,
            createdAt: new Date(),
            completed: false,
            percentOfMilestone: g.percentOfMilestone || Math.floor(100 / m.goals.length)
          };

          return goal;
        });

        return {
          milestone,
          goals
        };
      });

      return {
        feature,
        milestones
      };
    });

    return {
      project,
      features
    };
  } catch (error) {
    console.error('Error generating project with OpenAI:', error);
    throw new Error('Failed to generate project: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Generate a new feature for an existing project
 * @param projectId Project ID to generate feature for
 * @param prompt User prompt for the feature
 * @returns Generated feature structure
 */
export async function generateFeature(projectId: number, prompt: string): Promise<{
  feature: InsertFeature;
  milestones: Array<{
    milestone: InsertMilestone;
    goals: InsertGoal[];
  }>;
}> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Get project details to inform the AI
    const project = await storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    // Get existing features
    const existingFeatures = await storage.getFeaturesByProject(projectId);
    
    // Prepare context for OpenAI
    const context = `
Project Name: ${project.name}
Project Description: ${project.description}
Project Type: ${project.projectType}

Existing Features:
${existingFeatures.map(f => `- ${f.name}: ${f.description}`).join('\n')}

Generate a new feature based on the following prompt: "${prompt}"
`;

    console.log('Generating feature with OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: GPT_4_TURBO,
      messages: [
        { role: "system", content: FEATURE_GENERATION_PROMPT },
        { role: "user", content: context }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    console.log('OpenAI response received for feature generation:', responseText.substring(0, 100) + '...');
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing OpenAI feature response as JSON:', parseError);
      console.error('Received response:', responseText);
      throw new Error('Invalid response format from OpenAI for feature: ' + parseError.message);
    }
    
    // Transform the response to match our schema
    const feature: InsertFeature = {
      name: responseData.feature.name,
      description: responseData.feature.description,
      projectId: projectId,
      isWorking: false,
      priority: responseData.feature.priority || existingFeatures.length + 1,
      status: responseData.feature.status || 'planning',
      progress: 0,
      estimatedDays: responseData.feature.estimatedDays || null,
      createdAt: new Date(),
      startDate: null,
      endDate: null,
      dependencies: [],
      notes: null,
      optimizationRound: 0
    };

    // Transform milestones
    const milestones = responseData.milestones.map((m: any, mIndex: number) => {
      const milestone: InsertMilestone = {
        name: m.name,
        description: m.description,
        featureId: 0, // Will be updated after feature creation
        progress: 0,
        createdAt: new Date(),
        estimatedHours: m.estimatedHours || 4,
        percentOfFeature: m.percentOfFeature || Math.floor(100 / responseData.milestones.length)
      };

      // Transform goals for this milestone
      const goals = m.goals.map((g: any, gIndex: number) => {
        const goal: InsertGoal = {
          name: g.name,
          description: g.description,
          milestoneId: 0, // Will be updated after milestone creation
          progress: 0,
          createdAt: new Date(),
          completed: false,
          percentOfMilestone: g.percentOfMilestone || Math.floor(100 / m.goals.length)
        };

        return goal;
      });

      return {
        milestone,
        goals
      };
    });

    return {
      feature,
      milestones
    };
  } catch (error) {
    console.error('Error generating feature with OpenAI:', error);
    throw new Error('Failed to generate feature: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Generate code implementation for a goal
 * @param projectId Project ID
 * @param featureId Feature ID
 * @param milestoneId Milestone ID
 * @param goalId Goal ID
 * @returns Generated code with explanation
 */
export async function generateCodeForGoal(
  projectId: number, 
  featureId: number, 
  milestoneId: number, 
  goalId: number
): Promise<{ explanation: string; code: string; language: string }> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Get context for the AI
    const project = await storage.getProject(projectId);
    const feature = await storage.getFeature(featureId);
    const milestone = await storage.getMilestone(milestoneId);
    const goal = await storage.getGoal(goalId);
    
    if (!project || !feature || !milestone || !goal) {
      throw new Error('One or more required entities not found');
    }
    
    // Prepare context for OpenAI
    const context = `
Project: ${project.name} - ${project.description}
Feature: ${feature.name} - ${feature.description}
Milestone: ${milestone.name} - ${milestone.description}
Goal: ${goal.name} - ${goal.description}

Generate code to implement this goal.
`;

    const completion = await openai.chat.completions.create({
      model: GPT_4_TURBO,
      messages: [
        { role: "system", content: CODE_GENERATION_PROMPT },
        { role: "user", content: context }
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Extract code block and explanation
    const codeMatch = response.match(/```([a-zA-Z]+)?\n([\s\S]*?)\n```/);
    
    if (!codeMatch) {
      return {
        explanation: response,
        code: '',
        language: ''
      };
    }
    
    // Extract the language and code content
    const language = codeMatch[1] || '';
    const code = codeMatch[2] || '';
    
    // Extract explanation (everything before the code block)
    const explanationParts = response.split('```');
    const explanation = explanationParts[0].trim();
    
    return {
      explanation,
      code,
      language
    };
  } catch (error) {
    console.error('Error generating code with OpenAI:', error);
    throw new Error('Failed to generate code: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Generate thinking process or reasoning about a project
 * @param projectId Project ID
 * @param prompt Specific question or request for the AI
 * @returns AI reasoning and response
 */
export async function generateThinking(projectId: number, prompt: string): Promise<string> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Get project details
    const project = await storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    // Get features, milestones, and goals for context
    const features = await storage.getFeaturesByProject(projectId);
    
    // Build context from project structure
    let context = `
Project: ${project.name}
Description: ${project.description}
Type: ${project.projectType}
Progress: ${project.progress}%

Features:
`;

    for (const feature of features) {
      context += `- ${feature.name} (${feature.progress}%): ${feature.description}\n`;
      
      const milestones = await storage.getMilestonesByFeature(feature.id);
      for (const milestone of milestones) {
        context += `  * Milestone: ${milestone.name} (${milestone.progress}%): ${milestone.description}\n`;
        
        const goals = await storage.getGoalsByMilestone(milestone.id);
        for (const goal of goals) {
          context += `    - Goal: ${goal.name} (${goal.completed ? 'Completed' : 'In Progress'}): ${goal.description}\n`;
        }
      }
    }
    
    // Add the user's prompt
    context += `\nPlease think about this request regarding the project: "${prompt}"`;

    const completion = await openai.chat.completions.create({
      model: GPT_4_TURBO,
      messages: [
        { 
          role: "system", 
          content: `You are an AI assistant specializing in software development and project management. 
                   Provide thoughtful analysis and reasoning about the project based on the given context.
                   Think step by step and be thorough in your explanation.` 
        },
        { role: "user", content: context }
      ],
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'I could not generate a response at this time.';
  } catch (error) {
    console.error('Error generating thinking with OpenAI:', error);
    throw new Error('Failed to generate thinking: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Create a new project and all its components from a user prompt
 * @param description User description of the project
 * @returns Created project with all components
 */
export async function createProjectFromPrompt(description: string): Promise<Project> {
  try {
    // Generate project structure
    const generated = await generateProject(description);
    
    // Create the project
    const project = await storage.createProject(generated.project);
    
    // Create features, milestones, and goals
    for (const featureData of generated.features) {
      // Update the project ID
      featureData.feature.projectId = project.id;
      
      // Create the feature
      const feature = await storage.createFeature(featureData.feature);
      
      // Create milestones and goals for this feature
      for (const milestoneData of featureData.milestones) {
        // Update the feature ID
        milestoneData.milestone.featureId = feature.id;
        
        // Create the milestone
        const milestone = await storage.createMilestone(milestoneData.milestone);
        
        // Create goals for this milestone
        for (const goalData of milestoneData.goals) {
          // Update the milestone ID
          goalData.milestoneId = milestone.id;
          
          // Create the goal
          await storage.createGoal(goalData);
        }
      }
    }
    
    // Log the project creation
    await storage.createActivityLog({
      projectId: project.id,
      message: `Project ${project.name} created from AI generation`,
      timestamp: new Date(),
      agentId: 'ai-agent',
      codeSnippet: null,
      featureId: null,
      milestoneId: null,
      activityType: 'project_creation',
      details: { prompt: description },
      isCheckpoint: true,
      thinkingProcess: 'Generated project structure based on user prompt'
    });
    
    return project;
  } catch (error) {
    console.error('Error creating project from prompt:', error);
    throw new Error('Failed to create project: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Add a new feature to a project from a user prompt
 * @param projectId Project ID
 * @param prompt User prompt for the feature
 * @returns Created feature
 */
export async function addFeatureFromPrompt(projectId: number, prompt: string): Promise<Feature> {
  try {
    // Generate feature structure
    const generated = await generateFeature(projectId, prompt);
    
    // Create the feature
    const feature = await storage.createFeature(generated.feature);
    
    // Create milestones and goals for this feature
    for (const milestoneData of generated.milestones) {
      // Update the feature ID
      milestoneData.milestone.featureId = feature.id;
      
      // Create the milestone
      const milestone = await storage.createMilestone(milestoneData.milestone);
      
      // Create goals for this milestone
      for (const goalData of milestoneData.goals) {
        // Update the milestone ID
        goalData.milestoneId = milestone.id;
        
        // Create the goal
        await storage.createGoal(goalData);
      }
    }
    
    // Log the feature creation
    await storage.createActivityLog({
      projectId: projectId,
      featureId: feature.id,
      message: `Feature ${feature.name} created from AI generation`,
      timestamp: new Date(),
      agentId: 'ai-agent',
      codeSnippet: null,
      milestoneId: null,
      activityType: 'feature_creation',
      details: { prompt },
      isCheckpoint: true,
      thinkingProcess: 'Generated feature structure based on user prompt'
    });
    
    return feature;
  } catch (error) {
    console.error('Error adding feature from prompt:', error);
    throw new Error('Failed to add feature: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Autonomous project improvement
 * @param projectId Project ID to improve
 */
export async function improveProject(projectId: number): Promise<void> {
  try {
    const project = await storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    // Only improve projects in auto mode
    if (!project.autoMode) {
      return;
    }
    
    // Check if there are features with low progress
    const features = await storage.getFeaturesByProject(projectId);
    
    // Get incomplete goals to work on
    const incompleteGoals = [];
    
    for (const feature of features) {
      const milestones = await storage.getMilestonesByFeature(feature.id);
      
      for (const milestone of milestones) {
        const goals = await storage.getGoalsByMilestone(milestone.id);
        
        // Add incomplete goals to the list
        for (const goal of goals) {
          if (!goal.completed) {
            incompleteGoals.push({
              goal,
              milestone,
              feature
            });
          }
        }
      }
    }
    
    // If we have incomplete goals, work on one
    if (incompleteGoals.length > 0) {
      // Pick a random goal to work on
      const targetIndex = Math.floor(Math.random() * incompleteGoals.length);
      const target = incompleteGoals[targetIndex];
      
      // Generate code for this goal
      const { explanation, code, language } = await generateCodeForGoal(
        projectId,
        target.feature.id,
        target.milestone.id,
        target.goal.id
      );
      
      // Log the activity
      await storage.createActivityLog({
        projectId,
        featureId: target.feature.id,
        milestoneId: target.milestone.id,
        message: `Working on goal: ${target.goal.name}`,
        timestamp: new Date(),
        agentId: 'ai-agent',
        codeSnippet: code,
        activityType: 'code_generation',
        details: { 
          language,
          goalId: target.goal.id
        },
        isCheckpoint: false,
        thinkingProcess: explanation
      });
      
      // Update the goal progress
      await storage.updateGoal(target.goal.id, {
        progress: 100,
        completed: true
      });
    } else {
      // If all goals are complete, suggest a new feature
      const prompt = `The project ${project.name} needs a new feature to improve it. The project is described as: ${project.description}`;
      
      // Generate thinking about what to improve
      const thinking = await generateThinking(projectId, prompt);
      
      // Log the activity
      await storage.createActivityLog({
        projectId,
        message: `Analyzing project for improvements`,
        timestamp: new Date(),
        agentId: 'ai-agent',
        codeSnippet: null,
        activityType: 'project_analysis',
        details: { prompt },
        isCheckpoint: true,
        thinkingProcess: thinking
      });
    }
  } catch (error) {
    console.error('Error improving project:', error);
    // Log the error but don't throw to avoid breaking the improvement cycle
    await storage.createActivityLog({
      projectId,
      message: `Error during project improvement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date(),
      agentId: 'ai-agent',
      codeSnippet: null,
      activityType: 'error',
      details: { error: String(error) },
      isCheckpoint: false,
      thinkingProcess: null
    });
  }
}

/**
 * Setup a regular job to improve all auto-mode projects
 * @param intervalMinutes Minutes between improvement runs
 */
export function setupProjectImprovement(intervalMinutes: number = 15): void {
  // Run improvement for all auto-mode projects periodically
  setInterval(async () => {
    try {
      const projects = await storage.getAllProjects();
      
      for (const project of projects) {
        if (project.autoMode && project.isWorking) {
          // Run improvement for this project
          await improveProject(project.id);
        }
      }
    } catch (error) {
      console.error('Error in project improvement cycle:', error);
    }
  }, intervalMinutes * 60 * 1000);
}