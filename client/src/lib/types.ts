// Types from persona schema
export interface Persona {
  id: string;
  name: string;
  displayName: string;
  description: string;
  imageUrl?: string;
  emoji?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  projectId: number;
  
  // Customizable behavior settings
  behavior: {
    tone: string;
    style: string;
    vocabulary: string;
    responsiveness: number;
    instructions: string;
    lastUpdated: Date;
  };
  
  // Performance metrics
  stats: {
    totalIncome: number;
    messageCount: number;
    responseRate: number;
    averageResponseTime: number;
    contentCreated: number;
    contentPublished: number;
    conversionRate: number;
    lastActivity?: Date;
  };
  
  // Autonomy settings
  autonomy: {
    level: number;
    lastDecision?: string;
    decisionHistory: string[];
    canInitiateConversation: boolean;
    canCreateContent: boolean;
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
  emoji: '',
  isActive: true,
  behavior: {
    tone: '',
    style: '',
    vocabulary: '',
    responsiveness: 7,
    instructions: '',
    lastUpdated: new Date(),
  },
  autonomy: {
    level: 5,
    lastDecision: '',
    decisionHistory: [],
    canInitiateConversation: true,
    canCreateContent: true,
  },
  stats: {
    totalIncome: 0,
    messageCount: 0,
    responseRate: 0,
    averageResponseTime: 0,
    contentCreated: 0,
    contentPublished: 0,
    conversionRate: 0,
  }
};