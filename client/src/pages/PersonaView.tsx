import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Persona } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, RefreshCw, Settings, MessageSquare } from 'lucide-react';
import { Link } from 'wouter';
import { SafeImage } from '@/components/ui/safe-image';
import { ChatTab } from '@/components/ChatTab';

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
      {/* Header */}
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
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
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
                <h1 className="text-xl font-semibold text-white">{persona.name}</h1>
                <p className="text-sm text-gray-400">{persona.description}</p>
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
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-4">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
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
                  Track the progress of tasks assigned to this persona
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Current Tasks</h3>
                    <div className="space-y-3">
                      {/* Placeholder for tasks - will be replaced with actual data */}
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Content creation for Instagram</p>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 ml-2">70%</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Response to client messages</p>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 ml-2">45%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Recent Activities</h3>
                    <div className="space-y-3">
                      {/* Placeholder for activities - will be replaced with actual data */}
                      <div className="flex items-start">
                        <div className="min-w-[40px] h-10 flex items-center justify-center bg-gray-700 rounded-full mr-3">
                          <span className="text-xs">12:30</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Posted new content on OnlyFans</p>
                          <p className="text-xs text-gray-400">Received 5 comments and 12 likes</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="min-w-[40px] h-10 flex items-center justify-center bg-gray-700 rounded-full mr-3">
                          <span className="text-xs">10:15</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Responded to 3 client messages</p>
                          <p className="text-xs text-gray-400">Conversion rate: 33%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
        </Tabs>
      </main>
    </div>
  );
}