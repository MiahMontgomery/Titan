import React, { useState } from "react";
import { Header } from "@/components/ui/header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AgentList } from "@/components/ui/agent-list";
import { AgentForm } from "@/components/ui/agent-form";
import { useQuery } from "@tanstack/react-query";
import { AgentType } from "@shared/schema";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Agents() {
  const [view, setView] = useState<"list" | "create">("list");
  
  // Fetch agents
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['/api/agents'],
  });
  
  // Count by type
  const findomCount = agents.filter((agent: any) => agent.type === AgentType.FINDOM).length;
  const cachecowCount = agents.filter((agent: any) => agent.type === AgentType.CACHECOW).length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="AI Agents" />
      
      <main className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-background">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Agents</h1>
              <p className="mt-1 text-muted-foreground">Manage your autonomous agents for different projects</p>
            </div>
            <Button onClick={() => setView(view === "list" ? "create" : "list")}>
              {view === "list" ? "Create New Agent" : "View All Agents"}
            </Button>
          </div>
        </div>
        
        {view === "list" ? (
          <div className="space-y-6">
            {/* Agent Type Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Agents ({agents.length})</TabsTrigger>
                <TabsTrigger value="findom">FINDOM ({findomCount})</TabsTrigger>
                <TabsTrigger value="cachecow">CACHECOW ({cachecowCount})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <AgentList />
              </TabsContent>
              
              <TabsContent value="findom">
                <Card>
                  <CardHeader className="px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-medium text-foreground">FINDOM Agents</h2>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                      </div>
                    ) : findomCount === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No FINDOM agents found. Create a new agent to get started.
                      </div>
                    ) : (
                      <AgentList />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="cachecow">
                <Card>
                  <CardHeader className="px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-medium text-foreground">CACHECOW Agents</h2>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                      </div>
                    ) : cachecowCount === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No CACHECOW agents found. Create a new agent to get started.
                      </div>
                    ) : (
                      <AgentList />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Agent Capabilities Section */}
            <Card>
              <CardHeader className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-medium text-foreground">Agent Capabilities</h2>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-secondary rounded-md p-6">
                    <h3 className="text-lg font-medium text-primary mb-2">FINDOM Agent</h3>
                    <p className="text-muted-foreground mb-4">
                      Intelligent content generation and web automation agent specializing in:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                        <span>Content generation using OpenAI models</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                        <span>Web scraping and data extraction</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                        <span>Data analysis and summarization</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                        <span>Automated web task execution</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-secondary rounded-md p-6">
                    <h3 className="text-lg font-medium text-blue-400 mb-2">CACHECOW Agent</h3>
                    <p className="text-muted-foreground mb-4">
                      Data-focused caching and monitoring agent specializing in:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
                        <span>Intelligent data caching with TTL controls</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
                        <span>Website monitoring and change detection</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
                        <span>Comparative data analysis between sources</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
                        <span>Automated screenshots and visual monitoring</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <AgentForm />
          </div>
        )}
      </main>
    </div>
  );
}
