import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FirebaseIntegration } from "@/lib/types";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const firebaseConfigSchema = z.object({
  // Client-side Firebase config
  apiKey: z.string().min(1, "API Key is required"),
  authDomain: z.string().optional(),
  projectId: z.string().min(1, "Project ID is required"),
  storageBucket: z.string().optional(),
  messagingSenderId: z.string().optional(),
  appId: z.string().min(1, "App ID is required"),
  
  // For server-side Firebase Admin (optional)
  clientEmail: z.string().email("Please enter a valid client email").optional(),
  privateKey: z.string().optional(),
});

type FirebaseConfigValues = z.infer<typeof firebaseConfigSchema>;

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: FirebaseIntegration) => void;
  existingConfig?: FirebaseIntegration;
}

export function FirebaseSetupModal({ isOpen, onClose, onSave, existingConfig }: FirebaseSetupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultValues = existingConfig?.config || {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    clientEmail: "",
    privateKey: "",
  };
  
  const form = useForm<FirebaseConfigValues>({
    resolver: zodResolver(firebaseConfigSchema),
    defaultValues,
  });
  
  const onSubmit = (data: FirebaseConfigValues) => {
    setIsSubmitting(true);
    
    // Auto-fill some fields based on projectId if they're not provided
    if (!data.authDomain && data.projectId) {
      data.authDomain = `${data.projectId}.firebaseapp.com`;
    }
    
    if (!data.storageBucket && data.projectId) {
      data.storageBucket = `${data.projectId}.appspot.com`;
    }
    
    const fullConfig: FirebaseIntegration = {
      config: {
        apiKey: data.apiKey,
        authDomain: data.authDomain || `${data.projectId}.firebaseapp.com`,
        projectId: data.projectId,
        storageBucket: data.storageBucket || `${data.projectId}.appspot.com`,
        messagingSenderId: data.messagingSenderId || "",
        appId: data.appId,
      }
    };
    
    // Add service account details if provided
    if (data.clientEmail || data.privateKey) {
      fullConfig.config = {
        ...fullConfig.config,
        clientEmail: data.clientEmail,
        privateKey: data.privateKey,
      };
    }
    
    // Wait a bit to show loading state
    setTimeout(() => {
      onSave(fullConfig);
      setIsSubmitting(false);
      onClose();
    }, 500);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Firebase Configuration</DialogTitle>
          <DialogDescription>
            Enter your Firebase project credentials to connect with Firebase.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="AIzaSyC..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project ID</FormLabel>
                  <FormControl>
                    <Input placeholder="my-project-123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="appId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App ID</FormLabel>
                  <FormControl>
                    <Input placeholder="1:123456789012:web:abcdef1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2">
              <details>
                <summary className="text-sm font-medium cursor-pointer text-muted-foreground">
                  Advanced Options
                </summary>
                <div className="mt-3 space-y-4">
                  <FormField
                    control={form.control}
                    name="authDomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auth Domain (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="project-id.firebaseapp.com" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="storageBucket"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Bucket (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="project-id.appspot.com" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="messagingSenderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Messaging Sender ID (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123456789012" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </details>
            </div>
            
            <div className="pt-2">
              <details>
                <summary className="text-sm font-medium cursor-pointer text-muted-foreground">
                  Firebase Service Account (For Cloud Persistence)
                </summary>
                <div className="mt-3 space-y-4">
                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Account Email (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="firebase-adminsdk-xxxx@project-id.iam.gserviceaccount.com" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="privateKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Private Key (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----" 
                            {...field} 
                            value={field.value || ""}
                            className="h-32 font-mono text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </details>
            </div>
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Configuration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}