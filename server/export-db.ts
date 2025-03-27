import fs from 'fs';
import path from 'path';
import { getStorage } from './storage';

/**
 * Export Database Script
 * 
 * This script exports the current db.json into the dumps folder
 * with all necessary project data for autonomous operation.
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const DUMPS_DIR = path.join(DATA_DIR, 'dumps');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const EXPORT_PATH = path.join(DUMPS_DIR, 'db.json');

/**
 * Ensures the required directories exist
 */
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created directory: ${DATA_DIR}`);
  }

  if (!fs.existsSync(DUMPS_DIR)) {
    fs.mkdirSync(DUMPS_DIR, { recursive: true });
    console.log(`Created directory: ${DUMPS_DIR}`);
  }
}

/**
 * Export the current database to a JSON file
 */
async function exportDatabase() {
  try {
    ensureDirectories();
    
    // Check if db.json exists
    if (!fs.existsSync(DB_PATH)) {
      console.error(`Database file not found at ${DB_PATH}`);
      return;
    }
    
    // Read the current db.json
    const dbData = fs.readFileSync(DB_PATH, 'utf8');
    
    // Create a timestamp for the backup filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(DUMPS_DIR, `db_backup_${timestamp}.json`);
    
    // Create a backup of the existing export if it exists
    if (fs.existsSync(EXPORT_PATH)) {
      fs.copyFileSync(EXPORT_PATH, backupPath);
      console.log(`Created backup of existing export at ${backupPath}`);
    }
    
    // Write the current db data to the export file
    fs.writeFileSync(EXPORT_PATH, dbData);
    console.log(`Database exported successfully to ${EXPORT_PATH}`);
    
    return { success: true, path: EXPORT_PATH };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error exporting database:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ES modules compatible direct execution check
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  exportDatabase().then((result) => {
    if (result?.success) {
      console.log('Database export completed successfully');
      process.exit(0);
    } else {
      console.error('Database export failed:', result?.error);
      process.exit(1);
    }
  });
}

export { exportDatabase };