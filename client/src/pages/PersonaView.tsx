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
                  Track development of features, milestones, and goals for this persona
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {/* Feature 1 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">AI Chat Response System</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 3 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                    <div className="hidden">
                      {/* Milestones dropdown content */}
                      <div className="pl-6 pr-3 py-2 bg-gray-950/50 border-t border-gray-800">
                        <div className="border-l border-gray-700 pl-4 space-y-2">
                          {/* Milestone 1.1 */}
                          <div className="group/milestone">
                            <div className="flex items-center justify-between py-2 cursor-pointer">
                              <div className="text-sm font-medium group-hover/milestone:text-green-400">Personalized Response Generation</div>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover/milestone:text-green-400">
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            </div>
                            <div className="hidden">
                              <div className="pl-4 border-l border-gray-800 space-y-1.5 py-1.5">
                                <div className="text-xs text-gray-400">• GPT-4o integration for response generation</div>
                                <div className="text-xs text-gray-400">• Context-aware conversation memory</div>
                                <div className="text-xs text-gray-400">• Emotion detection and appropriate tone matching</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Milestone 1.2 */}
                          <div className="group/milestone">
                            <div className="flex items-center justify-between py-2 cursor-pointer">
                              <div className="text-sm font-medium group-hover/milestone:text-green-400">Message Interpretation</div>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover/milestone:text-green-400">
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            </div>
                          </div>
                          
                          {/* Milestone 1.3 */}
                          <div className="group/milestone">
                            <div className="flex items-center justify-between py-2 cursor-pointer">
                              <div className="text-sm font-medium group-hover/milestone:text-green-400">Automated Response Timing</div>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover/milestone:text-green-400">
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 2 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Web Browser Automation (Puppeteer)</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 7 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 3 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Content Creation System</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '42%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 12 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 4 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Multi-Platform Publishing</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '38%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 14 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 5 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">User Engagement Analytics</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '72%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 5 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 6 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Payment Processing Integration</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '28%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 18 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 7 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Autonomous Scheduling System</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '52%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 9 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 8 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Image & Media Generation</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 11 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 9 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">User Behavior Analysis</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '61%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 8 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 10 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Subscription Management</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '32%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 16 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 11 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Platform-Specific Content Optimization</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '48%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 10 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 12 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Automated Social Media Engagement</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '55%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 9 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 13 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Natural Language Processing Engine</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '68%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 6 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 14 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Sentiment Analysis System</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '77%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 4 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 15 */}
                  <div className="border border-gray-800 rounded-md overflow-hidden transition-shadow hover:shadow-[0_0_8px_rgba(74,222,128,0.5)] group">
                    <div className="flex items-center justify-between p-3 bg-gray-900 cursor-pointer group-hover:border-green-500">
                      <div className="flex-1">
                        <h3 className="font-medium">Automated Security & Privacy Management</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full max-w-[200px] bg-gray-800 rounded-full h-1.5 mr-3">
                            <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '23%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400">ETA: 20 hours</span>
                        </div>
                      </div>
                      <div className="ml-4 transform transition-transform group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-green-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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