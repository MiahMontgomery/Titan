import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import { log, error } from './helpers';
import { broadcastThinking } from './chatHandler';

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Basic text processing with OpenAI
 * @param prompt The text prompt to send to OpenAI
 * @returns The AI-generated response
 */
export async function processText(prompt: string): Promise<string> {
  try {
    log(`Processing prompt with OpenAI: ${prompt.substring(0, 50)}...`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "No response generated";
  } catch (err: any) {
    error(`OpenAI text processing error: ${err.message}`);
    throw new Error(`OpenAI API error: ${err.message}`);
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
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    return response.choices[0].message.content || "No response generated";
  } catch (err: any) {
    error(`OpenAI chat processing error: ${err.message}`);
    throw new Error(`OpenAI API error: ${err.message}`);
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
    throw new Error(`OpenAI API error: ${err.message}`);
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
    throw new Error(`OpenAI API error: ${err.message}`);
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
    throw new Error(`OpenAI API error: ${err.message}`);
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
      `Error generating thinking process: ${err.message}`,
      null,
      [],
      true,
      false,
      personaId
    );
  }
}