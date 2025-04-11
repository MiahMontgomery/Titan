/**
 * Helper functions for server operations
 */

/**
 * Format timestamp for logging
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Log a message with timestamp
 */
export function log(message: string): void {
  console.log(`[${getTimestamp()}] INFO: ${message}`);
}

/**
 * Log a warning with timestamp
 */
export function warn(message: string): void {
  console.warn(`[${getTimestamp()}] WARNING: ${message}`);
}

/**
 * Log an error with timestamp
 */
export function error(message: string): void {
  console.error(`[${getTimestamp()}] ERROR: ${message}`);
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a string is valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncate(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    error(`Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`);
    return fallback;
  }
}

/**
 * Safely stringify an object with error handling
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    error(`Failed to stringify object: ${e instanceof Error ? e.message : String(e)}`);
    return fallback;
  }
}