import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Persona, Feature } from '@/lib/types';
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
import { PerformanceTab } from '@/components/PerformanceTab';

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
  
  // Fetch features for this persona's project
  const { data: features = [], isLoading: featuresLoading } = useQuery<Feature[]>({
    queryKey: [`/api/personas/${personaId}/features`],
    enabled: !!persona?.projectId,
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
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
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
          
          <TabsContent value="performance" className="mt-4">
            <PerformanceTab persona={persona} projectId={1} />
          </TabsContent>

          <TabsContent value="progress" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Project Features & Development Roadmap</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/personas/${personaId}/features`] })}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${featuresLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  Track development of features, milestones, and goals for the {persona.name} system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {featuresLoading ? (
                  <div className="py-8 flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  </div>
                ) : features.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <p>No features have been created for this persona's project yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {features.map((feature) => (
                      <div key={feature.id} className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                        <Accordion type="single" collapsible>
                          <AccordionItem value={`feature-${feature.id}`} className="border-0">
                            <AccordionTrigger className="p-3 hover:no-underline bg-gray-900 group-hover:border-green-500 w-full">
                              <div className="flex-1 flex items-center justify-between">
                                <div className="flex-1 text-left">
                                  <h3 className="font-medium">{feature.name}</h3>
                                  <div className="flex items-center mt-1">
                                    <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${feature.progress || 0}%` }}></div>
                                    </div>
                                    <span className="text-xs text-gray-400">Progress: {feature.progress || 0}%</span>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-0">
                              <div className="pl-6 pr-3 py-2 bg-gray-950/50 border-t border-gray-800">
                                <div className="border-l border-gray-700 pl-4 space-y-3">
                                  {feature.milestones && feature.milestones.map((milestone, idx) => (
                                    <div key={milestone.id} className="group/milestone">
                                      <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value={`milestone-${feature.id}-${milestone.id}`} className="border-0">
                                          <AccordionTrigger className="py-2 hover:no-underline">
                                            <div className="text-sm font-medium group-hover/milestone:text-green-400 flex justify-between w-full">
                                              <span>{milestone.name}</span>
                                              <span className="text-xs text-gray-400">{milestone.progress || 0}%</span>
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent className="pt-0 pb-1">
                                            <div className="pl-4 border-l border-gray-800 space-y-1.5 py-1.5 text-xs">
                                              {milestone.goals && milestone.goals.map((goal) => (
                                                <div key={goal.id} className="text-gray-400">
                                                  • {goal.name} {goal.status === 'completed' && '✓'}
                                                </div>
                                              ))}
                                              
                                              {(!milestone.goals || milestone.goals.length === 0) && (
                                                <div className="text-gray-400 italic">No goals defined</div>
                                              )}
                                            </div>
                                          </AccordionContent>
                                        </AccordionItem>
                                      </Accordion>
                                    </div>
                                  ))}
                                  
                                  {(!feature.milestones || feature.milestones.length === 0) && (
                                    <div className="py-3 text-center text-gray-400 italic">
                                      No milestones defined yet
                                    </div>
                                  )}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>
                  Track revenue, conversions, and client metrics for {persona.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <div className="text-sm text-gray-400 mb-1">Monthly Revenue</div>
                    <div className="text-2xl font-semibold">${persona.sales?.monthlyRevenue || 0}</div>
                  </div>
                  
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <div className="text-sm text-gray-400 mb-1">Conversion Rate</div>
                    <div className="text-2xl font-semibold">{persona.sales?.conversionRate || 0}%</div>
                  </div>
                  
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <div className="text-sm text-gray-400 mb-1">Total Clients</div>
                    <div className="text-2xl font-semibold">{persona.sales?.totalClients || 0}</div>
                  </div>
                  
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <div className="text-sm text-gray-400 mb-1">Avg. Transaction</div>
                    <div className="text-2xl font-semibold">${persona.sales?.averageTransaction || 0}</div>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
                {persona.sales?.recentTransactions && persona.sales.recentTransactions.length > 0 ? (
                  <div className="border border-gray-800 rounded-lg overflow-hidden">
                    <div className="bg-gray-900 grid grid-cols-4 gap-4 p-3 text-sm font-medium">
                      <div>Title</div>
                      <div>Date</div>
                      <div>Amount</div>
                      <div>Status</div>
                    </div>
                    <div className="divide-y divide-gray-800">
                      {persona.sales.recentTransactions.map((transaction, idx) => (
                        <div key={transaction.id || idx} className="grid grid-cols-4 gap-4 p-3 text-sm">
                          <div className="text-gray-300">{transaction.title}</div>
                          <div className="text-gray-400">{transaction.date}</div>
                          <div className="text-gray-300">${transaction.amount}</div>
                          <div>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                              transaction.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                              transaction.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' : 
                              'bg-red-900/30 text-red-400'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No transaction data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="chat" className="mt-4">
            <ChatTab personaId={personaId} />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Persona Settings</CardTitle>
                <CardDescription>
                  Configure behavior, appearance, and system settings for {persona.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" defaultValue={persona.displayName} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emoji">Emoji</Label>
                        <Input id="emoji" defaultValue={persona.emoji || '🧠'} readOnly />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" className="h-24" defaultValue={persona.description} readOnly />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-800">
                    <h3 className="text-lg font-medium mb-4">AI Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input id="model" defaultValue={persona.settings?.model || 'gpt-4o'} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="temperature">Temperature</Label>
                        <Input id="temperature" type="number" step="0.1" defaultValue={persona.settings?.temperature || 0.7} readOnly />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="systemPrompt">System Prompt</Label>
                      <Textarea id="systemPrompt" className="h-32" defaultValue={persona.settings?.systemPrompt || ''} readOnly />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-800">
                    <h3 className="text-lg font-medium mb-4">Behavior Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tone">Tone</Label>
                        <Input id="tone" defaultValue={persona.behavior?.tone || ''} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="style">Conversational Style</Label>
                        <Input id="style" defaultValue={persona.behavior?.style || ''} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vocabulary">Vocabulary Level</Label>
                        <Input id="vocabulary" defaultValue={persona.behavior?.vocabulary || ''} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="responsiveness">Responsiveness (1-10)</Label>
                        <Input id="responsiveness" type="number" min="1" max="10" defaultValue={persona.behavior?.responsiveness || 5} readOnly />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="customPrompt">Custom Behavior Instructions</Label>
                      <Textarea id="customPrompt" className="h-32" defaultValue={persona.behavior?.customPrompt || ''} readOnly />
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