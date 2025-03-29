import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Code, MessageSquare, Bell, Activity } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Persona } from '@/lib/types';
import { CodeGenerationMonitor } from '@/components/CodeGenerationMonitor';
import { ChatTab } from '@/components/ChatTab';

interface LogEntry {
  id: string;
  message: string;
  timestamp: Date;
  type: 'debug' | 'info' | 'warning' | 'error' | 'success';
  canRollback: boolean;
}

interface PerformanceTabProps {
  persona: Persona;
  projectId: number;
}

export function PerformanceTab({ persona, projectId }: PerformanceTabProps) {
  const [activeTab, setActiveTab] = useState<string>('code');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Add a dummy log for demonstration purposes
  useEffect(() => {
    const dummyLogs: LogEntry[] = [
      {
        id: '1',
        message: 'Starting system initialization',
        timestamp: new Date(Date.now() - 3600000),
        type: 'info',
        canRollback: false,
      },
      {
        id: '2',
        message: 'Connected to OpenAI API',
        timestamp: new Date(Date.now() - 3500000),
        type: 'success',
        canRollback: false,
      },
      {
        id: '3',
        message: 'Loading persona configuration',
        timestamp: new Date(Date.now() - 3400000),
        type: 'info',
        canRollback: false,
      },
      {
        id: '4',
        message: 'Failed to initialize browser automation',
        timestamp: new Date(Date.now() - 3300000),
        type: 'error',
        canRollback: true,
      },
      {
        id: '5',
        message: 'Retrying browser automation initialization',
        timestamp: new Date(Date.now() - 3200000),
        type: 'warning',
        canRollback: false,
      },
      {
        id: '6',
        message: 'Successfully initialized browser automation',
        timestamp: new Date(Date.now() - 3100000),
        type: 'success',
        canRollback: false,
      },
      {
        id: '7',
        message: 'Generated content for OnlyFans platform',
        timestamp: new Date(Date.now() - 3000000),
        type: 'info',
        canRollback: true,
      },
      {
        id: '8',
        message: 'Posted content to Instagram',
        timestamp: new Date(Date.now() - 2900000),
        type: 'success',
        canRollback: true,
      },
      {
        id: '9',
        message: 'Updated analytics data',
        timestamp: new Date(Date.now() - 2800000),
        type: 'info',
        canRollback: false,
      },
      {
        id: '10',
        message: 'System ready for operations',
        timestamp: new Date(Date.now() - 2700000),
        type: 'success',
        canRollback: false,
      },
    ];
    
    setLogs(dummyLogs);
  }, []);
  
  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  // Handle log rollback
  const handleRollback = (logId: string) => {
    // This would normally call an API to perform the rollback
    console.log('Rolling back action:', logId);
    
    // For demo purposes, just mark the log
    setLogs(prevLogs => 
      prevLogs.map(log => 
        log.id === logId 
          ? { ...log, message: `ROLLED BACK: ${log.message}`, type: 'warning' } 
          : log
      )
    );
  };
  
  // Refresh logs
  const refreshLogs = () => {
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsProcessing(false);
    }, 1000);
  };
  
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="space-y-4">
        {/* Live Code Display Area */}
        <Tabs defaultValue="code" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code" className="flex items-center">
              <Code className="w-4 h-4 mr-2" />
              <span>Live Code</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              <span>Replit Chat</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="code">
            <Card className="h-[calc(100vh-220px)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Live Code Generation</span>
                </CardTitle>
                <CardDescription>
                  Real-time code being generated by GPT-4o
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100vh-300px)]">
                {/* This is where the CodeGenerationMonitor will go */}
                <CodeGenerationMonitor 
                  projectId={projectId} 
                  personaId={Number(persona.id)} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="chat">
            <Card className="h-[calc(100vh-220px)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Replit-Style Chat</CardTitle>
                <CardDescription>
                  Chat with the system for custom operations
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100vh-300px)]">
                {/* This is where the chat UI will go */}
                {persona && <ChatTab persona={persona} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="space-y-4">
        {/* System Logs with Rollback */}
        <Card className="h-[calc(50vh-120px)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between items-center">
              <div className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                <span>System Logs</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshLogs}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </CardTitle>
            <CardDescription className="flex justify-between">
              <span>System events with rollback capability</span>
              <span className="text-xs text-gray-500">Last updated: {formatTime(lastUpdated)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(50vh-200px)] p-0">
            <ScrollArea className="h-full rounded-md p-4">
              <div className="space-y-2 px-4">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`flex justify-between items-start p-2 rounded text-sm ${
                      log.type === 'error' ? 'bg-red-950/30 text-red-400' : 
                      log.type === 'warning' ? 'bg-yellow-950/30 text-yellow-400' : 
                      log.type === 'success' ? 'bg-green-950/30 text-green-400' : 
                      'bg-gray-800/50 text-gray-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="mr-2 text-xs text-gray-500">[{formatTime(log.timestamp)}]</span>
                        <span>{log.message}</span>
                      </div>
                    </div>
                    {log.canRollback && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2 h-6 px-2 py-0 text-xs hover:bg-red-900/30 hover:text-red-400"
                        onClick={() => handleRollback(log.id)}
                      >
                        Rollback
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Real-time Process Logs */}
        <Card className="h-[calc(50vh-120px)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              <span>Real-time Process Logs</span>
            </CardTitle>
            <CardDescription>
              Detailed processing information for debugging
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(50vh-200px)]">
            {/* This is the placeholder for the real-time logs from CodeGenerationMonitor */}
            <ScrollArea className="h-full bg-gray-900 rounded-md p-4">
              <div className="space-y-2">
                <div className="text-sm p-2 rounded bg-gray-800/50 text-gray-300">
                  <div className="flex justify-between items-start">
                    <span className="whitespace-pre-wrap">Connected to WebSocket server</span>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {formatTime(new Date())}
                    </span>
                  </div>
                </div>
                <div className="text-sm p-2 rounded bg-gray-800/50 text-gray-300">
                  <div className="flex justify-between items-start">
                    <span className="whitespace-pre-wrap">Waiting for tasks from the Progress tab</span>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {formatTime(new Date())}
                    </span>
                  </div>
                </div>
                <div className="text-sm p-2 rounded bg-green-950/30 text-green-400">
                  <div className="flex justify-between items-start">
                    <span className="whitespace-pre-wrap">Ready to process development tasks</span>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {formatTime(new Date())}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}