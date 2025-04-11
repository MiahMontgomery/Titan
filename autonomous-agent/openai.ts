import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// Initialize OpenAI client with API key from environment variable
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY 
});

/**
 * Generate text completion using OpenAI
 */
async function generateCompletion(prompt: string, options: {
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonResponse?: boolean;
} = {}): Promise<string> {
  const {
    systemPrompt = "You are a helpful AI assistant.",
    model = "gpt-4o",
    temperature = 0.7,
    maxTokens = 2000,
    jsonResponse = false
  } = options;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ];

    const completionOptions: any = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (jsonResponse) {
      completionOptions.response_format = { type: "json_object" };
    }

    const response = await openai.chat.completions.create(completionOptions);

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Analyze sentiment of text
 */
async function analyzeSentiment(text: string): Promise<{
  rating: number,
  confidence: number
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating from 1 to 5 stars and a confidence score between 0 and 1. Respond with JSON in this format: { 'rating': number, 'confidence': number }",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      rating: Math.max(1, Math.min(5, Math.round(result.rating || 3))),
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
    };
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    throw new Error(`Failed to analyze sentiment: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate structured data from unstructured input
 */
async function generateStructuredData(input: string, schema: {
  description: string;
  example: object;
}): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You extract structured data from unstructured input. 
          Output format should match this schema: ${JSON.stringify(schema.example)}
          Description: ${schema.description}`
        },
        {
          role: "user",
          content: input
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Data structuring error:", error);
    throw new Error(`Failed to generate structured data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate suggestions based on project context
 */
async function generateProjectSuggestions(projectType: string, context: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a project management AI assistant. Generate useful suggestions and next steps for projects based on their type and context."
        },
        {
          role: "user",
          content: `Generate 3-5 actionable suggestions for a ${projectType} project with the following context: ${context}`
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return Array.isArray(result.suggestions) ? result.suggestions : [];
  } catch (error) {
    console.error("Suggestions generation error:", error);
    throw new Error(`Failed to generate project suggestions: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Analyze web content
 */
async function analyzeWebContent(content: string, url: string): Promise<{
  summary: string;
  keyPoints: string[];
  sentiment: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a web content analysis expert. Provide a concise summary, key points, and sentiment analysis of web content."
        },
        {
          role: "user",
          content: `Analyze the following content from ${url}:\n\n${content}`
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Web content analysis error:", error);
    throw new Error(`Failed to analyze web content: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Export the OpenAI client and utility functions
export {
  openai,
  generateCompletion,
  analyzeSentiment,
  generateStructuredData,
  generateProjectSuggestions,
  analyzeWebContent
};
