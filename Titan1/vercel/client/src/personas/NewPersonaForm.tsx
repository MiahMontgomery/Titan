import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Persona } from "@/lib/types";
import { PERSONA_TEMPLATES } from "@/lib/constants";
import { useEffect } from "react";
import { createDefaultPersona } from "@/lib/personaFactory";

// Form schema for persona creation and editing with our new structure
const formSchema = z.object({
  name: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, {
    message: "Username can only contain lowercase letters, numbers, and underscores",
  }),
  displayName: z.string().min(2).max(50),
  description: z.string().min(10).max(500),
  imageUrl: z.string().optional(),
  emoji: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']),
  behavior: z.object({
    tone: z.string(),
    style: z.string(),
    vocabulary: z.string(),
    responsiveness: z.number().min(1).max(10),
    creativity: z.number().min(1).max(10).optional(),
    customPrompt: z.string().optional(),
  }),
  autonomy: z.object({
    level: z.number().min(1).max(10),
    canInitiateConversation: z.boolean(),
    canCreateContent: z.boolean(),
    workingHours: z.object({
      start: z.number().min(0).max(23),
      end: z.number().min(0).max(23),
    }).optional(),
  }),
  settings: z.object({
    model: z.string(),
    maxTokens: z.number(),
    temperature: z.number().min(0).max(2),
    systemPrompt: z.string(),
  }),
  template: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PersonaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Persona) => void;
  editingPersona: Persona | null;
  projectId?: number;
}

export function NewPersonaForm({
  open,
  onOpenChange,
  onSubmit,
  editingPersona,
  projectId,
}: PersonaFormProps) {
  // Create a base persona with our factory
  const defaultPersona = createDefaultPersona();
  
  // Extract relevant form values from the default persona
  const defaultFormValues: FormValues = {
    name: defaultPersona.name.toString(),
    displayName: defaultPersona.displayName,
    description: defaultPersona.description,
    imageUrl: defaultPersona.imageUrl || '',
    emoji: defaultPersona.emoji || '',
    status: defaultPersona.status,
    behavior: {
      tone: defaultPersona.behavior.tone,
      style: defaultPersona.behavior.style,
      vocabulary: defaultPersona.behavior.vocabulary,
      responsiveness: defaultPersona.behavior.responsiveness,
      creativity: defaultPersona.behavior.creativity || 0,
      customPrompt: defaultPersona.behavior.customPrompt || '',
    },
    autonomy: {
      level: defaultPersona.autonomy.level,
      canInitiateConversation: defaultPersona.autonomy.canInitiateConversation,
      canCreateContent: defaultPersona.autonomy.canCreateContent,
      workingHours: defaultPersona.autonomy.workingHours,
    },
    settings: {
      model: defaultPersona.settings.model,
      maxTokens: defaultPersona.settings.maxTokens,
      temperature: defaultPersona.settings.temperature,
      systemPrompt: defaultPersona.settings.systemPrompt,
    },
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  // Load persona data into form when editing
  useEffect(() => {
    if (editingPersona) {
      form.reset({
        name: String(editingPersona.id),
        displayName: editingPersona.displayName,
        description: editingPersona.description,
        imageUrl: editingPersona.imageUrl || "",
        emoji: editingPersona.emoji || "",
        status: editingPersona.status,
        behavior: {
          tone: editingPersona.behavior.tone,
          style: editingPersona.behavior.style,
          vocabulary: editingPersona.behavior.vocabulary,
          responsiveness: editingPersona.behavior.responsiveness,
          creativity: editingPersona.behavior.creativity || 0,
          customPrompt: editingPersona.behavior.customPrompt || '',
        },
        autonomy: {
          level: editingPersona.autonomy.level,
          canInitiateConversation: editingPersona.autonomy.canInitiateConversation,
          canCreateContent: editingPersona.autonomy.canCreateContent,
          workingHours: editingPersona.autonomy.workingHours,
        },
        settings: {
          model: editingPersona.settings.model,
          maxTokens: editingPersona.settings.maxTokens,
          temperature: editingPersona.settings.temperature,
          systemPrompt: editingPersona.settings.systemPrompt,
        },
      });
    } else {
      form.reset(defaultFormValues);
    }
  }, [editingPersona, form, defaultFormValues]);

  // Load template values when a template is selected
  const handleTemplateChange = (templateName: string) => {
    const template = PERSONA_TEMPLATES[templateName];
    if (template) {
      form.setValue("name", template.name);
      form.setValue("displayName", template.displayName);
      form.setValue("description", template.description);
      form.setValue("behavior.tone", template.behavior.tone);
      form.setValue("behavior.style", template.behavior.style);
      form.setValue("behavior.vocabulary", template.behavior.vocabulary);
      if (template.imageUrl) {
        form.setValue("imageUrl", template.imageUrl);
      }
    }
  };
  
  // Handle form submission with our factory pattern
  const handleSubmit = (values: FormValues) => {
    // Use the factory to create a persona with form values as overrides
    const newPersona = createDefaultPersona({
      id: editingPersona?.id || Date.now(),
      name: values.name,
      displayName: values.displayName,
      description: values.description,
      imageUrl: values.imageUrl,
      emoji: values.emoji,
      status: values.status,
      behavior: {
        tone: values.behavior.tone,
        style: values.behavior.style,
        vocabulary: values.behavior.vocabulary,
        responsiveness: values.behavior.responsiveness,
        creativity: values.behavior.creativity,
        customPrompt: values.behavior.customPrompt,
      },
      autonomy: {
        level: values.autonomy.level,
        canInitiateConversation: values.autonomy.canInitiateConversation,
        canCreateContent: values.autonomy.canCreateContent,
        workingHours: values.autonomy.workingHours,
      },
      settings: {
        model: values.settings.model,
        maxTokens: values.settings.maxTokens,
        temperature: values.settings.temperature,
        systemPrompt: values.settings.systemPrompt,
      },
    });
    
    // Pass the complete persona to the onSubmit handler
    onSubmit(newPersona);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPersona ? "Edit Persona" : "Create New Persona"}</DialogTitle>
          <DialogDescription>
            {editingPersona 
              ? "Update this persona's details and behavior settings" 
              : "Configure a new persona with standardized features and tabs"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {!editingPersona && (
              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleTemplateChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(PERSONA_TEMPLATES).map((key) => (
                          <SelectItem key={key} value={key}>
                            {PERSONA_TEMPLATES[key].displayName}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Persona</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Start with a template or create a custom persona
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. findom_specialist" {...field} />
                    </FormControl>
                    <FormDescription>
                      Used for identification (no spaces)
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
                      <Input placeholder="e.g. FINDOM Specialist" {...field} />
                    </FormControl>
                    <FormDescription>
                      Shown in the UI and to clients
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emoji"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emoji</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 💰" {...field} />
                    </FormControl>
                    <FormDescription>
                      Visual representation (single emoji)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Current operational status
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this persona's personality and approach"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank to use emoji as fallback
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="text-lg font-medium">Behavior Settings</h3>

              <FormField
                control={form.control}
                name="behavior.tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Authoritative, Playful, Stern" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="e.g. Demanding, Seductive, Manipulative" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="e.g. Formal, Slang, Technical terms" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="behavior.responsiveness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsiveness (1-10)</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Slow (1)</span>
                        <span>Instant (10)</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="behavior.creativity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creativity (1-10)</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value || 0]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Conservative (1)</span>
                        <span>Creative (10)</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="behavior.customPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Prompt Additions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional prompt instructions for fine-tuning persona behavior"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These will be appended to the system prompt
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="text-lg font-medium">Autonomy Settings</h3>

              <FormField
                control={form.control}
                name="autonomy.level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autonomy Level (1-10)</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Supervised (1)</span>
                      <span>Fully Autonomous (10)</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="autonomy.canInitiateConversation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Can Initiate Conversations</FormLabel>
                        <FormDescription>
                          Allow this persona to start conversations
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value ? "default" : "outline"}
                          className="w-[80px]"
                          onClick={() => field.onChange(!field.value)}
                        >
                          {field.value ? "On" : "Off"}
                        </Button>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autonomy.canCreateContent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Can Create Content</FormLabel>
                        <FormDescription>
                          Allow this persona to generate content
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value ? "default" : "outline"}
                          className="w-[80px]"
                          onClick={() => field.onChange(!field.value)}
                        >
                          {field.value ? "On" : "Off"}
                        </Button>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="text-lg font-medium">Model Settings</h3>

              <FormField
                control={form.control}
                name="settings.model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Model used for generating responses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="settings.temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature (0-2)</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={2}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Precise (0)</span>
                        <span>Random (2)</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.maxTokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Tokens</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={100} 
                          max={8000} 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum length of responses
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="settings.systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Base system prompt for the AI model"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Base instructions for the AI model
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingPersona ? "Save Changes" : "Create Persona"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}