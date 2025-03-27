/**
 * Project State
 * 
 * This component manages the current state of the project, including:
 * - File structure and content
 * - Project settings and configuration
 * - Dependencies and versions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectPlan } from '../core/project_analyzer';

interface FileState {
  path: string;
  content: string;
  lastModified: Date;
  history: {
    content: string;
    timestamp: Date;
    description: string;
  }[];
}

interface DependencyState {
  name: string;
  version: string;
  type: 'production' | 'development';
}

interface ProjectFiles {
  [filePath: string]: FileState;
}

interface ProjectSnapshot {
  files: ProjectFiles;
  dependencies: DependencyState[];
  settings: Record<string, any>;
  timestamp: Date;
}

export class ProjectState {
  private projectRoot: string;
  private files: ProjectFiles = {};
  private dependencies: DependencyState[] = [];
  private settings: Record<string, any> = {};
  
  constructor() {
    this.projectRoot = process.cwd();
  }
  
  /**
   * Initialize the project state based on the project plan
   */
  public async initializeProject(plan: ProjectPlan): Promise<void> {
    // Store project settings
    this.settings = {
      name: plan.projectName,
      description: plan.projectDescription,
      techStack: plan.techStack
    };
    
    // Create or load project file structure
    await this.loadExistingFileStructure();
  }
  
  /**
   * Create a new file or update an existing one
   */
  public async updateFiles(filePath: string, content: string, description: string = 'Updated file'): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    const absPath = path.join(this.projectRoot, normalizedPath);
    
    // Check if parent directories exist, create if needed
    const dirPath = path.dirname(absPath);
    await fs.mkdir(dirPath, { recursive: true });
    
    // Write file content
    await fs.writeFile(absPath, content, 'utf8');
    
    // Update file state in memory
    if (this.files[normalizedPath]) {
      // Add to history
      this.files[normalizedPath].history.push({
        content: this.files[normalizedPath].content,
        timestamp: this.files[normalizedPath].lastModified,
        description: description
      });
      
      // Update current content
      this.files[normalizedPath].content = content;
      this.files[normalizedPath].lastModified = new Date();
    } else {
      // Create new file state
      this.files[normalizedPath] = {
        path: normalizedPath,
        content: content,
        lastModified: new Date(),
        history: []
      };
    }
  }
  
  /**
   * Update multiple files at once
   */
  public async updateMultipleFiles(updates: { path: string; content: string; description?: string }[]): Promise<void> {
    for (const update of updates) {
      await this.updateFiles(update.path, update.content, update.description || 'Updated file');
    }
  }
  
  /**
   * Delete a file
   */
  public async deleteFile(filePath: string): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    const absPath = path.join(this.projectRoot, normalizedPath);
    
    try {
      await fs.unlink(absPath);
      // Keep file history but mark as deleted
      if (this.files[normalizedPath]) {
        // Add to history
        this.files[normalizedPath].history.push({
          content: this.files[normalizedPath].content,
          timestamp: this.files[normalizedPath].lastModified,
          description: 'File deleted'
        });
        
        // Remove from current files
        delete this.files[normalizedPath];
      }
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error}`);
    }
  }
  
  /**
   * Read file content
   */
  public async readFile(filePath: string): Promise<string> {
    const normalizedPath = this.normalizePath(filePath);
    const absPath = path.join(this.projectRoot, normalizedPath);
    
    try {
      return await fs.readFile(absPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }
  
  /**
   * Check if a file exists
   */
  public async fileExists(filePath: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(filePath);
    const absPath = path.join(this.projectRoot, normalizedPath);
    
    try {
      await fs.access(absPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get file history for a specific file
   */
  public getFileHistory(filePath: string): { content: string; timestamp: Date; description: string }[] {
    const normalizedPath = this.normalizePath(filePath);
    
    if (this.files[normalizedPath]) {
      return [...this.files[normalizedPath].history];
    }
    
    return [];
  }
  
  /**
   * Add or update a project dependency
   */
  public async addDependency(name: string, version: string, type: 'production' | 'development'): Promise<void> {
    // Check if dependency already exists
    const existingIndex = this.dependencies.findIndex(d => d.name === name);
    
    if (existingIndex >= 0) {
      // Update version if different
      if (this.dependencies[existingIndex].version !== version) {
        this.dependencies[existingIndex].version = version;
      }
      // Update type if different
      if (this.dependencies[existingIndex].type !== type) {
        this.dependencies[existingIndex].type = type;
      }
    } else {
      // Add new dependency
      this.dependencies.push({ name, version, type });
    }
    
    // Update package.json or equivalent file based on project tech stack
    await this.updateDependencyFiles();
  }
  
  /**
   * Remove a project dependency
   */
  public async removeDependency(name: string): Promise<void> {
    this.dependencies = this.dependencies.filter(d => d.name !== name);
    
    // Update package.json or equivalent file based on project tech stack
    await this.updateDependencyFiles();
  }
  
  /**
   * Update dependency files (package.json, etc.)
   */
  private async updateDependencyFiles(): Promise<void> {
    // Determine what type of dependency file to update based on settings
    const techStack = this.settings.techStack || {};
    const frontendTech = techStack.frontend || [];
    const backendTech = techStack.backend || [];
    
    // Try to determine project type
    if (frontendTech.includes('React') || backendTech.includes('Node.js') || backendTech.includes('Express')) {
      // Node.js project - update package.json
      await this.updateNodeDependencies();
    } else if (backendTech.includes('Python') || backendTech.includes('Flask') || backendTech.includes('Django')) {
      // Python project - update requirements.txt
      await this.updatePythonDependencies();
    }
    // Add more cases for other tech stacks as needed
  }
  
  /**
   * Update package.json for Node.js projects
   */
  private async updateNodeDependencies(): Promise<void> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    let packageJson: any = {};
    
    // Try to read existing package.json
    try {
      const content = await fs.readFile(packageJsonPath, 'utf8');
      packageJson = JSON.parse(content);
    } catch (error) {
      // Create a new package.json if it doesn't exist
      packageJson = {
        name: this.settings.name || 'project',
        version: '0.1.0',
        description: this.settings.description || '',
        main: 'index.js',
        scripts: {
          test: 'echo "Error: no test specified" && exit 1'
        },
        keywords: [],
        author: '',
        license: 'ISC',
        dependencies: {},
        devDependencies: {}
      };
    }
    
    // Update dependencies
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.devDependencies = packageJson.devDependencies || {};
    
    for (const dep of this.dependencies) {
      if (dep.type === 'production') {
        packageJson.dependencies[dep.name] = dep.version;
      } else {
        packageJson.devDependencies[dep.name] = dep.version;
      }
    }
    
    // Write updated package.json
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    
    // Update file state in memory
    await this.updateFiles('package.json', JSON.stringify(packageJson, null, 2), 'Updated dependencies');
  }
  
  /**
   * Update requirements.txt for Python projects
   */
  private async updatePythonDependencies(): Promise<void> {
    const requirementsPath = path.join(this.projectRoot, 'requirements.txt');
    const prodDeps = this.dependencies
      .filter(d => d.type === 'production')
      .map(d => `${d.name}${d.version !== '*' ? '==' + d.version : ''}`);
    
    const devDeps = this.dependencies
      .filter(d => d.type === 'development')
      .map(d => `${d.name}${d.version !== '*' ? '==' + d.version : ''}`);
    
    // Write requirements.txt
    await fs.writeFile(requirementsPath, prodDeps.join('\n'), 'utf8');
    
    // Update file state in memory
    await this.updateFiles('requirements.txt', prodDeps.join('\n'), 'Updated dependencies');
    
    // If there are dev dependencies, also create a dev-requirements.txt
    if (devDeps.length > 0) {
      const devRequirementsPath = path.join(this.projectRoot, 'dev-requirements.txt');
      await fs.writeFile(devRequirementsPath, devDeps.join('\n'), 'utf8');
      await this.updateFiles('dev-requirements.txt', devDeps.join('\n'), 'Updated dev dependencies');
    }
  }
  
  /**
   * Load the existing file structure into memory
   */
  private async loadExistingFileStructure(): Promise<void> {
    try {
      await this.scanDirectory(this.projectRoot);
    } catch (error) {
      console.error(`Failed to load existing file structure: ${error}`);
    }
  }
  
  /**
   * Recursively scan a directory and load all files
   */
  private async scanDirectory(dirPath: string, relativePath: string = ''): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, .git, and other common ignored directories
        if (['node_modules', '.git', 'dist', 'build', '.cache'].includes(entry.name)) {
          continue;
        }
        
        // Recursively scan subdirectories
        await this.scanDirectory(entryPath, entryRelativePath);
      } else if (entry.isFile()) {
        // Skip binary files and very large files
        if (this.shouldSkipFile(entryRelativePath)) {
          continue;
        }
        
        try {
          // Read file content
          const content = await fs.readFile(entryPath, 'utf8');
          const stats = await fs.stat(entryPath);
          
          // Store file state
          this.files[entryRelativePath] = {
            path: entryRelativePath,
            content,
            lastModified: stats.mtime,
            history: []
          };
        } catch (error) {
          console.error(`Failed to read file ${entryPath}: ${error}`);
        }
      }
    }
  }
  
  /**
   * Determine if a file should be skipped during scanning
   */
  private shouldSkipFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    
    // Skip binary and media files
    const skipExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg',
      '.mp3', '.mp4', '.wav', '.avi', '.mov',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx',
      '.zip', '.tar', '.gz', '.rar',
      '.exe', '.dll', '.so', '.dylib'
    ];
    
    if (skipExtensions.includes(extension)) {
      return true;
    }
    
    // Skip common large/generated files
    const skipNames = [
      'package-lock.json',
      'yarn.lock',
      '.DS_Store'
    ];
    
    if (skipNames.includes(path.basename(filePath))) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Normalize a file path to ensure consistent format
   */
  private normalizePath(filePath: string): string {
    // Make sure path is relative to project root
    let normalizedPath = filePath;
    
    // Remove leading ./ if present
    if (normalizedPath.startsWith('./')) {
      normalizedPath = normalizedPath.substring(2);
    }
    
    // Remove leading / if present
    if (normalizedPath.startsWith('/')) {
      normalizedPath = normalizedPath.substring(1);
    }
    
    return normalizedPath;
  }
  
  /**
   * Create a snapshot of the current project state
   */
  public async createSnapshot(): Promise<ProjectSnapshot> {
    return {
      files: { ...this.files },
      dependencies: [...this.dependencies],
      settings: { ...this.settings },
      timestamp: new Date()
    };
  }
  
  /**
   * Restore the project state from a snapshot
   */
  public async restoreFromSnapshot(snapshot: ProjectSnapshot): Promise<void> {
    this.files = { ...snapshot.files };
    this.dependencies = [...snapshot.dependencies];
    this.settings = { ...snapshot.settings };
    
    // Physically restore files from snapshot
    for (const [filePath, fileState] of Object.entries(this.files)) {
      const absPath = path.join(this.projectRoot, filePath);
      const dirPath = path.dirname(absPath);
      
      // Create directories if needed
      await fs.mkdir(dirPath, { recursive: true });
      
      // Write file content
      await fs.writeFile(absPath, fileState.content, 'utf8');
    }
    
    // Update dependency files
    await this.updateDependencyFiles();
  }
}