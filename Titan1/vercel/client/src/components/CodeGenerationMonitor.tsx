import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCodeGenerationLoop } from '@/hooks/useCodeGenerationLoop';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayCircle, StopCircle, RefreshCw, RotateCw } from 'lucide-react';

interface CodeGenerationMonitorProps {
  projectId: number;
  personaId: number;
}

export function CodeGenerationMonitor({ projectId, personaId }: CodeGenerationMonitorProps) {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  // Use our custom code generation loop hook
  const {
    isActive,
    startLoop,
    stopLoop,
    currentTask,
    pendingTasks,
    completedTasks,
    generatedCode,
    processLogs,
    addProcessLog
  } = useCodeGenerationLoop({
    projectId,
    personaId,
    onTaskUpdate: (task) => {
      console.log('Task updated:', task);
    },
    onCodeGenerated: (code, taskId) => {
      console.log(`Code generated for task ${taskId}`);
    },
    onProcessLog: (log) => {
      console.log('Process log:', log);
    }
  });
  
  // Format time to display in the logs
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    setLastRefreshed(new Date());
    addProcessLog('Manually refreshed code generation monitor', 'info');
  };
  
  // Periodically update the last refreshed time
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Live Code Display */}
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Live Code Generation</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription className="flex justify-between">
            <span>Real-time code output from AI</span>
            <span className="text-xs text-gray-500">Last updated: {formatTime(lastRefreshed)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <span className="text-sm mr-2">Current Task:</span>
                <span className="text-sm font-medium">
                  {currentTask ? currentTask.title : 'No active task'}
                </span>
              </div>
              <div>
                {isActive ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={stopLoop}
                    className="flex items-center text-red-500 hover:text-red-600"
                  >
                    <StopCircle className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={startLoop}
                    className="flex items-center text-green-500 hover:text-green-600"
                  >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Start
                  </Button>
                )}
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-280px)] bg-gray-900 rounded-md p-4">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {generatedCode || 'No code has been generated yet. Start the loop to begin processing tasks.'}
              </pre>
            </ScrollArea>
            
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{pendingTasks.length} pending tasks</span>
                <span>{completedTasks.length} completed tasks</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Process Logs */}
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Real-time Process Logs</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addProcessLog('Manual log entry added', 'info')}
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Add Log
            </Button>
          </CardTitle>
          <CardDescription>
            Detailed processing information for debugging and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[calc(100vh-280px)] bg-gray-900 rounded-md p-4">
            <div className="space-y-2">
              {processLogs.length > 0 ? (
                processLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`text-sm p-2 rounded ${
                      log.level === 'error' ? 'bg-red-950/30 text-red-400' : 
                      log.level === 'warning' ? 'bg-yellow-950/30 text-yellow-400' : 
                      log.level === 'success' ? 'bg-green-950/30 text-green-400' : 
                      'bg-gray-800/50 text-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="whitespace-pre-wrap">{log.message}</span>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic p-2">
                  No logs available. Start the code generation loop to see logs.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}