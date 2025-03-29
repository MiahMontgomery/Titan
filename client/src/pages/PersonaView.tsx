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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Progress Dashboard</span>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  Track progress on features, milestones, and goals assigned to this persona
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {/* Feature 1 */}
                  <AccordionItem value="feature-1" className="border-b border-gray-700">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex-1 flex justify-between items-center pr-4">
                        <div>
                          <h3 className="text-lg font-medium text-left">AI-Driven Personalized Interactive Experience</h3>
                          <p className="text-sm text-gray-400 mt-1 text-left">Building an AI-driven interactive experience tailored to user preferences</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">68%</span>
                            <div className="w-20 bg-gray-700 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-blue-800 text-blue-100 rounded-full">In Progress</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-4">
                        <Accordion type="multiple" className="w-full">
                          {/* Milestone 1.1 */}
                          <AccordionItem value="milestone-1-1" className="border-b border-gray-700/50 mt-2">
                            <AccordionTrigger className="hover:no-underline py-2">
                              <div className="flex-1 flex justify-between items-center pr-4">
                                <div className="flex items-center">
                                  <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center text-xs mr-2">1</div>
                                  <div>
                                    <h4 className="font-medium text-left">User Interface Adaptation</h4>
                                    <p className="text-sm text-gray-400 text-left">Developing adaptive UI components that respond to user behavior</p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium mr-2">75%</span>
                                  <div className="w-16 bg-gray-700 rounded-full h-1.5">
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-8">
                              <div className="border-l border-gray-700 pl-4 py-2 space-y-3">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-3 h-3 rounded-full border border-blue-500 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm">Design adaptable UI components</p>
                                    <p className="text-xs text-gray-400">Completed</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-3 h-3 rounded-full border border-blue-500 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm">Implement reactive layout system</p>
                                    <p className="text-xs text-green-500">In Progress (80%)</p>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Milestone 1.2 */}
                          <AccordionItem value="milestone-1-2" className="border-b border-gray-700/50 mt-2">
                            <AccordionTrigger className="hover:no-underline py-2">
                              <div className="flex-1 flex justify-between items-center pr-4">
                                <div className="flex items-center">
                                  <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center text-xs mr-2">2</div>
                                  <div>
                                    <h4 className="font-medium text-left">AI Algorithm Development</h4>
                                    <p className="text-sm text-gray-400 text-left">Creating AI algorithms for personalized experience generation</p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium mr-2">60%</span>
                                  <div className="w-16 bg-gray-700 rounded-full h-1.5">
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-8">
                              <div className="border-l border-gray-700 pl-4 py-2 space-y-3">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-3 h-3 rounded-full border border-green-500 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm">Develop preference learning algorithm</p>
                                    <p className="text-xs text-gray-400">Completed</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-3 h-3 rounded-full border border-yellow-500 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm">Implement real-time content adaptation</p>
                                    <p className="text-xs text-yellow-500">In Progress (40%)</p>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Feature 2 */}
                  <AccordionItem value="feature-2" className="border-b border-gray-700">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex-1 flex justify-between items-center pr-4">
                        <div>
                          <h3 className="text-lg font-medium text-left">Client Messaging Automation</h3>
                          <p className="text-sm text-gray-400 mt-1 text-left">Autonomous client communication and relationship management</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">100%</span>
                            <div className="w-20 bg-gray-700 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-green-800 text-green-100 rounded-full">Completed</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-4">
                        <Accordion type="multiple" className="w-full">
                          {/* Milestone 2.1 */}
                          <AccordionItem value="milestone-2-1" className="border-b border-gray-700/50 mt-2">
                            <AccordionTrigger className="hover:no-underline py-2">
                              <div className="flex-1 flex justify-between items-center pr-4">
                                <div className="flex items-center">
                                  <div className="w-5 h-5 rounded-full bg-green-800 flex items-center justify-center text-xs mr-2">1</div>
                                  <div>
                                    <h4 className="font-medium text-left">Message Response System</h4>
                                    <p className="text-sm text-gray-400 text-left">AI-driven automated messaging response capabilities</p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium mr-2">100%</span>
                                  <div className="w-16 bg-gray-700 rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-8">
                              <div className="border-l border-gray-700 pl-4 py-2 space-y-3">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-3 h-3 rounded-full border border-green-500 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm">Develop natural language processing system</p>
                                    <p className="text-xs text-gray-400">Completed</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-3 h-3 rounded-full border border-green-500 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm">Implement sentiment analysis</p>
                                    <p className="text-xs text-gray-400">Completed</p>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Feature 3 */}
                  <AccordionItem value="feature-3" className="border-b border-gray-700">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex-1 flex justify-between items-center pr-4">
                        <div>
                          <h3 className="text-lg font-medium text-left">Content Generation and Publishing System</h3>
                          <p className="text-sm text-gray-400 mt-1 text-left">Autonomous content creation and multi-platform publishing</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">45%</span>
                            <div className="w-20 bg-gray-700 rounded-full h-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-purple-800 text-purple-100 rounded-full">In Progress</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-4">
                        <p className="text-sm text-gray-400 py-2">Milestones not yet defined.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="mt-4">
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