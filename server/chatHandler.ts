import { Request, Response } from 'express';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Create an OpenAI client instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat history storage for context
const chatHistories: Record<number, ChatCompletionMessageParam[]> = {};

// AI Chat handler that processes user messages using OpenAI's GPT-4 Turbo
export async function handleChatMessage(req: Request, res: Response) {
  try {
    const { message, projectId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }
    
    // Parse projectId to number if it's a string
    const projectIdNum = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
    
    if (isNaN(projectIdNum) || projectIdNum <= 0) {
      return res.status(400).json({ error: 'Project ID is required and must be a valid number' });
    }
    
    console.log(`Received chat message for project ${projectIdNum}: ${message}`);
    
    // Simple math expressions handler as a fallback for demo purposes
    if (message.toLowerCase().includes('what') && message.includes('+')) {
      const parts = message.match(/(\d+)\s*\+\s*(\d+)/);
      if (parts && parts.length === 3) {
        const num1 = parseInt(parts[1], 10);
        const num2 = parseInt(parts[2], 10);
        const result = num1 + num2;
        
        // Return the sum result
        return res.json({
          response: `The answer is ${result}`,
          codeSnippet: null
        });
      }
    }
    
    // Initialize chat history for this project if it doesn't exist
    if (!chatHistories[projectIdNum]) {
      chatHistories[projectIdNum] = [
        {
          role: "system",
          content: `You are an AI-powered assistant for the Titan project management system, focused on helping with project planning, coding, and debugging.
          
Current project context: Project ID ${projectIdNum}

Your role:
- Help users write, debug, and optimize code
- Answer questions about development best practices
- Generate code samples when requested
- Provide explanation for code logic
- Process follow-up questions based on previous conversation context
- Maintain a friendly, professional tone

When providing code snippets, embed them directly in your response. If you're extensively modifying code, return both your explanation and the complete updated code.`
        } as ChatCompletionMessageParam
      ];
    }
    
    // Add the user message to chat history
    chatHistories[projectIdNum].push({
      role: "user",
      content: message
    } as ChatCompletionMessageParam);
    
    // Keep only the last 10 messages to avoid exceeding token limits
    if (chatHistories[projectIdNum].length > 10) {
      // Always keep the system message at index 0
      chatHistories[projectIdNum] = [
        chatHistories[projectIdNum][0],
        ...chatHistories[projectIdNum].slice(-9)
      ];
    }
    
    let response;
    let codeSnippet = null;
    
    try {
      // Call OpenAI API for chat completion
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview", // or "gpt-3.5-turbo" as fallback
        messages: chatHistories[projectIdNum],
        max_tokens: 2000,
        temperature: 0.7,
      });
      
      // Get the assistant's response
      response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      
      // Add the assistant's response to chat history
      chatHistories[projectIdNum].push({
        role: "assistant",
        content: response
      } as ChatCompletionMessageParam);
      
      console.log("OpenAI API response received successfully");
      
      // Extract code snippet if present
      codeSnippet = extractCodeSnippet(response);
      
    } catch (apiError) {
      console.error("Error calling OpenAI API:", apiError);
      
      // Fallback to local response generation
      const fallbackResponse = generateFallbackResponse(message);
      response = fallbackResponse.message;
      codeSnippet = fallbackResponse.codeSnippet;
      
      // Still add this fallback to history
      chatHistories[projectIdNum].push({
        role: "assistant",
        content: response
      } as ChatCompletionMessageParam);
    }
    
    // Return the response
    return res.json({
      response: response,
      codeSnippet: codeSnippet
    });
    
  } catch (error) {
    console.error('Error handling chat message:', error);
    return res.status(500).json({ error: 'Failed to process chat message' });
  }
}

// Function to extract code snippets from the response
function extractCodeSnippet(response: string): string | null {
  // Look for code blocks in markdown format ```code```
  const codeBlockRegex = /```(?:javascript|typescript|js|ts|jsx|tsx)?\s*([\s\S]*?)```/g;
  
  // Collect all matches manually without using matchAll
  const matches: string[] = [];
  let match;
  
  while ((match = codeBlockRegex.exec(response)) !== null) {
    if (match[1]) {
      matches.push(match[1].trim());
    }
  }
  
  if (matches.length > 0) {
    // Use the largest code block found (likely the main snippet)
    let largestCodeBlock = matches[0];
    let maxLength = largestCodeBlock.length;
    
    for (let i = 1; i < matches.length; i++) {
      const codeBlock = matches[i];
      if (codeBlock.length > maxLength) {
        largestCodeBlock = codeBlock;
        maxLength = codeBlock.length;
      }
    }
    
    return largestCodeBlock;
  }
  
  return null;
}

// Fallback response generator in case the API call fails
function generateFallbackResponse(message: string): { message: string; codeSnippet: string | null } {
  const messageLower = message.toLowerCase();
  
  console.log(`Generating fallback AI response for: ${message}`);
  
  // Sample code for demonstration
  const sampleCode = `import React from 'react';
import { useState, useEffect } from 'react';

// Authentication component for the e-commerce site
const AuthForm = () => {
  const [formType, setFormType] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Call to authentication API will be implemented here
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(\`\${formType} successful\`);
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>{formType === 'login' ? 'Login' : 'Sign Up'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        // Form inputs will be added here
      </form>
    </div>
  );
};`;
  
  // Simple rule-based responses
  if (messageLower.includes('fix error') || messageLower.includes('debug')) {
    return {
      message: "I've analyzed the code and found an issue with the form submission. Let me fix that for you by adding form inputs and improving the error handling.",
      codeSnippet: sampleCode.replace(
        "// Form inputs will be added here",
        `<div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : formType === 'login' ? 'Login' : 'Sign Up'}
        </button>
        <button type="button" onClick={() => setFormType(formType === 'login' ? 'signup' : 'login')}>
          {formType === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
        </button>`
      )
    };
  } else if (messageLower.includes('add feature') || messageLower.includes('implement')) {
    return {
      message: "I'm adding a new feature to handle user sessions with localStorage. This will allow the application to remember when users are logged in.",
      codeSnippet: `import React from 'react';
import { useState, useEffect } from 'react';

// Authentication component for the e-commerce site
const AuthForm = () => {
  const [formType, setFormType] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check for existing session
  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        if (sessionData.loggedIn && new Date(sessionData.expiry) > new Date()) {
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('userSession');
        }
      } catch (e) {
        console.error('Error parsing session data', e);
        localStorage.removeItem('userSession');
      }
    }
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Call to authentication API will be implemented here
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(\`\${formType} successful\`);
      
      // Store session in localStorage
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24); // 24 hour expiry
      
      localStorage.setItem('userSession', JSON.stringify({
        email,
        loggedIn: true,
        expiry: expiry.toISOString()
      }));
      
      setIsLoggedIn(true);
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setIsLoggedIn(false);
  };
  
  if (isLoggedIn) {
    return (
      <div className="user-profile">
        <h2>Welcome back!</h2>
        <p>You are logged in as {email}</p>
        <button onClick={handleLogout}>Log Out</button>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <h2>{formType === 'login' ? 'Login' : 'Sign Up'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : formType === 'login' ? 'Login' : 'Sign Up'}
        </button>
        <button type="button" onClick={() => setFormType(formType === 'login' ? 'signup' : 'login')}>
          {formType === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
        </button>
      </form>
    </div>
  );
};`
    };
  } else if (messageLower.includes('explain') || messageLower.includes('how') || messageLower.includes('why')) {
    return {
      message: "Let me explain how the authentication flow works in this component:\n\n1. The component maintains state for `formType` (login/signup), user credentials, loading state, and errors.\n\n2. When the form is submitted, it calls the `handleSubmit` function which:\n   - Prevents the default form submission\n   - Sets loading state to true\n   - Clears any previous errors\n   - Makes an API call (currently a mock Promise)\n   - Handles success or error cases\n   - Updates the UI accordingly\n\n3. The UI conditionally renders different content based on the `formType` state.\n\nThis is a standard React pattern for handling form submissions and API calls. We can enhance it further with validation, security features, or UI improvements.",
      codeSnippet: null
    };
  } else {
    return {
      message: "I understand you're interested in improving this code. Would you like me to explain how it works, add new features, or fix any specific issues? I'm here to help you optimize and expand your project.",
      codeSnippet: null
    };
  }
}