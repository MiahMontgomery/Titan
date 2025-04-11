import React, { useState } from "react";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Globe, Play, Code, Timer, Database, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const taskFormSchema = z.object({
  name: z.string().min(2, {
    message: "Task name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  url: z.string().url({
    message: "Please enter a valid URL.",
  }),
  script: z.string().min(10, {
    message: "Script must be at least 10 characters.",
  }),
  agentId: z.string().min(1, {
    message: "Please select an agent.",
  }),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function WebAutomation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form setup
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      url: "",
      script: "// Add your automation script here\n// Example:\n// document.querySelector('button').click();\n// return { success: true };",
      agentId: "",
    },
  });
  
  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ['/api/agents'],
  });
  
  // Fetch automation tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['/api/automation-tasks'],
  });
  
  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (values: any) => {
      return apiRequest('POST', '/api/automation-tasks', {
        ...values,
        agentId: parseInt(values.agentId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation-tasks'] });
      toast({
        title: "Task Created",
        description: "New automation task has been created successfully.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Run task mutation
  const runTask = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest('POST', `/api/automation-tasks/${taskId}/run`, {});
    },
    onSuccess: () => {
      toast({
        title: "Task Started",
        description: "Automation task is now running.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/automation-tasks'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to run task: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: TaskFormValues) => {
    createTask.mutate(values);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Web Automation" />
      
      <main className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-background">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Web Automation</h1>
              <p className="mt-1 text-muted-foreground">Create and manage Puppeteer-based web automation tasks</p>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">Automation Tasks</TabsTrigger>
            <TabsTrigger value="create">Create New Task</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks">
            <Card>
              <CardHeader className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-medium text-foreground">Automation Tasks</h2>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingTasks ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No automation tasks found. Create a new task to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task: any) => (
                      <div key={task.id} className="bg-secondary p-4 rounded-md">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center">
                              <h3 className="text-base font-medium text-foreground">{task.name}</h3>
                              <Badge 
                                variant="outline" 
                                className={
                                  task.status === "RUNNING" 
                                    ? "ml-2 bg-blue-500 bg-opacity-20 text-blue-400" 
                                    : task.status === "ERROR"
                                    ? "ml-2 bg-red-500 bg-opacity-20 text-red-400"
                                    : "ml-2 bg-yellow-500 bg-opacity-20 text-yellow-400"
                                }
                              >
                                {task.status}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Globe className="h-3.5 w-3.5 mr-1" />
                                {task.url}
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => runTask.mutate(task.id)}
                            disabled={task.status === "RUNNING" || runTask.isPending}
                          >
                            {task.status === "RUNNING" ? (
                              <>
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                Running
                              </>
                            ) : (
                              <>
                                <Play className="mr-1 h-4 w-4" />
                                Run Task
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Timer className="h-3.5 w-3.5 mr-1" />
                            Last run: {task.lastRun ? formatDate(task.lastRun) : 'Never'}
                          </div>
                          <div className="flex items-center">
                            <Database className="h-3.5 w-3.5 mr-1" />
                            Agent: {agents.find((a: any) => a.id === task.agentId)?.name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="create">
            <Card>
              <CardHeader className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-medium text-foreground">Create Automation Task</h2>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter task name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter task description"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="agentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agent</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an agent" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {agents.map((agent: any) => (
                                <SelectItem key={agent.id} value={agent.id.toString()}>
                                  {agent.name} ({agent.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="script"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Automation Script</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter JavaScript code for automation"
                              className="resize-none font-mono h-40"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Write JavaScript that will be executed in the browser context
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createTask.isPending}
                    >
                      {createTask.isPending ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                          Creating...
                        </>
                      ) : (
                        "Create Automation Task"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Documentation Section */}
        <Card className="mt-6">
          <CardHeader className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Web Automation Documentation</h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-foreground mb-2">Script Examples</h3>
                <div className="code-block">
                  <pre>{`// Example 1: Click a button and extract data
document.querySelector('#login-button').click();
await new Promise(resolve => setTimeout(resolve, 2000));

const data = {
  title: document.title,
  text: document.querySelector('.main-content').textContent
};

return data;

// Example 2: Fill a form and submit
document.querySelector('#username').value = 'testuser';
document.querySelector('#password').value = 'password123';
document.querySelector('form').submit();
await new Promise(resolve => setTimeout(resolve, 3000));

return {
  success: true,
  currentUrl: window.location.href
};`}</pre>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-secondary p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <Code className="h-5 w-5 text-primary mr-2" />
                    <h4 className="font-medium">Available Functions</h4>
                  </div>
                  <ul className="space-y-1 text-sm">
                    <li className="text-muted-foreground">
                      <code>document.querySelector()</code> - Select DOM elements
                    </li>
                    <li className="text-muted-foreground">
                      <code>document.querySelectorAll()</code> - Select multiple elements
                    </li>
                    <li className="text-muted-foreground">
                      <code>element.click()</code> - Click on elements
                    </li>
                    <li className="text-muted-foreground">
                      <code>element.value = '...'</code> - Set input values
                    </li>
                    <li className="text-muted-foreground">
                      <code>await new Promise()</code> - Wait for specified time
                    </li>
                  </ul>
                </div>
                
                <div className="bg-secondary p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                    <h4 className="font-medium">Tips & Best Practices</h4>
                  </div>
                  <ul className="space-y-1 text-sm">
                    <li className="text-muted-foreground">
                      Always add waits between interactions
                    </li>
                    <li className="text-muted-foreground">
                      Use try/catch blocks to handle failures
                    </li>
                    <li className="text-muted-foreground">
                      Return data as a JavaScript object
                    </li>
                    <li className="text-muted-foreground">
                      Keep scripts focused on specific tasks
                    </li>
                    <li className="text-muted-foreground">
                      Test scripts thoroughly before automation
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
