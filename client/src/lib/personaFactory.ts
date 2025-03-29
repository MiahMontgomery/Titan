import { Persona } from '@/lib/types';

/**
 * Factory function to create a default persona with standard scaffolding
 * This ensures all personas have the same structure and tabs (performance, progress, chat, settings)
 */
export function createDefaultPersona(overrides: Partial<Persona> = {}): Persona {
  // Generate a unique ID for the persona
  const id = Date.now();
  
  // Create base persona structure with all required fields
  const defaultPersona: Persona = {
    id,
    name: `Persona_${id}`,
    displayName: 'New Persona',
    description: 'A new AI persona created with default parameters',
    emoji: '🤖',
    imageUrl: '',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    
    // Behavior settings
    behavior: {
      tone: 'Professional',
      style: 'Informative',
      vocabulary: 'Advanced',
      responsiveness: 8,
      creativity: 7,
      customPrompt: '',
    },
    
    // Analytics and performance data
    performance: {
      messageCount: 0,
      averageResponseTime: 0,
      engagement: 0,
      conversionRate: 0,
      revenue: 0,
      lastUpdated: new Date().toISOString(),
    },
    
    // Autonomy configuration
    autonomy: {
      level: 5,
      canInitiateConversation: false,
      canCreateContent: false,
      workingHours: {
        start: 9,
        end: 17,
      },
      restrictions: [],
    },
    
    // Progress structure (features, milestones, goals)
    progress: {
      features: [
        // Default feature structure following the 15-feature model from the Progress tab
        {
          id: 1,
          name: 'Web Browser Automation (Puppeteer)',
          description: 'Browser automation for platform interactions',
          status: 'in-progress',
          progress: 65,
          milestones: [
            {
              id: 101,
              name: 'Headless Browser Integration',
              description: 'Set up Puppeteer with stealth plugins',
              status: 'completed',
              progress: 100,
              goals: [
                {
                  id: 1001,
                  name: 'Configure Puppeteer with stealth plugin',
                  status: 'completed',
                },
                {
                  id: 1002,
                  name: 'Implement proxy rotation system',
                  status: 'completed',
                },
                {
                  id: 1003,
                  name: 'Create browser session management',
                  status: 'completed',
                },
              ],
            },
            {
              id: 102,
              name: 'Platform Login Automation',
              description: 'Automate login processes for various platforms',
              status: 'in-progress',
              progress: 75,
              goals: [
                {
                  id: 1004,
                  name: 'Implement OnlyFans authentication workflow',
                  status: 'completed',
                },
                {
                  id: 1005,
                  name: 'Create Instagram login system with 2FA support',
                  status: 'in-progress',
                },
                {
                  id: 1006,
                  name: 'Develop Twitter authentication with token management',
                  status: 'pending',
                },
              ],
            },
            // Add 3 more milestone templates with similar structure
            {
              id: 103,
              name: 'Content Posting Automation',
              description: 'Automate content creation and posting',
              status: 'pending',
              progress: 20,
              goals: [
                {
                  id: 1007,
                  name: 'Build text content submission flow',
                  status: 'in-progress',
                },
                {
                  id: 1008,
                  name: 'Implement image upload capability',
                  status: 'pending',
                },
                {
                  id: 1009,
                  name: 'Create video posting functionality',
                  status: 'pending',
                },
              ],
            },
            {
              id: 104,
              name: 'Interaction Automation',
              description: 'Automate user interactions like messaging',
              status: 'pending',
              progress: 10,
              goals: [
                {
                  id: 1010,
                  name: 'Implement messaging capabilities',
                  status: 'in-progress',
                },
                {
                  id: 1011,
                  name: 'Create like/comment functionality',
                  status: 'pending',
                },
                {
                  id: 1012,
                  name: 'Build story view and engagement automation',
                  status: 'pending',
                },
              ],
            },
            {
              id: 105,
              name: 'Data Extraction & Analytics',
              description: 'Collect and analyze data from platforms',
              status: 'pending',
              progress: 5,
              goals: [
                {
                  id: 1013,
                  name: 'Build DOM scraping utilities',
                  status: 'pending',
                },
                {
                  id: 1014,
                  name: 'Implement audience analysis tools',
                  status: 'pending',
                },
                {
                  id: 1015,
                  name: 'Create performance metrics dashboard integration',
                  status: 'pending',
                },
              ],
            },
          ],
        },
        // Add a second feature template
        {
          id: 2,
          name: 'AI-Powered Chat Response System',
          description: 'Intelligent conversation management with GPT-4o',
          status: 'in-progress',
          progress: 85,
          milestones: [
            {
              id: 201,
              name: 'GPT-4o Integration',
              description: 'Connect with OpenAI API for GPT-4o access',
              status: 'completed',
              progress: 100,
              goals: [
                {
                  id: 2001,
                  name: 'Set up OpenAI API client integration',
                  status: 'completed',
                },
                {
                  id: 2002,
                  name: 'Configure system prompts for persona',
                  status: 'completed',
                },
                {
                  id: 2003,
                  name: 'Implement token optimization',
                  status: 'completed',
                },
              ],
            },
            // Add more milestones
            {
              id: 202,
              name: 'Contextual Memory System',
              description: 'Remember conversation history and context',
              status: 'in-progress',
              progress: 80,
              goals: [
                {
                  id: 2004,
                  name: 'Build conversation history database',
                  status: 'completed',
                },
                {
                  id: 2005,
                  name: 'Implement dynamic context window management',
                  status: 'in-progress',
                },
                {
                  id: 2006,
                  name: 'Create message summarization for long conversations',
                  status: 'pending',
                },
              ],
            },
            {
              id: 203,
              name: 'Persona Customization',
              description: 'Adjust AI personality traits',
              status: 'in-progress',
              progress: 60,
              goals: [
                {
                  id: 2007,
                  name: 'Create vocabulary customization system',
                  status: 'completed',
                },
                {
                  id: 2008,
                  name: 'Implement conversational style settings',
                  status: 'in-progress',
                },
                {
                  id: 2009,
                  name: 'Build tone and emotion adjustment settings',
                  status: 'pending',
                },
              ],
            },
          ],
        },
        // Add a basic template for feature 3 (Content Creation)
        {
          id: 3,
          name: 'Content Creation & Management System',
          description: 'Create and manage AI-generated content',
          status: 'in-progress',
          progress: 42,
          milestones: [
            {
              id: 301,
              name: 'Text Content Generation',
              description: 'Generate text content for posts',
              status: 'in-progress',
              progress: 65,
              goals: [
                {
                  id: 3001,
                  name: 'Create personalized post generation system',
                  status: 'in-progress',
                },
                {
                  id: 3002,
                  name: 'Implement platform-specific content formatting',
                  status: 'pending',
                },
                {
                  id: 3003,
                  name: 'Build content categorization and tagging',
                  status: 'pending',
                },
              ],
            },
            {
              id: 302,
              name: 'Image Generation Integration',
              description: 'Generate images with AI',
              status: 'in-progress',
              progress: 40,
              goals: [
                {
                  id: 3004,
                  name: 'Implement DALL-E integration',
                  status: 'in-progress',
                },
                {
                  id: 3005,
                  name: 'Build prompting system for image styles',
                  status: 'pending',
                },
                {
                  id: 3006,
                  name: 'Develop image optimization for platforms',
                  status: 'pending',
                },
              ],
            },
          ],
        },
      ],
    },
    
    // Sales tracking data
    sales: {
      monthlyRevenue: 0,
      conversionRate: 0,
      averageTransaction: 0,
      recentTransactions: [],
      totalClients: 0,
      returningClients: 0,
    },
    
    // Settings and configuration
    settings: {
      model: 'gpt-4o',
      maxTokens: 1000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful assistant named {name}. You are {behavior.tone} and {behavior.style}.',
    },
    
    // Integration points with other systems
    integrations: {
      platforms: [],
      apis: [],
      webhooks: [],
    },
  };
  
  // Merge with any provided overrides
  return { ...defaultPersona, ...overrides };
}