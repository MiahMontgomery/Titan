import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/lib/websocket";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Loader2, 
  RefreshCw, 
  Bot, 
  MessageSquare, 
  FileText, 
  Play,
  Pause,
  Activity
} from "lucide-react";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { WebAccount } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types for automation activities
interface AutomationActivity {
  id: string;
  timestamp: Date;
  type: 'login' | 'message' | 'content' | 'system';
  account?: WebAccount;
  platform: string;
  description: string;
  status: 'success' | 'failed' | 'in-progress';
  details?: any;
}

export default function AutomationDashboard() {
  const { toast } = useToast();
  const webSocketContext = useWebSocket();
  const [automationRunning, setAutomationRunning] = useState(true);
  const [activities, setActivities] = useState<AutomationActivity[]>([]);
  const [automationStats, setAutomationStats] = useState({
    messagesProcessed: 0,
    messagesResponded: 0,
    contentPosted: 0,
    loginAttempts: 0,
    successRate: 0
  });

  // Fetch web accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<WebAccount[]>({
    queryKey: ["/api/web-accounts"],
    retry: false,
  });

  // Mock function to start/stop automation
  const toggleAutomation = () => {
    setAutomationRunning(!automationRunning);
    toast({
      title: automationRunning ? "Automation Paused" : "Automation Started",
      description: automationRunning 
        ? "FINDOM automation has been paused" 
        : "FINDOM automation is now running",
    });
  };

  // Function to generate some mock activities
  useEffect(() => {
    // Initial mock activities
    const initialActivities: AutomationActivity[] = [
      {
        id: 'act-' + Date.now() + '-1',
        timestamp: new Date(Date.now() - 5 * 60000),
        type: 'login',
        platform: 'onlyfans',
        description: 'Successful login to OnlyFans',
        status: 'success',
      },
      {
        id: 'act-' + Date.now() + '-2',
        timestamp: new Date(Date.now() - 3 * 60000),
        type: 'message',
        platform: 'onlyfans',
        description: 'Checked for new messages',
        status: 'success',
        details: {
          messagesFound: 2,
          messagesProcessed: 2,
        }
      },
      {
        id: 'act-' + Date.now() + '-3',
        timestamp: new Date(Date.now() - 1 * 60000),
        type: 'content',
        platform: 'onlyfans',
        description: 'Generated and posted new content',
        status: 'success',
        details: {
          contentType: 'text',
          contentId: 'content-' + Date.now()
        }
      }
    ];
    
    setActivities(initialActivities);
    
    // Update stats
    setAutomationStats({
      messagesProcessed: 5,
      messagesResponded: 3,
      contentPosted: 1,
      loginAttempts: 2,
      successRate: 92
    });

    // Simulate new activities arriving
    const interval = setInterval(() => {
      if (automationRunning) {
        const types = ['login', 'message', 'content', 'system'] as const;
        const platforms = ['onlyfans', 'instagram', 'twitter'];
        const statuses = ['success', 'success', 'success', 'failed'] as const; // 75% success rate
        
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        let description = '';
        let details = {};
        
        switch (randomType) {
          case 'login':
            description = randomStatus === 'success' 
              ? `Successfully logged in to ${randomPlatform}` 
              : `Failed to log in to ${randomPlatform}`;
            setAutomationStats(prev => ({
              ...prev,
              loginAttempts: prev.loginAttempts + 1,
              successRate: randomStatus === 'success' 
                ? Math.min(100, prev.successRate + 1) 
                : Math.max(0, prev.successRate - 3)
            }));
            break;
          case 'message':
            const msgCount = Math.floor(Math.random() * 5);
            description = `Checked for new messages on ${randomPlatform}`;
            details = {
              messagesFound: msgCount,
              messagesProcessed: msgCount
            };
            setAutomationStats(prev => ({
              ...prev,
              messagesProcessed: prev.messagesProcessed + msgCount,
              messagesResponded: prev.messagesResponded + (msgCount > 0 ? Math.ceil(msgCount * 0.7) : 0),
              successRate: randomStatus === 'success' 
                ? Math.min(100, prev.successRate + 1) 
                : Math.max(0, prev.successRate - 2)
            }));
            break;
          case 'content':
            description = randomStatus === 'success'
              ? `Generated and posted new content to ${randomPlatform}`
              : `Failed to post content to ${randomPlatform}`;
            details = {
              contentType: Math.random() > 0.3 ? 'text' : 'image',
              contentId: 'content-' + Date.now()
            };
            setAutomationStats(prev => ({
              ...prev,
              contentPosted: randomStatus === 'success' ? prev.contentPosted + 1 : prev.contentPosted,
              successRate: randomStatus === 'success' 
                ? Math.min(100, prev.successRate + 2) 
                : Math.max(0, prev.successRate - 3)
            }));
            break;
          case 'system':
            description = `System maintenance on ${randomPlatform} accounts`;
            setAutomationStats(prev => ({
              ...prev,
              successRate: randomStatus === 'success' 
                ? Math.min(100, prev.successRate + 1) 
                : Math.max(0, prev.successRate - 1)
            }));
            break;
        }
        
        const newActivity: AutomationActivity = {
          id: 'act-' + Date.now(),
          timestamp: new Date(),
          type: randomType,
          platform: randomPlatform,
          description,
          status: randomStatus,
          details
        };
        
        // Add to start of array and limit to 20 items
        setActivities(prev => [newActivity, ...prev].slice(0, 20));
      }
    }, 10000); // New activity every 10 seconds
    
    return () => clearInterval(interval);
  }, [automationRunning]);

  // Function to get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Bot className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'content':
        return <FileText className="h-4 w-4" />;
      case 'system':
        return <Activity className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  // Function to format date
  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">FINDOM Autonomous Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Real-time monitoring of automated operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              toast({
                title: "Dashboard Refreshed",
                description: "The dashboard data has been updated",
              });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button 
            onClick={toggleAutomation}
            variant={automationRunning ? "destructive" : "default"}
          >
            {automationRunning ? (
              <>
                <Pause className="mr-2 h-4 w-4" /> Pause Automation
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Start Automation
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.messagesProcessed}</div>
            <p className="text-xs text-gray-400">
              Responded to {automationStats.messagesResponded} messages
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Content Posted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.contentPosted}</div>
            <p className="text-xs text-gray-400">
              Across all platforms
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Login Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.loginAttempts}</div>
            <p className="text-xs text-gray-400">
              Account authentication attempts
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.successRate}%</div>
            <Progress 
              value={automationStats.successRate} 
              className="h-2" 
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border border-gray-800 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Automation Activities</CardTitle>
            <CardDescription>
              Real-time log of automation system operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDate(activity.timestamp)}
                      </TableCell>
                      <TableCell>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="flex items-center">
                              {getActivityIcon(activity.type)}
                              <span className="ml-2">{activity.description}</span>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">{activity.type.toUpperCase()} Activity Details</h4>
                              <p className="text-sm">{activity.description}</p>
                              {activity.details && (
                                <div className="text-xs text-gray-400">
                                  {Object.entries(activity.details).map(([key, value]) => (
                                    <div key={key}>
                                      <strong>{key}:</strong> {value as string}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>
                        {activity.platform}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            activity.status === "success"
                              ? "bg-green-900/30 text-green-400 hover:bg-green-900/30"
                              : activity.status === "failed"
                              ? "bg-red-900/30 text-red-400 hover:bg-red-900/30"
                              : "bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/30"
                          }
                        >
                          {activity.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border border-gray-800">
          <CardHeader>
            <CardTitle>Monitored Accounts</CardTitle>
            <CardDescription>
              Web accounts under autonomous management
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accountsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : accounts?.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {accounts.map((account: WebAccount) => (
                    <div 
                      key={account.id} 
                      className="p-3 rounded-md border border-gray-800 hover:bg-gray-900/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{account.accountName}</div>
                        <Badge
                          variant={
                            account.status === "active" ? "outline" : "secondary"
                          }
                          className={
                            account.status === "active"
                              ? "bg-green-900/30 text-green-400 hover:bg-green-900/30"
                              : "bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/30"
                          }
                        >
                          {account.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">{account.service}</div>
                      <div className="text-xs mt-2 text-gray-500">
                        Last activity: {formatDate(account.lastActivity)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No web accounts found.</p>
                <p className="mt-2">
                  Add accounts in the Web Accounts tab to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}