import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance } from "date-fns";
import { initializeFirebase } from "./firebase";
import { Persona } from "./types";

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

/**
 * Calculates a performance score for the persona (0-100)
 * @param persona The persona to score
 * @returns A numeric score from 0-100
 */
export function calculatePersonaScore(persona: Persona): number {
  const { stats } = persona;
  
  // These weights can be adjusted based on importance
  const weights = {
    income: 0.4,
    messages: 0.2,
    responseRate: 0.15,
    contentEffectiveness: 0.15,
    conversionRate: 0.1,
  };
  
  // Simple scoring logic - this could be made more sophisticated
  let score = 0;
  
  // Income score (assuming $1000 is a perfect score)
  score += (Math.min(stats.totalIncome, 1000) / 1000) * 100 * weights.income;
  
  // Message activity score (assuming 100 messages is a perfect score)
  score += (Math.min(stats.messageCount, 100) / 100) * 100 * weights.messages;
  
  // Response rate score (already a percentage)
  score += stats.responseRate * weights.responseRate;
  
  // Content effectiveness (published vs created)
  const contentEffectiveness = stats.contentCreated > 0 
    ? (stats.contentPublished / stats.contentCreated) * 100 
    : 0;
  score += contentEffectiveness * weights.contentEffectiveness;
  
  // Conversion rate (already a percentage)
  score += stats.conversionRate * weights.conversionRate;
  
  // Cap at 100
  return Math.min(Math.round(score), 100);
}