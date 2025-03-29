import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContentItem } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Check, X, RefreshCw, Clock, ArrowUpDown } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PersonaContentProps {
  personaId: string;
}

export function PersonaContent({ personaId }: PersonaContentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [rejectedContentId, setRejectedContentId] = useState<string | null>(null);
  const [regeneratingContent, setRegeneratingContent] = useState<ContentItem | null>(null);
  
  // Fetch content items for this persona
  const { data: contentItems, isLoading } = useQuery<ContentItem[]>({
    queryKey: [`/api/personas/${personaId}/content-items`],
    retry: 1,
  });
  
  // Approve content mutation
  const approveContent = useMutation({
    mutationFn: async (contentId: string) => {
      return apiRequest({
        url: `/api/personas/${personaId}/content-items/${contentId}/approve`,
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/personas/${personaId}/content-items`] });
      toast({
        title: "Content Approved",
        description: "The content has been approved and scheduled for publishing.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve content. Please try again.",
      });
    }
  });
  
  // Reject content mutation
  const rejectContent = useMutation({
    mutationFn: async ({ contentId, feedback }: { contentId: string, feedback: string }) => {
      return apiRequest({
        url: `/api/personas/${personaId}/content-items/${contentId}/reject`,
        method: "POST",
        data: { feedback }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/personas/${personaId}/content-items`] });
      toast({
        title: "Content Rejected",
        description: "The content has been rejected with feedback.",
      });
      setRejectedContentId(null);
      setFeedbackMessage("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject content. Please try again.",
      });
    }
  });
  
  // Regenerate content mutation
  const regenerateContent = useMutation({
    mutationFn: async (contentId: string) => {
      return apiRequest({
        url: `/api/personas/${personaId}/content-items/${contentId}/regenerate`,
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/personas/${personaId}/content-items`] });
      toast({
        title: "Regeneration Initiated",
        description: "The content is being regenerated.",
      });
      setRegeneratingContent(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to regenerate content. Please try again.",
      });
    }
  });
  
  const handleReject = (item: ContentItem) => {
    setRejectedContentId(item.id);
  };
  
  const handleRegenerateRequest = (item: ContentItem) => {
    setRegeneratingContent(item);
  };
  
  const submitRejection = () => {
    if (rejectedContentId && feedbackMessage.trim()) {
      rejectContent.mutate({ 
        contentId: rejectedContentId, 
        feedback: feedbackMessage 
      });
    } else {
      toast({
        variant: "destructive",
        title: "Feedback Required",
        description: "Please provide feedback on why this content was rejected.",
      });
    }
  };
  
  const confirmRegeneration = () => {
    if (regeneratingContent) {
      regenerateContent.mutate(regeneratingContent.id);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="bg-gray-800 text-gray-300">Draft</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-900 text-yellow-300">Pending</Badge>;
      case "published":
        return <Badge variant="outline" className="bg-green-900 text-green-300">Published</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-900 text-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "post":
        return "📝";
      case "story":
        return "📚";
      case "message":
        return "💬";
      case "promotion":
        return "🔥";
      default:
        return "📄";
    }
  };
  
  return (
    <div>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Content Queue</h3>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-400">
                Content Autonomy: <span className="font-medium text-orange-400">Off</span>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center my-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <>
              {contentItems && contentItems.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Type</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead className="w-[120px]">Platform</TableHead>
                        <TableHead className="w-[130px]">Schedule</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[180px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <span className="text-xl" title={item.contentType}>
                              {getContentTypeIcon(item.contentType)}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <div className="truncate font-medium">{item.title}</div>
                            <div className="text-sm text-gray-400 truncate">
                              {item.content.substring(0, 100)}
                              {item.content.length > 100 ? "..." : ""}
                            </div>
                          </TableCell>
                          <TableCell>{item.platform}</TableCell>
                          <TableCell>
                            {item.publishedAt ? (
                              <span className="text-xs text-gray-400">
                                {new Date(item.publishedAt).toLocaleString()}
                              </span>
                            ) : (
                              <span className="flex items-center text-xs text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                Unscheduled
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {item.status === "draft" || item.status === "pending" ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => approveContent.mutate(item.id)}
                                    disabled={approveContent.isPending}
                                    title="Approve"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 w-8 p-0 border-red-800 text-red-500 hover:bg-red-950"
                                    onClick={() => handleReject(item)}
                                    disabled={rejectContent.isPending}
                                    title="Reject"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : null}
                              
                              {item.status === "rejected" && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleRegenerateRequest(item)}
                                  disabled={regenerateContent.isPending}
                                  title="Regenerate"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No content items yet.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Rejection Feedback Dialog */}
      <Dialog open={!!rejectedContentId} onOpenChange={(open) => !open && setRejectedContentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Please explain why you're rejecting this content..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setRejectedContentId(null)}
              disabled={rejectContent.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitRejection}
              disabled={!feedbackMessage.trim() || rejectContent.isPending}
            >
              {rejectContent.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Regeneration Confirmation Dialog */}
      <Dialog open={!!regeneratingContent} onOpenChange={(open) => !open && setRegeneratingContent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Content</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to regenerate this content? 
              The AI will create a new version based on the feedback provided.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setRegeneratingContent(null)}
              disabled={regenerateContent.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmRegeneration}
              disabled={regenerateContent.isPending}
            >
              {regenerateContent.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Regeneration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}