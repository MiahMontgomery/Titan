import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ActivityLog } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useWebSocketContext } from '@/lib/websocket';
import { Separator } from '@/components/ui/separator';
import { WebSocketMessage } from '@/lib/types';
import { LivePreview } from '@/components/LivePreview';
import { NinjaStarSpinner } from '@/components/NinjaStarSpinner';

interface PerformanceTabProps {
  projectId: number;
}

// Define chat message types
type MessageRole = 'user' | 'agent' | 'system';

interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  codeSnippet?: string | null;
  isThinking?: boolean;
  isError?: boolean;
  isDebugging?: boolean;
  isStepByStep?: boolean;
  debugSteps?: string[];
  currentDebugStep?: number;
  canRollback?: boolean;
}

// Function to generate unique IDs for messages
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function PerformanceTab({ projectId }: PerformanceTabProps) {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [canRollback, setCanRollback] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(true);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, subscribe, connected } = useWebSocketContext();
  
  // Handle panel toggle for expansion/collapse
  const togglePanelExpansion = (panelId: string) => {
    if (expandedPanel === panelId) {
      // If clicking the already expanded panel, collapse it
      setExpandedPanel(null);
    } else {
      // Otherwise, expand the clicked panel
      setExpandedPanel(panelId);
    }
  };
  
  // Helper function to determine panel height based on expansion state
  const getPanelHeight = (panelId: string): string => {
    // When expanded, take up more space, otherwise use standard height
    if (expandedPanel === panelId) {
      return '400px'; // Expanded height
    } else if (expandedPanel === null) {
      return '250px'; // Standard height when nothing is expanded
    } else {
      return '150px'; // Reduced height when another panel is expanded
    }
  };
  
  // Fetch activity logs
  const { data: activityLogs = [] } = useQuery<ActivityLog[]>({
    queryKey: [`/api/projects/${projectId}/activity`],
    retry: 1,
  });
  
  // Real code implementation from FINDOM Legal Compliance System
  const sampleCode = `// DocumentTemplateManager.tsx - Part of FINDOM Legal and Compliance System
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient, apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { DocumentTemplate, insertDocumentTemplateSchema } from '@shared/schema';

export function DocumentTemplateManager({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const { toast } = useToast();

  // Form schema with validation
  const formSchema = insertDocumentTemplateSchema.extend({
    name: z.string().min(3, "Name must be at least 3 characters"),
    content: z.string().min(10, "Template content must be at least 10 characters"),
    description: z.string().min(5, "Please provide a brief description"),
    category: z.string().min(1, "Category is required"),
  });

  // Setup form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      content: "",
      description: "",
      category: "legal",
      projectId: projectId,
      variables: [],
      isActive: true
    }
  });

  // Reset form when opening dialog or changing editing template
  useEffect(() => {
    if (open) {
      if (editingTemplate) {
        form.reset({
          name: editingTemplate.name,
          content: editingTemplate.content,
          description: editingTemplate.description,
          category: editingTemplate.category,
          projectId: projectId,
          variables: editingTemplate.variables,
          isActive: editingTemplate.isActive
        });
      } else {
        form.reset({
          name: "",
          content: "",
          description: "",
          category: "legal",
          projectId: projectId,
          variables: [],
          isActive: true
        });
      }
    }
  }, [open, editingTemplate, form, projectId]);

  // Fetch templates for this project
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/templates', projectId],
    queryFn: async () => {
      const response = await apiRequest({
        url: \`/api/projects/\${projectId}/templates\`,
        method: 'GET'
      });
      return response.data as DocumentTemplate[];
    }
  });

  // Create new template mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest({
        url: '/api/templates',
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates', projectId] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Template has been created",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: \`Failed to create template: \${error}\`,
        variant: "destructive"
      });
    }
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema> & { id: number }) => {
      const { id, ...updateData } = data;
      return await apiRequest({
        url: \`/api/templates/\${id}\`,
        method: 'PATCH',
        data: updateData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates', projectId] });
      setOpen(false);
      setEditingTemplate(null);
      toast({
        title: "Success",
        description: "Template has been updated",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: \`Failed to update template: \${error}\`,
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingTemplate) {
      updateMutation.mutate({ ...data, id: editingTemplate.id });
    } else {
      createMutation.mutate(data);
    }
  };
  
  // Open dialog to add a new template
  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setOpen(true);
  };
  
  // Open dialog to edit an existing template
  const handleEditTemplate = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setOpen(true);
  };
}`;

  // Set up the initial code and welcome message in Replit-like style
  useEffect(() => {
    if (chatMessages.length === 0) {
      setCurrentCode(sampleCode);
      
      // Add welcome messages with Replit-like styling and Markdown formatting
      setChatMessages([
        {
          id: generateId(),
          content: "# 👋 Welcome to Titan\n\nI'm your AI development agent. I work **24/7** on your projects, constantly improving them without stopping.",
          role: 'system',
          timestamp: new Date(),
          codeSnippet: null
        },
        {
          id: generateId(),
          content: "## What I'm doing\nI'm analyzing your project and determining what to build next. I'll show you my **real-time thinking process** as I work.",
          role: 'agent',
          timestamp: new Date(),
          codeSnippet: null
        },
        {
          id: generateId(),
          content: "## Live Development in Progress\n\n**FINDOM Project Status:**\n\n- ✅ AI-Driven Interactive Experience Platform (100%)\n- ✅ Dynamic Pricing Engine (100%)\n- 🔄 AI-Driven Legal and Compliance Automation System (39%)\n- 🔄 Persona Development Suite (28%)\n- 🔄 Multi-platform Distribution System (5%)\n\nCurrently working on: **Document Template Management System** and **Persona Behavior Modeling**",
          role: 'agent',
          timestamp: new Date(),
          codeSnippet: null
        },
        {
          id: generateId(),
          content: "## How to interact with me\n- Ask me questions about the code\n- Request new features or changes\n- Give me specific instructions\n- See my thinking process in real-time\n\nI'll generate meaningful, production-ready code that you can use immediately.\n\nIf you encounter any errors, use the **Roll Back** button to restore previous versions.",
          role: 'agent',
          timestamp: new Date(),
          codeSnippet: null
        }
      ]);
    }
  }, []);
  
  // Convert activity logs to chat messages when they change
  useEffect(() => {
    if (activityLogs.length > 0) {
      const newMessages = activityLogs.map(log => {
        const isUser = log.agentId === 'user';
        return {
          id: log.id.toString(),
          content: log.message.replace(/^(User: |Agent: )/, ''),
          role: isUser ? 'user' as MessageRole : 'agent' as MessageRole,
          timestamp: new Date(log.timestamp),
          codeSnippet: log.codeSnippet
        };
      });
      
      // Don't replace existing messages if we already have them
      if (chatMessages.length === 0) {
        setChatMessages(newMessages.reverse());
      }
    }
  }, [activityLogs]);
  
  // Add new log message mutation
  const addLogMutation = useMutation({
    mutationFn: async (newLog: Omit<ActivityLog, 'id'>) => {
      return await apiRequest({ 
        method: 'POST', 
        url: '/api/activity', 
        data: newLog 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/activity`] });
    }
  });
  
  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Function to add a message to the chat
  const addChatMessage = useCallback((
    content: string, 
    role: MessageRole, 
    codeSnippet: string | null = null, 
    isThinking?: boolean, 
    isError?: boolean,
    isDebugging?: boolean,
    isStepByStep?: boolean,
    debugSteps?: string[],
    currentDebugStep?: number
  ) => {
    const newMessage: ChatMessage = {
      id: generateId(),
      content,
      role,
      timestamp: new Date(),
      codeSnippet,
      isThinking,
      isError,
      isDebugging,
      isStepByStep,
      debugSteps,
      currentDebugStep,
      canRollback: codeSnippet ? true : false
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    
    // If not a thinking message, also save to the activity log
    if (!isThinking && role !== 'system') {
      const rolePrefix = role === 'user' ? 'User: ' : 'Agent: ';
      addLogMutation.mutate({
        projectId,
        message: rolePrefix + content,
        timestamp: new Date(),
        agentId: role === 'user' ? 'user' : 'agent-1',
        codeSnippet: codeSnippet || null,
        featureId: null,
        milestoneId: null,
        activityType: isDebugging ? 'debugging' : isStepByStep ? 'explanation' : 'chat',
        details: { 
          debugSteps: debugSteps || [],
          hasRollback: codeSnippet ? true : false
        },
        isCheckpoint: false,
        thinkingProcess: null,
        urls: [],
        changes: {}
      });
    }
  }, [projectId, addLogMutation]);
  
  // Setup WebSocket subscription for chat responses and thinking updates
  useEffect(() => {
    // Subscribe to WebSocket messages
    const unsubscribe = subscribe((data: WebSocketMessage) => {
      // Handle chat responses from WebSocket
      if (data.type === 'chat-response') {
        console.log('Received chat response via WebSocket in component:', data);
        
        // Remove thinking messages
        setChatMessages(prev => prev.filter(msg => !msg.isThinking));
        setIsThinking(false);
        
        // Add the response to chat
        if (typeof data.message === 'string') {
          addChatMessage(data.message, 'agent', (data as any).codeSnippet || null);
          
          // Update code if a code snippet was provided
          if ((data as any).codeSnippet) {
            // Save current code to history for rollback
            if (currentCode) {
              setCodeHistory(prev => [...prev, currentCode]);
              setCanRollback(true);
            }
            setCurrentCode((data as any).codeSnippet);
          }
        }
      }
      
      // Handle thinking updates from the server (progressive updates)
      else if (data.type === 'thinking') {
        console.log('Received thinking update via WebSocket:', data);
        
        setIsThinking(true);
        
        // Check if we already have a thinking message
        const existingThinkingIndex = chatMessages.findIndex(m => m.isThinking);
        
        if (existingThinkingIndex >= 0) {
          // Update the existing thinking message
          const updatedMessages = [...chatMessages];
          updatedMessages[existingThinkingIndex] = {
            ...updatedMessages[existingThinkingIndex],
            content: data.message as string,
            codeSnippet: (data as any).codeSnippet || null
          };
          
          setChatMessages(updatedMessages);
        } else {
          // Add a new thinking message
          addChatMessage(
            data.message as string, 
            'agent', 
            (data as any).codeSnippet || null,
            true, // isThinking
            false, // isError
            (data as any).isDebugging || false,
            (data as any).isStepByStep || false,
            (data as any).debugSteps || [],
            (data as any).currentDebugStep || 0
          );
        }
      }
    });
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, [addChatMessage, chatMessages, currentCode, subscribe]);
  
  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !connected) return;
    
    // Add message to UI
    addChatMessage(message, 'user');
    
    // Send message to server over WebSocket
    sendMessage({
      type: 'chat-message',
      message,
      projectId
    });
    
    // Reset input
    setMessage('');
    
    // Add thinking indicator
    setIsThinking(true);
    addChatMessage(
      "```thinking\n→ Processing your request...\n```", 
      'agent', 
      null, 
      true
    );
    
    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [message, projectId, connected, addChatMessage, sendMessage]);
  
  // Function to roll back to previous code version
  const handleRollback = useCallback(() => {
    // Make sure we have history to roll back to
    if (codeHistory.length === 0) return;
    
    // Pop the most recent code from history
    const previousCode = codeHistory[codeHistory.length - 1];
    const newHistory = codeHistory.slice(0, -1);
    
    // Update state
    setCurrentCode(previousCode);
    setCodeHistory(newHistory);
    setCanRollback(newHistory.length > 0);
    
    // Add system message about rollback
    addChatMessage(
      "🔄 **Rolled back to previous version.**\n\nThe latest changes have been undone.",
      'system'
    );
    
    // Dispatch an event to notify the LivePreview component
    window.dispatchEvent(new CustomEvent('code-rollback', { 
      detail: { code: previousCode } 
    }));
  }, [codeHistory, addChatMessage]);
  
  // Function to show debugging process with steps
  const simulateDebugging = () => {
    try {
      // Sample debugging steps
      const debuggingSteps = [
        "Identified issue: Dynamic pricing formula not correctly calculating tiered discounts",
        "Investigating the discountTier function in pricing.ts",
        "Found bug in discount calculation when user crosses multiple tiers at once",
        "Fixing the calculation logic to properly account for partial tier discounts",
        "Adding comprehensive test cases to verify the fix across all tier boundaries",
        "Verified fix - All discount calculations now match expected values"
      ];
      
      // Add initial debugging message
      addChatMessage(
        "```thinking\n→ Starting debugging process...\n```",
        'agent',
        null,
        true,
        false,
        true,
        false,
        debuggingSteps,
        0
      );
      
      // Simulate progressive updates to debugging steps
      let currentStep = 0;
      
      const debugInterval = setInterval(() => {
        if (currentStep >= debuggingSteps.length) {
          clearInterval(debugInterval);
          
          // Remove thinking indicator and add final summary
          setChatMessages(prev => prev.filter(msg => !msg.isThinking));
          
          addChatMessage(
            "## 🔍 Bug Fixed: Discount Tier Calculation\n\nI found and fixed an issue in the dynamic pricing formula that was causing incorrect discount calculations when users crossed multiple tiers at once.\n\n**Changes made:**\n- Updated the discount calculation logic in `pricing.ts`\n- Added protection against negative discount values\n- Implemented proper partial tier calculations\n- Added comprehensive tests for all tier boundaries\n\nThe fix is now implemented and all test cases are passing.",
            'agent',
            `// Fixed pricing.ts discount calculation function
export function calculateTieredDiscount(amount: number, tiers: DiscountTier[]): number {
  // Sort tiers by threshold ascending
  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);
  
  // Initialize discount value
  let totalDiscount = 0;
  let remainingAmount = amount;
  let previousThreshold = 0;
  
  // Apply each tier's discount to the appropriate portion of the amount
  for (const tier of sortedTiers) {
    if (amount >= tier.threshold) {
      // Calculate the portion of the amount that falls within this tier
      const portionInTier = Math.min(
        remainingAmount,
        tier.threshold - previousThreshold
      );
      
      // Apply this tier's discount rate to the portion
      totalDiscount += portionInTier * (tier.discountRate / 100);
      
      // Update remaining amount and previous threshold
      remainingAmount -= portionInTier;
      previousThreshold = tier.threshold;
    } else {
      // Skip tiers that don't apply based on the amount
      break;
    }
  }
  
  // Apply the highest tier's discount rate to any remaining amount
  if (remainingAmount > 0 && sortedTiers.length > 0) {
    const highestTier = sortedTiers[sortedTiers.length - 1];
    totalDiscount += remainingAmount * (highestTier.discountRate / 100);
  }
  
  // Ensure discount doesn't exceed the original amount
  return Math.min(totalDiscount, amount);
}`
          );
        } else {
          // Update the debugging message with the next step
          const updatedContent = `\`\`\`thinking\n→ ${debuggingSteps.slice(0, currentStep + 1).join("\n→ ")}\n\`\`\``;
          
          // Find and update the thinking message
          setChatMessages(prev => 
            prev.map(msg => 
              msg.isThinking ? { ...msg, content: updatedContent, currentDebugStep: currentStep } : msg
            )
          );
          
          currentStep++;
        }
      }, 1000);
    } finally {
      setIsThinking(false);
    }
  };
  
  // Function to show step-by-step explanation process
  const simulateStepByStepExplanation = () => {
    // Sample explanation steps
    const explanationSteps = [
      "The FINDOM dynamic pricing engine uses a tiered approach to calculate user-specific pricing",
      "Each user's engagement level and purchase history determines their pricing tier",
      "The algorithm analyzes past behavior to predict optimal price points for maximum conversion",
      "AI-driven price adjustment occurs in real-time based on user interactions",
      "Behavioral analysis combines with market trends to identify ideal monetization strategies"
    ];
    
    // Add initial explanation message
    addChatMessage(
      "```thinking\n→ Explaining the dynamic pricing model...\n```",
      'agent',
      null,
      true,
      false,
      false, // not debugging
      true, // step by step
      explanationSteps,
      0
    );
    
    // Simulate progressive updates to explanation steps
    let currentStep = 0;
    
    const explainInterval = setInterval(() => {
      if (currentStep >= explanationSteps.length) {
        clearInterval(explainInterval);
        
        // Remove thinking indicator and add final summary
        setChatMessages(prev => prev.filter(msg => !msg.isThinking));
        
        addChatMessage(
          "## 📊 FINDOM Dynamic Pricing System Explained\n\nThe dynamic pricing engine is one of the core components that drives revenue optimization. Here's how it works:\n\n1. **User Tier Classification** - Segmentation based on engagement metrics and spending behavior\n2. **Algorithmic Price Determination** - ML model that predicts optimal price points\n3. **Real-time Adjustments** - Continuous optimization based on interaction patterns\n4. **Behavioral Analytics** - Deep pattern recognition to identify monetization opportunities\n5. **Market Trend Integration** - External data sources influence pricing strategy\n\nThis system consistently increases conversion rates by 32% compared to fixed pricing models.",
          'agent',
          null
        );
      } else {
        // Update the explanation message with the next step
        const updatedContent = `\`\`\`thinking\n→ ${explanationSteps.slice(0, currentStep + 1).join("\n→ ")}\n\`\`\``;
        
        // Find and update the thinking message
        setChatMessages(prev => 
          prev.map(msg => 
            msg.isThinking ? { ...msg, content: updatedContent, currentDebugStep: currentStep } : msg
          )
        );
        
        currentStep++;
      }
    }, 1000);
  };
  
  // Adjust textarea height as user types
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(150, textarea.scrollHeight)}px`;
    setMessage(textarea.value);
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message with Enter (without shift for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Chat interface with code panel */}
      <div className="flex flex-col h-full">
        {/* Vertical stacked layout with consistent box design */}
        
        {/* Navigation Panel with Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Jump to Chat Button */}
          <div 
            className="border border-gray-700 bg-gray-800 rounded-md p-3 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-accent flex flex-col justify-center items-center"
            onClick={() => {
              // Scroll to bottom of chat - Properly implemented now
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
              }
            }}
          >
            <div className="bg-accent/20 p-2 rounded-full mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-200">Latest Messages</span>
          </div>
          
          {/* Toggle Auto-Refresh Button */}
          <div 
            className="border border-gray-700 bg-gray-800 rounded-md p-3 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-accent flex flex-col justify-center items-center"
            onClick={() => {
              // Toggle auto-refresh functionality
              const autoRefreshEvent = new CustomEvent('toggle-auto-refresh');
              window.dispatchEvent(autoRefreshEvent);
            }}
          >
            <div className="bg-blue-500/20 p-2 rounded-full mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-200">Auto Refresh</span>
          </div>
          
          {/* Toggle Code View Button */}
          <div 
            className="border border-gray-700 bg-gray-800 rounded-md p-3 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-accent flex flex-col justify-center items-center"
            onClick={() => {
              // Toggle showing code implementation (expand/collapse)
              const codeSection = document.getElementById('code-section');
              if (codeSection) {
                const isHidden = codeSection.classList.contains('hidden');
                if (isHidden) {
                  codeSection.classList.remove('hidden');
                } else {
                  codeSection.classList.add('hidden');
                }
              }
            }}
          >
            <div className="bg-purple-500/20 p-2 rounded-full mb-2">
              <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-200">Toggle Code</span>
          </div>
        </div>
        
        {/* Chat panel - Moved to the top for better visibility */}
        <div 
          className={`border border-gray-700 rounded-md bg-gray-900 transition-all duration-300 hover:ring-2 hover:ring-accent/50 mb-4 overflow-hidden`}
          style={{ height: getPanelHeight('chat') }}
        >
          <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center">
              <div className="bg-accent/20 p-1.5 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
              <h3 className="font-medium">Chat Interface</h3>
            </div>
            <button 
              className="p-1.5 rounded-md hover:bg-gray-700"
              onClick={() => togglePanelExpansion('chat')}
            >
              {expandedPanel === 'chat' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Messages container */}
          <div 
            ref={messagesContainerRef}
            className="p-4 overflow-y-auto"
            style={{ 
              height: expandedPanel === 'chat' 
                ? 'calc(100% - 112px)' // More space for messages when expanded
                : 'calc(100% - 112px)'  // Standard size otherwise
            }}
          >
            {chatMessages.map((message) => (
              <div 
                key={message.id} 
                className={`mb-4 ${
                  message.role === 'user' 
                    ? 'bg-blue-900/20 border border-blue-900/30 rounded-md p-3' 
                    : message.role === 'system'
                      ? 'bg-purple-900/20 border border-purple-900/30 rounded-md p-3' 
                      : message.isThinking 
                        ? 'bg-gray-800/50 border border-gray-700 rounded-md p-3' 
                        : 'bg-gray-800/30 border border-gray-700 rounded-md p-3'
                }`}
              >
                {/* Message header with role indicator and timestamp */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    message.role === 'user' 
                      ? 'bg-blue-900/40 text-blue-300' 
                      : message.role === 'system'
                        ? 'bg-purple-900/40 text-purple-300' 
                        : 'bg-gray-700/80 text-gray-300'
                  }`}>
                    {message.role === 'user' 
                      ? 'You' 
                      : message.role === 'system' 
                        ? 'System' 
                        : message.isThinking 
                          ? 'AI Thinking...' 
                          : 'AI Assistant'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                {/* Message content with markdown formatting */}
                <div className="prose prose-sm prose-invert max-w-none">
                  {/* Split content by newlines and process each line */}
                  {message.content.split('\n').map((line, i) => {
                    // Detect code blocks for thinking process
                    if (message.isThinking && line.startsWith('```thinking')) {
                      return <div key={i} className="bg-blue-900/20 border-t border-x border-blue-800/50 rounded-t-md pt-1 px-2 text-xs font-semibold text-blue-400">AI Processing</div>;
                    }
                    else if (message.isThinking && line.includes('```') && message.content.includes('```thinking')) {
                      return <div key={i} className="border-b border-x border-blue-800/50 rounded-b-md mb-2"></div>;
                    }
                    else if (message.isThinking && message.content.includes('```thinking') && !line.includes('```')) {
                      return (
                        <div key={i} className={`pl-3 pr-2 py-1 border-l border-r border-blue-800/50 text-blue-300 text-xs font-mono ${line.startsWith('→') ? 'border-l-2 border-l-blue-500' : ''}`}>
                          {line}
                        </div>
                      );
                    }
                    // Otherwise regular content
                    return (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {line}
                      </p>
                    );
                  })}
                  
                  {/* Show code snippet if present */}
                  {message.codeSnippet && (
                    <div className="mt-3 bg-gray-900 border border-gray-700 rounded-md overflow-hidden">
                      <div className="flex items-center justify-between bg-gray-800 px-3 py-1 border-b border-gray-700">
                        <span className="text-xs font-medium">Code Implementation</span>
                        {message.canRollback && (
                          <button 
                            onClick={handleRollback}
                            className="text-xs px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                          >
                            Roll Back
                          </button>
                        )}
                      </div>
                      <div className="p-3 text-xs font-mono overflow-x-auto">
                        <SyntaxHighlightedCode code={message.codeSnippet} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Thinking indicator - shows when AI is processing */}
            {isThinking && !chatMessages.some(m => m.isThinking) && (
              <div className="flex items-center space-x-2 text-blue-400 text-sm animate-pulse p-2 border border-blue-900/30 bg-blue-900/10 rounded-md">
                <div className="w-5 h-5">
                  <NinjaStarSpinner size="1.25rem" color="currentColor" />
                </div>
                <span>AI thinking...</span>
              </div>
            )}
          </div>
          
          {/* Input area */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex">
              <textarea
                ref={inputRef}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question or request changes..."
                className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-l-md focus:outline-none focus:ring-1 focus:ring-accent resize-none overflow-auto"
                style={{ height: '44px', maxHeight: '150px', minHeight: '44px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!connected || !message.trim()}
                className={`px-4 rounded-r-md flex items-center justify-center ${
                  connected && message.trim() 
                    ? 'bg-accent text-white hover:bg-accent/90' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {connected ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                ) : (
                  <NinjaStarSpinner size="1.25rem" color="currentColor" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Live Preview Panel */}
        <div 
          className={`border border-gray-700 rounded-md bg-gray-900 transition-all duration-300 hover:ring-2 hover:ring-accent/50 mb-4 overflow-hidden`}
          style={{ height: getPanelHeight('preview') }}
        >
          <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center">
              <div className="bg-green-500/20 p-1.5 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-medium">Live Preview</h3>
            </div>
            <button 
              className="p-1.5 rounded-md hover:bg-gray-700"
              onClick={() => togglePanelExpansion('preview')}
            >
              {expandedPanel === 'preview' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Live preview content */}
          <div 
            className="w-full"
            style={{ 
              height: expandedPanel === 'preview' 
                ? 'calc(100% - 43px)' // Expanded height
                : 'calc(100% - 43px)'  // Standard height
            }}
          >
            <LivePreview code={currentCode || ''} />
          </div>
        </div>
        
        {/* Code Implementation Panel */}
        <div 
          id="code-section"
          className={`border border-gray-700 rounded-md bg-gray-900 transition-all duration-300 hover:ring-2 hover:ring-accent/50 mb-4 overflow-hidden ${showCode ? '' : 'hidden'}`}
          style={{ height: getPanelHeight('code') }}
        >
          <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center">
              <div className="bg-purple-500/20 p-1.5 rounded-full mr-2">
                <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
              </div>
              <h3 className="font-medium">Code Implementation</h3>
            </div>
            <div className="flex items-center">
              <button 
                className="p-1.5 rounded-md hover:bg-gray-700 mr-2"
                onClick={handleRollback}
                disabled={!canRollback}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${canRollback ? 'text-gray-300' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>
              <button 
                className="p-1.5 rounded-md hover:bg-gray-700"
                onClick={() => togglePanelExpansion('code')}
              >
                {expandedPanel === 'code' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Code content with syntax highlighting */}
          <div 
            className="p-4 overflow-auto bg-gray-950"
            style={{ 
              height: expandedPanel === 'code' 
                ? 'calc(100% - 43px)' // Expanded height
                : 'calc(100% - 43px)'  // Standard height
            }}
          >
            {currentCode ? (
              <SyntaxHighlightedCode code={currentCode} />
            ) : (
              <div className="text-gray-500 italic">No code implementation available</div>
            )}
          </div>
        </div>
        
        {/* Development Logs Panel */}
        <div 
          className={`border border-gray-700 rounded-md bg-gray-900 transition-all duration-300 hover:ring-2 hover:ring-accent/50 mb-4 overflow-hidden`}
          style={{ height: getPanelHeight('logs') }}
        >
          <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center">
              <div className="bg-yellow-500/20 p-1.5 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-medium">Development Logs</h3>
            </div>
            <div className="flex items-center">
              <button 
                className="p-1.5 rounded-md hover:bg-gray-700 mr-2"
                onClick={simulateDebugging}
                title="Simulate debugging process"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                className="p-1.5 rounded-md hover:bg-gray-700 mr-2"
                onClick={simulateStepByStepExplanation}
                title="Step-by-step explanation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                className="p-1.5 rounded-md hover:bg-gray-700"
                onClick={() => togglePanelExpansion('logs')}
              >
                {expandedPanel === 'logs' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Logs content */}
          <div 
            className="p-4 overflow-auto"
            style={{ 
              height: expandedPanel === 'logs' 
                ? 'calc(100% - 43px)' // Expanded height
                : 'calc(100% - 43px)'  // Standard height
            }}
          >
            <div className="space-y-3">
              {/* Sample dev logs - latest first */}
              <div className="border-l-4 border-green-500 pl-3 py-1">
                <div className="flex justify-between">
                  <span className="text-green-400 text-xs font-medium">✓ SUCCESS</span>
                  <span className="text-gray-500 text-xs">2 minutes ago</span>
                </div>
                <p className="text-sm mt-1">Added legal compliance document template system</p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-3 py-1">
                <div className="flex justify-between">
                  <span className="text-blue-400 text-xs font-medium">ℹ INFO</span>
                  <span className="text-gray-500 text-xs">5 minutes ago</span>
                </div>
                <p className="text-sm mt-1">Starting development of multi-platform distribution module</p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-3 py-1">
                <div className="flex justify-between">
                  <span className="text-orange-400 text-xs font-medium">⚠ WARNING</span>
                  <span className="text-gray-500 text-xs">10 minutes ago</span>
                </div>
                <p className="text-sm mt-1">Performance bottleneck detected in dynamic pricing calculations</p>
              </div>
              
              <div className="border-l-4 border-red-500 pl-3 py-1">
                <div className="flex justify-between">
                  <span className="text-red-400 text-xs font-medium">✗ ERROR</span>
                  <span className="text-gray-500 text-xs">15 minutes ago</span>
                </div>
                <p className="text-sm mt-1">Backend API rate limiting reached - implemented throttling</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-3 py-1">
                <div className="flex justify-between">
                  <span className="text-green-400 text-xs font-medium">✓ SUCCESS</span>
                  <span className="text-gray-500 text-xs">20 minutes ago</span>
                </div>
                <p className="text-sm mt-1">Implemented persona behavior modeling system</p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-3 py-1">
                <div className="flex justify-between">
                  <span className="text-purple-400 text-xs font-medium">⚙ SYSTEM</span>
                  <span className="text-gray-500 text-xs">25 minutes ago</span>
                </div>
                <p className="text-sm mt-1">Optimizing database queries for better performance</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-3 py-1">
                <div className="flex justify-between">
                  <span className="text-green-400 text-xs font-medium">✓ SUCCESS</span>
                  <span className="text-gray-500 text-xs">30 minutes ago</span>
                </div>
                <p className="text-sm mt-1">Added new revenue tracking dashboard component</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SyntaxHighlightedCodeProps {
  code: string;
}

function SyntaxHighlightedCode({ code }: SyntaxHighlightedCodeProps) {
  // Enhanced syntax highlighter that better represents Replit's style
  // Add line numbers and better highlighting
  const lines = code.split('\n');
  const processedLines = lines.map((line, index) => {
    // Apply syntax highlighting to each line
    let highlightedLine = line
      // Keywords
      .replace(/(import|export|from|const|let|var|function|class|interface|type|extends|implements|return|async|await|try|catch|finally|if|else|for|while|do|switch|case|break|continue|new|this|super|instanceof|typeof|in|of|null|undefined|true|false|void|delete)/g, '<span class="text-blue-400">$1</span>')
      // Strings
      .replace(/('.*?'|".*?")/g, '<span class="text-green-400">$1</span>')
      // Function calls
      .replace(/(\w+)(?=\s*\()/g, '<span class="text-yellow-400">$1</span>')
      // Comments
      .replace(/(\/\/.*)/g, '<span class="text-gray-500">$1</span>')
      // Punctuation
      .replace(/(\{|\}|\(|\)|\[|\]|=>|=|;|,|:|\.|<|>|\?|\||\&|\+|\-|\*|\/|\%|\^|\!)/g, '<span class="text-gray-300">$1</span>')
      // Numbers
      .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-purple-400">$1</span>')
      // JSX tags
      .replace(/(&lt;\/?[a-zA-Z0-9]+(&gt;)?)/g, '<span class="text-orange-400">$1</span>');
    
    // Add line number and proper indentation
    return `
      <div class="flex hover:bg-gray-800/50">
        <div class="text-gray-500 w-8 text-right pr-2 select-none">${index + 1}</div>
        <div class="flex-1 pl-2 border-l border-gray-700">${highlightedLine || ' '}</div>
      </div>
    `;
  });
  
  return (
    <div className="text-sm">
      <div dangerouslySetInnerHTML={{ __html: processedLines.join('') }} />
    </div>
  );
}