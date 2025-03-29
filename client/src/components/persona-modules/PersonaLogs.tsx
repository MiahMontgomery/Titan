import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Info, AlertCircle, Check, X, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Log {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
  status: "success" | "failure" | "warning" | "info";
  personaId: string;
}

interface FeedbackLog {
  id: string;
  timestamp: Date;
  contentType: "message" | "content";
  originalContent: string;
  feedback: string;
  personaId: string;
  contentId: string;
}

interface RegenerationLog {
  id: string;
  timestamp: Date;
  contentType: "message" | "content";
  originalContent: string;
  regeneratedContent: string;
  success: boolean;
  personaId: string;
  contentId: string;
}

interface PersonaLogsProps {
  personaId: string;
}

export function PersonaLogs({ personaId }: PersonaLogsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("action-history");
  
  // Fetch action logs
  const { data: actionLogs, isLoading: isLoadingActions } = useQuery<Log[]>({
    queryKey: [`/api/personas/${personaId}/logs/actions`],
    retry: 1,
  });
  
  // Fetch feedback logs
  const { data: feedbackLogs, isLoading: isLoadingFeedback } = useQuery<FeedbackLog[]>({
    queryKey: [`/api/personas/${personaId}/logs/feedback`],
    retry: 1,
  });
  
  // Fetch regeneration logs
  const { data: regenerationLogs, isLoading: isLoadingRegeneration } = useQuery<RegenerationLog[]>({
    queryKey: [`/api/personas/${personaId}/logs/regeneration`],
    retry: 1,
  });
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <Check className="h-4 w-4 text-green-500" />;
      case "failure":
        return <X className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <div>
      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="action-history" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="action-history">Action History</TabsTrigger>
              <TabsTrigger value="feedback-logs">Feedback Logs</TabsTrigger>
              <TabsTrigger value="regeneration-logs">Regeneration Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="action-history">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Action History</h3>
                <p className="text-sm text-gray-400">Record of all persona actions and responses</p>
              </div>
              
              {isLoadingActions ? (
                <div className="flex justify-center my-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {actionLogs && actionLogs.length > 0 ? (
                    actionLogs.map((log) => (
                      <div key={log.id} className="bg-gray-800 rounded-md p-3">
                        <div className="flex items-start">
                          <div className="mt-1 mr-3">
                            {getStatusIcon(log.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium">{log.action}</span>
                              <span className="text-xs text-gray-400">
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300">{log.details}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>No action logs recorded yet.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="feedback-logs">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Feedback Logs</h3>
                <p className="text-sm text-gray-400">User feedback from rejected messages and content</p>
              </div>
              
              {isLoadingFeedback ? (
                <div className="flex justify-center my-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {feedbackLogs && feedbackLogs.length > 0 ? (
                    feedbackLogs.map((log) => (
                      <div key={log.id} className="bg-gray-800 rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-300">
                            Rejected {log.contentType}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <div className="bg-gray-900 rounded p-3 mb-3">
                          <h4 className="text-xs text-gray-500 uppercase mb-1">Original Content</h4>
                          <p className="text-sm text-gray-300">{log.originalContent}</p>
                        </div>
                        <div className="bg-red-900/20 rounded p-3">
                          <h4 className="text-xs text-gray-500 uppercase mb-1">Feedback</h4>
                          <p className="text-sm text-gray-300">{log.feedback}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>No feedback logs recorded yet.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="regeneration-logs">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Regeneration Logs</h3>
                <p className="text-sm text-gray-400">Records of content regeneration attempts</p>
              </div>
              
              {isLoadingRegeneration ? (
                <div className="flex justify-center my-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {regenerationLogs && regenerationLogs.length > 0 ? (
                    regenerationLogs.map((log) => (
                      <div key={log.id} className="bg-gray-800 rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-300 mr-2">
                              Regenerated {log.contentType}
                            </span>
                            {log.success ? (
                              <span className="text-xs bg-green-900/20 text-green-400 px-2 py-0.5 rounded">
                                Success
                              </span>
                            ) : (
                              <span className="text-xs bg-red-900/20 text-red-400 px-2 py-0.5 rounded">
                                Failed
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <div className="bg-gray-900 rounded p-3 mb-3">
                          <h4 className="text-xs text-gray-500 uppercase mb-1">Original Content</h4>
                          <p className="text-sm text-gray-300">{log.originalContent}</p>
                        </div>
                        {log.success && (
                          <div className="bg-green-900/20 rounded p-3">
                            <h4 className="text-xs text-gray-500 uppercase mb-1">Regenerated Content</h4>
                            <p className="text-sm text-gray-300">{log.regeneratedContent}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>No regeneration logs recorded yet.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}