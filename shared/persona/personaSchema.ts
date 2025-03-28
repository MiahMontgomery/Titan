import { z } from "zod";

/**
 * Persona Schema
 * 
 * This defines the structure for FINDOM personas
 * Each persona represents a unique identity with its own behavior settings,
 * chat history, content, and performance metrics.
 */

// Base persona schema
export const personaSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().default(true),
  
  // Customizable behavior settings
  behavior: z.object({
    tone: z.string(),
    style: z.string(),
    vocabulary: z.string(),
    responsiveness: z.number().min(1).max(10),
    instructions: z.string(),
    lastUpdated: z.date(),
  }),
  
  // Performance metrics
  stats: z.object({
    totalIncome: z.number().default(0),
    messageCount: z.number().default(0),
    responseRate: z.number().default(0),
    averageResponseTime: z.number().default(0),
    contentCreated: z.number().default(0),
    contentPublished: z.number().default(0),
    conversionRate: z.number().default(0),
    lastActivity: z.date().optional(),
  }),
  
  // Autonomy settings
  autonomy: z.object({
    level: z.number().min(1).max(10).default(5),
    lastDecision: z.string().optional(),
    decisionHistory: z.array(z.string()).default([]),
    canInitiateConversation: z.boolean().default(true),
    canCreateContent: z.boolean().default(true),
  }),
});

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.string(),
  personaId: z.string(),
  sender: z.string(),
  content: z.string(),
  timestamp: z.date(),
  isFromPersona: z.boolean(),
  platform: z.string(),
  clientId: z.string().optional(),
  metrics: z.object({
    sentiment: z.number().optional(),
    engagementScore: z.number().optional(),
    conversionIntent: z.number().optional(),
  }).optional(),
});

// Content item schema
export const contentItemSchema = z.object({
  id: z.string(),
  personaId: z.string(),
  title: z.string(),
  content: z.string(),
  contentType: z.enum(["post", "story", "message", "promotion"]),
  platform: z.string(),
  status: z.enum(["draft", "pending", "published", "rejected"]).default("draft"),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  metrics: z.object({
    views: z.number().default(0),
    likes: z.number().default(0),
    comments: z.number().default(0),
    conversions: z.number().default(0),
    revenue: z.number().default(0),
  }),
});

// Behavior update schema
export const behaviorUpdateSchema = z.object({
  id: z.string(),
  personaId: z.string(),
  previousInstructions: z.string(),
  newInstructions: z.string(),
  timestamp: z.date(),
  appliedBy: z.string(),
  status: z.enum(["pending", "applied", "rejected"]).default("pending"),
});

// Types
export type Persona = z.infer<typeof personaSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ContentItem = z.infer<typeof contentItemSchema>;
export type BehaviorUpdate = z.infer<typeof behaviorUpdateSchema>;

// Creation schemas (omitting auto-generated fields)
export const createPersonaSchema = personaSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreatePersona = z.infer<typeof createPersonaSchema>;

export const createChatMessageSchema = chatMessageSchema.omit({ id: true, timestamp: true });
export type CreateChatMessage = z.infer<typeof createChatMessageSchema>;

export const createContentItemSchema = contentItemSchema.omit({ id: true, createdAt: true });
export type CreateContentItem = z.infer<typeof createContentItemSchema>;

export const createBehaviorUpdateSchema = behaviorUpdateSchema.omit({ id: true, timestamp: true });
export type CreateBehaviorUpdate = z.infer<typeof createBehaviorUpdateSchema>;