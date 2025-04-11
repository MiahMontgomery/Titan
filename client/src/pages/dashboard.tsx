import React from "react";
import { Header } from "@/components/ui/header";
import { StatusCard } from "@/components/ui/status-card";
import { AgentList } from "@/components/ui/agent-list";
import { AgentForm } from "@/components/ui/agent-form";
import { ActivityLog } from "@/components/ui/activity-log";
import { TechnicalInfo } from "@/components/ui/technical-info";
import { Monitor, Clock, Cpu, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function Dashboard() {
  // Fetch agents count
  const { data: agents = [] } = useQuery({
    queryKey: ['/api/agents'],
  });

  // Fetch activity logs
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['/api/activity-logs?limit=10'],
  });

  // Fetch automation tasks
  const { data: automationTasks = [] } = useQuery({
    queryKey: ['/api/automation-tasks'],
  });

  // Calculate active agents
  const activeAgents = agents.filter((agent: any) => agent.status === "ACTIVE").length;
  
  // Calculate running tasks
  const runningTasks = automationTasks.filter((task: any) => task.status === "RUNNING").length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" />
      
      <main className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-background">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Project Overview</h1>
            <Button>
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              New Project
            </Button>
          </div>
          <p className="mt-1 text-muted-foreground">Manage your AI agents and automation workflows</p>
        </div>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatusCard 
            data={{
              title: "Active Agents",
              value: activeAgents.toString(),
              icon: <Monitor className="h-6 w-6" />,
              color: "green"
            }}
          />
          
          <StatusCard 
            data={{
              title: "Running Tasks",
              value: runningTasks.toString(),
              icon: <Clock className="h-6 w-6" />,
              color: "blue"
            }}
          />
          
          <StatusCard 
            data={{
              title: "API Calls Today",
              value: "128",
              icon: <Cpu className="h-6 w-6" />,
              color: "purple"
            }}
          />
          
          <StatusCard 
            data={{
              title: "Total Projects",
              value: "7",
              icon: <FileText className="h-6 w-6" />,
              color: "yellow"
            }}
          />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="lg:col-span-2">
            <AgentList />
          </div>
          
          {/* Agent Form */}
          <div>
            <AgentForm />
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="mt-8">
          <ActivityLog limit={4} />
        </div>
        
        {/* Technical Info */}
        <div className="mt-8">
          <TechnicalInfo />
        </div>
      </main>
    </div>
  );
}
