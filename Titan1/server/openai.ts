import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import { log, error } from './helpers';
import { broadcastThinking } from './chatHandler';

// Create OpenAI client only if API key is available
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    // The newest OpenAI model is "gpt-4o" which was released May 13, 2024
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    log('OpenAI client initialized successfully');
  } else {
    log('No OpenAI API key found. OpenAI features will return fallback responses.');
  }
} catch (err: any) {
  error(`Failed to initialize OpenAI client: ${err.message}`);
}

/**
 * Basic text processing with OpenAI
 * @param prompt The text prompt to send to OpenAI
 * @returns The AI-generated response
 */
export async function processText(prompt: string): Promise<string> {
  try {
    log(`Processing prompt with OpenAI: ${prompt.substring(0, 50)}...`);
    
    // Check if OpenAI client is initialized
    if (!openai) {
      log('OpenAI client not available. Returning fallback response.');
      return `OpenAI processing not available. I've received your prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "No response generated";
  } catch (err: any) {
    error(`OpenAI text processing error: ${err.message}`);
    return `Error processing text: ${err.message}. Please check your API key.`;
  }
}

/**
 * Process chat messages with OpenAI
 * @param messages Array of chat messages with role and content
 * @returns The AI-generated response
 */
export async function processChat(messages: Array<ChatCompletionMessageParam>): Promise<string> {
  try {
    log(`Processing chat with OpenAI: ${messages.length} messages`);
    
    // Check if OpenAI client is initialized
    if (!openai) {
      log('OpenAI client not available. Returning fallback response.');
      const lastMessage = messages[messages.length - 1]?.content;
      const lastMessageText = typeof lastMessage === 'string' ? lastMessage : 'your message';
      return `OpenAI processing not available. I've received ${messages.length} messages, most recently: "${lastMessageText.substring(0, 100)}${lastMessageText.length > 100 ? '...' : ''}"`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    return response.choices[0].message.content || "No response generated";
  } catch (err: any) {
    error(`OpenAI chat processing error: ${err.message}`);
    return `Error processing chat: ${err.message}. Please check your API key.`;
  }
}

/**
 * Generate structured JSON data from OpenAI
 * @param prompt The text prompt to send to OpenAI
 * @param systemPrompt Optional system prompt for better context
 * @returns The JSON response from OpenAI
 */
export async function generateJsonResponse<T>(
  prompt: string, 
  systemPrompt: string = "You are a helpful assistant that provides structured JSON responses."
): Promise<T> {
  try {
    log(`Generating JSON response with OpenAI: ${prompt.substring(0, 50)}...`);
    
    // Check if OpenAI client is initialized
    if (!openai) {
      log('OpenAI client not available. Returning fallback JSON response.');
      // Create a sample JSON response as fallback
      const fallbackResponse = {
        message: "OpenAI processing not available",
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        timestamp: new Date().toISOString()
      } as unknown as T;
      return fallbackResponse;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}") as T;
    return result;
  } catch (err: any) {
    error(`OpenAI JSON generation error: ${err.message}`);
    // Return a fallback error response
    const errorResponse = {
      error: true,
      message: `Error generating JSON: ${err.message}`,
      timestamp: new Date().toISOString()
    } as unknown as T;
    return errorResponse;
  }
}

/**
 * Analyze and generate a project plan structure
 * @param projectDescription The project description to analyze
 * @returns A structured project plan
 */
export async function generateProjectPlan(projectDescription: string): Promise<{
  title: string;
  description: string;
  tasks: Array<{ 
    id: string; 
    title: string; 
    description: string; 
    status: 'todo' | 'in_progress' | 'done'; 
    priority: 'low' | 'medium' | 'high';
  }>
}> {
  const systemPrompt = `You are an expert project planner. Analyze the project description and create a structured JSON project plan with:
- A concise title
- A clear description
- A list of concrete, actionable tasks, each with:
  - A unique ID
  - A specific title
  - A descriptive explanation
  - A status (todo/in_progress/done)
  - A priority level (low/medium/high)
Format everything as a JSON object.`;

  const userPrompt = `Create a detailed project plan based on this description: ${projectDescription}`;

  return generateJsonResponse(userPrompt, systemPrompt);
}

/**
 * Analyze a website or image with OpenAI Vision
 * @param base64Image Base64-encoded image data
 * @param prompt The text prompt for image analysis
 * @returns The AI analysis of the image
 */
export async function analyzeImage(base64Image: string, prompt: string = "Analyze this image in detail"): Promise<string> {
  try {
    log('Analyzing image with OpenAI Vision');
    
    // Check if OpenAI client is initialized
    if (!openai) {
      log('OpenAI client not available. Cannot analyze image.');
      return "Image analysis not available. Please configure your OpenAI API key to analyze images.";
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
    });

    return response.choices[0].message.content || "No analysis generated";
  } catch (err: any) {
    error(`OpenAI Vision analysis error: ${err.message}`);
    return `Error analyzing image: ${err.message}. Please check your API key.`;
  }
}

/**
 * Generate an image with DALL-E 3
 * @param prompt Text prompt for image generation
 * @returns URL to the generated image
 */
export async function generateImage(prompt: string): Promise<string> {
  try {
    log(`Generating image with DALL-E: ${prompt.substring(0, 50)}...`);
    
    // Check if OpenAI client is initialized
    if (!openai) {
      log('OpenAI client not available. Cannot generate image.');
      return "Image generation not available. Please configure your OpenAI API key to generate images.";
    }
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    if (!response.data[0].url) {
      throw new Error('No image URL generated');
    }

    return response.data[0].url;
  } catch (err: any) {
    error(`DALL-E image generation error: ${err.message}`);
    return `Error generating image: ${err.message}. Please check your API key.`;
  }
}

/**
 * Generate and broadcast AI thinking steps (simulated stream)
 * @param projectId Project ID to associate the thinking with
 * @param personaId Optional persona ID for personalized thinking
 * @param prompt The prompt to think about
 * @param steps Number of thinking steps to generate
 */
export async function generateThinking(
  projectId: number,
  personaId: string | undefined,
  prompt: string,
  steps: number = 3
): Promise<void> {
  try {
    log(`Generating thinking process: ${prompt.substring(0, 50)}...`);
    
    // Check if OpenAI client is initialized
    if (!openai) {
      log('OpenAI client not available. Using simulated thinking process.');
      // Simulate thinking steps with fallback messages
      for (let i = 0; i < steps; i++) {
        const fallbackThinking = `Step ${i+1} of ${steps}: Thinking about "${prompt.substring(0, 50)}..." (OpenAI API not available)`;
        
        broadcastThinking(
          projectId,
          fallbackThinking,
          null, // code snippet
          [], // debug steps
          false, // is debugging
          true, // step by step
          personaId
        );
        
        // Wait a short time between steps for natural flow
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      broadcastThinking(
        projectId,
        "Thinking complete (OpenAI API not available). Please configure your OpenAI API key for enhanced AI thinking capabilities.",
        null,
        [],
        false,
        true,
        personaId
      );
      
      return;
    }
    
    // For each step, generate thinking and broadcast
    for (let i = 0; i < steps; i++) {
      // Create step prompt
      const stepPrompt = `You are an AI assistant explaining your thinking process step by step.
      This is step ${i+1} of ${steps} for this thinking sequence.
      Think about: ${prompt}
      
      Provide a detailed, specific explanation for this step of your thinking. Focus on one aspect only.`;
      
      // Generate content
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: stepPrompt }],
      });
      
      const thinking = response.choices[0].message.content || "Thinking...";
      
      // Broadcast thinking to clients
      broadcastThinking(
        projectId,
        thinking,
        null, // code snippet
        [], // debug steps
        false, // is debugging
        true, // step by step
        personaId
      );
      
      // Wait a short time between steps for natural flow
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    log('Thinking process generation complete');
  } catch (err: any) {
    error(`Thinking process generation error: ${err.message}`);
    broadcastThinking(
      projectId,
      `Error generating thinking process: ${err.message}. Please check your API key.`,
      null,
      [],
      true,
      false,
      personaId
    );
  }
}