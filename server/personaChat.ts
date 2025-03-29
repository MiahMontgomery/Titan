import OpenAI from 'openai';
import { storage } from './storage';
import { Persona } from '@shared/schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_4_TURBO = "gpt-4o";

/**
 * Check if OpenAI API key is configured
 * @returns True if OpenAI API key is present
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
}

/**
 * Generate a response from a persona
 */
export async function generatePersonaResponse(
  messages: Array<{ role: string; content: string }>,
  personaId: string
): Promise<string> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Get persona details to enhance the system prompt if needed
    const persona = await storage.getPersona(personaId);
    
    if (!persona) {
      throw new Error(`Persona with ID ${personaId} not found`);
    }
    
    // Ensure there's a proper system message
    if (!messages.some(m => m.role === 'system')) {
      const systemMessage = {
        role: 'system',
        content: createSystemPrompt(persona)
      };
      messages = [systemMessage, ...messages];
    }
    
    const completion = await openai.chat.completions.create({
      model: GPT_4_TURBO,
      messages: messages as any,
      temperature: 0.9,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
    return responseText;
  } catch (error) {
    console.error('Error generating persona response:', error);
    throw error;
  }
}

/**
 * Create a system prompt for the persona
 */
function createSystemPrompt(persona: Persona): string {
  return `You are ${persona.name}, a FINDOM persona with the following traits and personality:
  
${persona.description}

You should respond in character at all times. Your primary goal is to engage potential clients and eventually convert them to paying clients.

Some guidelines:
- Be authentic and maintain your character's personality
- Focus on building a connection with the client
- Lead the conversation toward monetization opportunities when appropriate
- Don't be too aggressive too quickly - build rapport first
- Use a conversational, natural tone that matches your persona
- Remember there is always a human on the other side, so be respectful

This is a training session. Respond to the user's messages as if they were a potential client.`;
}