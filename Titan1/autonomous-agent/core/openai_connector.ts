/**
 * OpenAI Connector
 * 
 * This component handles all interactions with OpenAI's API, including:
 * - Text generation for planning and analysis
 * - Code generation
 * - Code review and improvements
 * - Error analysis
 */

import OpenAI from 'openai';
import config from '../config';

export interface AIStatus {
  available: boolean;
  message?: string;
}

export interface CodeGenerationParams {
  prompt: string;
  language: string;
  existingCode?: string;
  constraints?: string[];
  maxTokens?: number;
}

export interface CodeGenerationResult {
  code: string;
  explanation: string;
  suggestedTests?: string[];
  potentialIssues?: string[];
}

export interface FunctionSpec {
  name: string;
  description: string;
  parameters: any;
  returnType: string;
}

export class OpenAIConnector {
  private client: OpenAI;
  private baseModel: string = 'gpt-4o'; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  private codeModel: string = 'gpt-4o'; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  
  constructor() {
    // Initialize the OpenAI client with the API key from config
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      organization: config.openai.organization,
    });
    
    // Use configured models if provided
    this.baseModel = config.openai.model;
    this.codeModel = config.openai.model;
    
    if (!config.openai.apiKey) {
      console.warn('OpenAI API key not found in environment variables');
    }
  }
  
  /**
   * Check if the OpenAI service is available
   */
  public async checkStatus(): Promise<AIStatus> {
    if (!config.openai.apiKey) {
      return {
        available: false,
        message: 'API key not configured'
      };
    }
    
    try {
      // Make a small request to check if the API is responding
      await this.client.models.list();
      
      return {
        available: true,
        message: 'OpenAI API is available'
      };
    } catch (error: any) {
      return {
        available: false,
        message: `Connection error: ${error.message || error}`
      };
    }
  }
  
  /**
   * Generate a text response from OpenAI
   */
  public async generateResponse(prompt: string, maxTokens: number = 1000): Promise<string> {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.baseModel,
        messages: [
          { role: 'system', content: 'You are an expert software engineer assistant. Provide clear, concise, and accurate responses.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.2, // More deterministic outputs
      });
      
      return response.choices[0].message.content?.trim() || '';
    } catch (error: any) {
      throw new Error(`Failed to generate response: ${error.message || error}`);
    }
  }
  
  /**
   * Generate code based on specifications
   */
  public async generateCode(params: CodeGenerationParams): Promise<CodeGenerationResult> {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    const constraintsText = params.constraints ? 
      `\n\nAdditional constraints:\n${params.constraints.map(c => `- ${c}`).join('\n')}` : '';
    
    const existingCodeText = params.existingCode ?
      `\n\nExisting code to modify or extend:\n\`\`\`${params.language}\n${params.existingCode}\n\`\`\`` : '';
    
    const systemPrompt = `
      You are an expert software developer specializing in ${params.language} development.
      Generate high-quality, production-ready code based on the requirements.
      Focus on creating clean, efficient, and well-documented code.
      
      Your response should include:
      1. The complete code implementation
      2. A brief explanation of your implementation
      3. Suggestions for testing (optional)
      4. Potential issues or edge cases to consider (optional)
      
      Format your response as follows:
      
      ## Implementation
      \`\`\`${params.language}
      // Your code here
      \`\`\`
      
      ## Explanation
      Brief explanation of the implementation.
      
      ## Testing Suggestions (optional)
      - Test suggestion 1
      - Test suggestion 2
      
      ## Potential Issues (optional)
      - Potential issue 1
      - Potential issue 2
    `;
    
    const userPrompt = `
      ${params.prompt}${existingCodeText}${constraintsText}
    `;
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.codeModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: params.maxTokens || 2000,
        temperature: 0.2, // More deterministic outputs for code
      });
      
      const content = response.choices[0].message.content?.trim() || '';
      
      // Parse the response to extract code, explanation, and optional sections
      return this.parseCodeResponse(content, params.language);
    } catch (error: any) {
      throw new Error(`Failed to generate code: ${error.message || error}`);
    }
  }
  
  /**
   * Parse the code generation response into structured parts
   */
  private parseCodeResponse(content: string, language: string): CodeGenerationResult {
    // Default result structure
    const result: CodeGenerationResult = {
      code: '',
      explanation: '',
      suggestedTests: [],
      potentialIssues: []
    };
    
    // Extract code
    const codeRegex = new RegExp(`\`\`\`(?:${language})?([\\s\\S]*?)\`\`\``, 'i');
    const codeMatch = content.match(codeRegex);
    if (codeMatch && codeMatch[1]) {
      result.code = codeMatch[1].trim();
    } else {
      // Fallback: try to find any code block
      const fallbackCodeMatch = content.match(/```([\s\S]*?)```/);
      if (fallbackCodeMatch && fallbackCodeMatch[1]) {
        result.code = fallbackCodeMatch[1].trim();
      }
    }
    
    // Extract explanation
    const explanationMatch = content.match(/## Explanation([\s\S]*?)(?:##|$)/);
    if (explanationMatch && explanationMatch[1]) {
      result.explanation = explanationMatch[1].trim();
    } else {
      // Fallback: use everything after the code block as explanation
      const codeEndIndex = content.lastIndexOf('```') + 3;
      if (codeEndIndex < content.length) {
        result.explanation = content.substring(codeEndIndex).trim();
      }
    }
    
    // Extract testing suggestions
    const testsMatch = content.match(/## Testing Suggestions([\s\S]*?)(?:##|$)/);
    if (testsMatch && testsMatch[1]) {
      result.suggestedTests = testsMatch[1].split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.substring(1).trim());
    }
    
    // Extract potential issues
    const issuesMatch = content.match(/## Potential Issues([\s\S]*?)(?:##|$)/);
    if (issuesMatch && issuesMatch[1]) {
      result.potentialIssues = issuesMatch[1].split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.substring(1).trim());
    }
    
    return result;
  }
  
  /**
   * Review and suggest improvements for existing code
   */
  public async reviewCode(code: string, language: string): Promise<string[]> {
    const prompt = `
      Review the following ${language} code and suggest improvements:
      
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Focus on:
      1. Bugs or potential issues
      2. Performance improvements
      3. Code structure and organization
      4. Best practices for ${language}
      
      Provide a list of specific, actionable suggestions.
    `;
    
    const response = await this.generateResponse(prompt);
    
    // Extract suggestions as a list
    const suggestions = response.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.match(/^\d+\./))
      .map(line => {
        // Remove bullet point or number
        return line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
      });
    
    return suggestions.length > 0 ? suggestions : [response]; // Fallback if parsing fails
  }
  
  /**
   * Analyze an error and suggest potential fixes
   */
  public async analyzeError(errorMessage: string, code: string, language: string): Promise<string[]> {
    const prompt = `
      Analyze this error and suggest potential fixes:
      
      Error Message:
      ${errorMessage}
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Provide specific, actionable suggestions to fix the issue.
      Format your response as a list of potential solutions.
    `;
    
    const response = await this.generateResponse(prompt);
    
    // Extract suggestions as a list
    const suggestions = response.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.match(/^\d+\./))
      .map(line => {
        // Remove bullet point or number
        return line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
      });
    
    return suggestions.length > 0 ? suggestions : [response]; // Fallback if parsing fails
  }
  
  /**
   * Generate unit tests for a given code
   */
  public async generateTests(code: string, language: string, framework?: string): Promise<string> {
    const frameworkText = framework ? ` using the ${framework} testing framework` : '';
    
    const prompt = `
      Generate comprehensive unit tests${frameworkText} for the following ${language} code:
      
      \`\`\`${language}
      ${code}
      \`\`\`
      
      The tests should:
      1. Cover all major functionality
      2. Include edge cases
      3. Be well-organized and documented
      4. Follow best practices for ${language} testing
      
      Provide only the test code, without additional explanations.
    `;
    
    return await this.generateResponse(prompt, 1500);
  }
  
  /**
   * Generate a function specification from description
   */
  public async generateFunctionSpec(
    description: string, 
    language: string
  ): Promise<FunctionSpec> {
    const prompt = `
      Generate a detailed function specification based on this description:
      
      "${description}"
      
      The function should be implemented in ${language}.
      
      Provide the specification in this JSON format:
      {
        "name": "functionName",
        "description": "Detailed description of what the function does",
        "parameters": [
          {
            "name": "paramName",
            "type": "paramType",
            "description": "Parameter description"
          }
        ],
        "returnType": "returnType",
        "returnDescription": "Description of the return value"
      }
    `;
    
    try {
      const completion = await this.client.chat.completions.create({
        model: this.baseModel,
        messages: [
          { role: 'system', content: 'You are an expert software engineer assistant specializing in API design.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      
      const response = completion.choices[0].message.content || '{}';
      
      return JSON.parse(response);
    } catch (error: any) {
      throw new Error(`Failed to generate function spec: ${error.message || error}`);
    }
  }
}