import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Persona } from '@shared/schema';
import { Send, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatTabProps {
  persona: Persona;
}

export function ChatTab({ persona }: ChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: `You are now interacting with ${persona.name}, a FINDOM persona with the following traits and personality:
      
${persona.description}

This is a training session. Your responses to the user will help shape how this persona interacts with potential clients.`,
      timestamp: new Date()
    },
    {
      role: 'assistant',
      content: `Hi, I'm ${persona.name}. How can I help you train me today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Prepare the messages for the API call
      const messageHistory = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Add the system message as the first message
      const systemMessage = messages.find(m => m.role === 'system');
      const fullPrompt = [
        { role: 'system', content: systemMessage?.content || '' },
        ...messageHistory,
        { role: 'user', content: inputMessage }
      ];
      
      // Call the API
      const response = await fetch('/api/chat/persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: fullPrompt,
          personaId: persona.id,
          model: 'gpt-4o' // Use GPT-4o as specified
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }
      
      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get response from AI. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([
        {
          role: 'system',
          content: `You are now interacting with ${persona.name}, a FINDOM persona with the following traits and personality:
          
${persona.description}

This is a training session. Your responses to the user will help shape how this persona interacts with potential clients.`,
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: `Hi, I'm ${persona.name}. How can I help you train me today?`,
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Chat Training</CardTitle>
          <CardDescription>
            Train this persona by chatting with it
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="text-red-500"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[calc(70vh-200px)]">
          <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4">
            {messages.filter(m => m.role !== 'system').map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-gray-800 text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-gray-700 pt-4">
            <div className="flex">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${persona.name}...`}
                className="resize-none mr-2 min-h-[60px]"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="h-auto bg-accent hover:bg-accent/90 text-black"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}