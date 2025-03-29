import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Persona } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, RefreshCw, Settings, MessageSquare } from 'lucide-react';
import { Link } from 'wouter';
import { SafeImage } from '@/components/ui/safe-image';
import { ChatTab } from '@/components/ChatTab';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';

export default function PersonaView() {
  const [_, params] = useRoute('/personas/:id');
  const personaId = params?.id;
  const [activeTab, setActiveTab] = useState('progress');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: persona, isLoading, error } = useQuery<Persona>({
    queryKey: [`/api/personas/${personaId}`],
    enabled: !!personaId,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ isActive }: { isActive: boolean }) => {
      return apiRequest(`/api/personas/${personaId}/toggle-active`, 'POST', { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/personas/${personaId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas'] });
      toast({
        title: 'Status updated',
        description: 'Persona status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update status',
        description: 'Please try again later.'
      });
      console.error('Error toggling persona active status:', error);
    }
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load persona details. Please try again.',
      });
    }
  }, [error, toast]);

  const handleStatusToggle = () => {
    if (persona) {
      toggleActive.mutate({ isActive: !persona.isActive });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-2xl font-bold mb-2">Persona Not Found</h2>
        <p className="text-gray-400 mb-4">The persona you are looking for doesn't exist or has been removed.</p>
        <Link href="/">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header - Cleaner, simpler design */}
      <header className="bg-background py-3 px-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3 border border-gray-700">
                <SafeImage
                  src={persona.imageUrl || ''}
                  alt={persona.displayName || persona.name}
                  className="w-full h-full object-cover rounded-full"
                  fallback={
                    <span className="text-xl">{persona.emoji || '🧠'}</span>
                  }
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">{persona.displayName || persona.name}</h1>
                <p className="text-sm text-gray-400 max-w-lg truncate">{persona.description}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={persona.isActive ? 'default' : 'outline'}
              size="sm"
              onClick={handleStatusToggle}
              disabled={toggleActive.isPending}
              className={persona.isActive ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {toggleActive.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {persona.isActive ? 'Active' : 'Inactive'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-5">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="progress" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Live Code Display */}
              <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900 transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                <div className="p-3 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="font-medium text-gray-200">Live Code Generation</h3>
                  <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-gray-800">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="p-0">
                  <div className="bg-[#1e1e1e] overflow-hidden">
                    <div className="bg-gray-950 text-xs border-b border-gray-800 px-3 py-1 flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span>automatedScheduler.ts</span>
                      </div>
                      <span className="text-gray-500">Modifying...</span>
                    </div>
                    <pre className="text-xs p-3 overflow-auto h-[300px] font-mono">
                      <code className="text-gray-300">
{`/**
 * Automated Content Scheduling System
 * 
 * This module manages the autonomous scheduling of content
 * generation, approvals, and publishing across multiple platforms.
 */

// Platform-specific content quotas and posting frequency
const PLATFORM_QUOTAS = {
  'onlyfans': {
    dailyPosts: 2,
    dailyStories: 4,
    weeklyPromotions: 3,
    idealTimeSpacing: 5 // hours
  },
  'instagram': {
    dailyPosts: 1,
    dailyStories: 6,
    weeklyPromotions: 2,
    idealTimeSpacing: 8 // hours
  },
  'twitter': {
    dailyPosts: 4,
    dailyStories: 0,
    weeklyPromotions: 2,
    idealTimeSpacing: 3 // hours
  }
}

// Schedule specific content type across a date range
function scheduleContentType(
  platform, 
  contentType,
  count,
  startDate,
  endDate
) {
  // Calculate optimal posting times using engagement analytics
  const optimalTimes = getOptimalPostingTimes(
    platform,
    contentType,
    startDate,
    endDate,
    count
  );
  
  console.log(\`Scheduling \${count} \${contentType} posts for \${platform}\`);
  
  // Create scheduled items
  optimalTimes.forEach((time, index) => {
    const id = generateUniqueId(platform, contentType, index);
    const item = {
      contentId: id,
      contentType,
      platform,
      scheduledTime: time,
      status: 'pending',
      priority: calculatePriority(platform, contentType, time)
    };
    
    saveScheduledItem(item);
  });
  
  // Sort queue by scheduled time and priority
  sortScheduleQueue();
}

// Calculate priority score for a content item  
function calculatePriority(platform, contentType, time) {
  let priority = 5; // Default mid-priority
  
  // Adjust by platform importance
  if (platform === 'onlyfans') priority += 2;
  
  // Adjust by content type
  if (contentType === 'promotion') priority += 1;
  
  // Adjust by time - higher priority for prime time hours
  const hour = time.hour;
  if (hour >= 18 && hour <= 22) priority += 1; // Evening prime time
  
  // Ensure it stays within 1-10 range
  return Math.max(1, Math.min(10, priority));
}

// Get the next scheduled content items to publish
function getNextScheduledItems(count = 5) {
  // Return the next N pending items
  return activeQueue
    .filter(item => item.status === 'pending')
    .slice(0, count);
}

// Update status of a scheduled item
function updateItemStatus(itemId, status) {
  const item = scheduledItems.get(itemId);
  if (!item) return false;
  
  item.status = status;
  scheduledItems.set(itemId, item);
  
  // If published or failed, recalculate queue
  if (status === 'published' || status === 'failed') {
    recalculateQueue();
  }
  
  return true;
}`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Live Updates & Rollbacks */}
              <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900 transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                <div className="p-3 border-b border-gray-800">
                  <h3 className="font-medium text-gray-200">System Updates & Rollbacks</h3>
                </div>
                <div className="overflow-auto h-[328px] py-2 px-3">
                  <div className="space-y-2">
                    {/* First Update */}
                    <div className="border border-gray-800 rounded-md p-2 cursor-pointer transition-all hover:border-green-500 hover:shadow-[0_0_6px_rgba(74,222,128,0.3)]">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                            <h4 className="text-sm font-medium">Added automated content scheduling</h4>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Implemented system for optimal time calculation, platform-specific quotas</p>
                        </div>
                        <span className="text-xs text-gray-500">10:42 AM</span>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs py-0 px-2 bg-transparent hover:bg-gray-800">
                            View Changes
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs py-0 px-2 bg-transparent hover:bg-gray-800">
                            Rollback
                          </Button>
                        </div>
                        <span className="text-xs text-green-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M20 6 9 17l-5-5"/>
                          </svg>
                          Success
                        </span>
                      </div>
                    </div>
                    
                    {/* Second Update */}
                    <div className="border border-gray-800 rounded-md p-2 cursor-pointer transition-all hover:border-green-500 hover:shadow-[0_0_6px_rgba(74,222,128,0.3)]">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                            <h4 className="text-sm font-medium">Enhanced AI response patterns</h4>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Improved contextual understanding with client message history</p>
                        </div>
                        <span className="text-xs text-gray-500">10:12 AM</span>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs py-0 px-2 bg-transparent hover:bg-gray-800">
                            View Changes
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs py-0 px-2 bg-transparent hover:bg-gray-800">
                            Rollback
                          </Button>
                        </div>
                        <span className="text-xs text-green-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M20 6 9 17l-5-5"/>
                          </svg>
                          Success
                        </span>
                      </div>
                    </div>
                    
                    {/* Third Update */}
                    <div className="border border-gray-800 rounded-md p-2 cursor-pointer transition-all hover:border-green-500 hover:shadow-[0_0_6px_rgba(74,222,128,0.3)]">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-400 mr-2"></div>
                            <h4 className="text-sm font-medium">Fixed OnlyFans authentication issue</h4>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Resolved login session timeout error with enhanced token refresh</p>
                        </div>
                        <span className="text-xs text-gray-500">9:36 AM</span>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs py-0 px-2 bg-transparent hover:bg-gray-800">
                            View Changes
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs py-0 px-2 bg-transparent hover:bg-gray-800">
                            Rollback
                          </Button>
                        </div>
                        <span className="text-xs text-amber-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z"/>
                          </svg>
                          Partial
                        </span>
                      </div>
                    </div>
                    
                    {/* Fourth Update */}
                    <div className="border border-gray-800 rounded-md p-2 cursor-pointer transition-all hover:border-green-500 hover:shadow-[0_0_6px_rgba(74,222,128,0.3)]">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                            <h4 className="text-sm font-medium">Optimized image processing pipeline</h4>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Reduced processing time by 40% with improved image compression</p>
                        </div>
                        <span className="text-xs text-gray-500">Yesterday</span>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs py-0 px-2 bg-transparent hover:bg-gray-800">
                            View Changes
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs py-0 px-2 bg-transparent hover:bg-gray-800">
                            Rollback
                          </Button>
                        </div>
                        <span className="text-xs text-green-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M20 6 9 17l-5-5"/>
                          </svg>
                          Success
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Real-time Process Logging */}
              <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900 transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                <div className="p-3 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="font-medium text-gray-200">Real-time Process Logs</h3>
                  <div className="flex items-center">
                    <span className="animate-pulse mr-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </span>
                    <span className="text-xs text-gray-400">Live</span>
                  </div>
                </div>
                <div className="p-0">
                  <div className="bg-[#1e1e1e] h-[328px] overflow-auto p-3 text-xs font-mono">
                    <div className="space-y-1.5">
                      <div className="text-gray-500">[11:05:32] <span className="text-blue-400">INFO</span> » Starting scheduled content creation workflow</div>
                      <div className="text-gray-500">[11:05:33] <span className="text-blue-400">INFO</span> » Analyzing engagement metrics for optimal posting times</div>
                      <div className="text-gray-500">[11:05:35] <span className="text-green-400">SUCCESS</span> » Scheduled 3 content items for "OnlyFans"</div>
                      <div className="text-gray-500">[11:05:36] <span className="text-blue-400">INFO</span> » Loading browser automation for content publishing</div>
                      <div className="text-gray-500">[11:05:38] <span className="text-yellow-400">WARN</span> » Browser automation took longer than expected (3.2s)</div>
                      <div className="text-gray-500">[11:05:42] <span className="text-blue-400">INFO</span> » Generating Instagram post content using GPT-4o</div>
                      <div className="text-gray-500">[11:05:48] <span className="text-green-400">SUCCESS</span> » Content generated successfully</div>
                      <div className="text-gray-500">[11:05:49] <span className="text-blue-400">INFO</span> » Running image generation with theme: "summer beach"</div>
                      <div className="text-gray-500">[11:06:02] <span className="text-green-400">SUCCESS</span> » Image generated successfully</div>
                      <div className="text-gray-500">[11:06:03] <span className="text-blue-400">INFO</span> » Optimizing image for Instagram dimensions</div>
                      <div className="text-gray-500">[11:06:05] <span className="text-green-400">SUCCESS</span> » Image optimized successfully</div>
                      <div className="text-gray-500">[11:06:06] <span className="text-blue-400">INFO</span> » Preparing to publish Instagram content</div>
                      <div className="text-gray-500">[11:06:08] <span className="text-blue-400">INFO</span> » Navigating to Instagram login page</div>
                      <div className="text-gray-500">[11:06:12] <span className="text-green-400">SUCCESS</span> » Logged in successfully</div>
                      <div className="text-gray-500">[11:06:15] <span className="text-blue-400">INFO</span> » Navigating to content creation page</div>
                      <div className="text-gray-500">[11:06:18] <span className="text-green-400">SUCCESS</span> » Content uploaded successfully</div>
                      <div className="text-gray-500">[11:06:19] <span className="text-blue-400">INFO</span> » Scheduling content for optimal engagement time</div>
                      <div className="text-gray-500">[11:06:21] <span className="text-green-400">SUCCESS</span> » Content scheduled for 3:15 PM</div>
                      <div className="text-gray-500">[11:06:22] <span className="text-blue-400">INFO</span> » Updating analytics database with new content item</div>
                      <div className="text-gray-500">[11:06:23] <span className="text-green-400">SUCCESS</span> » Database updated successfully</div>
                      <div className="text-gray-500">[11:06:25] <span className="text-blue-400">INFO</span> » Starting client message response workflow</div>
                      <div className="text-gray-500">[11:06:26] <span className="text-blue-400">INFO</span> » Checking for new client messages</div>
                      <div className="text-gray-500">[11:06:29] <span className="text-blue-400">INFO</span> » Found 3 new messages requiring responses</div>
                      <div className="text-gray-500 font-bold">[11:06:30] <span className="text-blue-400">INFO</span> » Generating personalized responses...</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Interactive Chat */}
              <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900 transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] flex flex-col">
                <div className="p-3 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="font-medium text-gray-200">Project Assistant</h3>
                  <span className="animate-pulse flex items-center text-xs text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                    Online
                  </span>
                </div>
                <div className="flex-grow overflow-auto p-3 h-[252px]">
                  <div className="space-y-3">
                    <div className="flex justify-start">
                      <div className="max-w-[80%] bg-gray-800 rounded-lg rounded-tl-none p-2.5 text-sm">
                        <p>Hi there! I'm your project assistant. How can I help with the {persona?.name || 'persona'} automation today?</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-blue-900/40 rounded-lg rounded-tr-none p-2.5 text-sm">
                        <p>Can you optimize the OnlyFans message response time?</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-start">
                      <div className="max-w-[80%] bg-gray-800 rounded-lg rounded-tl-none p-2.5 text-sm">
                        <p>I can help with that! I'll adjust the response timing pattern for OnlyFans messages to prioritize faster responses.</p>
                        <p className="mt-1.5">Would you prefer immediate responses or more natural timing with 3-5 minute delays?</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-blue-900/40 rounded-lg rounded-tr-none p-2.5 text-sm">
                        <p>Let's try the natural timing approach for better engagement</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-start">
                      <div className="max-w-[80%] bg-gray-800 rounded-lg rounded-tl-none p-2.5 text-sm">
                        <p>Implementing natural response timing with 3-5 minute delays for OnlyFans messages. This should improve engagement rates while maintaining a realistic conversation flow.</p>
                        <p className="mt-1.5 text-green-400">✓ Settings updated successfully</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-800 p-3">
                  <div className="flex">
                    <Input 
                      placeholder="Type your message..." 
                      className="bg-gray-800 border-gray-700 flex-grow"
                    />
                    <Button className="ml-2 bg-blue-600 hover:bg-blue-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m22 2-7 20-4-9-9-4Z"/>
                        <path d="M22 2 11 13"/>
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left column - Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Review engagement and performance analytics for this persona
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Engagement Rate</h3>
                        <p className="text-2xl font-bold">24.8%</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-green-500">↑ 3.2%</span>
                          <span className="text-xs text-gray-500 ml-1">vs last week</span>
                        </div>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Response Rate</h3>
                        <p className="text-2xl font-bold">89.5%</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-green-500">↑ 1.7%</span>
                          <span className="text-xs text-gray-500 ml-1">vs last week</span>
                        </div>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Active Subscribers</h3>
                        <p className="text-2xl font-bold">128</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-green-500">↑ 12</span>
                          <span className="text-xs text-gray-500 ml-1">vs last week</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3">Platform Performance</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">OnlyFans</span>
                            <span className="text-sm font-medium">85%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-pink-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Instagram</span>
                            <span className="text-sm font-medium">62%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Twitter</span>
                            <span className="text-sm font-medium">41%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '41%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Right column - Live Code & Log */}
              <div className="space-y-4">
                {/* Live Code Display */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex justify-between items-center">
                      <span>Live Code Generation</span>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="bg-[#1e1e1e] border border-gray-800 rounded-md overflow-hidden">
                      <div className="bg-gray-900 text-xs border-b border-gray-800 px-3 py-1 flex justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <span>personaAgent.ts</span>
                        </div>
                        <span className="text-gray-500">Generating code...</span>
                      </div>
                      <pre className="text-xs p-3 overflow-auto max-h-[240px] font-mono">
                        <code className="text-gray-300">
{`/**
 * Intelligent Response Generation for ${persona?.name || 'Persona'}
 * 
 * This module handles dynamic content generation based on context,
 * user interactions, and persona-specific behavioral patterns.
 */
 
import { OpenAI } from 'openai';
import { analyzeUserIntent } from './intentAnalysis';
import { PersonaContext } from '../types';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function generatePersonalizedResponse(
  userMessage: string,
  persona: PersonaContext
): Promise<string> {
  // Analyze user intent and emotional state
  const userIntent = await analyzeUserIntent(userMessage);
  
  // Build contextualized prompt with persona-specific instructions
  const prompt = buildPrompt(userMessage, userIntent, persona);
  
  // Generate response with GPT-4o
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: persona.instructions },
      { role: "user", content: prompt }
    ],
    temperature: persona.creativity || 0.7,
    max_tokens: 500
  });
  
  return response.choices[0].message.content;
}`}
                        </code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Replit-style Chat Box */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">System Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-[#1e1e1e] border border-gray-800 rounded-md overflow-hidden flex flex-col h-[300px]">
                      <div className="flex-1 p-3 overflow-auto">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center">
                              <span className="text-xs">🤖</span>
                            </div>
                            <div>
                              <div className="bg-gray-800 rounded-lg p-2 text-xs text-gray-300">
                                <p>Starting performance optimization for {persona?.name || 'Persona'}</p>
                              </div>
                              <div className="flex items-center mt-1 gap-2">
                                <span className="text-xs text-gray-500">11:32 AM</span>
                                <Button variant="ghost" size="sm" className="h-5 px-1.5">
                                  <span className="text-xs">Rollback</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center">
                              <span className="text-xs">🤖</span>
                            </div>
                            <div>
                              <div className="bg-gray-800 rounded-lg p-2 text-xs text-gray-300">
                                <p>Analyzing engagement metrics across platforms...</p>
                                <p className="text-gray-500 mt-1">Found 3 active platforms with 128 total subscribers</p>
                              </div>
                              <div className="flex items-center mt-1 gap-2">
                                <span className="text-xs text-gray-500">11:35 AM</span>
                                <Button variant="ghost" size="sm" className="h-5 px-1.5">
                                  <span className="text-xs">Rollback</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center">
                              <span className="text-xs">🤖</span>
                            </div>
                            <div>
                              <div className="bg-gray-800 rounded-lg p-2 text-xs text-gray-300">
                                <p>Generating optimized content patterns based on highest performing posts</p>
                                <p className="text-gray-500 mt-1">Identified 5 high-engagement content patterns</p>
                              </div>
                              <div className="flex items-center mt-1 gap-2">
                                <span className="text-xs text-gray-500">11:42 AM</span>
                                <Button variant="ghost" size="sm" className="h-5 px-1.5">
                                  <span className="text-xs">Rollback</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-800 p-2 flex">
                        <Input 
                          placeholder="Add system instruction..." 
                          className="bg-gray-900 border-gray-700 text-xs h-8"
                        />
                        <Button size="sm" className="ml-2 h-8">
                          Send
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sales" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Dashboard</CardTitle>
                <CardDescription>
                  Monitor revenue and sales performance for this persona
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Monthly Revenue</h3>
                      <p className="text-2xl font-bold">$2,458</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-green-500">↑ $348</span>
                        <span className="text-xs text-gray-500 ml-1">vs last month</span>
                      </div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Conversion Rate</h3>
                      <p className="text-2xl font-bold">18.3%</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-green-500">↑ 2.1%</span>
                        <span className="text-xs text-gray-500 ml-1">vs last month</span>
                      </div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Avg. Transaction</h3>
                      <p className="text-2xl font-bold">$42.50</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-red-500">↓ $1.20</span>
                        <span className="text-xs text-gray-500 ml-1">vs last month</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Recent Transactions</h3>
                    <div className="space-y-3">
                      {/* Placeholder for transactions - will be replaced with actual data */}
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <div>
                          <p className="text-sm font-medium">Custom Video Request</p>
                          <p className="text-xs text-gray-400">Mar 28, 2025</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">$120.00</p>
                          <p className="text-xs text-green-500">Completed</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <div>
                          <p className="text-sm font-medium">Monthly Subscription</p>
                          <p className="text-xs text-gray-400">Mar 25, 2025</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">$29.99</p>
                          <p className="text-xs text-green-500">Completed</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <div>
                          <p className="text-sm font-medium">Premium Content Access</p>
                          <p className="text-xs text-gray-400">Mar 22, 2025</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">$15.99</p>
                          <p className="text-xs text-green-500">Completed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            {persona && <ChatTab persona={persona} />}
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Persona Settings</CardTitle>
                <CardDescription>
                  Advanced configuration for this persona
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Model & Brain section - moved from header */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">AI Model & Brain Configuration</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Model</Label>
                        <div className="bg-gray-900 p-2 rounded mt-1 flex items-center">
                          <span className="mr-2">🧠</span>
                          <span className="text-sm">GPT-4o Turbo</span>
                        </div>
                      </div>
                      <div>
                        <Label>Behavior Settings</Label>
                        <div className="space-y-2 mt-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Tone</span>
                            <span className="text-sm text-gray-400">{persona.behavior.tone || 'Professional'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Style</span>
                            <span className="text-sm text-gray-400">{persona.behavior.style || 'Informative'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Vocabulary</span>
                            <span className="text-sm text-gray-400">{persona.behavior.vocabulary || 'Advanced'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Responsiveness</span>
                            <div className="flex items-center">
                              <span className="mr-2 text-sm text-gray-400">{persona.behavior.responsiveness}/10</span>
                              <div className="w-24 bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full" 
                                  style={{ width: `${(persona.behavior.responsiveness / 10) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personality Traits */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">Persona Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Display Name</Label>
                        <Input 
                          value={persona.displayName || persona.name} 
                          className="mt-1 bg-gray-900 border-gray-700" 
                          disabled
                        />
                      </div>
                      <div>
                        <Label>Internal Name</Label>
                        <Input 
                          value={persona.name} 
                          className="mt-1 bg-gray-900 border-gray-700" 
                          disabled
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea 
                          value={persona.description} 
                          className="mt-1 bg-gray-900 border-gray-700" 
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  {/* Autonomy Settings */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">Autonomy Settings</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Autonomy Level</p>
                          <p className="text-xs text-gray-400">How independent this persona is in decision-making</p>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm">{persona.autonomy.level}/10</span>
                          <div className="w-24 bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full" 
                              style={{ width: `${(persona.autonomy.level / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Can Initiate Conversations</p>
                          <p className="text-xs text-gray-400">Ability to start conversations without prompting</p>
                        </div>
                        <div>
                          {persona.autonomy.canInitiateConversation ? 
                            <span className="px-2 py-1 bg-green-800 text-green-100 rounded-full text-xs">Enabled</span> : 
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">Disabled</span>
                          }
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Can Create Content</p>
                          <p className="text-xs text-gray-400">Ability to create and publish content autonomously</p>
                        </div>
                        <div>
                          {persona.autonomy.canCreateContent ? 
                            <span className="px-2 py-1 bg-green-800 text-green-100 rounded-full text-xs">Enabled</span> : 
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">Disabled</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}