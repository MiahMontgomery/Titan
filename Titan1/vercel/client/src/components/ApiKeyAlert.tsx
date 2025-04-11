import { useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { useLocation } from 'wouter';

/**
 * Component that checks for API keys on startup and prompts the user
 * to add them if they are missing.
 */
export function ApiKeyAlert() {
  const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean | null>(null);
  const [hasFirebaseKeys, setHasFirebaseKeys] = useState<boolean | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check for API keys on component mount
  useEffect(() => {
    const checkApiKeys = async () => {
      try {
        // Check OpenAI API key
        const openaiResponse = await fetch('/api/check-keys/openai');
        const openaiData = await openaiResponse.json();
        setHasOpenAIKey(openaiData.valid);

        // Check Firebase keys
        const firebaseResponse = await fetch('/api/check-keys/firebase');
        const firebaseData = await firebaseResponse.json();
        setHasFirebaseKeys(firebaseData.valid);

        // Show notification if OpenAI key is missing or invalid
        if (!openaiData.valid && window.location.pathname !== '/settings') {
          toast({
            title: "OpenAI API Key Required",
            description: "The OpenAI API key is missing or invalid. Please add it in Settings to enable AI functionality.",
            variant: "destructive",
            action: (
              <div 
                className="bg-green-600 text-white px-3 py-1 rounded-md cursor-pointer"
                onClick={() => navigate('/settings')}
              >
                Go to Settings
              </div>
            ),
            duration: 10000, // Show for 10 seconds
          });
        }
      } catch (error) {
        console.error('Error checking API keys:', error);
      }
    };

    checkApiKeys();
  }, [toast, navigate]);

  return null; // This component doesn't render anything
}