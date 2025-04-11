import React, { useState, useRef, useEffect } from "react";
import { SendHorizonal, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TitanLogo } from "@/components/ui/titan-logo";

type MessageType = "user" | "system" | "agent" | "action" | "error";

interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  allowRollback?: boolean;
}

interface ChatAction {
  id: string;
  description: string;
  timestamp: Date;
  inProgress: boolean;
}

interface InputTabProps {
  projectId: number;
  onSendMessage?: (message: string) => void;
  messages?: ChatMessage[];
  currentAction?: ChatAction | null;
  isLoading?: boolean;
}

export function InputTab({
  projectId,
  onSendMessage,
  messages = [],
  currentAction = null,
  isLoading = false,
}: InputTabProps) {
  const [input, setInput] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handle sending a message
  const handleSendMessage = () => {
    if (input.trim() && onSendMessage) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Track scrolling to show/hide scroll to bottom button
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
    setIsAtBottom(isBottom);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Current action display */}
      {currentAction && (
        <div className="bg-secondary py-2 px-4 border-b border-border">
          <div className="flex items-center">
            {currentAction.inProgress ? (
              <TitanLogo size={16} spinning className="mr-2" />
            ) : (
              <div className="w-4 h-4 bg-primary rounded-full mr-2" />
            )}
            <span className="text-sm">{currentAction.description}</span>
          </div>
        </div>
      )}

      {/* Chat messages container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" 
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <TitanLogo size={40} />
            <h3 className="mt-4 text-lg font-medium">Welcome to your project</h3>
            <p className="mt-2 text-muted-foreground max-w-md">
              Describe your project requirements, and I'll help you build it. Ask me anything or give me specific tasks to accomplish.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="chat-message">
              <div
                className={`p-3 rounded-lg ${
                  message.type === "user"
                    ? "bg-secondary ml-12"
                    : message.type === "error"
                    ? "bg-red-500 bg-opacity-20 border border-red-500 mr-12"
                    : message.type === "action"
                    ? "bg-primary bg-opacity-10 border border-primary mr-12"
                    : "bg-card border border-border mr-12"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground uppercase mb-1">
                    {message.type === "user" ? "You" : message.type === "agent" ? "Titan" : message.type}
                  </span>
                  {message.allowRollback && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rollback to here
                    </Button>
                  )}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {message.content}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && (
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-20 right-8 rounded-full p-2 bg-card opacity-80"
          onClick={scrollToBottom}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              className="w-full p-3 pr-10 bg-secondary rounded-md border border-border outline-none focus:ring-1 focus:ring-primary min-h-[80px] max-h-[200px] resize-y"
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
          </div>
          <Button
            className="bg-primary text-primary-foreground h-10 px-4"
            disabled={!input.trim() || isLoading}
            onClick={handleSendMessage}
          >
            {isLoading ? (
              <TitanLogo size={16} spinning className="mr-2" />
            ) : (
              <SendHorizonal className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}