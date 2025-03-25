import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance } from "date-fns";
import { initializeFirebase } from "./firebase";

// Utility for combining Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to readable format
export function formatDate(date: Date | string): string {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  return format(parsedDate, "MMM dd, yyyy h:mm a");
}

// Format relative time
export function timeFromNow(date: Date | string): string {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  return formatDistance(parsedDate, new Date(), { addSuffix: true });
}

// Connect to Firebase
export function connectToFirebase(config: any) {
  return initializeFirebase(config);
}

// Connect to OpenAI (placeholder)
export function connectToOpenAI(apiKey: string) {
  console.log("Connecting to OpenAI with API key:", apiKey.substring(0, 4) + "...");
  return true;
}

// Connect to Telegram (placeholder)
export function connectToTelegram(token: string) {
  console.log("Connecting to Telegram with token:", token.substring(0, 4) + "...");
  return true;
}

// Generate random status message (for UI demonstration)
export function generateStatusMessage(): string {
  const messages = [
    "Processing data...",
    "Analyzing progress...",
    "Generating insights...",
    "Updating project status...",
    "Calculating metrics...",
    "Optimizing workflow...",
    "Validating goals...",
    "Checking milestone progress...",
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}