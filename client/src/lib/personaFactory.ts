import { Persona } from '@/lib/types';

/**
 * Factory function to create a default persona with standard scaffolding
 * This ensures all personas have the same structure and tabs (performance, progress, chat, settings)
 */
export function createDefaultPersona(overrides: Partial<Persona> = {}): Persona {
  // Generate a unique ID for the persona
  const id = Date.now();
  
  // Create base persona structure with minimal defaults
  const defaultPersona: Persona = {
    id,
    name: '',
    displayName: '',
    description: '',
    emoji: '',
    imageUrl: '',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    
    // Behavior settings
    behavior: {
      tone: '', // Set by user
      style: '', // Set by user
      vocabulary: '', // Set by user
      responsiveness: 0, // Set by user
      creativity: 0, // Set by user
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
      level: 0, // Set by user
      canInitiateConversation: false,
      canCreateContent: false,
      workingHours: {
        start: 0, // Set by user
        end: 0, // Set by user
      },
      restrictions: [],
    },
    
    // Progress structure (features, milestones, goals)
    progress: {
      features: [], // Features will be populated by the user or API
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