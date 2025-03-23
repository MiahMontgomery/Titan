import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to readable format
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Calculate time from now (e.g. "2 hours ago")
export function timeFromNow(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSecs < 60) {
    return 'just now';
  } else if (diffInMins < 60) {
    return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatDate(d);
  }
}

// Function stubs for external integrations
export function connectToFirebase(config: any) {
  console.log('Firebase integration ready for connection', config);
  return {
    success: true,
    message: "Firebase integration ready for connection",
    timestamp: new Date()
  };
}

export function connectToOpenAI(apiKey: string) {
  console.log('OpenAI integration ready for connection', { apiKey: apiKey ? '***' : 'missing' });
  return {
    success: true,
    message: "OpenAI integration ready for connection",
    timestamp: new Date()
  };
}

export function connectToTelegram(token: string) {
  console.log('Telegram integration ready for connection', { token: token ? '***' : 'missing' });
  return {
    success: true,
    message: "Telegram integration ready for connection",
    timestamp: new Date()
  };
}

// Function to generate a random status update message
export function generateStatusMessage(): string {
  const activities = [
    "Analyzing code structure",
    "Generating feature wireframes",
    "Implementing database schema",
    "Testing API endpoints",
    "Refactoring components",
    "Optimizing performance",
    "Debugging authentication flow",
    "Setting up state management",
    "Creating responsive layouts",
    "Writing documentation"
  ];
  
  return activities[Math.floor(Math.random() * activities.length)];
}
