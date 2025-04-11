import OpenAI from "openai";

// Initialize OpenAI client with API key from environment
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Get API key for a specific project (for turbo mode)
export function getProjectApiKey(projectId: number | null, isTurbo: boolean): string {
  // First check for project-specific API key if turbo is enabled
  if (isTurbo && projectId) {
    const turboKey = process.env[`OPENAI_API_KEY_PROJECT_${projectId}`];
    if (turboKey) return turboKey;
  }
  
  // Fallback to default API key
  return process.env.OPENAI_API_KEY || "";
}

// Create a new OpenAI client with a specific API key
export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

// Function to generate text completion
export async function generateCompletion(
  prompt: string, 
  model: string = "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
  maxTokens: number = 1000,
  temperature: number = 0.7,
  apiKey?: string
): Promise<string> {
  try {
    const client = apiKey ? createOpenAIClient(apiKey) : openai;
    
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    });
    
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate completion: ${error.message}`);
  }
}

// Function to analyze data with structured output
export async function analyzeData(
  prompt: string,
  data: any,
  model: string = "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
  apiKey?: string
): Promise<any> {
  try {
    const client = apiKey ? createOpenAIClient(apiKey) : openai;
    
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a data analysis assistant. Analyze the provided data and respond with JSON.",
        },
        {
          role: "user",
          content: `${prompt}\n\nData: ${JSON.stringify(data)}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to analyze data: ${error.message}`);
  }
}
