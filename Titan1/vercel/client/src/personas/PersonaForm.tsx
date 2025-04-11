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

// Form schema for persona creation and editing
const formSchema = z.object({
  name: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, {
    message: "Username can only contain lowercase letters, numbers, and underscores",
  }),
  displayName: z.string().min(2).max(50),
  description: z.string().min(10).max(500),
  imageUrl: z.string().optional(),
  isActive: z.boolean(),
  behavior: z.object({
    tone: z.string(),
    style: z.string(),
    vocabulary: z.string(),
    responsiveness: z.number().min(1).max(10),
    instructions: z.string(),
    lastUpdated: z.date(),
  }),
  autonomy: z.object({
    chatEnabled: z.boolean(),
    contentEnabled: z.boolean(),
    marketingEnabled: z.boolean(),
  }),
  stats: z.object({
    totalIncome: z.number(),
    messageCount: z.number(),
    responseRate: z.number(),
    averageResponseTime: z.number(),
    contentCreated: z.number(),
    contentPublished: z.number(),
    conversionRate: z.number(),
  }),
  template: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PersonaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => void;
  editingPersona: Persona | null;
}

export default function PersonaForm({
  open,
  onOpenChange,
  onSubmit,
  editingPersona
}: PersonaFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      imageUrl: "",
      isActive: true,
      behavior: {
        tone: "",
        style: "",
        vocabulary: "",
        responsiveness: 7,
        instructions: "",
        lastUpdated: new Date(),
      },
      autonomy: {
        chatEnabled: true,
        contentEnabled: true,
        marketingEnabled: true,
      },
      stats: {
        totalIncome: 0,
        messageCount: 0,
        responseRate: 0,
        averageResponseTime: 0,
        contentCreated: 0,
        contentPublished: 0,
        conversionRate: 0,
      }
    },
  });

  // Load persona data into form when editing
  useEffect(() => {
    if (editingPersona) {
      form.reset({
        name: editingPersona.name,
        displayName: editingPersona.displayName,
        description: editingPersona.description,
        imageUrl: editingPersona.imageUrl || "",
        isActive: editingPersona.isActive,
        behavior: {
          tone: editingPersona.behavior.tone,
          style: editingPersona.behavior.style,
          vocabulary: editingPersona.behavior.vocabulary,
          responsiveness: editingPersona.behavior.responsiveness,
          instructions: editingPersona.behavior.instructions,
          lastUpdated: new Date(),
        },
        autonomy: {
          chatEnabled: editingPersona.autonomy.chatEnabled,
          contentEnabled: editingPersona.autonomy.contentEnabled,
          marketingEnabled: editingPersona.autonomy.marketingEnabled,
        },
        stats: editingPersona.stats
      });
    } else {
      form.reset({
        name: "",
        displayName: "",
        description: "",
        imageUrl: "",
        isActive: true,
        behavior: {
          tone: "",
          style: "",
          vocabulary: "",
          responsiveness: 7,
          instructions: "",
          lastUpdated: new Date(),
        },
        autonomy: {
          chatEnabled: true,
          contentEnabled: true,
          marketingEnabled: true,
        },
        stats: {
          totalIncome: 0,
          messageCount: 0,
          responseRate: 0,
          averageResponseTime: 0,
          contentCreated: 0,
          contentPublished: 0,
          conversionRate: 0,
        }
      });
    }
  }, [editingPersona, form]);

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
      form.setValue("behavior.instructions", template.behavior.instructions);
      if (template.imageUrl) {
        form.setValue("imageUrl", template.imageUrl);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPersona ? "Edit Persona" : "Create New Persona"}</DialogTitle>
          <DialogDescription>
            {editingPersona 
              ? "Update this persona's details and behavior settings" 
              : "Configure a new persona for your FINDOM project"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. emilydominant" {...field} />
                    </FormControl>
                    <FormDescription>
                      Used for login and identification (no spaces)
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
                      <Input placeholder="e.g. Emily Dominant" {...field} />
                    </FormControl>
                    <FormDescription>
                      Shown to clients
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
                    Leave blank to use the default avatar
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
                      <span>Balanced (5)</span>
                      <span>Instant (10)</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="behavior.instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Behavior Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed instructions for how this persona should behave and interact with clients"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These instructions will guide the AI in role-playing this persona
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="text-lg font-medium">Autonomy Settings</h3>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="autonomy.chatEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Chat</FormLabel>
                        <FormDescription>
                          Allow this persona to chat autonomously with clients
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
                  name="autonomy.contentEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Content Creation</FormLabel>
                        <FormDescription>
                          Allow this persona to create content autonomously
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
                  name="autonomy.marketingEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Marketing</FormLabel>
                        <FormDescription>
                          Allow this persona to market itself and find new clients
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