import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Persona } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, BarChart3, DollarSign, Globe, Brain, Monitor } from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Progress } from "@/components/ui/progress";

// Performance metrics interface
interface PerformanceData {
  personaId: string;
  metrics: {
    messagesSent: number;
    totalMessagesApproved: number;
    totalMessagesRejected: number;
    contentApprovalRate: number;
    estimatedRevenue: number;
    platformActivity: {
      [platform: string]: number;
    };
    pendingFeedbackItems: number;
    messageTrend: {
      date: string;
      count: number;
    }[];
    platformDistribution: {
      name: string;
      value: number;
    }[];
  };
  browserStatus: "active" | "inactive";
}

interface PersonaPerformanceProps {
  personaId: string;
}

export function PersonaPerformance({ personaId }: PersonaPerformanceProps) {
  const { toast } = useToast();
  
  // Fetch persona performance data
  const { data: performanceData, isLoading } = useQuery<PerformanceData>({
    queryKey: [`/api/personas/${personaId}/performance`],
    retry: 1,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }
  
  if (!performanceData) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Unable to load performance data. Please try again later.</p>
      </div>
    );
  }
  
  const { metrics, browserStatus } = performanceData;
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Messages Sent</p>
                <h3 className="text-2xl font-bold">{metrics.messagesSent}</h3>
              </div>
              <div className="bg-blue-900/20 p-3 rounded-full">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Approval Rate</span>
                <span>{Math.round(
                  (metrics.totalMessagesApproved / 
                    (metrics.totalMessagesApproved + metrics.totalMessagesRejected || 1)) * 100
                )}%</span>
              </div>
              <Progress 
                value={(metrics.totalMessagesApproved / 
                  (metrics.totalMessagesApproved + metrics.totalMessagesRejected || 1)) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Content Approval</p>
                <h3 className="text-2xl font-bold">{metrics.contentApprovalRate}%</h3>
              </div>
              <div className="bg-green-900/20 p-3 rounded-full">
                <BarChart3 className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Overall Performance</span>
              </div>
              <Progress value={metrics.contentApprovalRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Estimated Revenue</p>
                <h3 className="text-2xl font-bold">${metrics.estimatedRevenue.toFixed(2)}</h3>
              </div>
              <div className="bg-pink-900/20 p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-pink-500" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-400">
                Estimated earnings based on engagement metrics
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Platform Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Platform Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(metrics.platformActivity).map(([platform, count]) => ({
                  platform,
                  count
                }))}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }} 
                />
                <Legend />
                <Bar dataKey="count" name="Activity Count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Message Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Message Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metrics.messageTrend}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }} 
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Messages"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-500" />
                <h3 className="font-medium">Pending Learning Feedback</h3>
              </div>
              <span className="bg-purple-900/20 text-purple-400 text-sm font-medium px-2.5 py-0.5 rounded">
                {metrics.pendingFeedbackItems}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Number of feedback items waiting to be incorporated into the persona's learning
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-cyan-500" />
                <h3 className="font-medium">Browser Session</h3>
              </div>
              <span className={`text-sm font-medium px-2.5 py-0.5 rounded ${
                browserStatus === "active" 
                  ? "bg-green-900/20 text-green-400" 
                  : "bg-red-900/20 text-red-400"
              }`}>
                {browserStatus === "active" ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Status of the real-time browser automation session for this persona
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}