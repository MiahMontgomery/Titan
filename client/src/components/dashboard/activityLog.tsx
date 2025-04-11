import { useEffect, useRef, useState } from "react";
import { BotIcon, RefreshCcwIcon, FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityLog } from "@shared/schema";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WebSocketMessageType } from "@shared/types";

interface ActivityLogItemProps {
  log: ActivityLog;
}

const ActivityLogItem = ({ log }: ActivityLogItemProps) => {
  const getTypeColor = (agentType: string) => {
    switch (agentType) {
      case "FINDOM":
        return "text-green-500";
      case "CACHECOW":
        return "text-blue-500";
      case "SYSTEM":
        return "text-yellow-500";
      default:
        return "text-muted";
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      case "success":
        return "text-green-500";
      default:
        return "text-muted";
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="mb-3">
      <div className="flex gap-2 mb-1">
        <span className={getTypeColor(log.agentType)}>[{log.agentType}]</span>
        <span className="text-white">{log.projectName}</span>
        <span className="text-muted ml-auto">{formatTime(new Date(log.timestamp))}</span>
      </div>
      <div className={`pl-5 ${getMessageColor(log.type)}`}>{log.message}</div>
    </div>
  );
};

interface ActivityLogProps {
  initialLogs?: ActivityLog[];
}

const ActivityLogComponent = ({ initialLogs = [] }: ActivityLogProps) => {
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [isConnected, setIsConnected] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  const { lastMessage } = useWebSocket({
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false)
  });
  
  // Handle incoming websocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === WebSocketMessageType.ACTIVITY_LOG) {
      const newLog = lastMessage.data as ActivityLog;
      setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 30)); // Keep last 30 logs
    }
  }, [lastMessage]);
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);
  
  const handleRefresh = () => {
    // This would trigger a refresh from the server in a real implementation
    console.log("Refreshing logs");
  };
  
  const handleFilter = () => {
    // This would open a filter dialog in a real implementation
    console.log("Filtering logs");
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Agent Activity</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 bg-background border border-border rounded-md text-sm text-white hover:bg-card transition flex items-center gap-1"
            onClick={handleFilter}
          >
            <FilterIcon className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 bg-background border border-border rounded-md text-sm text-white hover:bg-card transition flex items-center gap-1"
            onClick={handleRefresh}
          >
            <RefreshCcwIcon className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border border-border overflow-hidden mb-4">
        <div className="border-b border-border p-3 flex items-center gap-2 bg-background/50">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <BotIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Agent Activity Log</h3>
            <p className="text-xs text-muted">Real-time updates via Socket.io</p>
          </div>
          <div className="ml-auto flex items-center">
            <Badge 
              variant="outline" 
              className={`px-2 py-0.5 text-xs rounded-full ${isConnected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} flex items-center gap-1`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </div>
        
        <div 
          ref={logContainerRef} 
          className="terminal bg-card p-4 font-mono text-sm h-56 overflow-y-auto scrollbar-custom"
        >
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <ActivityLogItem key={index} log={log} />
            ))
          ) : (
            <div className="text-center text-muted py-10">No activity logs available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogComponent;
