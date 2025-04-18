// Integration types for external services
export interface FirebaseIntegration {
  config: {
    projectId: string;
    apiKey: string;
    appId: string;
    authDomain?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    clientEmail?: string;
    privateKey?: string;
    credentials?: any;
    databaseURL?: string;
    measurementId?: string;
    startedAt?: string | Date;
    status?: string;
  };
}

export interface OpenAIIntegration {
  apiKey: string;
  model?: string;
}

export interface TelegramIntegration {
  token: string;
  chatId?: string;
}

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
  projectId: number;
  name: string;
  displayName: string;
  description: string;
  imageUrl?: string;
  emoji?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Customizable behavior settings
  behavior: {
    tone: string;
    style: string;
    vocabulary: string;
    responsiveness: number;
    creativity?: number;
    customPrompt?: string;
    instructions?: string;
    lastUpdated?: Date | string;
  };
  
  // Performance metrics
  stats: {
    messageCount: number;
    averageResponseTime: number;
    engagement: number;
    conversionRate: number;
    revenue: number;
    lastUpdated: string;
    totalIncome?: number;
    responseRate?: number;
    contentCreated?: number;
    contentPublished?: number;
    lastActivity?: Date | string;
  };
  
  // Autonomy settings
  autonomy: {
    level: number;
    canInitiateConversation: boolean;
    canCreateContent: boolean;
    chatEnabled?: boolean;
    contentEnabled?: boolean;
    marketingEnabled?: boolean;
    workingHours?: {
      start: number;
      end: number;
    };
    restrictions?: string[];
    lastDecision?: string;
    decisionHistory?: string[];
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
  
  // Status field for backward compatibility with PersonaForm
  status?: any; // This will allow code using persona.status to work while we migrate
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
  data?: any;
  projectId?: number;
  personaId?: string;
  timestamp?: string | number | Date;
  codeSnippet?: string;
  isDebugging?: boolean;
  isStepByStep?: boolean;
  debugSteps?: string[];
  currentDebugStep?: number;
  connected?: boolean; // Used for connection status updates
}

// Create schema (for form validation) with empty values to be filled by user
export const createPersonaSchema = {
  projectId: 0,
  name: '',
  displayName: '',
  description: '',
  imageUrl: '',
  emoji: '',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  
  behavior: {
    tone: '',
    style: '',
    vocabulary: '',
    responsiveness: 0,
    creativity: 0,
    customPrompt: '',
    instructions: '',
    lastUpdated: new Date().toISOString(),
  },
  
  stats: {
    messageCount: 0,
    averageResponseTime: 0,
    engagement: 0,
    conversionRate: 0,
    revenue: 0,
    lastUpdated: new Date().toISOString(),
    totalIncome: 0,
    responseRate: 0,
    contentCreated: 0,
    contentPublished: 0,
    lastActivity: new Date().toISOString(),
  },
  
  autonomy: {
    level: 0,
    canInitiateConversation: false,
    canCreateContent: false,
    workingHours: {
      start: 0,
      end: 0,
    },
    restrictions: [],
    lastDecision: '',
    decisionHistory: [],
    chatEnabled: false,
    contentEnabled: false,
    marketingEnabled: false,
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
    systemPrompt: '',
  },
  
  integrations: {
    platforms: [],
    apis: [],
    webhooks: [],
  },
  
  // Status field for backward compatibility
  status: null,
};