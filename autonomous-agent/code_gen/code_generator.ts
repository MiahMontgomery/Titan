/**
 * Code Generator
 * 
 * This component is responsible for generating code based on task specifications,
 * including:
 * - Creating new files and components
 * - Modifying existing code
 * - Implementing specific functionality
 * - Generating tests
 */

import * as path from 'path';
import { OpenAIConnector, CodeGenerationParams } from '../core/openai_connector';
import { MemoryManager } from '../memory/memory_manager';
import { Logger } from '../logging/logger';
import { Task } from '../tasks/task_manager';

interface CodeResult {
  code: string;
  filePath: string;
  language: string;
  explanation: string;
}

interface FileSpec {
  filePath: string;
  content: string;
  description: string;
}

export class CodeGenerator {
  private ai: OpenAIConnector;
  private memory: MemoryManager;
  private logger: Logger;
  private projectRoot: string;
  
  constructor(ai: OpenAIConnector, memory: MemoryManager, logger: Logger) {
    this.ai = ai;
    this.memory = memory;
    this.logger = logger;
    this.projectRoot = process.cwd();
  }
  
  /**
   * Generate code for a task
   */
  public async generateCode(task: Task): Promise<CodeResult> {
    this.logger.info(`Generating code for task: ${task.name}`);
    
    // Determine what kind of code generation is needed
    const codeType = await this.determineCodeType(task);
    
    // If this is a complex task that requires multiple files
    if (codeType === 'multi-file') {
      return await this.generateMultiFileImplementation(task);
    }
    
    // If this is modifying existing code
    if (codeType === 'modification') {
      return await this.generateCodeModification(task);
    }
    
    // Default: generate a single file implementation
    return await this.generateSingleFileImplementation(task);
  }
  
  /**
   * Determine what type of code generation is needed for a task
   */
  private async determineCodeType(task: Task): Promise<'single-file' | 'multi-file' | 'modification'> {
    // Check if task context specifies the code type
    if (task.context?.codeType) {
      return task.context.codeType;
    }
    
    // If task description mentions modifying existing code
    const modificationKeywords = ['modify', 'update', 'change', 'fix', 'refactor', 'extend'];
    if (modificationKeywords.some(keyword => 
      task.description.toLowerCase().includes(keyword)
    )) {
      return 'modification';
    }
    
    // If task is complex (high effort), likely needs multiple files
    if (task.estimatedEffort >= 8) {
      return 'multi-file';
    }
    
    // Default to single file
    return 'single-file';
  }
  
  /**
   * Generate a single file implementation
   */
  private async generateSingleFileImplementation(task: Task): Promise<CodeResult> {
    // Determine the best language to use
    const language = await this.determineLanguage(task);
    
    // Determine the appropriate file path
    const filePath = await this.determineFilePath(task, language);
    
    // Check if we need to modify existing code
    let existingCode: string | undefined;
    try {
      const projectState = this.memory.getProjectState();
      if (await projectState.fileExists(filePath)) {
        existingCode = await projectState.readFile(filePath);
        this.logger.info(`Found existing file at ${filePath}, will update it`);
      }
    } catch (error) {
      this.logger.warn(`Error checking for existing file: ${error}`);
    }
    
    // Generate code using AI
    const params: CodeGenerationParams = {
      prompt: `
        Task: ${task.name}
        
        Description: ${task.description}
        
        ${task.context ? `Additional context: ${JSON.stringify(task.context, null, 2)}` : ''}
        
        ${task.testCriteria?.length ? `Test criteria:\n${task.testCriteria.map(c => `- ${c}`).join('\n')}` : ''}
        
        Generate a complete, production-ready implementation for this task.
        ${existingCode ? 'Modify the existing code to implement this task.' : 'Create a new implementation from scratch.'}
        
        File path: ${filePath}
      `,
      language,
      existingCode,
      constraints: [
        'Write clean, maintainable code',
        'Include appropriate error handling',
        'Add comments for complex logic',
        'Follow best practices for the language'
      ]
    };
    
    try {
      const result = await this.ai.generateCode(params);
      
      // Save the generated code
      const projectState = this.memory.getProjectState();
      await projectState.updateFiles(filePath, result.code, task.name);
      
      this.logger.success(`Generated code for ${filePath}`);
      
      return {
        code: result.code,
        filePath,
        language,
        explanation: result.explanation
      };
    } catch (error) {
      this.logger.error(`Failed to generate code: ${error}`);
      throw new Error(`Code generation failed: ${error}`);
    }
  }
  
  /**
   * Generate a multi-file implementation
   */
  private async generateMultiFileImplementation(task: Task): Promise<CodeResult> {
    // For multi-file implementations, first determine what files we need to create
    const fileSpecs = await this.determineRequiredFiles(task);
    
    // Generate each file
    const generatedFiles: FileSpec[] = [];
    
    for (const spec of fileSpecs) {
      try {
        // Determine language from file extension
        const extension = path.extname(spec.filePath).slice(1);
        const language = this.mapExtensionToLanguage(extension);
        
        // Check if file already exists
        let existingCode: string | undefined;
        try {
          const projectState = this.memory.getProjectState();
          if (await projectState.fileExists(spec.filePath)) {
            existingCode = await projectState.readFile(spec.filePath);
          }
        } catch (error) {
          this.logger.warn(`Error checking for existing file: ${error}`);
        }
        
        // Generate code for this file
        const params: CodeGenerationParams = {
          prompt: `
            Task: ${task.name}
            
            Description: ${spec.description}
            
            This file is part of a multi-file implementation.
            File purpose: ${spec.description}
            
            Generate a complete, production-ready implementation for this file.
            ${existingCode ? 'Modify the existing code to implement this functionality.' : 'Create a new implementation from scratch.'}
            
            File path: ${spec.filePath}
          `,
          language,
          existingCode,
          constraints: [
            'Write clean, maintainable code',
            'Include appropriate error handling',
            'Add comments for complex logic',
            'Follow best practices for the language'
          ]
        };
        
        const result = await this.ai.generateCode(params);
        
        // Save the generated code
        const projectState = this.memory.getProjectState();
        await projectState.updateFiles(spec.filePath, result.code, `${task.name} - ${spec.description}`);
        
        generatedFiles.push({
          filePath: spec.filePath,
          content: result.code,
          description: spec.description
        });
        
        this.logger.success(`Generated code for ${spec.filePath}`);
      } catch (error) {
        this.logger.error(`Failed to generate code for ${spec.filePath}: ${error}`);
      }
    }
    
    // Return the main file or the first file as the primary result
    const mainFile = generatedFiles.find(f => f.filePath.includes('index')) || generatedFiles[0];
    
    if (!mainFile) {
      throw new Error('Failed to generate any files');
    }
    
    return {
      code: mainFile.content,
      filePath: mainFile.filePath,
      language: this.mapExtensionToLanguage(path.extname(mainFile.filePath).slice(1)),
      explanation: `Generated ${generatedFiles.length} files for this task:\n${generatedFiles.map(f => `- ${f.filePath}: ${f.description}`).join('\n')}`
    };
  }
  
  /**
   * Generate code modifications for an existing file
   */
  private async generateCodeModification(task: Task): Promise<CodeResult> {
    // Determine which file to modify
    const filePath = task.context?.filePath || await this.findFileToModify(task);
    
    if (!filePath) {
      throw new Error('Could not determine which file to modify');
    }
    
    // Get the existing code
    let existingCode: string;
    try {
      const projectState = this.memory.getProjectState();
      existingCode = await projectState.readFile(filePath);
    } catch (error) {
      throw new Error(`Failed to read existing file ${filePath}: ${error}`);
    }
    
    // Determine language from file extension
    const extension = path.extname(filePath).slice(1);
    const language = this.mapExtensionToLanguage(extension);
    
    // Generate code modifications
    const params: CodeGenerationParams = {
      prompt: `
        Task: ${task.name}
        
        Description: ${task.description}
        
        ${task.context ? `Additional context: ${JSON.stringify(task.context, null, 2)}` : ''}
        
        ${task.testCriteria?.length ? `Test criteria:\n${task.testCriteria.map(c => `- ${c}`).join('\n')}` : ''}
        
        Modify the existing code to implement this task.
        
        File path: ${filePath}
      `,
      language,
      existingCode,
      constraints: [
        'Preserve existing functionality unless explicitly told to change it',
        'Make minimal changes necessary to implement the requirements',
        'Maintain consistent coding style with the existing code',
        'Ensure all imports and dependencies are properly handled'
      ]
    };
    
    try {
      const result = await this.ai.generateCode(params);
      
      // Save the modified code
      const projectState = this.memory.getProjectState();
      await projectState.updateFiles(filePath, result.code, `Modified for ${task.name}`);
      
      this.logger.success(`Modified code in ${filePath}`);
      
      return {
        code: result.code,
        filePath,
        language,
        explanation: result.explanation
      };
    } catch (error) {
      this.logger.error(`Failed to modify code: ${error}`);
      throw new Error(`Code modification failed: ${error}`);
    }
  }
  
  /**
   * Determine the language to use for code generation
   */
  private async determineLanguage(task: Task): Promise<string> {
    // Check if task context specifies the language
    if (task.context?.language) {
      return task.context.language;
    }
    
    // Try to infer from task description
    const languages = [
      { name: 'typescript', keywords: ['typescript', 'ts', 'angular', 'react', 'node'] },
      { name: 'javascript', keywords: ['javascript', 'js', 'node', 'react', 'vue'] },
      { name: 'python', keywords: ['python', 'py', 'django', 'flask'] },
      { name: 'java', keywords: ['java', 'spring', 'android'] },
      { name: 'csharp', keywords: ['c#', 'csharp', '.net', 'dotnet'] }
    ];
    
    const taskText = task.name.toLowerCase() + ' ' + task.description.toLowerCase();
    
    for (const lang of languages) {
      if (lang.keywords.some(keyword => taskText.includes(keyword))) {
        return lang.name;
      }
    }
    
    // Get project plan from memory
    const projectPlan = await this.memory.getProjectPlan();
    if (projectPlan?.techStack) {
      // Check backend first
      if (projectPlan.techStack.backend.includes('Node.js')) {
        return 'javascript'; // or typescript if we know it's typescript
      }
      if (projectPlan.techStack.backend.includes('Python')) {
        return 'python';
      }
      // Then check frontend
      if (projectPlan.techStack.frontend.includes('React')) {
        return 'typescript';
      }
    }
    
    // Default to typescript as a safe bet
    return 'typescript';
  }
  
  /**
   * Determine the appropriate file path for a new file
   */
  private async determineFilePath(task: Task, language: string): Promise<string> {
    // Check if task context specifies the file path
    if (task.context?.filePath) {
      return task.context.filePath;
    }
    
    // Get file extension for language
    const extension = this.mapLanguageToExtension(language);
    
    // Convert task name to kebab case for filename
    const filename = task.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    
    // Determine appropriate directory based on task type
    let directory: string;
    
    // Get project plan from memory
    const projectPlan = await this.memory.getProjectPlan();
    
    if (task.description.toLowerCase().includes('backend') || 
        task.description.toLowerCase().includes('server') ||
        task.description.toLowerCase().includes('api')) {
      directory = 'server';
    } else if (task.description.toLowerCase().includes('frontend') || 
               task.description.toLowerCase().includes('ui') ||
               task.description.toLowerCase().includes('component')) {
      directory = 'client/src/components';
    } else if (task.description.toLowerCase().includes('database') || 
               task.description.toLowerCase().includes('model') ||
               task.description.toLowerCase().includes('schema')) {
      directory = 'server/models';
    } else if (task.description.toLowerCase().includes('test') || 
               task.description.toLowerCase().includes('spec')) {
      directory = 'tests';
    } else if (task.description.toLowerCase().includes('util') || 
               task.description.toLowerCase().includes('helper')) {
      directory = 'utils';
    } else {
      // Default directory based on project structure
      directory = projectPlan?.techStack.frontend.includes('React') ? 'client/src' : 'src';
    }
    
    return `${directory}/${filename}.${extension}`;
  }
  
  /**
   * Find the most relevant file to modify for a task
   */
  private async findFileToModify(task: Task): Promise<string | null> {
    // This is a complex task that would typically involve looking at the file system
    // and determining which file is most relevant to the task.
    // For simplicity, we'll infer from task description.
    
    // Get project state to access files
    const projectState = this.memory.getProjectState();
    
    // Extract key terms from task description
    const description = task.name.toLowerCase() + ' ' + task.description.toLowerCase();
    
    // Define key directories to search based on typical project structure
    const dirsToSearch = [
      'src',
      'client/src',
      'server',
      'utils',
      'models',
      'client/src/components',
      'client/src/pages',
      'server/routes',
      'server/controllers'
    ];
    
    // Guess at potential file paths based on keywords in the task
    const componentKeywords = ['component', 'ui', 'interface', 'view', 'page'];
    const serverKeywords = ['api', 'endpoint', 'server', 'route', 'controller'];
    const modelKeywords = ['model', 'schema', 'database', 'entity'];
    
    let targetDirs: string[] = [];
    
    if (componentKeywords.some(keyword => description.includes(keyword))) {
      targetDirs = ['client/src/components', 'client/src/pages', 'src/components'];
    } else if (serverKeywords.some(keyword => description.includes(keyword))) {
      targetDirs = ['server', 'server/routes', 'server/controllers', 'src/api'];
    } else if (modelKeywords.some(keyword => description.includes(keyword))) {
      targetDirs = ['server/models', 'models', 'src/models'];
    }
    
    // If we have target directories, scan them first
    for (const dir of targetDirs) {
      try {
        // This is a simplified implementation - in a real system we would recursively
        // scan the directory and use more sophisticated matching
        const filesToCheck = [
          `${dir}/index.ts`,
          `${dir}/index.js`,
          `${dir}/${task.name.toLowerCase().replace(/\s+/g, '-')}.ts`,
          `${dir}/${task.name.toLowerCase().replace(/\s+/g, '-')}.js`
        ];
        
        for (const file of filesToCheck) {
          if (await projectState.fileExists(file)) {
            return file;
          }
        }
      } catch (error) {
        // Ignore errors when scanning, just try the next directory
      }
    }
    
    // Fall back to checking some common files
    const commonFiles = [
      'server/index.ts',
      'server/index.js',
      'src/index.ts',
      'src/index.js',
      'client/src/App.tsx',
      'client/src/App.js'
    ];
    
    for (const file of commonFiles) {
      if (await projectState.fileExists(file)) {
        return file;
      }
    }
    
    return null;
  }
  
  /**
   * Determine required files for a multi-file implementation
   */
  private async determineRequiredFiles(task: Task): Promise<FileSpec[]> {
    // If task context already specifies the files
    if (task.context?.requiredFiles) {
      return task.context.requiredFiles;
    }
    
    // Create a prompt to determine required files
    const prompt = `
      Task: ${task.name}
      
      Description: ${task.description}
      
      ${task.context ? `Additional context: ${JSON.stringify(task.context, null, 2)}` : ''}
      
      Based on this task, determine what files need to be created or modified.
      For each file, provide:
      1. A file path relative to the project root
      2. A brief description of what this file should contain
      
      Format your response as a JSON array:
      [
        {
          "filePath": "path/to/file.ext",
          "description": "Description of this file's purpose"
        },
        ...
      ]
    `;
    
    try {
      // In a real implementation, we'd send this to the AI
      // For now, we'll use a simplified approach
      
      // Infer language from task
      const language = await this.determineLanguage(task);
      const extension = this.mapLanguageToExtension(language);
      
      // Convert task name to kebab case for filename base
      const filenameBase = task.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
      
      // Determine if this is frontend or backend
      const isFrontend = task.description.toLowerCase().includes('ui') || 
                         task.description.toLowerCase().includes('interface') ||
                         task.description.toLowerCase().includes('component');
      
      // Create some default file specs based on common patterns
      const defaultSpecs: FileSpec[] = [];
      
      if (isFrontend) {
        // Frontend component
        defaultSpecs.push({
          filePath: `client/src/components/${filenameBase}/${filenameBase}.${extension}`,
          description: 'Main component implementation'
        });
        defaultSpecs.push({
          filePath: `client/src/components/${filenameBase}/index.${extension}`,
          description: 'Component entry point'
        });
        defaultSpecs.push({
          filePath: `client/src/components/${filenameBase}/styles.css`,
          description: 'Component styles'
        });
        // Maybe add a test file
        if (task.description.toLowerCase().includes('test')) {
          defaultSpecs.push({
            filePath: `client/src/components/${filenameBase}/${filenameBase}.test.${extension}`,
            description: 'Component tests'
          });
        }
      } else {
        // Backend implementation
        defaultSpecs.push({
          filePath: `server/${filenameBase}.${extension}`,
          description: 'Main implementation'
        });
        // If it looks like an API endpoint, add a controller and route
        if (task.description.toLowerCase().includes('api') || 
            task.description.toLowerCase().includes('endpoint')) {
          defaultSpecs.push({
            filePath: `server/controllers/${filenameBase}.controller.${extension}`,
            description: 'Controller implementation'
          });
          defaultSpecs.push({
            filePath: `server/routes/${filenameBase}.routes.${extension}`,
            description: 'Route definitions'
          });
        }
        // If it involves a database, add a model
        if (task.description.toLowerCase().includes('database') || 
            task.description.toLowerCase().includes('model')) {
          defaultSpecs.push({
            filePath: `server/models/${filenameBase}.model.${extension}`,
            description: 'Data model'
          });
        }
        // Maybe add a test file
        if (task.description.toLowerCase().includes('test')) {
          defaultSpecs.push({
            filePath: `server/${filenameBase}.test.${extension}`,
            description: 'Implementation tests'
          });
        }
      }
      
      return defaultSpecs;
    } catch (error) {
      this.logger.error(`Failed to determine required files: ${error}`);
      // Return a minimal set of files as fallback
      return [
        {
          filePath: `src/${task.name.toLowerCase().replace(/\s+/g, '-')}.${this.mapLanguageToExtension(await this.determineLanguage(task))}`,
          description: 'Implementation for ' + task.name
        }
      ];
    }
  }
  
  /**
   * Map a file extension to a language name
   */
  private mapExtensionToLanguage(extension: string): string {
    const extensionMap: { [key: string]: string } = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'php': 'php',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown'
    };
    
    return extensionMap[extension.toLowerCase()] || 'text';
  }
  
  /**
   * Map a language name to a file extension
   */
  private mapLanguageToExtension(language: string): string {
    const languageMap: { [key: string]: string } = {
      'typescript': 'ts',
      'javascript': 'js',
      'python': 'py',
      'java': 'java',
      'csharp': 'cs',
      'go': 'go',
      'ruby': 'rb',
      'php': 'php',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'markdown': 'md'
    };
    
    return languageMap[language.toLowerCase()] || 'txt';
  }
  
  /**
   * Generate tests for a specific implementation
   */
  public async generateTests(
    code: string, 
    filePath: string, 
    testCriteria: string[] = []
  ): Promise<string> {
    const extension = path.extname(filePath);
    const language = this.mapExtensionToLanguage(extension.slice(1));
    
    // Determine testing framework based on language
    let testFramework = 'jest'; // Default
    
    if (language === 'python') {
      testFramework = 'pytest';
    } else if (language === 'java') {
      testFramework = 'junit';
    } else if (language === 'csharp') {
      testFramework = 'xunit';
    }
    
    // Generate tests using AI
    const testCode = await this.ai.generateTests(
      code, 
      language, 
      testFramework
    );
    
    // Determine test file path
    const dirname = path.dirname(filePath);
    const basename = path.basename(filePath, extension);
    const testFilePath = path.join(dirname, `${basename}.test${extension}`);
    
    // Save test file
    const projectState = this.memory.getProjectState();
    await projectState.updateFiles(testFilePath, testCode, 'Generated tests');
    
    this.logger.success(`Generated tests at ${testFilePath}`);
    
    return testCode;
  }
}