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

// Models - the newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user.
const GPT_4_TURBO = "gpt-4o";
const GPT_3_5_TURBO = "gpt-3.5-turbo";

/**
 * Project generation system prompt
 */

const PROJECT_GENERATION_PROMPT = `
You are an expert AI project management assistant working on the Titan system, an autonomous AI project management tool that continually improves projects 24/7 without stopping. Your job is to analyze the user's project description, simplify it to its core essence, and then generate an extremely comprehensive project plan with as many features as possible.

IMPORTANT: You must create as many features as possible - aim for 50+ features. This is critical as this enables the system to continuously develop and improve the project without running out of tasks. The system runs 24/7 and needs enough work to do.

First, analyze and simplify the user's project description to its most essential components and objectives. Break down complex requests into understandable parts.

Then create a structured plan that includes:

1. A clear and concise project title (use user-provided name if given, otherwise generate one)
2. A simplified but comprehensive project description that explains the project's core purpose, key functionalities and target audience
3. A list of AT LEAST 50 FEATURES that would be required to fulfill the project requirements - be extremely thorough and creative
4. For each feature, generate 3-5 detailed milestones that represent key accomplishments
5. For each milestone, generate 3-5 specific technical goals or programming tasks with sufficient detail

Categories of features to always include:
- Core functionality (at least 15 features)
- User interface and experience (at least 10 features)
- Backend and data management (at least 10 features)
- Performance optimization (at least 5 features)
- Security considerations (at least 5 features)
- Analytics and reporting (at least 5 features)
- Integration capabilities (at least 5 features)
- Deployment and maintenance (at least 5 features)

The project must be designed to continuously evolve and improve over time without end. Consider real-world technical implementation details, edge cases, scalability concerns, and integration with external systems.

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
              "description": "Specific task description with technical details. Include programming language, APIs, libraries to use.",
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

Remember, this system is designed for autonomous coding and project improvement that runs 24/7 - the project should reflect an "eternally improving" system that continuously works through features and is never considered "done".`;
/**
 * Feature generation system prompt
 */

const FEATURE_GENERATION_PROMPT = `
You are an expert AI project management assistant working on the Titan system, an autonomous AI project management tool that continuously improves projects 24/7. Your task is to analyze the user's feature request within the context of their project and generate a comprehensive implementation plan.

IMPORTANT: Create a feature with as much depth and technical detail as possible. This system runs 24/7 and needs substantive work to continuously improve.

The feature should include:
1. A clear feature name and description that captures the essence of what needs to be built
2. 3-5 detailed technical milestones with implementation specifics
3. For each milestone, 3-5 specific programming goals with detailed technical requirements

Ensure each goal includes:
- Specific programming languages to use
- APIs, libraries, and frameworks to implement
- Data structures and algorithms where applicable
- Error handling considerations
- Testing strategies
- Integration points with other systems

Format the response in a structured JSON object with the following structure:
{
  "feature": {
    "name": "Feature Name",
    "description": "Detailed feature description explaining purpose and functionality",
    "projectId": <projectId>,
    "isWorking": true,
    "priority": 1-10,
    "status": "planning",
    "progress": 0
  },
  "milestones": [
    {
      "name": "Milestone Name",
      "description": "Detailed milestone description with technical specifications",
      "featureId": 0,
      "progress": 0,
      "estimatedHours": 4-40,
      "percentOfFeature": 10-50,
      "goals": [
        {
          "name": "Goal Name",
          "description": "Extremely specific and technical task description with implementation details including code structures, algorithms, libraries, and integration points. Include sufficient detail to guide programming work.",
          "milestoneId": 0,
          "progress": 0,
          "completed": false,
          "percentOfMilestone": 10-50
        }
      ]
    }
  ]
}`;

/**
 * Code generation system prompt (template - populated at runtime)
 */
const CODE_GENERATION_PROMPT_TEMPLATE = `
You are an expert AI coding assistant for the Titan system, an autonomous AI project management tool that continuously improves projects 24/7. Your job is to implement detailed, production-ready code for a specific goal within a project feature.

I'll provide you with project context, feature details, milestone information, and a specific goal to implement. Your task is to produce comprehensive, professional-grade code that fulfills this goal.

PROJECT: {{PROJECT_NAME}}
PROJECT DESCRIPTION: {{PROJECT_DESCRIPTION}}

FEATURE: {{FEATURE_NAME}}
FEATURE DESCRIPTION: {{FEATURE_DESCRIPTION}}

MILESTONE: {{MILESTONE_NAME}}
MILESTONE DESCRIPTION: {{MILESTONE_DESCRIPTION}}

GOAL: {{GOAL_NAME}}
GOAL DESCRIPTION: {{GOAL_DESCRIPTION}}

Please write high-quality, well-documented, and fully functional code to implement this goal. Your code should:

1. Be complete and ready to integrate into the project
2. Include error handling, edge cases, and performance considerations
3. Include proper commenting and documentation
4. Follow best practices for the language and frameworks used
5. Be structured for maintainability and readability

For complex implementations, explain your design choices and include any setup instructions or dependencies required.

Provide the entire code solution (not pseudocode) along with a detailed explanation of how it works and how it fulfills the goal. Consider all aspects of professional development including security, testing, and performance.

If any external APIs, libraries, or services are needed, specify them clearly with installation or integration instructions.

Your response should be extremely thorough with all the necessary details required to immediately implement your solution without needing to ask further questions.`;
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
    } catch (error) {
      const parseError = error as Error;
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
        dependencies: [],
        aiGenerated: true,
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
    } catch (error) {
      const parseError = error as Error;
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
      dependencies: [],
      aiGenerated: true,
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

    // Fill in template placeholders with actual values
    const codeGenerationPrompt = CODE_GENERATION_PROMPT_TEMPLATE
      .replace('{{PROJECT_NAME}}', project.name || '')
      .replace('{{PROJECT_DESCRIPTION}}', project.description || '')
      .replace('{{FEATURE_NAME}}', feature.name || '')
      .replace('{{FEATURE_DESCRIPTION}}', feature.description || '')
      .replace('{{MILESTONE_NAME}}', milestone.name || '')
      .replace('{{MILESTONE_DESCRIPTION}}', milestone.description || '')
      .replace('{{GOAL_NAME}}', goal.name || '')
      .replace('{{GOAL_DESCRIPTION}}', goal.description || '');

    const completion = await openai.chat.completions.create({
      model: GPT_4_TURBO,
      messages: [
        { role: "system", content: codeGenerationPrompt },
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
 * @param name Optional project name to use instead of AI-generated name
 * @returns Created project with all components
 */
export async function createProjectFromPrompt(description: string, name?: string): Promise<Project> {
  try {
    // Generate project structure
    const generated = await generateProject(description);
    
    // Override name if provided by user
    if (name && name.trim()) {
      generated.project.name = name.trim();
    }
    
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
    console.log(`Starting autonomous improvement for project ID: ${projectId}`);
    const project = await storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    // Only improve projects in auto mode
    if (!project.autoMode) {
      console.log(`Project ${project.name} (ID: ${projectId}) is not in auto mode, skipping improvement`);
      return;
    }
    
    // Log the activity for the automation start
    await storage.createActivityLog({
      projectId,
      message: `Starting intelligent autonomous development cycle for project ${project.name}`,
      timestamp: new Date(),
      agentId: `titan-agent`,
      codeSnippet: null,
      activityType: 'auto_improvement',
      isCheckpoint: true,
    });
    
    // Check if there are features 
    const features = await storage.getFeaturesByProject(projectId);
    console.log(`Found ${features.length} features for project ${project.name}, checking for work to do`);
    
    // We should always have features - if there are none or very few, generate a new feature
    if (features.length < 3) {
      console.log(`Project ${project.name} needs more features. Generating a new feature...`);
      
      // Generate a new feature for the project
      const featurePrompt = `The project ${project.name} needs more features. Please generate a comprehensive 
      new feature for this project. The project is described as: ${project.description}. 
      Current features: ${features.map(f => f.name).join(', ')}. 
      Focus on creating complex, detailed implementation with many milestones and goals.`;
      
      try {
        // Add a new feature to the project
        console.log("Autonomously adding new feature to project via prompt:", featurePrompt);
        const newFeature = await addFeatureFromPrompt(projectId, featurePrompt);
        
        // Log this major action
        await storage.createActivityLog({
          projectId,
          featureId: newFeature.id,
          message: `Added new feature: ${newFeature.name}`,
          timestamp: new Date(),
          agentId: 'titan-agent',
          codeSnippet: null,
          activityType: 'feature_creation',
          isCheckpoint: true,
          thinkingProcess: `Analyzed project needs and determined that a new feature was required. Generated feature: ${newFeature.name} - ${newFeature.description}`
        });
        
        console.log(`Successfully added new feature: ${newFeature.name}`);
        return; // Exit after adding a feature to avoid doing too much at once
      } catch (featureError) {
        console.error("Error creating new feature:", featureError);
      }
    }
    
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
    
    console.log(`Found ${incompleteGoals.length} incomplete goals to work on`);
    
    // If we have incomplete goals, work on one
    if (incompleteGoals.length > 0) {
      // Pick a random goal to work on
      const targetIndex = Math.floor(Math.random() * incompleteGoals.length);
      const target = incompleteGoals[targetIndex];
      
      console.log(`Working on goal: ${target.goal.name} for feature: ${target.feature.name}`);
      
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
        message: `Implemented goal: ${target.goal.name}`,
        timestamp: new Date(),
        agentId: 'titan-agent',
        codeSnippet: code,
        activityType: 'code_generation',
        details: { 
          language,
          goalId: target.goal.id
        },
        isCheckpoint: true,
        thinkingProcess: explanation
      });
      
      // Update the goal progress
      await storage.updateGoal(target.goal.id, {
        progress: 100,
        completed: true
      });
      
      console.log(`Successfully completed goal: ${target.goal.name}`);
    } else {
      // If all goals are complete, we definitely need a new feature
      console.log("All goals are complete. Generating a new feature...");
      
      const featurePrompt = `The project ${project.name} has completed all its current goals and needs a new feature. 
      Generate a completely new, substantial feature that would extend the project's capabilities. 
      The project is described as: ${project.description}. 
      Current features: ${features.map(f => f.name).join(', ')}. 
      Think of a major new capability that would take this project to the next level.`;
      
      try {
        // Add a new feature to the project
        console.log("Adding new feature due to all goals being complete");
        const newFeature = await addFeatureFromPrompt(projectId, featurePrompt);
        
        // Log this major action
        await storage.createActivityLog({
          projectId,
          featureId: newFeature.id,
          message: `Added new feature: ${newFeature.name} as all existing goals were complete`,
          timestamp: new Date(),
          agentId: 'titan-agent',
          codeSnippet: null,
          activityType: 'feature_creation',
          isCheckpoint: true,
          thinkingProcess: `All goals were complete. Project needed continued improvement. Generated new feature: ${newFeature.name} - ${newFeature.description}`
        });
        
        console.log(`Successfully added new feature: ${newFeature.name}`);
      } catch (featureError) {
        console.error("Error creating new feature:", featureError);
      }
    }
  } catch (error) {
    console.error('Error improving project:', error);
    // Log the error but don't throw to avoid breaking the improvement cycle
    await storage.createActivityLog({
      projectId,
      message: `Error during project improvement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date(),
      agentId: 'titan-agent',
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
export function setupProjectImprovement(intervalMinutes: number = 1): void {
  // Run improvement for all auto-mode projects periodically
  // Using 1-minute intervals for more frequent autonomous development
  console.log(`Setting up autonomous project improvement with ${intervalMinutes}-minute intervals`);
  
  // Immediate execution when starting up to avoid waiting for the first interval
  setTimeout(async () => {
    try {
      console.log("Running immediate autonomous improvement run...");
      const projects = await storage.getAllProjects();
      console.log(`Checking ${projects.length} projects for immediate autonomous improvement...`);
      
      for (const project of projects) {
        if (project.autoMode && project.isWorking) {
          console.log(`Immediately improving project: ${project.name} (ID: ${project.id})`);
          // Run improvement for this project right away
          await improveProject(project.id);
        }
      }
    } catch (error) {
      console.error('Error in immediate project improvement cycle:', error);
    }
  }, 5000); // Wait 5 seconds after startup
  
  // Set up regular interval checks
  setInterval(async () => {
    try {
      const projects = await storage.getAllProjects();
      console.log(`Checking ${projects.length} projects for autonomous improvement...`);
      
      for (const project of projects) {
        if (project.autoMode && project.isWorking) {
          console.log(`Autonomously improving project: ${project.name} (ID: ${project.id})`);
          // Run improvement for this project
          await improveProject(project.id);
        }
      }
    } catch (error) {
      console.error('Error in project improvement cycle:', error);
    }
  }, intervalMinutes * 60 * 1000);
}