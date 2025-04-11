import fs from 'fs';
import path from 'path';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data', 'storage');

// Initialize data directory if it doesn't exist
function initDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Created data directory: ${DATA_DIR}`);
    }
  } catch (error) {
    console.error(`Failed to create data directory: ${error.message}`);
  }
}

// Save data to file
export async function saveData(key: string, data: any): Promise<void> {
  initDataDirectory();
  
  const filePath = path.join(DATA_DIR, `${key}.json`);
  
  try {
    await fs.promises.writeFile(
      filePath, 
      JSON.stringify(data, null, 2), 
      'utf8'
    );
    console.log(`Data saved: ${key}`);
  } catch (error) {
    console.error(`Failed to save data (${key}): ${error.message}`);
    throw error;
  }
}

// Load data from file
export async function loadData(key: string): Promise<any> {
  const filePath = path.join(DATA_DIR, `${key}.json`);
  
  try {
    const fileExists = fs.existsSync(filePath);
    if (!fileExists) {
      return null;
    }
    
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to load data (${key}): ${error.message}`);
    return null;
  }
}

// Delete data file
export async function deleteData(key: string): Promise<boolean> {
  const filePath = path.join(DATA_DIR, `${key}.json`);
  
  try {
    const fileExists = fs.existsSync(filePath);
    if (!fileExists) {
      return false;
    }
    
    await fs.promises.unlink(filePath);
    console.log(`Data deleted: ${key}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete data (${key}): ${error.message}`);
    return false;
  }
}

// List all data files
export async function listDataKeys(): Promise<string[]> {
  initDataDirectory();
  
  try {
    const files = await fs.promises.readdir(DATA_DIR);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.error(`Failed to list data keys: ${error.message}`);
    return [];
  }
}

// Cache management for temporary data
const memoryCache = new Map<string, { data: any, expiry: number }>();

// Cache data in memory with expiry
export function cacheData(key: string, data: any, ttlSeconds: number = 3600): void {
  const expiry = Date.now() + (ttlSeconds * 1000);
  memoryCache.set(key, { data, expiry });
}

// Get cached data if not expired
export function getCachedData(key: string): any | null {
  const cached = memoryCache.get(key);
  
  if (!cached) {
    return null;
  }
  
  if (cached.expiry < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  
  return cached.data;
}

// Clear expired items from cache
export function cleanupCache(): void {
  const now = Date.now();
  
  for (const [key, value] of memoryCache.entries()) {
    if (value.expiry < now) {
      memoryCache.delete(key);
    }
  }
}

// Set interval to clean up expired cache items
setInterval(cleanupCache, 60000); // Run every minute
