import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FirebaseIntegration } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

// Define the schema for Firebase configuration
const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1, { message: "API Key is required" }),
  authDomain: z.string().optional(),
  projectId: z.string().min(1, { message: "Project ID is required" }),
  storageBucket: z.string().optional(),
  messagingSenderId: z.string().optional(),
  appId: z.string().min(1, { message: "App ID is required" }),
});

type FirebaseConfigValues = z.infer<typeof firebaseConfigSchema>;

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: FirebaseIntegration) => void;
  existingConfig?: FirebaseIntegration;
}

export function FirebaseSetupModal({ isOpen, onClose, onSave, existingConfig }: FirebaseSetupModalProps) {
  const [testingConnection, setTestingConnection] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FirebaseConfigValues>({
    resolver: zodResolver(firebaseConfigSchema),
    defaultValues: {
      apiKey: existingConfig?.config.apiKey || '',
      authDomain: existingConfig?.config.authDomain || '',
      projectId: existingConfig?.config.projectId || '',
      storageBucket: existingConfig?.config.storageBucket || '',
      messagingSenderId: existingConfig?.config.messagingSenderId || '',
      appId: existingConfig?.config.appId || '',
    },
  });

  // Generate authDomain and storageBucket based on projectId
  const updateDerivedFields = (projectId: string) => {
    if (projectId) {
      form.setValue('authDomain', `${projectId}.firebaseapp.com`);
      form.setValue('storageBucket', `${projectId}.appspot.com`);
    }
  };

  // Handle projectId change
  const handleProjectIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const projectId = e.target.value;
    form.setValue('projectId', projectId);
    updateDerivedFields(projectId);
  };

  // Test Firebase connection
  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      
      const values = form.getValues();
      const firebaseConfig = {
        apiKey: values.apiKey,
        authDomain: values.authDomain || `${values.projectId}.firebaseapp.com`,
        projectId: values.projectId,
        storageBucket: values.storageBucket || `${values.projectId}.appspot.com`,
        messagingSenderId: values.messagingSenderId || '',
        appId: values.appId,
      };
      
      // Initialize Firebase temporarily for testing
      const app = initializeApp(firebaseConfig, 'testApp');
      const auth = getAuth(app);
      
      // Try anonymous sign-in as a simple test
      await signInAnonymously(auth);
      
      toast({
        title: "Connection Successful",
        description: "Firebase connection was verified successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Firebase connection error:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Firebase. Please check your configuration.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Save Firebase configuration
  const onSubmit = (data: FirebaseConfigValues) => {
    // Create complete config with derived fields if necessary
    const fullConfig: FirebaseIntegration = {
      config: {
        apiKey: data.apiKey,
        authDomain: data.authDomain || `${data.projectId}.firebaseapp.com`,
        projectId: data.projectId,
        storageBucket: data.storageBucket || `${data.projectId}.appspot.com`,
        messagingSenderId: data.messagingSenderId || '',
        appId: data.appId,
      }
    };
    
    onSave(fullConfig);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Firebase Configuration</DialogTitle>
          <DialogDescription>
            Enter your Firebase project details to enable data persistence and authentication.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firebase API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="AIza..." {...field} />
                  </FormControl>
                  <FormDescription>
                    The API Key from your Firebase project settings.
                  </FormDescription>
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
                    <Input 
                      placeholder="my-project-123" 
                      {...field} 
                      onChange={handleProjectIdChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Your Firebase project identifier.
                  </FormDescription>
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
                    <Input placeholder="1:12345:web:abcdef..." {...field} />
                  </FormControl>
                  <FormDescription>
                    The unique identifier for your Firebase app.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator className="my-4" />
            
            <div className="text-sm text-gray-500">
              <h3 className="font-medium">Advanced Settings (Optional)</h3>
              <p className="mt-1">These fields will be auto-generated if left empty.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="authDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auth Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-generated" {...field} />
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
                    <FormLabel>Storage Bucket</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-generated" {...field} />
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
                    <FormLabel>Messaging Sender ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="flex justify-between items-center pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <>
                    <span className="mr-2">Testing...</span>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit">Save Configuration</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}