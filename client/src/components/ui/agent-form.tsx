import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AgentType } from "@/lib/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AgentFormProps {
  className?: string;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Agent name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  type: z.enum(["FINDOM", "CACHECOW"]),
  apiKeyId: z.number().optional().nullable(),
  projectId: z.number().optional().nullable(),
  config: z.object({
    isTurbo: z.boolean().default(false),
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function AgentForm({ className }: AgentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get default API key
  const { data: apiKeyData } = useQuery({
    queryKey: ['/api/api-keys'],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "FINDOM" as AgentType,
      config: {
        isTurbo: false,
      },
    },
  });

  // Create agent mutation
  const createAgent = useMutation({
    mutationFn: async (values: FormValues) => {
      return apiRequest('POST', '/api/agents', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Agent Created",
        description: "New agent has been created successfully.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create agent: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    createAgent.mutate(values);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-medium text-foreground">New Agent Configuration</h2>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Type</FormLabel>
                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        className={cn(
                          "flex-1 px-3 py-2",
                          field.value === "FINDOM"
                            ? "bg-primary bg-opacity-10 border border-primary text-primary"
                            : "bg-secondary border border-border text-muted-foreground"
                        )}
                        onClick={() => form.setValue("type", "FINDOM")}
                      >
                        FINDOM
                      </Button>
                      <Button
                        type="button"
                        className={cn(
                          "flex-1 px-3 py-2",
                          field.value === "CACHECOW"
                            ? "bg-primary bg-opacity-10 border border-primary text-primary"
                            : "bg-secondary border border-border text-muted-foreground"
                        )}
                        onClick={() => form.setValue("type", "CACHECOW")}
                      >
                        CACHECOW
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter agent name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKeyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OpenAI API Key</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="Use project default"
                        value={field.value?.toString() || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute right-1 top-1 h-7 text-xs"
                      onClick={() => field.onChange(null)}
                    >
                      Use Default
                    </Button>
                  </div>
                  <FormDescription>
                    {apiKeyData?.defaultApiKey ? 'Default API key is available' : 'No default API key configured'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="config.isTurbo"
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
                      Assign a dedicated API key to this agent for faster response times
                    </FormDescription>
                  </div>
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
                      placeholder="Enter agent description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={createAgent.isPending}
            >
              {createAgent.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                "Create Agent"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
