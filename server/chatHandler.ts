import { Request, Response } from 'express';

// Simple chat handler that processes user messages and returns simulated AI responses
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
    
    // Simple math expressions handler for demo purposes
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
    
    // Process the message and generate a response
    const response = generateAIResponse(message);
    
    // Simulate a delay for realistic response timing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return the response
    return res.json({
      response: response.message,
      codeSnippet: response.codeSnippet
    });
  } catch (error) {
    console.error('Error handling chat message:', error);
    return res.status(500).json({ error: 'Failed to process chat message' });
  }
}

// Function to generate AI responses based on user input
function generateAIResponse(message: string): { message: string; codeSnippet: string | null } {
  const messageLower = message.toLowerCase();
  
  console.log(`Generating AI response for: ${message}`);
  
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