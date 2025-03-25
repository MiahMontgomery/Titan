import { Request, Response } from 'express';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { 
  doc, getDoc, setDoc, updateDoc, collection, addDoc, 
  serverTimestamp, query, where, orderBy, limit, getDocs 
} from 'firebase/firestore';
import { db } from '../client/src/lib/firebase';
import { WebSocketServer } from 'ws';
import { Feature, Milestone, Goal, insertFeatureSchema, insertMilestoneSchema, insertGoalSchema } from '../shared/schema';

// Create an OpenAI client instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Reference to the WebSocket server for live streaming of thinking process
let wss: WebSocketServer | null = null;

// Set WebSocket server reference
export function setWebSocketServer(wsServer: WebSocketServer) {
  wss = wsServer;
}

// Chat history storage for context
const chatHistories: Record<number, ChatCompletionMessageParam[]> = {};

// Firestore collections
const projectsCollection = collection(db, 'projects');
const featuresCollection = collection(db, 'features');
const milestonesCollection = collection(db, 'milestones');
const goalsCollection = collection(db, 'goals');
const chatHistoryCollection = collection(db, 'chat_histories');

// Function to check if a message is a project generation request
function isProjectGenerationRequest(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  return (
    (lowerMsg.includes('create') || lowerMsg.includes('build') || lowerMsg.includes('make') || lowerMsg.includes('develop')) && 
    (lowerMsg.includes('project') || lowerMsg.includes('app') || lowerMsg.includes('application') || lowerMsg.includes('website'))
  );
}

// Function to check if a message is asking about features or requirements
function isFeatureRequest(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  return (
    (lowerMsg.includes('what features') || lowerMsg.includes('add feature') || lowerMsg.includes('new feature') || lowerMsg.includes('implement')) &&
    !lowerMsg.includes('how to')
  );
}

// Function to parse feature request from AI response
async function processFeatureRequest(
  message: string, 
  response: string, 
  projectId: number
): Promise<void> {
  if (!wss) return;
  
  // Notify clients that we're thinking about features
  broadcastThinking(projectId, 'Analyzing feature request...');
  
  try {
    // Get project details
    const projectDocRef = doc(projectsCollection, projectId.toString());
    const projectDoc = await getDoc(projectDocRef);
    
    if (!projectDoc.exists()) {
      broadcastThinking(projectId, 'Could not find project. Please create a project first.');
      return;
    }
    
    // Create a feature extraction prompt
    const featureExtractionPrompt = `
    Based on this conversation:
    
    User: ${message}
    Assistant: ${response}
    
    Extract a list of distinct, specific features that were mentioned or requested. 
    For each feature, provide:
    1. A clear, concise name (max 5 words)
    2. A detailed description
    3. An estimated completion time in days
    
    Format your response as valid JSON like this:
    [
      {
        "name": "Feature name",
        "description": "Detailed feature description",
        "estimatedDays": 3
      }
    ]
    
    Only include features, not general project requirements or questions. If no specific features were mentioned, return an empty array.
    `;
    
    broadcastThinking(projectId, 'Identifying features from the request...');
    
    // Extract features using AI
    const featuresCompletion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: featureExtractionPrompt }],
      max_tokens: 2000,
      temperature: 0.3,
    });
    
    const featuresResponse = featuresCompletion.choices[0]?.message?.content || "[]";
    
    // Try to parse the JSON response
    let features;
    try {
      features = JSON.parse(featuresResponse);
    } catch (e) {
      console.error("Failed to parse features JSON:", e);
      features = [];
    }
    
    if (!Array.isArray(features) || features.length === 0) {
      broadcastThinking(projectId, 'No specific features were identified in the request.');
      return;
    }
    
    // For each feature, create it and then generate milestones
    for (const feature of features) {
      broadcastThinking(projectId, `Creating feature: ${feature.name}...`);
      
      // Calculate progress as 0 initially
      const progress = 0;
      
      // Create the feature in Firestore
      const newFeature: Omit<Feature, "id"> = {
        name: feature.name,
        description: feature.description,
        projectId: projectId,
        progress: progress,
        isWorking: false,
        estimatedDays: feature.estimatedDays || 5, // Default to 5 days if not provided
        createdAt: new Date(),
      };
      
      // Add to Firestore
      const featureSnapshot = await getDocs(featuresCollection);
      const featureId = featureSnapshot.size > 0 
        ? Math.max(...featureSnapshot.docs.map(doc => parseInt(doc.id))) + 1 
        : 0;
      
      await setDoc(doc(featuresCollection, featureId.toString()), {
        ...newFeature,
        createdAt: serverTimestamp(),
      });
      
      // Create milestones for this feature
      broadcastThinking(projectId, `Generating milestones for feature: ${feature.name}...`);
      
      const milestonePrompt = `
      For this feature in our project:
      
      Feature: "${feature.name}"
      Description: "${feature.description}"
      
      Generate 3-5 sequential milestones needed to complete this feature. For each milestone:
      1. Provide a clear, specific name
      2. Write a detailed description of what needs to be done
      3. Estimate the percentage of the overall feature this milestone represents (the total should be 100%)
      
      Format your response as valid JSON like this:
      [
        {
          "name": "Milestone name",
          "description": "Detailed milestone description",
          "percentOfFeature": 25
        }
      ]
      
      Ensure the milestones are practical, specific development tasks that build upon each other.
      `;
      
      // Extract milestones using AI
      const milestonesCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: milestonePrompt }],
        max_tokens: 2000,
        temperature: 0.3,
      });
      
      const milestonesResponse = milestonesCompletion.choices[0]?.message?.content || "[]";
      
      // Try to parse the JSON response
      let milestones;
      try {
        milestones = JSON.parse(milestonesResponse);
        if (!Array.isArray(milestones)) throw new Error("Not an array");
      } catch (e) {
        console.error("Failed to parse milestones JSON:", e);
        continue; // Skip to the next feature if we can't parse milestones
      }
      
      // Create each milestone
      for (const milestone of milestones) {
        broadcastThinking(projectId, `Creating milestone: ${milestone.name}...`);
        
        // Create the milestone in Firestore
        const newMilestone: Omit<Milestone, "id"> = {
          name: milestone.name,
          description: milestone.description,
          featureId: featureId,
          progress: 0,
          estimatedHours: 0,
          percentOfFeature: milestone.percentOfFeature || 20,
          createdAt: new Date(),
        };
        
        // Add to Firestore
        const milestoneSnapshot = await getDocs(milestonesCollection);
        const milestoneId = milestoneSnapshot.size > 0 
          ? Math.max(...milestoneSnapshot.docs.map(doc => parseInt(doc.id))) + 1 
          : 0;
        
        await setDoc(doc(milestonesCollection, milestoneId.toString()), {
          ...newMilestone,
          createdAt: serverTimestamp(),
        });
        
        // Generate goals for this milestone
        broadcastThinking(projectId, `Generating specific goals for milestone: ${milestone.name}...`);
        
        const goalPrompt = `
        For this milestone in our feature:
        
        Milestone: "${milestone.name}"
        Description: "${milestone.description}"
        
        Generate 2-4 specific, actionable goals (tasks) needed to complete this milestone. For each goal:
        1. Provide a clear, specific name
        2. Write a detailed description of what needs to be done
        3. Estimate the percentage of the milestone this goal represents (the total should be 100%)
        
        Format your response as valid JSON like this:
        [
          {
            "name": "Goal name",
            "description": "Detailed goal description",
            "percentOfMilestone": 30
          }
        ]
        
        Ensure the goals are specific, actionable development tasks that a developer could implement directly.
        `;
        
        // Extract goals using AI
        const goalsCompletion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [{ role: "user", content: goalPrompt }],
          max_tokens: 2000,
          temperature: 0.3,
        });
        
        const goalsResponse = goalsCompletion.choices[0]?.message?.content || "[]";
        
        // Try to parse the JSON response
        let goals;
        try {
          goals = JSON.parse(goalsResponse);
          if (!Array.isArray(goals)) throw new Error("Not an array");
        } catch (e) {
          console.error("Failed to parse goals JSON:", e);
          continue; // Skip to the next milestone if we can't parse goals
        }
        
        // Create each goal
        for (const goal of goals) {
          broadcastThinking(projectId, `Creating goal: ${goal.name}...`);
          
          // Create the goal in Firestore
          const newGoal: Omit<Goal, "id"> = {
            name: goal.name,
            description: goal.description,
            milestoneId: milestoneId,
            completed: false,
            percentOfMilestone: goal.percentOfMilestone || 25,
            progress: 0,
            createdAt: new Date(),
          };
          
          // Add to Firestore
          const goalSnapshot = await getDocs(goalsCollection);
          const goalId = goalSnapshot.size > 0 
            ? Math.max(...goalSnapshot.docs.map(doc => parseInt(doc.id))) + 1 
            : 0;
          
          await setDoc(doc(goalsCollection, goalId.toString()), {
            ...newGoal,
            createdAt: serverTimestamp(),
          });
        }
      }
      
      // Create an activity log for the feature creation
      const logData = {
        projectId: projectId,
        message: `Created feature: ${feature.name} with ${milestones.length} milestones`,
        timestamp: new Date(),
        agentId: "ai-assistant",
        codeSnippet: null,
      };
      
      const logSnapshot = await getDocs(collection(db, "activity_logs"));
      const logId = logSnapshot.size > 0 
        ? Math.max(...logSnapshot.docs.map(doc => parseInt(doc.id))) + 1 
        : 0;
      
      await setDoc(doc(collection(db, "activity_logs"), logId.toString()), {
        ...logData,
        timestamp: serverTimestamp(),
      });
    }
    
    broadcastThinking(projectId, `Successfully created ${features.length} features with milestones and goals!`);
    
  } catch (error) {
    console.error('Error processing feature request:', error);
    broadcastThinking(projectId, 'Error processing feature request. Please try again.');
  }
}

// Function to send thinking updates through WebSocket
function broadcastThinking(projectId: number, message: string): void {
  if (!wss) return;
  
  const thinkingMessage = {
    type: 'thinking',
    projectId: projectId,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(thinkingMessage));
    }
  });
}

// Function to save chat message and response to Firebase
async function saveChatToFirebase(
  projectId: number, 
  userMessage: string, 
  aiResponse: string, 
  codeSnippet: string | null
): Promise<void> {
  try {
    const chatRef = collection(db, `chat_histories/${projectId}/messages`);
    const timestamp = serverTimestamp();
    
    // Save user message
    await addDoc(chatRef, {
      role: 'user',
      content: userMessage,
      timestamp: timestamp
    });
    
    // Save AI response
    await addDoc(chatRef, {
      role: 'assistant',
      content: aiResponse,
      codeSnippet: codeSnippet,
      timestamp: timestamp
    });
    
  } catch (error) {
    console.error('Error saving chat to Firebase:', error);
  }
}

// AI Chat handler that processes user messages using OpenAI's GPT-4 Turbo
export async function handleChatMessage(req: Request, res: Response) {
  try {
    const { message, projectId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }
    
    // Parse projectId to number if it's a string
    const projectIdNum = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
    
    if (isNaN(projectIdNum) || projectIdNum < 0) {
      return res.status(400).json({ error: 'Project ID is required and must be a valid number' });
    }
    
    console.log(`Received chat message for project ${projectIdNum}: ${message}`);
    
    // Start sending thinking updates if this looks like a project or feature request
    if (isProjectGenerationRequest(message) || isFeatureRequest(message)) {
      broadcastThinking(projectIdNum, 'Analyzing your request...');
    }
    
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
    
    // Try to load existing chat history from Firebase
    let projectDetails;
    try {
      const projectDocRef = doc(projectsCollection, projectIdNum.toString());
      const projectDoc = await getDoc(projectDocRef);
      projectDetails = projectDoc.exists() ? projectDoc.data() : { name: "New Project" };
    } catch (error) {
      console.error("Error fetching project details:", error);
      projectDetails = { name: "Unknown Project" };
    }
    
    // Initialize chat history for this project if it doesn't exist
    if (!chatHistories[projectIdNum]) {
      chatHistories[projectIdNum] = [
        {
          role: "system",
          content: `You are Titan, an AI-powered assistant for the Titan project management system, focused on helping with project planning, coding, and debugging.
          
Current project context: ${projectDetails?.name || `Project ID ${projectIdNum}`}

Your capabilities:
1. Project Management:
   - Analyze project requirements and break them down into features, milestones, and goals
   - Estimate completion times for different tasks
   - Provide technical architecture recommendations

2. Coding & Development:
   - Write, debug, and optimize code in various languages (JavaScript, TypeScript, Python, etc.)
   - Implement specific features requested by the user
   - Generate complete components or functions
   - Provide step-by-step implementation plans
   
3. Guidance & Explanation:
   - Explain technical concepts clearly and concisely
   - Answer questions about development best practices
   - Recommend technologies and approaches for specific problems
   - Provide explanations for how code works or why certain decisions are made

Important guidelines:
- Always be constructive and helpful
- When providing code snippets, embed them directly in your response using markdown code blocks
- If you're extensively modifying code, return both your explanation and the complete updated code
- Provide detailed, actionable advice that the user can implement immediately
- Ask clarifying questions if the user's request is ambiguous`
        } as ChatCompletionMessageParam
      ];
      
      // Try to load previous messages from Firebase
      try {
        broadcastThinking(projectIdNum, 'Retrieving conversation history...');
        
        const chatRef = collection(db, `chat_histories/${projectIdNum}/messages`);
        const q = query(chatRef, orderBy('timestamp', 'desc'), limit(10));
        const chatDocs = await getDocs(q);
        
        if (!chatDocs.empty) {
          const messages = chatDocs.docs.map(doc => {
            const data = doc.data();
            return {
              role: data.role,
              content: data.content
            } as ChatCompletionMessageParam;
          }).reverse();
          
          // Add past messages after the system message
          chatHistories[projectIdNum] = [
            chatHistories[projectIdNum][0],
            ...messages
          ];
        }
      } catch (error) {
        console.error("Error loading chat history from Firebase:", error);
      }
    }
    
    // Add the user message to chat history
    chatHistories[projectIdNum].push({
      role: "user",
      content: message
    } as ChatCompletionMessageParam);
    
    // Keep only the last 15 messages to avoid exceeding token limits
    if (chatHistories[projectIdNum].length > 15) {
      // Always keep the system message at index 0
      chatHistories[projectIdNum] = [
        chatHistories[projectIdNum][0],
        ...chatHistories[projectIdNum].slice(-14)
      ];
    }
    
    let response;
    let codeSnippet = null;
    
    // If this is a feature or project request, send more thinking updates
    if (isProjectGenerationRequest(message) || isFeatureRequest(message)) {
      broadcastThinking(projectIdNum, 'Formulating detailed response...');
    }
    
    try {
      // For feature or project requests, use a more structured approach
      if (isFeatureRequest(message)) {
        broadcastThinking(projectIdNum, 'Analyzing feature requirements...');
      } else if (isProjectGenerationRequest(message)) {
        broadcastThinking(projectIdNum, 'Analyzing project requirements...');
      }
      
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
      
      // Save the chat to Firebase
      saveChatToFirebase(projectIdNum, message, response, codeSnippet);
      
      // If this is a feature request, process it in the background
      if (isFeatureRequest(message)) {
        // Don't await this - let it run in the background
        processFeatureRequest(message, response, projectIdNum);
      }
      
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