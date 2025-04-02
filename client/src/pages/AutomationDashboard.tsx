import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useWebSocketContext } from "@/lib/websocket";
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
  Activity,
  Globe,
  ScreenShare,
  MousePointer,
  Keyboard,
  Image
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

// Types for browser activities
interface BrowserSession {
  id: string;
  timestamp: Date;
  accountId: number;
  platform: string;
  url: string;
  action: string;
  screenshot?: string; // Base64 encoded image
  status: 'active' | 'complete' | 'error';
}

export default function AutomationDashboard() {
  const { toast } = useToast();
  const webSocketContext = useWebSocketContext();
  const [automationRunning, setAutomationRunning] = useState(true);
  const [activities, setActivities] = useState<AutomationActivity[]>([]);
  const [browserSessions, setBrowserSessions] = useState<BrowserSession[]>([]);
  const [activeBrowserSession, setActiveBrowserSession] = useState<BrowserSession | null>(null);
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

  // Simulate browser sessions
  useEffect(() => {
    if (automationRunning) {
      // Sample URLs that might be accessed by the automation
      const urls = [
        'https://onlyfans.com/login',
        'https://onlyfans.com/dashboard',
        'https://onlyfans.com/my/subscribers',
        'https://onlyfans.com/my/statements',
        'https://twitter.com/login',
        'https://twitter.com/home',
        'https://instagram.com/login',
        'https://instagram.com/direct/inbox',
      ];

      // Generate initial browser sessions
      const initialSessions: BrowserSession[] = [
        {
          id: 'session-' + Date.now() + '-1',
          timestamp: new Date(Date.now() - 15 * 60000),
          accountId: 1,
          platform: 'onlyfans',
          url: 'https://onlyfans.com/login',
          action: 'Logging in to OnlyFans account',
          status: 'complete'
        },
        {
          id: 'session-' + Date.now() + '-2',
          timestamp: new Date(Date.now() - 10 * 60000),
          accountId: 1,
          platform: 'onlyfans',
          url: 'https://onlyfans.com/my/subscribers',
          action: 'Checking subscriber messages',
          status: 'complete'
        }
      ];

      setBrowserSessions(initialSessions);
      
      // Set the active browser session
      setActiveBrowserSession(initialSessions[1]);

      // Simulate new browser sessions arriving
      const interval = setInterval(() => {
        if (automationRunning) {
          const platforms = ['onlyfans', 'instagram', 'twitter'];
          const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
          
          // Select a URL that matches the platform
          const platformUrls = urls.filter(url => url.includes(randomPlatform));
          const randomUrl = platformUrls[Math.floor(Math.random() * platformUrls.length)];
          
          // Create actions based on URL
          let action = 'Browsing';
          if (randomUrl.includes('login')) {
            action = 'Logging in to account';
          } else if (randomUrl.includes('subscribers') || randomUrl.includes('inbox')) {
            action = 'Checking messages';
          } else if (randomUrl.includes('statements')) {
            action = 'Checking earnings';
          } else if (randomUrl.includes('home')) {
            action = 'Browsing timeline';
          }
          
          const newSession: BrowserSession = {
            id: 'session-' + Date.now(),
            timestamp: new Date(),
            accountId: 1, // Assuming account ID 1 for demo
            platform: randomPlatform,
            url: randomUrl,
            action: `${action} on ${randomPlatform}`,
            status: 'active'
          };
          
          // Add to sessions and update active session
          setBrowserSessions(prev => [newSession, ...prev].slice(0, 20));
          setActiveBrowserSession(newSession);
          
          // Mark the session as complete after 5 seconds
          setTimeout(() => {
            setBrowserSessions(prev => 
              prev.map(session => 
                session.id === newSession.id 
                  ? { ...session, status: 'complete' } 
                  : session
              )
            );
          }, 5000);
        }
      }, 15000); // New browser session every 15 seconds
      
      return () => clearInterval(interval);
    }
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

      {/* Live Browser View Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Live Browser View</h2>
        <p className="text-gray-400 mb-6">
          Real-time visualization of the FINDOM agent's web browsing activities
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Browser History */}
          <Card className="border border-gray-800">
            <CardHeader>
              <CardTitle>Browser History</CardTitle>
              <CardDescription>
                Recent web navigation activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {browserSessions.map((session) => (
                    <div 
                      key={session.id}
                      className={`p-2 rounded-md border border-gray-800 hover:bg-gray-900/50 transition-colors cursor-pointer ${
                        activeBrowserSession?.id === session.id ? 'bg-gray-800' : ''
                      }`}
                      onClick={() => setActiveBrowserSession(session)}
                    >
                      <div className="flex items-center mb-1">
                        <Globe className="h-4 w-4 mr-2" />
                        <div className="text-sm font-medium truncate">
                          {session.url.replace(/https?:\/\//, '')}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-400">{session.platform}</div>
                        <div className="text-xs text-gray-500">{formatDate(session.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Browser Visualization */}
          <Card className="border border-gray-800 lg:col-span-3">
            <CardHeader>
              <CardTitle>
                <div className="flex justify-between items-center">
                  <span>Active Browser Session</span>
                  <Badge variant="outline" className="ml-2">
                    {activeBrowserSession?.status || 'inactive'}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                {activeBrowserSession ? activeBrowserSession.action : 'No active browsing session'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeBrowserSession ? (
                <div className="space-y-4">
                  {/* URL Bar */}
                  <div className="flex items-center border border-gray-700 rounded-md px-3 py-2 bg-gray-900">
                    <Globe className="h-4 w-4 mr-2 text-gray-400" />
                    <div className="text-sm text-gray-300 truncate">
                      {activeBrowserSession.url}
                    </div>
                  </div>
                  
                  {/* Browser Viewport (Simulated) */}
                  <div className="border border-gray-700 rounded-md bg-gray-900 overflow-hidden">
                    <div className="border-b border-gray-800 p-2 bg-gray-800 flex items-center justify-between">
                      <div className="flex space-x-1">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {activeBrowserSession.platform} - {activeBrowserSession.action}
                      </div>
                    </div>
                    <div className="flex justify-center items-center relative h-[300px] bg-gray-950 text-center">
                      {/* Simulated website content */}
                      {activeBrowserSession.url.includes('login') ? (
                        <div className="space-y-4 max-w-md mx-auto p-6">
                          <div className="text-xl font-bold text-center mb-6">Log In</div>
                          <div className="border border-gray-800 rounded-md p-3 bg-gray-900">Username</div>
                          <div className="border border-gray-800 rounded-md p-3 bg-gray-900">Password</div>
                          <div className="bg-blue-600 rounded-md p-3 text-white font-medium">Sign In</div>
                        </div>
                      ) : (
                        <div className="space-y-4 w-full max-w-2xl p-4">
                          <div className="h-8 bg-gray-800 rounded-md w-1/2 mx-auto"></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="h-20 bg-gray-800 rounded-md"></div>
                            <div className="h-20 bg-gray-800 rounded-md"></div>
                            <div className="h-20 bg-gray-800 rounded-md"></div>
                            <div className="h-20 bg-gray-800 rounded-md"></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show automation happening */}
                      {activeBrowserSession.status === 'active' && (
                        <>
                          <div 
                            className="absolute h-6 w-6 border-2 border-yellow-400 rounded-full pointer-events-none"
                            style={{ 
                              left: `${Math.random() * 70 + 15}%`, 
                              top: `${Math.random() * 70 + 15}%`,
                              transition: 'all 0.5s ease-out'
                            }}
                          ></div>
                          <div className="absolute bottom-4 right-4 bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded">
                            <div className="flex items-center">
                              <Keyboard className="h-3 w-3 mr-1" />
                              <span>Automated input</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Activity Log */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Browser Activity Log</h4>
                    <div className="text-xs text-gray-400 space-y-1 border border-gray-800 rounded-md p-2 bg-gray-900/50">
                      <div className="flex items-center">
                        <ScreenShare className="h-3 w-3 mr-2" />
                        <span>Navigated to {activeBrowserSession.url}</span>
                      </div>
                      {activeBrowserSession.url.includes('login') && (
                        <>
                          <div className="flex items-center">
                            <MousePointer className="h-3 w-3 mr-2" />
                            <span>Clicked on username field</span>
                          </div>
                          <div className="flex items-center">
                            <Keyboard className="h-3 w-3 mr-2" />
                            <span>Entered account credentials</span>
                          </div>
                          <div className="flex items-center">
                            <MousePointer className="h-3 w-3 mr-2" />
                            <span>Clicked Sign In button</span>
                          </div>
                        </>
                      )}
                      {activeBrowserSession.url.includes('subscribers') && (
                        <>
                          <div className="flex items-center">
                            <MousePointer className="h-3 w-3 mr-2" />
                            <span>Scanning for new messages</span>
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="h-3 w-3 mr-2" />
                            <span>Analyzing conversation context</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                  <Globe className="h-16 w-16 mb-4 opacity-20" />
                  <p>No active browsing session</p>
                  <p className="text-sm">Start the automation to see browser activities</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}