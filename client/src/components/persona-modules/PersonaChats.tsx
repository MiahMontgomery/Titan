import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatMessage } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Check, X, SendHorizonal, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PersonaChatsProps {
  personaId: string;
}

export function PersonaChats({ personaId }: PersonaChatsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [rejectedMessageId, setRejectedMessageId] = useState<string | null>(null);
  
  // Fetch chat messages for this persona
  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/personas/${personaId}/chat-messages`],
    retry: 1,
  });
  
  // Send a message mutation
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest({
        url: `/api/personas/${personaId}/chat-messages`,
        method: "POST",
        data: { 
          content: message,
          isFromPersona: false,
          sender: "User",
          platform: "web"
        }
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/personas/${personaId}/chat-messages`] });
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      });
    }
  });
  
  // Approve message mutation
  const approveMessage = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest({
        url: `/api/personas/${personaId}/chat-messages/${messageId}/approve`,
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/personas/${personaId}/chat-messages`] });
      toast({
        title: "Message Approved",
        description: "The message has been approved and sent.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve message. Please try again.",
      });
    }
  });
  
  // Reject message mutation
  const rejectMessage = useMutation({
    mutationFn: async ({ messageId, feedback }: { messageId: string, feedback: string }) => {
      return apiRequest({
        url: `/api/personas/${personaId}/chat-messages/${messageId}/reject`,
        method: "POST",
        data: { feedback }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/personas/${personaId}/chat-messages`] });
      toast({
        title: "Message Rejected",
        description: "The message has been rejected with feedback.",
      });
      setRejectedMessageId(null);
      setFeedbackMessage("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject message. Please try again.",
      });
    }
  });
  
  // Retry failed message mutation
  const retryMessage = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest({
        url: `/api/personas/${personaId}/chat-messages/${messageId}/retry`,
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/personas/${personaId}/chat-messages`] });
      toast({
        title: "Retry Initiated",
        description: "The message is being regenerated.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to retry message. Please try again.",
      });
    }
  });
  
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage.mutate(newMessage);
    }
  };
  
  const handleReject = (messageId: string) => {
    setRejectedMessageId(messageId);
  };
  
  const submitRejection = () => {
    if (rejectedMessageId && feedbackMessage.trim()) {
      rejectMessage.mutate({ 
        messageId: rejectedMessageId, 
        feedback: feedbackMessage 
      });
    } else {
      toast({
        variant: "destructive",
        title: "Feedback Required",
        description: "Please provide feedback on why this message was rejected.",
      });
    }
  };
  
  const getMessageStatusClass = (message: ChatMessage) => {
    if (!message.isFromPersona) return "bg-gray-800";
    
    // Note: Adding status to the message type even though it's not in the schema yet
    // This would be added in a real implementation
    const status = (message as any).status || "sent";
    
    if (status === "sent") return "bg-green-900/20";
    if (status === "rejected") return "bg-red-900/20";
    if (status === "pending") return "bg-yellow-900/20";
    if (status === "failed") return "bg-red-900/20";
    
    return "bg-gray-800";
  };
  
  return (
    <div>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Chat History</h3>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-400">
                Chat Autonomy: <span className="font-medium text-orange-400">Off</span>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center my-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
              {messages && messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${getMessageStatusClass(message)} ${
                      message.isFromPersona ? "ml-4" : "mr-4"
                    }`}
                  >
                    <div className="flex items-start">
                      <Avatar className="h-8 w-8 mr-3 mt-1">
                        <AvatarFallback>
                          {message.isFromPersona ? "AI" : "Me"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">
                            {message.isFromPersona ? "Persona" : "You"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-200">{message.content}</p>
                        
                        {message.isFromPersona && (message as any).status === "pending" && (
                          <div className="mt-3 flex space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveMessage.mutate(message.id)}
                              disabled={approveMessage.isPending}
                            >
                              {approveMessage.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(message.id)}
                              disabled={rejectMessage.isPending}
                            >
                              {rejectMessage.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <X className="h-4 w-4 mr-1" />
                              )}
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        {message.isFromPersona && (message as any).status === "failed" && (
                          <div className="mt-3 flex">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => retryMessage.mutate(message.id)}
                              disabled={retryMessage.isPending}
                            >
                              {retryMessage.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-1" />
                              )}
                              Retry
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No messages yet. Start a conversation!</p>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-4 flex items-end space-x-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || sendMessage.isPending}
              className="bg-accent hover:bg-accent/90 text-black"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Rejection Feedback Dialog */}
      <Dialog open={!!rejectedMessageId} onOpenChange={(open) => !open && setRejectedMessageId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Please explain why you're rejecting this message..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setRejectedMessageId(null)}
              disabled={rejectMessage.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitRejection}
              disabled={!feedbackMessage.trim() || rejectMessage.isPending}
            >
              {rejectMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}