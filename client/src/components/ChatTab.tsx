import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Persona } from "@shared/schema";
import { SendHorizontal, Bot, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatTabProps {
  persona: Persona;
}

interface ChatMessage {
  sender: string;
  content: string;
  timestamp: Date;
}

export function ChatTab({ persona }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Add initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: "system",
          content: `This is your chat with ${persona.displayName || persona.name}. You can use this tab to interact with the persona directly.`,
          timestamp: new Date()
        },
        {
          sender: "persona",
          content: `Hello! I'm ${persona.displayName || persona.name}. How can I assist you today?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [persona, messages.length]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      sender: "user",
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const response = await apiRequest(`/api/personas/${persona.id}/chat`, "POST", {
        message: input
      });
      
      setMessages(prev => [
        ...prev, 
        {
          sender: "persona",
          content: response.reply,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get response from persona. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-gray-900 border-gray-800">
      <div className="flex flex-col h-[600px]">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-lg font-medium">Chat with {persona.displayName || persona.name}</h3>
          <p className="text-sm text-gray-400">
            Train your persona by chatting directly. This helps develop their personality.
          </p>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'system' ? (
                <div className="bg-gray-800 text-gray-300 rounded-lg p-3 max-w-[80%] text-sm">
                  {message.content}
                </div>
              ) : message.sender === 'user' ? (
                <div className="flex items-start space-x-2">
                  <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[80%]">
                    {message.content}
                  </div>
                  <div className="bg-gray-700 rounded-full p-1 flex-shrink-0">
                    <User size={16} className="text-gray-300" />
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-2">
                  <div className="bg-gray-700 rounded-full p-1 flex-shrink-0">
                    <Bot size={16} className="text-green-300" />
                  </div>
                  <div className="bg-gray-800 text-white rounded-lg p-3 max-w-[80%]">
                    {message.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Textarea 
                placeholder="Type your message..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[80px] bg-gray-800 border-gray-700"
              />
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0"
            >
              <SendHorizontal size={18} className="mr-1" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}