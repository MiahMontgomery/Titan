import React, { useState } from "react";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Key, Eye, EyeOff, Trash2, Check, AlertCircle, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiKeyFormData } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

const apiKeyFormSchema = z.object({
  name: z.string().min(2, {
    message: "API key name must be at least 2 characters.",
  }),
  key: z.string().min(10, {
    message: "API key must be at least 10 characters.",
  }),
  provider: z.string().min(2, {
    message: "Provider name must be at least 2 characters.",
  }),
  isTurbo: z.boolean().default(false),
  isDefault: z.boolean().default(false),
});

export default function ApiKeys() {
  const [open, setOpen] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form setup
  const form = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: "",
      key: "",
      provider: "OpenAI",
      isTurbo: false,
      isDefault: false,
    },
  });
  
  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['/api/api-keys'],
    select: (data) => {
      // Process the data if needed
      if (data && data.keys) {
        return data.keys;
      }
      if (data && data.defaultApiKey) {
        return [data.defaultApiKey];
      }
      return [];
    },
  });
  
  // Create API key mutation
  const createApiKey = useMutation({
    mutationFn: async (values: ApiKeyFormData) => {
      return apiRequest('POST', '/api/api-keys', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      toast({
        title: "API Key Added",
        description: "New API key has been added successfully.",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add API key: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: ApiKeyFormData) => {
    createApiKey.mutate(values);
  };
  
  // Toggle visibility of API key
  const toggleKeyVisibility = (id: number) => {
    setShowKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  
  // Mask API key for display
  const maskApiKey = (key: string): string => {
    if (!key) return '•••••••••••••••';
    return key.substring(0, 4) + '•••••••••••••••' + key.substring(key.length - 4);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="API Keys" />
      
      <main className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-background">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
              <p className="mt-1 text-muted-foreground">Manage API keys for OpenAI and other services</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Key className="-ml-1 mr-2 h-5 w-5" />
                  Add API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New API Key</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. OpenAI Production Key" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. OpenAI" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your API key"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Your API key will be encrypted and stored securely
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isTurbo"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Turbo Mode</FormLabel>
                            <FormDescription>
                              Assign this key as a dedicated high-performance API key
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Default Key</FormLabel>
                            <FormDescription>
                              Set this as the default API key for new agents and projects
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createApiKey.isPending}
                      >
                        {createApiKey.isPending ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                            Adding...
                          </>
                        ) : (
                          "Add API Key"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* API Keys List */}
        <Card>
          <CardHeader className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Your API Keys</h2>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary text-primary mb-4">
                  <Key className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-medium text-foreground mb-2">No API keys found</h2>
                <p className="text-muted-foreground mb-4">Add your first API key to get started with FINDOM</p>
                <Button onClick={() => setOpen(true)}>
                  <Key className="-ml-1 mr-2 h-5 w-5" />
                  Add First API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey: any) => (
                  <div key={apiKey.id} className="bg-secondary p-4 rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-base font-medium text-foreground">{apiKey.name}</h3>
                          {apiKey.isDefault && (
                            <Badge variant="outline" className="ml-2 bg-primary bg-opacity-10 text-primary">
                              Default
                            </Badge>
                          )}
                          {apiKey.isTurbo && (
                            <Badge variant="outline" className="ml-2 bg-yellow-500 bg-opacity-10 text-yellow-400">
                              <Zap className="h-3 w-3 mr-1" />
                              Turbo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Provider: {apiKey.provider}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {showKeys[apiKey.id] ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="bg-background rounded px-3 py-2 font-mono text-xs">
                        {showKeys[apiKey.id] ? apiKey.key : maskApiKey(apiKey.key)}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Added: {formatDate(apiKey.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* API Key Information */}
        <Card className="mt-6">
          <CardHeader className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">API Key Information</h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-secondary p-4 rounded-md">
                  <div className="flex items-center mb-3">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <h3 className="font-medium">Key Features</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <span className="text-muted-foreground">Secure storage of API keys</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <span className="text-muted-foreground">Turbo mode for dedicated high-performance keys</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <span className="text-muted-foreground">Assign specific keys to projects</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <span className="text-muted-foreground">Set default keys for new agents</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-secondary p-4 rounded-md">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                    <h3 className="font-medium">Important Notes</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 mr-2"></div>
                      <span className="text-muted-foreground">Never share your API keys publicly</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 mr-2"></div>
                      <span className="text-muted-foreground">Turbo keys are billed at their respective provider rates</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 mr-2"></div>
                      <span className="text-muted-foreground">Rotate your API keys regularly for security</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 mr-2"></div>
                      <span className="text-muted-foreground">Monitor usage to avoid unexpected charges</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-secondary p-4 rounded-md">
                <h3 className="font-medium mb-2">Supported API Providers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center p-3 bg-background rounded-md">
                    <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-semibold text-primary">AI</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">OpenAI</p>
                      <p className="text-xs text-muted-foreground">GPT-4o, GPT-3.5</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-background rounded-md">
                    <div className="w-8 h-8 bg-blue-500 bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-semibold text-blue-500">AP</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Anthropic</p>
                      <p className="text-xs text-muted-foreground">Claude models</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-background rounded-md">
                    <div className="w-8 h-8 bg-purple-500 bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-semibold text-purple-500">GC</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Google Cloud</p>
                      <p className="text-xs text-muted-foreground">Gemini, PaLM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
