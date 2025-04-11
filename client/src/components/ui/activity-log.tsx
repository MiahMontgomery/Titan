import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { 
  CheckCircle, 
  PlayCircle, 
  AlertCircle, 
  Package, 
  Clock
} from "lucide-react";

interface ActivityLogProps {
  className?: string;
  limit?: number;
}

export function ActivityLog({ className, limit = 5 }: ActivityLogProps) {
  // Fetch activity logs
  const { data: activityLogs = [], isLoading, error } = useQuery({
    queryKey: [`/api/activity-logs?limit=${limit}`],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Get appropriate icon based on action type
  const getActionIcon = (action: string) => {
    switch (action) {
      case "AGENT_CREATED":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "STATUS_CHANGED":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "AUTOMATION_COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "AUTOMATION_STARTED":
        return <PlayCircle className="h-5 w-5 text-blue-500" />;
      case "AUTOMATION_ERROR":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Get background color for icon container
  const getIconBgColor = (action: string) => {
    switch (action) {
      case "AGENT_CREATED":
        return "bg-blue-500 bg-opacity-20";
      case "STATUS_CHANGED":
        return "bg-amber-500 bg-opacity-20";
      case "AUTOMATION_COMPLETED":
        return "bg-green-500 bg-opacity-20";
      case "AUTOMATION_STARTED":
        return "bg-blue-500 bg-opacity-20";
      case "AUTOMATION_ERROR":
        return "bg-red-500 bg-opacity-20";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="px-6 py-4 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-medium text-foreground">Recent Activity</h2>
        <Button variant="link" className="text-primary px-0">View All</Button>
      </CardHeader>

      <CardContent className="p-4">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-destructive py-4">Error loading activity logs</div>
        ) : activityLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No activity logs found</div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activityLogs.map((log: any, index: number) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {index < activityLogs.length - 1 && (
                      <span 
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-border" 
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-card",
                          getIconBgColor(log.action)
                        )}>
                          {getActionIcon(log.action)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm text-foreground font-medium">
                            {log.action.split('_').map((word: string) => 
                              word.charAt(0) + word.slice(1).toLowerCase()
                            ).join(' ')}
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {log.details}
                          </p>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
