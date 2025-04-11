import React, { useState } from "react";
import { ChevronDown, ChevronRight, GitCommit, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogEntry {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  changes: {
    file: string;
    additions: number;
    deletions: number;
  }[];
}

interface LogsTabProps {
  projectId: number;
  logs: LogEntry[];
  onRollback?: (logId: string) => void;
  onViewChanges?: (logId: string) => void;
}

export function LogsTab({ projectId, logs, onRollback, onViewChanges }: LogsTabProps) {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedLog === id) {
      setExpandedLog(null);
    } else {
      setExpandedLog(id);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GitCommit className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="mb-1">No logs available yet</p>
          <p className="text-sm">Logs will appear here as changes are made to the project</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="titan-card overflow-hidden">
              <div 
                className="p-3 flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(log.id)}
              >
                <div className="flex items-center">
                  <GitCommit className="h-4 w-4 text-primary mr-3" />
                  <div>
                    <div className="font-medium">{log.title}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="mr-2 text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRollback && onRollback(log.id);
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Rollback
                  </Button>
                  {expandedLog === log.id ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              
              {expandedLog === log.id && (
                <div className="border-t border-border p-3 bg-secondary bg-opacity-30">
                  <p className="text-sm mb-3">{log.description}</p>
                  
                  {log.changes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium uppercase text-muted-foreground mb-2">Changed Files</h4>
                      {log.changes.map((change, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 bg-card rounded-md text-sm cursor-pointer hover:bg-secondary"
                          onClick={() => onViewChanges && onViewChanges(log.id)}
                        >
                          <span className="font-mono">{change.file}</span>
                          <div className="flex items-center text-xs">
                            <span className="text-green-500 mr-2">+{change.additions}</span>
                            <span className="text-red-500">-{change.deletions}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}