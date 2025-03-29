// Types from persona schema
export interface Goal {
  id: number;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface Milestone {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  goals: Goal[];
}

export interface Feature {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  milestones: Milestone[];
}

export interface Persona {
  id: number | string;
  name: string;
  displayName: string;
  description: string;
  imageUrl?: string;
  emoji?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  lastActive: string;
  
  // Customizable behavior settings
  behavior: {
    tone: string;
    style: string;
    vocabulary: string;
    responsiveness: number;
    creativity?: number;
    customPrompt?: string;
  };
  
  // Performance metrics
  performance: {
    messageCount: number;
    averageResponseTime: number;
    engagement: number;
    conversionRate: number;
    revenue: number;
    lastUpdated: string;
  };
  
  // Autonomy settings
  autonomy: {
    level: number;
    canInitiateConversation: boolean;
    canCreateContent: boolean;
    workingHours?: {
      start: number;
      end: number;
    };
    restrictions?: string[];
  };
  
  // Progress tracking structure
  progress: {
    features: Feature[];
  };
  
  // Sales tracking data
  sales: {
    monthlyRevenue: number;
    conversionRate: number;
    averageTransaction: number;
    recentTransactions: Array<{
      id?: string;
      title: string;
      amount: number;
      date: string;
      status: string;
    }>;
    totalClients: number;
    returningClients: number;
  };
  
  // Settings and configuration
  settings: {
    model: string;
    maxTokens: number;
    temperature: number;
    systemPrompt: string;
  };
  
  // Integration points with other systems
  integrations?: {
    platforms: string[];
    apis: string[];
    webhooks: string[];
  };
}

export interface ChatMessage {
  id: string;
  personaId: string;
  sender: string;
  content: string;
  timestamp: Date;
  isFromPersona: boolean;
  platform: string;
  clientId?: string;
  metrics?: {
    sentiment?: number;
    engagementScore?: number;
    conversionIntent?: number;
  };
}

export interface ContentItem {
  id: string;
  personaId: string;
  title: string;
  content: string;
  contentType: "post" | "story" | "message" | "promotion";
  platform: string;
  status: "draft" | "pending" | "published" | "rejected";
  createdAt: Date;
  publishedAt?: Date;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    conversions: number;
    revenue: number;
  };
}

export interface BehaviorUpdate {
  id: string;
  personaId: string;
  previousInstructions: string;
  newInstructions: string;
  timestamp: Date;
  appliedBy: string;
  status: "pending" | "applied" | "rejected";
}

// WebSocket message types for real-time communication
export interface WebSocketMessage {
  type: string;
  message?: string | Record<string, any>;
  projectId?: number;
  personaId?: string;
  timestamp?: Date;
  codeSnippet?: string;
  isDebugging?: boolean;
  isStepByStep?: boolean;
  debugSteps?: string[];
  currentDebugStep?: number;
  connected?: boolean; // Used for connection status updates
}

// Create schema (for form validation)
export const createPersonaSchema = {
  name: '',
  displayName: '',
  description: '',
  imageUrl: '',
  emoji: '🤖',
  status: 'active',
  createdAt: new Date().toISOString(),
  lastActive: new Date().toISOString(),
  
  behavior: {
    tone: 'Professional',
    style: 'Informative',
    vocabulary: 'Advanced',
    responsiveness: 8,
    creativity: 7,
    customPrompt: '',
  },
  
  performance: {
    messageCount: 0,
    averageResponseTime: 0,
    engagement: 0,
    conversionRate: 0,
    revenue: 0,
    lastUpdated: new Date().toISOString(),
  },
  
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
  
  progress: {
    features: [],
  },
  
  sales: {
    monthlyRevenue: 0,
    conversionRate: 0,
    averageTransaction: 0,
    recentTransactions: [],
    totalClients: 0,
    returningClients: 0,
  },
  
  settings: {
    model: 'gpt-4o',
    maxTokens: 1000,
    temperature: 0.7,
    systemPrompt: 'You are a helpful assistant named {name}. You are {behavior.tone} and {behavior.style}.',
  },
  
  integrations: {
    platforms: [],
    apis: [],
    webhooks: [],
  },
};