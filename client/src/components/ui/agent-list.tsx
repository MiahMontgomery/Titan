import React, { useState, useEffect } from "react";
import { Agent, AgentType } from "@/lib/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Cpu, MoreVertical } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AgentListProps {
  className?: string;
}

export function AgentList({ className }: AgentListProps) {
  const [filter, setFilter] = useState<AgentType | "ALL">("ALL");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agents
  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['/api/agents'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Update agent status mutation
  const updateAgentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/agents/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Agent Updated",
        description: "Agent status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update agent status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter agents based on selected type
  const filteredAgents = agents.filter((agent: Agent) => {
    return filter === "ALL" || agent.type === filter;
  });

  // Handle agent type filter
  const handleFilterChange = (type: AgentType | "ALL") => {
    setFilter(type);
  };

  // Handle toggle agent status
  const handleToggleStatus = (agent: Agent) => {
    const newStatus = agent.status === "ACTIVE" ? "IDLE" : "ACTIVE";
    updateAgentStatus.mutate({ id: agent.id, status: newStatus });
  };

  if (error) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="pt-6">
          <div className="text-destructive">Error loading agents: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="px-6 py-4 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-medium text-foreground">AI Agents</h2>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={filter === "ALL" ? "default" : "outline"}
            onClick={() => handleFilterChange("ALL")}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filter === "FINDOM" ? "default" : "outline"}
            onClick={() => handleFilterChange("FINDOM")}
          >
            FINDOM
          </Button>
          <Button
            size="sm"
            variant={filter === "CACHECOW" ? "default" : "outline"}
            onClick={() => handleFilterChange("CACHECOW")}
          >
            CACHECOW
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No agents found. Create a new agent to get started.
          </div>
        ) : (
          filteredAgents.map((agent: Agent) => (
            <div
              key={agent.id}
              className="bg-secondary rounded-lg p-4"
              data-agent-type={agent.type}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    agent.type === "FINDOM" 
                      ? "bg-teal-500 bg-opacity-20" 
                      : "bg-blue-500 bg-opacity-20"
                  )}>
                    {agent.type === "FINDOM" ? (
                      <Zap className="h-6 w-6 text-primary" />
                    ) : (
                      <Cpu className="h-6 w-6 text-blue-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-foreground">{agent.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "mt-1",
                        agent.type === "FINDOM" 
                          ? "bg-teal-500 bg-opacity-20 text-teal-400 hover:bg-teal-500 hover:bg-opacity-20" 
                          : "bg-blue-500 bg-opacity-20 text-blue-400 hover:bg-blue-500 hover:bg-opacity-20"
                      )}
                    >
                      {agent.type}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      agent.status === "ACTIVE" 
                        ? "bg-green-500 bg-opacity-20 text-green-400 hover:bg-green-500 hover:bg-opacity-20"
                        : agent.status === "ERROR"
                        ? "bg-red-500 bg-opacity-20 text-red-400 hover:bg-red-500 hover:bg-opacity-20"
                        : "bg-yellow-500 bg-opacity-20 text-yellow-400 hover:bg-yellow-500 hover:bg-opacity-20"
                    )}
                  >
                    {agent.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleStatus(agent)}>
                        {agent.status === "ACTIVE" ? "Stop Agent" : "Start Agent"}
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit Configuration</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete Agent</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Last activity</p>
                  <p className="text-sm text-foreground">
                    {agent.lastActivity ? formatDate(agent.lastActivity) : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">API key</p>
                  <p className="text-sm text-foreground">
                    {agent.config?.isTurbo ? "Turbo: enabled" : "Standard"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
