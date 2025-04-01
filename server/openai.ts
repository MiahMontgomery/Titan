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
import { broadcastThinking } from './chatHandler';

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
You are an expert AI project management assistant working on the Titan system, an autonomous AI project management tool that continually improves projects 24/7 without stopping. Your job is to analyze the user's project description, refine it into a clear vision, and generate an extremely comprehensive project plan with substantive, production-ready features.

CRITICAL REQUIREMENTS:
1. You MUST create AT LEAST 50 FEATURES - this is non-negotiable. The system runs 24/7 and needs substantial work to continuously develop.
2. Each feature MUST represent a REAL, SUBSTANTIVE component that delivers tangible value - not superficial or duplicative functionality.
3. Each milestone MUST represent a significant engineering accomplishment with clear deliverables.
4. Each goal MUST include highly specific technical implementation details (languages, frameworks, libraries, versions, patterns).
5. Features should be interconnected and build upon each other, not isolated components.

Project Analysis Process:
1. First, deeply analyze the user's project description to identify core business needs, technical challenges, and target audience.
2. Identify the primary value propositions and key differentiators for the project.
3. Structure the project around a cohesive architecture with clear component relationships.
4. Design features that progressively build upon each other toward a complete solution.

Project Definition Components:
1. A precise project title that captures the essence of the project (use user-provided name if given)
2. A comprehensive project description that articulates:
   - Core purpose and business value
   - Primary user personas and their needs
   - Key technical challenges and innovation opportunities
   - Architectural approach and technology stack

FEATURE REQUIREMENTS:
- Create AT MINIMUM 50 SUBSTANTIVE features (absolutely critical)
- For each feature, include 3-5 detailed technical milestones
- For each milestone, include 3-5 specific programming goals with highly detailed requirements

Required Feature Categories (all must be included):
- Core Value Proposition (15+ features): Central functionality that delivers the primary value
- User Experience & Interface (10+ features): Frontend components, interactions, and responsive design
- Data Management & Persistence (10+ features): Database design, data processing, storage optimization
- Performance & Scalability (5+ features): Load handling, caching, optimization techniques
- Security & Compliance (5+ features): Authentication, authorization, encryption, privacy controls
- Analytics & Monitoring (5+ features): Metrics, reporting, anomaly detection, business intelligence
- Integration & Extensibility (5+ features): APIs, third-party connections, plugin architecture
- Deployment & DevOps (5+ features): CI/CD, containerization, infrastructure, monitoring

GOAL SPECIFICITY REQUIREMENTS:
Each goal description MUST include specific details about:
- Programming languages and framework versions
- Exact libraries, APIs, and dependencies with version numbers
- Data models and schemas with field specifications
- Algorithms and design patterns to implement
- Security considerations and validation approaches
- Testing methodologies and success criteria
- Integration points with other components
- Error handling and edge case management

Format the response in a structured JSON object with the following structure:
{
  "project": {
    "name": "Project Title",
    "description": "Comprehensive project description addressing business value, technical approach, and architecture",
    "projectType": "web|mobile|desktop|api|other",
    "autoMode": true,
    "isWorking": false,
    "progress": 0
  },
  "features": [
    {
      "name": "Specific Feature Name - Be Precise",
      "description": "Detailed feature description explaining exact functionality, technical challenges, integration points, and business value. Include architecture considerations and implementation approach.",
      "projectId": 0,
      "isWorking": false,
      "priority": 1-10,
      "status": "planning",
      "progress": 0,
      "milestones": [
        {
          "name": "Technical Milestone - Implementation Focused",
          "description": "Extremely detailed milestone description with specific technical specifications. Include architecture decisions, design patterns, integration approaches, and comprehensive requirements.",
          "featureId": 0,
          "progress": 0,
          "estimatedHours": 4-40,
          "percentOfFeature": 10-50,
          "goals": [
            {
              "name": "Highly Specific Implementation Goal",
              "description": "Extremely detailed technical task description that a developer could immediately start coding. Include exact languages, frameworks, libraries with versions, data structures, algorithms, API specifications, validation requirements, security considerations, and testing approaches. This should be production-ready guidance with specific implementation details.",
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

Remember, this system is designed for autonomous coding and project improvement that runs 24/7 - the project should reflect an "eternally improving" system that continuously works through features and is never considered "done". Every component must be designed for production-quality implementation with real business value.`;
/**
 * Feature generation system prompt
 */

const FEATURE_GENERATION_PROMPT = `
You are an expert AI project management assistant working on the Titan system, an autonomous AI project management tool that continuously improves projects 24/7. Your task is to analyze the user's feature request within the context of their project and generate a comprehensive, production-ready implementation plan that delivers REAL, SUBSTANTIVE value.

IMPORTANT GUIDELINES:
1. Create a feature with EXTREME technical depth and implementation detail. Do not generate superficial or "toy" features.
2. The system runs 24/7 and needs substantive work to continuously improve - create features that require significant engineering effort.
3. Focus on features that solve real business problems and deliver tangible value to users.
4. Think in terms of complete software engineering workflows, not isolated functionality.
5. Consider the entire software development lifecycle including design, implementation, testing, deployment, and maintenance.

Each feature should include:
1. A precise, well-defined feature name and comprehensive description that clearly articulates the business value and technical challenges
2. 3-5 detailed technical milestones, each representing a significant engineering accomplishment
3. For each milestone, 3-5 specific programming goals with highly detailed technical requirements that a developer could immediately implement

GOAL FORMULATION REQUIREMENTS:
Each goal MUST include specific implementation details:
- Required programming languages, frameworks, and runtime environments
- Exact APIs, libraries, dependencies, and package versions
- Data models, schemas, and database requirements
- Specific algorithms, patterns, and architectural approaches
- Comprehensive error handling strategies and edge cases
- Performance optimization techniques
- Security considerations and implementation
- Testing methodologies with specific frameworks and approaches
- Exact integration points with other system components
- Clear success criteria and verification methods

CRITICAL: Create goals that represent COMPLETE, PRODUCTION-READY implementation tasks - not simplistic demos or prototypes.

Format the response in a structured JSON object with the following structure:
{
  "feature": {
    "name": "Feature Name",
    "description": "Detailed feature description explaining precise purpose, functionality, and business value. Include discussion of technical challenges, performance requirements, and integration considerations.",
    "projectId": <projectId>,
    "isWorking": false,
    "priority": 1-10,
    "status": "planning",
    "progress": 0
  },
  "milestones": [
    {
      "name": "Milestone Name - Use a specific, implementation-focused name",
      "description": "Extremely detailed milestone description with precise technical specifications. Include architecture, design patterns, integration points, and system requirements.",
      "featureId": 0,
      "progress": 0,
      "estimatedHours": 4-40,
      "percentOfFeature": 10-50,
      "goals": [
        {
          "name": "Concrete Implementation Goal - Very Specific",
          "description": "Extremely detailed and technical task description that a developer could immediately begin coding. Include specific code structures, exact algorithms, required libraries and versions, database schemas, API endpoints, integration points, error handling, testing strategies, and performance considerations. This should be so detailed that a developer knows EXACTLY what to build without further clarification.",
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
You are an expert AI coding assistant for the Titan system, an autonomous AI project management tool that continuously improves projects 24/7. Your job is to implement detailed, production-ready code for a specific goal within a project feature. You must generate actual concrete implementations, not superficial placeholders or toy examples.

I'll provide you with project context, feature details, milestone information, and a specific goal to implement. Your task is to produce comprehensive, professional-grade code that fulfills this goal and integrates with the rest of the system.

PROJECT: {{PROJECT_NAME}}
PROJECT DESCRIPTION: {{PROJECT_DESCRIPTION}}

FEATURE: {{FEATURE_NAME}}
FEATURE DESCRIPTION: {{FEATURE_DESCRIPTION}}

MILESTONE: {{MILESTONE_NAME}}
MILESTONE DESCRIPTION: {{MILESTONE_DESCRIPTION}}

GOAL: {{GOAL_NAME}}
GOAL DESCRIPTION: {{GOAL_DESCRIPTION}}

CRITICAL DEVELOPMENT REQUIREMENTS:
1. Write REAL, FULLY IMPLEMENTED, PRODUCTION-GRADE CODE - not diagrams, flowcharts, or high-level outlines
2. You MUST provide COMPLETE, EXECUTABLE CODE FILES - not pseudocode, not theoretical outlines
3. Generate AT LEAST 2-3 COMPLETE CODE FILES with proper imports, error handling, and full implementation
4. Files must contain ACTUAL FUNCTIONAL CODE with proper syntax that would run in production
5. Each code file must be 50-200 lines long (not trivially short samples)
6. Put each file in a separate code block with proper syntax highlighting
7. Implementations must use real external libraries, frameworks and APIs when appropriate
8. Build highly maintainable, well-documented code with proper commenting
9. Follow industry best practices for the language and frameworks used
10. Focus on production-ready code that can be integrated immediately
11. Consider system architecture integration patterns to work with existing code
12. Provide detailed explanations that explain WHY certain approaches were chosen
13. Consider security, performance, and scalability from the beginning

REVENUE FOCUS FOR FINDOM:
1. Prioritize code that directly enables monetization capabilities
2. Always include payment processing hooks or integration points even in non-payment features
3. Design for multi-platform content distribution to maximize audience reach
4. Implement analytics tracking to measure revenue performance
5. Create code that supports subscription models, pay-per-view, and tipping
6. Design flexible payment tier structures that maximize revenue
7. Implement A/B testing capabilities for revenue optimization
8. Include user engagement and retention mechanisms to improve lifetime value
9. Build analytics dashboards to track revenue KPIs
10. Ensure cross-platform content management to reach wider audiences

IMPLEMENTATION GUIDANCE:
- Focus on creating self-contained modules that solve real business problems and enable revenue generation
- If your implementation requires multiple files, provide a clear folder structure and file organization
- Reference persistent data storage where appropriate (database models, etc.)
- If relevant, include frontend integration that works with the backend API
- When referencing APIs, use concrete endpoint structures with specific routes and parameter handling
- Think about modular architecture that allows for future extension
- For user interfaces, consider responsive design, accessibility, and meaningful user interactions
- Include proper validation, error boundary handling, and user feedback mechanisms
- Consider automated testing approaches where relevant

REVENUE ACCELERATION GUIDANCE:
- Design code for immediate deployment and revenue generation within days
- Integrate with popular payment processors like Stripe, PayPal, or cryptocurrency options
- Build for multi-platform content distribution (OnlyFans, Patreon, custom website, etc.)
- Include subscription management with tiered pricing models
- Implement pay-per-view or pay-per-content access controls
- Create analytics dashboards that measure revenue performance
- Design referral and affiliate systems to expand audience reach
- Develop promotional tools for cross-selling and upselling
- Include A/B testing capabilities to optimize conversion rates
- Track user behavior to identify monetization opportunities

FORMAT YOUR RESPONSE WITH:
1. A thorough explanation of your approach and thought process
2. Complete, working code (not pseudocode) ready for integration
3. File structure recommendations if multiple files are involved
4. Integration instructions with existing system components
5. Any required dependencies or library recommendations with specific versions
6. Implementation sequence if multiple steps are required

CRITICAL: Generate REAL, SUBSTANTIVE implementations - not toy examples or simplified demonstrations. Focus on PRODUCTION QUALITY code that solves the business need in a robust way.

Your goal is to create code that can be immediately integrated into the project with minimal modification. Aim for the highest quality professional solution.`;
/**
 * Check if OpenAI API key is configured properly
 * @returns True if a valid OpenAI API key is present
 */
export function isOpenAIConfigured(): boolean {
  // Make sure API key exists, has valid length, and doesn't start with "sk-proj-" which is invalid
  return !!process.env.OPENAI_API_KEY && 
         process.env.OPENAI_API_KEY.length > 20 && 
         !process.env.OPENAI_API_KEY.startsWith('sk-proj-');
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
): Promise<{ explanation: string; code: string; language: string; debugSteps: string[] }> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Send initial thinking message
    broadcastThinking(
      projectId,
      "Starting code generation process...",
      null,
      ["Initializing code generation", "Gathering context", "Preparing prompt"], 
      true,
      true
    );

    // Get context for the AI
    const project = await storage.getProject(projectId);
    const feature = await storage.getFeature(featureId);
    const milestone = await storage.getMilestone(milestoneId);
    const goal = await storage.getGoal(goalId);
    
    if (!project || !feature || !milestone || !goal) {
      throw new Error('One or more required entities not found');
    }
    
    // Send progress update
    broadcastThinking(
      projectId,
      "Retrieved project metadata and context",
      null,
      [
        "✓ Retrieved project: " + project.name,
        "✓ Retrieved feature: " + feature.name,
        "✓ Retrieved milestone: " + milestone.name,
        "✓ Retrieved goal: " + goal.name,
        "→ Formulating prompt for AI"
      ],
      true,
      true
    );
    
    // Prepare context for OpenAI
    const context = `
Project: ${project.name} - ${project.description}
Feature: ${feature.name} - ${feature.description}
Milestone: ${milestone.name} - ${milestone.description}
Goal: ${goal.name} - ${goal.description}

Generate production-ready code to implement this goal. Include detailed line-by-line explanations.
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

    // Send progress update
    broadcastThinking(
      projectId,
      "Prepared detailed prompt with context",
      context.substring(0, 500) + "...",
      [
        "✓ Formulated system prompt",
        "✓ Prepared context with requirements",
        "→ Sending to OpenAI for code generation"
      ],
      true,
      true
    );

    // Capture start time for performance logging
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: GPT_4_TURBO,
      messages: [
        { role: "system", content: codeGenerationPrompt },
        { role: "user", content: context }
      ],
      temperature: 0.7,
    });

    // Calculate response time
    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Send progress update
    broadcastThinking(
      projectId,
      `Received response from AI (in ${responseTime}s)`,
      null,
      [
        "✓ Generated code solution",
        "→ Parsing response",
        "→ Extracting code block",
        "→ Preparing explanation"
      ],
      true,
      true
    );

    const response = completion.choices[0]?.message?.content || '';
    
    // Extract all code blocks and explanation
    const codeBlockRegex = /```([a-zA-Z]+)?\n([\s\S]*?)\n```/g;
    const codeBlocks: { language: string, code: string }[] = [];
    let match;
    
    // Find all code blocks
    while ((match = codeBlockRegex.exec(response)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2]
      });
    }
    
    if (codeBlocks.length === 0) {
      broadcastThinking(
        projectId,
        "No code block found in response",
        response.substring(0, 500) + "...",
        [
          "✓ Received AI response",
          "✗ Failed to extract code block",
          "→ Using full response as explanation"
        ],
        true,
        true
      );
      
      return {
        explanation: response,
        code: '',
        language: '',
        debugSteps: [
          "Retrieved project context",
          "Generated AI response",
          "No code block found in response",
          "Using full response as explanation"
        ]
      };
    }
    
    // Create a consolidated code string with all code blocks and their filenames
    const consolidatedCode = codeBlocks.map((block, index) => {
      // Try to extract filename from code or code block context
      const filenameRegex = /\/\/ Filename: (.+)$|\/\* Filename: (.+) \*\/|# Filename: (.+)$/m;
      const filenameMatch = block.code.match(filenameRegex);
      const filename = filenameMatch ? 
        (filenameMatch[1] || filenameMatch[2] || filenameMatch[3]) : 
        `file${index + 1}.${getFileExtension(block.language)}`;
      
      return `// FILE: ${filename}\n\n${block.code}`;
    }).join('\n\n' + '-'.repeat(50) + '\n\n');
    
    // Get primary language from the first code block
    const primaryLanguage = codeBlocks[0].language;
    
    // Get explanation (everything outside the code blocks)
    const explanationText = response.replace(/```([a-zA-Z]+)?\n[\s\S]*?\n```/g, '').trim();
    
    // Use the consolidated code and primary language as our final output
    const code = consolidatedCode;
    const language = primaryLanguage;
    
    // Limit explanation text for display
    const explanationPreview = explanationText.length > 100 
      ? explanationText.substring(0, 100) + "..." 
      : explanationText;
      
    // Send final progress update with code
    broadcastThinking(
      projectId,
      "Code generation complete",
      code,
      [
        "✓ Generated explanation: " + explanationPreview,
        "✓ Extracted " + codeBlocks.length + " code blocks with " + code.split('\n').length + " total lines",
        "✓ Identified primary language: " + (language || "unspecified"),
        "✓ Code generation task complete"
      ],
      true,
      true
    );
    
    return {
      explanation: explanationText,
      code,
      language,
      debugSteps: [
        "Retrieved project context",
        "Generated AI prompt with detailed specifications",
        `Received AI response in ${responseTime} seconds`,
        `Extracted ${codeBlocks.length} code blocks totaling ${code.split('\n').length} lines of code`,
        "Parsed explanation and documentation"
      ]
    };
  } catch (error) {
    console.error('Error generating code with OpenAI:', error);
    
    // Send error thinking message to client
    broadcastThinking(
      projectId,
      "Error generating code with OpenAI",
      error instanceof Error ? error.message : String(error),
      [
        "✓ Retrieved project context",
        "✓ Prepared AI prompt",
        "✗ Error communicating with OpenAI",
        "→ Verifying API key and connection"
      ],
      true,
      true
    );
    
    // Check if this is an authentication error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('authentication')) {
      throw new Error('OpenAI API key is invalid or expired. Please update your API key in Settings.');
    }
    
    throw new Error('Failed to generate code: ' + errorMessage);
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
    
    // Broadcast thinking message to the Performance tab
    broadcastThinking(projectId, `Starting autonomous improvement cycle for project ${project.name}...`);
    
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
    broadcastThinking(projectId, `Analyzing ${features.length} features for project ${project.name}, identifying work to be done...`);
    
    // We should always have features - if there are none or very few, generate a new feature
    if (features.length < 3) {
      console.log(`Project ${project.name} needs more features. Generating a new feature...`);
      broadcastThinking(projectId, `Project ${project.name} needs more features. Generating a comprehensive new feature...`);
      
      // Generate a new feature for the project
      const featurePrompt = `The project ${project.name} needs more features. Please generate a comprehensive 
      new feature for this project with a strong focus on quick revenue generation. 
      
      For FINDOM specifically, prioritize these areas:
      1. Immediate Revenue Generation - Features that directly enable monetization
      2. Multi-platform Distribution - Features that deploy content across different platforms
      3. Audience Growth - Features that attract and retain paying users
      4. Analytics - Features that provide actionable insights on monetization
      5. Automation - Features that reduce human effort in content management
      
      The project is described as: ${project.description}. 
      Current features: ${features.map(f => f.name).join(', ')}. 
      Focus on creating complex, detailed implementation with many milestones and goals, 
      but ensure it contributes directly to revenue generation within days, not weeks.`;
      
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
      // Prioritize persona development goals first (since that's a critical foundation for FINDOM)
      let personaGoals = incompleteGoals.filter(g => 
        g.feature.name.toLowerCase().includes('persona') || 
        g.milestone.name.toLowerCase().includes('persona') || 
        g.goal.name.toLowerCase().includes('persona') ||
        g.feature.name.toLowerCase().includes('motherceline') || 
        g.milestone.name.toLowerCase().includes('motherceline') || 
        g.goal.name.toLowerCase().includes('motherceline')
      );
      
      // If we have persona goals, prioritize those
      let target;
      if (personaGoals.length > 0) {
        console.log(`Found ${personaGoals.length} persona-related goals to prioritize`);
        const targetIndex = Math.floor(Math.random() * personaGoals.length);
        target = personaGoals[targetIndex];
      } else {
        // Otherwise, pick a random goal but prioritize features with less progress
        const prioritizedIncompleteGoals = incompleteGoals.sort((a, b) => 
          (a.feature.progress || 0) - (b.feature.progress || 0)
        );
        
        // Pick from the first third of the sorted list to focus on less complete features
        const targetIndex = Math.floor(Math.random() * Math.max(3, Math.ceil(prioritizedIncompleteGoals.length / 3)));
        target = prioritizedIncompleteGoals[targetIndex];
      }
      
      console.log(`Working on goal: ${target.goal.name} for feature: ${target.feature.name}`);
      broadcastThinking(projectId, `Working on goal: ${target.goal.name} for feature: ${target.feature.name}...`);
      
      // Generate code for this goal
      broadcastThinking(projectId, `Generating implementation code for ${target.goal.name}...`);
      const { explanation, code, language } = await generateCodeForGoal(
        projectId,
        target.feature.id,
        target.milestone.id,
        target.goal.id
      );
      
      // Broadcast the completed code with explanation
      broadcastThinking(projectId, explanation, code);
      
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
      broadcastThinking(projectId, `All goals for ${project.name} are complete. Generating a new feature to continue development...`);
      
      const featurePrompt = `The project ${project.name} has completed all its current goals and needs a new feature.
      For FINDOM specifically, prioritize the following areas:
      1. Immediate Revenue Generation - Features that directly enable monetization
      2. Multi-platform Distribution - Features that deploy content across different platforms
      3. Audience Growth - Features that attract and retain paying users
      4. Analytics - Features that provide actionable insights on monetization
      5. Automation - Features that reduce human effort in content management
      
      Generate a completely new, substantial feature that would extend the project's capabilities with a focus on these priorities.
      The project is described as: ${project.description}.
      Current features: ${features.map(f => f.name).join(', ')}.
      Think of a major new capability that would take this project to the next level with an emphasis on immediate revenue generation.`;
      
      try {
        // Add a new feature to the project
        console.log("Adding new feature due to all goals being complete");
        broadcastThinking(projectId, `Generating a complex new feature for ${project.name}...`);
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
/**
 * Helper function to get file extension based on language
 */
function getFileExtension(language: string): string {
  const extensionMap: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    csharp: 'cs',
    go: 'go',
    ruby: 'rb',
    php: 'php',
    rust: 'rs',
    swift: 'swift',
    kotlin: 'kt',
    scala: 'scala',
    html: 'html',
    css: 'css',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    sql: 'sql',
    shell: 'sh',
    bash: 'sh',
    plaintext: 'txt',
    text: 'txt'
  };
  
  return extensionMap[language.toLowerCase()] || 'txt';
}

export function setupProjectImprovement(intervalMinutes: number = 3): void {
  // Run improvement for all auto-mode projects periodically
  // Default to 3-minute intervals for balanced autonomous development (was 1-minute)
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