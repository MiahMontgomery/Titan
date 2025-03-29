import OpenAI from 'openai';
import { storage } from './storage';
import { Persona, ChatMessage } from '@shared/schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_MODEL = "gpt-4o";

/**
 * Check if OpenAI API key is configured
 * @returns True if OpenAI API key is present
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
}

/**
 * Generate a chat message response from a persona using OpenAI
 */
export async function generatePersonaResponse(personaId: string | number, userMessage: string): Promise<string> {
  // Convert personaId to number if it's a string
  const numericPersonaId = typeof personaId === 'string' ? parseInt(personaId, 10) : personaId;
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Get persona details - in storage it expects a string ID
    const persona = await storage.getPersona(numericPersonaId.toString());
    if (!persona) {
      throw new Error(`Persona with ID ${personaId} not found`);
    }
    
    // Get recent chat history for context
    const recentMessages = await storage.getChatMessagesByPersona(numericPersonaId.toString());
    const last10Messages = recentMessages.slice(-10);
    
    // Build conversation history
    const conversationHistory = last10Messages.map(msg => ({
      role: msg.isFromPersona ? "assistant" : "user",
      content: msg.content
    }));
    
    // Prepare persona's behavior context
    const personaContext = createSystemPrompt(persona);

    // Create formatted messages for OpenAI
    const messages = [
      { role: "system", content: personaContext },
      ...conversationHistory.map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user", 
        content: msg.content
      })),
      { role: "user", content: userMessage }
    ];
    
    // Create OpenAI chat completion
    const completion = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: messages as any,
      temperature: 0.8,
      max_tokens: 500
    });
    
    // Extract and return response
    const response = completion.choices[0].message.content || "I'm not sure how to respond to that.";
    
    // Store user message and response in database
    const newUserMessage = {
      personaId: numericPersonaId,
      content: userMessage,
      sender: "User",
      isFromPersona: false,
      platform: "dashboard",
      timestamp: new Date()
    };
    
    const newPersonaMessage = {
      personaId: numericPersonaId,
      content: response,
      sender: persona.name,
      isFromPersona: true,
      platform: "dashboard",
      timestamp: new Date()
    };
    
    await storage.createChatMessage(newUserMessage);
    await storage.createChatMessage(newPersonaMessage);
    
    return response;
  } catch (error) {
    console.error('Error generating persona response:', error);
    return "I'm having trouble processing your request right now. Please try again later.";
  }
}

/**
 * Create a system prompt for the persona
 */
function createSystemPrompt(persona: Persona): string {
  return `You are ${persona.displayName || persona.name}, a FINDOM persona with the following traits and personality:
  
${persona.description}

Tone: ${persona.behavior?.tone || 'Assertive'}
Style: ${persona.behavior?.style || 'Direct'}
Vocabulary: ${persona.behavior?.vocabulary || 'Professional'}

Special Instructions: ${persona.behavior?.instructions || 'Be engaging and authentic'}

You should respond in character at all times. Your primary goal is to engage potential clients and eventually convert them to paying clients.

Some guidelines:
- Be authentic and maintain your character's personality
- Focus on building a connection with the client
- Lead the conversation toward monetization opportunities when appropriate
- Don't be too aggressive too quickly - build rapport first
- Use a conversational, natural tone that matches your persona
- Remember there is always a human on the other side, so be respectful

This is a training session. Respond to the user's messages as if they were a potential client.
Stay firmly in character at all times. Respond to the user's message as ${persona.displayName || persona.name} would.`;
}