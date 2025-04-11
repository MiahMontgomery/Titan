import { useState, useEffect } from "react";
import { Persona } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PERSONA_TEMPLATES } from "../lib/constants";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().min(10, "Description should be at least 10 characters"),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(false),
  projectId: z.number(),
  behavior: z.object({
    tone: z.string().min(1, "Tone is required"),
    style: z.string().min(1, "Style is required"),
    vocabulary: z.string().min(1, "Vocabulary is required"),
    responsiveness: z.number().min(0).max(100),
    instructions: z.string().min(10, "Instructions should be at least 10 characters")
  }),
  stats: z.object({
    messagesSent: z.number().default(0),
    messagesReceived: z.number().default(0),
    contentCreated: z.number().default(0),
    conversions: z.number().default(0),
    interactions: z.number().default(0)
  }).default({
    messagesSent: 0,
    messagesReceived: 0,
    contentCreated: 0,
    conversions: 0,
    interactions: 0
  }),
  autonomy: z.object({
    level: z.number().min(0).max(10).default(5),
    lastDecision: z.string().optional(),
    decisionHistory: z.array(z.string()).default([]),
    canInitiateConversation: z.boolean().default(true),
    canCreateContent: z.boolean().default(true)
  }).default({
    level: 5,
    lastDecision: "",
    decisionHistory: [],
    canInitiateConversation: true,
    canCreateContent: true
  })
});

type FormValues = z.infer<typeof formSchema>;

interface PersonaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => void;
  editingPersona: Persona | null;
  projectId: number;
}

export function PersonaForm({
  open,
  onOpenChange,
  onSubmit,
  editingPersona,
  projectId
}: PersonaFormProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      imageUrl: "",
      isActive: false,
      projectId,
      behavior: {
        tone: "Professional",
        style: "Informative",
        vocabulary: "Standard",
        responsiveness: 50,
        instructions: "Respond to user queries promptly and accurately."
      },
      autonomy: {
        level: 5,
        lastDecision: "",
        decisionHistory: [],
        canInitiateConversation: true,
        canCreateContent: true
      }
    }
  });

  useEffect(() => {
    if (editingPersona) {
      form.reset({
        name: editingPersona.name,
        displayName: editingPersona.displayName,
        description: editingPersona.description,
        imageUrl: editingPersona.imageUrl || "",
        isActive: editingPersona.isActive,
        projectId: projectId,
        behavior: {
          tone: editingPersona.behavior.tone,
          style: editingPersona.behavior.style,
          vocabulary: editingPersona.behavior.vocabulary,
          responsiveness: editingPersona.behavior.responsiveness,
          instructions: editingPersona.behavior.instructions
        },
        stats: editingPersona.stats,
        autonomy: editingPersona.autonomy
      });
    } else {
      form.reset({
        name: "",
        displayName: "",
        description: "",
        imageUrl: "",
        isActive: false,
        projectId,
        behavior: {
          tone: "Professional",
          style: "Informative",
          vocabulary: "Standard",
          responsiveness: 50,
          instructions: "Respond to user queries promptly and accurately."
        },
        autonomy: {
          level: 5,
          lastDecision: "",
          decisionHistory: [],
          canInitiateConversation: true,
          canCreateContent: true
        }
      });
    }
  }, [editingPersona, form, projectId, open]);

  const createPersona = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest('/api/personas', { method: 'POST', body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personas'] });
      toast({
        title: "Persona created",
        description: "New persona has been created successfully."
      });
      onSubmit(form.getValues());
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create persona",
        description: "Please check your inputs and try again."
      });
      console.error("Error creating persona:", error);
    }
  });

  const updatePersona = useMutation({
    mutationFn: async (data: FormValues & { id: string }) => {
      const { id, ...updateData } = data;
      return apiRequest(`/api/personas/${id}`, { method: 'PATCH', body: updateData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personas'] });
      toast({
        title: "Persona updated",
        description: "Persona has been updated successfully."
      });
      onSubmit(form.getValues());
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update persona",
        description: "Please check your inputs and try again."
      });
      console.error("Error updating persona:", error);
    }
  });

  const handleApplyTemplate = (templateName: string) => {
    const template = PERSONA_TEMPLATES[templateName];
    if (template) {
      form.setValue("name", template.name);
      form.setValue("displayName", template.displayName);
      form.setValue("description", template.description);
      form.setValue("imageUrl", template.imageUrl || "");
      form.setValue("behavior.tone", template.behavior.tone);
      form.setValue("behavior.style", template.behavior.style);
      form.setValue("behavior.vocabulary", template.behavior.vocabulary);
      form.setValue("behavior.instructions", template.behavior.instructions);
    }
  };

  const handleSubmit = (data: FormValues) => {
    if (editingPersona) {
      updatePersona.mutate({ ...data, id: editingPersona.id });
    } else {
      createPersona.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {!editingPersona && (
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select
                    value={selectedTemplate}
                    onValueChange={(value) => {
                      setSelectedTemplate(value);
                      handleApplyTemplate(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PERSONA_TEMPLATES).map(([key, template]) => (
                        <SelectItem key={key} value={key}>
                          {template.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose a template or create a custom persona
                  </FormDescription>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Identifier</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. sales_agent, customer_support" {...field} />
                </FormControl>
                <FormDescription>
                  Unique identifier for the persona (no spaces)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Sales Agent, Customer Support" {...field} />
                </FormControl>
                <FormDescription>
                  Human-friendly name for the persona
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the persona's purpose and role"
                    className="resize-none h-20"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Brief description of the persona's purpose
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/avatar.jpg" {...field} />
                </FormControl>
                <FormDescription>
                  URL to an image avatar (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Behavior Settings</h3>

            <FormField
              control={form.control}
              name="behavior.tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tone</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="Empathetic">Empathetic</SelectItem>
                      <SelectItem value="Authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="behavior.style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Informative">Informative</SelectItem>
                      <SelectItem value="Conversational">Conversational</SelectItem>
                      <SelectItem value="Persuasive">Persuasive</SelectItem>
                      <SelectItem value="Concise">Concise</SelectItem>
                      <SelectItem value="Detailed">Detailed</SelectItem>
                      <SelectItem value="Narrative">Narrative</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="behavior.vocabulary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vocabulary</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vocabulary level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Simple">Simple</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Industry-specific">Industry-specific</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="behavior.responsiveness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsiveness: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider 
                      min={0}
                      max={100}
                      step={5}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    How quickly and frequently the persona should respond
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="behavior.instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Specific instructions for how the persona should behave"
                      className="resize-none h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed instructions for the persona's behavior
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={createPersona.isPending || updatePersona.isPending}
          >
            {editingPersona ? "Update Persona" : "Create Persona"}
          </Button>
        </div>
      </form>
    </Form>
  );
}