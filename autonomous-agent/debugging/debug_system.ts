/**
 * Debug System
 * 
 * This component is responsible for testing and debugging generated code,
 * including:
 * - Running static analysis tools
 * - Executing tests
 * - Identifying and fixing errors
 * - Optimizing code quality
 */

import * as path from 'path';
import { spawn } from 'child_process';
import { MemoryManager } from '../memory/memory_manager';
import { CodeGenerator } from '../code_gen/code_generator';
import { Logger } from '../logging/logger';

interface DebugResult {
  success: boolean;
  finalCode: string;
  error?: string;
  metrics?: {
    staticAnalysisIssues: number;
    testsPassing: number;
    testsFailing: number;
    codeQualityScore: number;
  };
}

interface StaticAnalysisResult {
  issues: {
    severity: 'error' | 'warning' | 'info';
    message: string;
    line: number;
    column?: number;
  }[];
  errorCount: number;
  warningCount: number;
}

export class DebugSystem {
  private memory: MemoryManager;
  private codeGenerator: CodeGenerator;
  private logger: Logger;
  private maxFixAttempts: number = 3;
  
  constructor(memory: MemoryManager, codeGenerator: CodeGenerator, logger: Logger) {
    this.memory = memory;
    this.codeGenerator = codeGenerator;
    this.logger = logger;
  }
  
  /**
   * Test and debug code
   */
  public async testAndDebug(
    code: string, 
    filePath: string, 
    testCriteria: string[] = []
  ): Promise<DebugResult> {
    this.logger.info(`Testing and debugging code for ${filePath}`);
    
    try {
      // Static analysis
      this.logger.info('Running static analysis...');
      const staticAnalysisResult = await this.runStaticAnalysis(code, filePath);
      
      // If serious errors, fix them first
      let currentCode = code;
      if (staticAnalysisResult.errorCount > 0) {
        this.logger.warn(`Found ${staticAnalysisResult.errorCount} static analysis errors`);
        
        // Try to fix static analysis errors
        for (let attempt = 1; attempt <= this.maxFixAttempts; attempt++) {
          this.logger.info(`Fixing static analysis errors (attempt ${attempt}/${this.maxFixAttempts})...`);
          
          const fixedCode = await this.fixStaticAnalysisIssues(
            currentCode, 
            filePath, 
            staticAnalysisResult
          );
          
          // Check if issues were fixed
          const newAnalysisResult = await this.runStaticAnalysis(fixedCode, filePath);
          
          if (newAnalysisResult.errorCount === 0) {
            this.logger.success('Static analysis errors fixed');
            currentCode = fixedCode;
            break;
          } else if (newAnalysisResult.errorCount < staticAnalysisResult.errorCount) {
            this.logger.info(`Reduced errors from ${staticAnalysisResult.errorCount} to ${newAnalysisResult.errorCount}`);
            currentCode = fixedCode;
            
            // Update for next iteration
            if (attempt < this.maxFixAttempts) {
              staticAnalysisResult.issues = newAnalysisResult.issues;
              staticAnalysisResult.errorCount = newAnalysisResult.errorCount;
            }
          }
          
          if (attempt === this.maxFixAttempts && newAnalysisResult.errorCount > 0) {
            this.logger.warn(`Could not fix all static analysis errors after ${this.maxFixAttempts} attempts`);
          }
        }
      }
      
      // Generate tests if needed
      if (testCriteria.length > 0) {
        this.logger.info('Generating tests...');
        await this.codeGenerator.generateTests(currentCode, filePath, testCriteria);
        
        // Run tests
        this.logger.info('Running tests...');
        const testResult = await this.runTests(currentCode, filePath);
        
        // If tests fail, try to fix
        let testAttempt = 1;
        while (!testResult.success && testAttempt <= this.maxFixAttempts) {
          this.logger.warn(`Tests failed: ${testResult.error}`);
          this.logger.info(`Fixing test failures (attempt ${testAttempt}/${this.maxFixAttempts})...`);
          
          const fixedCode = await this.fixTestFailures(
            currentCode, 
            filePath, 
            testResult.error || 'Unknown test failure',
            testCriteria
          );
          
          // Run tests with fixed code
          currentCode = fixedCode;
          const newTestResult = await this.runTests(currentCode, filePath);
          
          if (newTestResult.success) {
            this.logger.success('Test failures fixed');
            break;
          }
          
          testAttempt++;
          
          if (testAttempt > this.maxFixAttempts) {
            this.logger.error(`Could not fix test failures after ${this.maxFixAttempts} attempts`);
            return {
              success: false,
              finalCode: currentCode,
              error: `Failed to fix test failures: ${newTestResult.error}`,
              metrics: {
                staticAnalysisIssues: staticAnalysisResult.errorCount + staticAnalysisResult.warningCount,
                testsPassing: 0,
                testsFailing: 1, // Assuming at least one test is failing
                codeQualityScore: 0.5 // Mediocre score due to failing tests
              }
            };
          }
        }
      }
      
      // Code optimization (if needed)
      const codeQualityScore = await this.assessCodeQuality(currentCode, filePath);
      
      if (codeQualityScore < 0.7) {
        this.logger.info('Optimizing code quality...');
        const optimizedCode = await this.optimizeCode(currentCode, filePath);
        currentCode = optimizedCode;
      }
      
      // Final assessment
      const finalAnalysis = await this.runStaticAnalysis(currentCode, filePath);
      const finalQualityScore = await this.assessCodeQuality(currentCode, filePath);
      
      this.logger.success(`Code debugging completed for ${filePath}`);
      
      return {
        success: true,
        finalCode: currentCode,
        metrics: {
          staticAnalysisIssues: finalAnalysis.errorCount + finalAnalysis.warningCount,
          testsPassing: 1, // Assuming tests are now passing or weren't required
          testsFailing: 0,
          codeQualityScore: finalQualityScore
        }
      };
    } catch (error) {
      this.logger.error(`Debug process failed: ${error}`);
      
      return {
        success: false,
        finalCode: code,
        error: `Debug process failed: ${error}`
      };
    }
  }
  
  /**
   * Run static analysis on code
   */
  private async runStaticAnalysis(code: string, filePath: string): Promise<StaticAnalysisResult> {
    const extension = path.extname(filePath).slice(1);
    let toolName: string;
    let toolArgs: string[];
    
    // For demonstration, we're just simulating a static analysis tool
    // In a real system, you'd run actual tools like ESLint, Pylint, etc.
    
    // This is a simplified static analysis implementation
    // that looks for some basic issues.
    const issues: StaticAnalysisResult['issues'] = [];
    
    // Check for common issues in the code
    const lines = code.split('\n');
    
    let errorCount = 0;
    let warningCount = 0;
    
    // Look for some basic issues:
    
    // 1. Check for console.log statements (warning)
    lines.forEach((line, index) => {
      if (line.includes('console.log(')) {
        issues.push({
          severity: 'warning',
          message: 'Avoid using console.log in production code',
          line: index + 1
        });
        warningCount++;
      }
    });
    
    // 2. Check for TODO comments (info)
    lines.forEach((line, index) => {
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          severity: 'info',
          message: 'Unresolved TODO or FIXME comment',
          line: index + 1
        });
      }
    });
    
    // 3. Check for syntax errors by looking for unbalanced brackets/parens
    const openChars = '({[';
    const closeChars = ')}]';
    const stack: { char: string; line: number }[] = [];
    
    lines.forEach((line, lineIndex) => {
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const openIndex = openChars.indexOf(char);
        
        if (openIndex !== -1) {
          stack.push({ char, line: lineIndex + 1 });
        } else {
          const closeIndex = closeChars.indexOf(char);
          if (closeIndex !== -1) {
            if (stack.length === 0 || openChars.indexOf(stack[stack.length - 1].char) !== closeIndex) {
              issues.push({
                severity: 'error',
                message: `Mismatched bracket/parenthesis: found '${char}' without matching open character`,
                line: lineIndex + 1,
                column: i + 1
              });
              errorCount++;
            } else {
              stack.pop();
            }
          }
        }
      }
    });
    
    // Any unclosed brackets/parens?
    stack.forEach(item => {
      issues.push({
        severity: 'error',
        message: `Unclosed '${item.char}'`,
        line: item.line
      });
      errorCount++;
    });
    
    // 4. JavaScript/TypeScript-specific checks
    if (extension === 'js' || extension === 'ts' || extension === 'jsx' || extension === 'tsx') {
      // Check for missing semicolons (warning)
      lines.forEach((line, index) => {
        // Skip empty lines, lines with only braces, lines ending with opening brace or lines inside multiline comments
        const trimmedLine = line.trim();
        if (trimmedLine && 
            !trimmedLine.endsWith('{') && 
            !trimmedLine.endsWith('}') && 
            !trimmedLine.endsWith(',') && 
            !trimmedLine.endsWith(';') && 
            !trimmedLine.match(/^(\/\/|\/\*|\*)/)) {
          issues.push({
            severity: 'warning',
            message: 'Missing semicolon',
            line: index + 1
          });
          warningCount++;
        }
      });
      
      // Check for variables declared but never used (warning)
      // This is a simplified check and would need more complex analysis in a real tool
      const declaredVars = new Set<string>();
      const usedVars = new Set<string>();
      
      // Extremely simplified detection
      lines.forEach(line => {
        const constMatch = line.match(/const\s+(\w+)\s*=/);
        const letMatch = line.match(/let\s+(\w+)\s*=/);
        const varMatch = line.match(/var\s+(\w+)\s*=/);
        
        if (constMatch) declaredVars.add(constMatch[1]);
        if (letMatch) declaredVars.add(letMatch[1]);
        if (varMatch) declaredVars.add(varMatch[1]);
        
        // Extremely simple usage detection (this would miss many uses in a real codebase)
        declaredVars.forEach(varName => {
          const pattern = new RegExp(`\\b${varName}\\b`);
          if (line.match(pattern) && !line.match(new RegExp(`(const|let|var)\\s+${varName}\\s*=`))) {
            usedVars.add(varName);
          }
        });
      });
      
      // Find unused variables
      declaredVars.forEach(varName => {
        if (!usedVars.has(varName)) {
          // Find the line where this variable was declared
          let declarationLine = 1;
          lines.forEach((line, index) => {
            if (line.match(new RegExp(`(const|let|var)\\s+${varName}\\s*=`))) {
              declarationLine = index + 1;
            }
          });
          
          issues.push({
            severity: 'warning',
            message: `Variable '${varName}' is declared but never used`,
            line: declarationLine
          });
          warningCount++;
        }
      });
    }
    
    // 5. Python-specific checks
    if (extension === 'py') {
      // Check for Python indentation issues (error)
      let expectedIndentation = 0;
      let currentIndentation = 0;
      
      lines.forEach((line, index) => {
        // Skip empty lines or comments
        if (!line.trim() || line.trim().startsWith('#')) {
          return;
        }
        
        // Count leading spaces
        const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
        currentIndentation = leadingSpaces;
        
        // Lines that end with a colon increase the expected indentation
        if (line.trim().endsWith(':')) {
          expectedIndentation = currentIndentation + 4; // Python standard is 4 spaces
        } 
        // Lines with 'return', 'break', 'continue', etc. can reduce indentation
        else if (line.trim().match(/^(return|break|continue|pass|raise)/)) {
          // No change to expected indentation
        }
        // Check if indentation is what we expect
        else if (currentIndentation !== expectedIndentation && index > 0) {
          // Only flag if this isn't the first line and we expected indentation
          if (expectedIndentation > 0) {
            issues.push({
              severity: 'error',
              message: `Indentation error: expected ${expectedIndentation} spaces, got ${currentIndentation}`,
              line: index + 1
            });
            errorCount++;
          }
        }
      });
    }
    
    return {
      issues,
      errorCount,
      warningCount
    };
  }
  
  /**
   * Fix static analysis issues using AI
   */
  private async fixStaticAnalysisIssues(
    code: string, 
    filePath: string, 
    analysisResult: StaticAnalysisResult
  ): Promise<string> {
    // In a real implementation, we'd use an AI to fix the issues
    // For this demo, we'll make some basic fixes
    
    let fixedCode = code;
    const lines = code.split('\n');
    
    // Process issues in reverse order to maintain line numbers
    const sortedIssues = [...analysisResult.issues].sort((a, b) => b.line - a.line);
    
    for (const issue of sortedIssues) {
      if (issue.severity === 'error') {
        // Handle errors based on message
        if (issue.message.includes('Unclosed')) {
          // For unclosed bracket/parenthesis, try to add the closing char
          const char = issue.message.match(/'(.)'/)![1];
          const matchingClose = { '(': ')', '{': '}', '[': ']' }[char as keyof typeof { '(': ')', '{': '}', '[': ']' }];
          
          if (matchingClose) {
            // Add to end of the line or block
            const lineIndex = Math.min(issue.line, lines.length - 1);
            lines[lineIndex] = lines[lineIndex] + matchingClose;
          }
        } else if (issue.message.includes('Mismatched bracket')) {
          // For mismatched brackets, try to remove the problematic char
          const lineIndex = issue.line - 1;
          const colIndex = (issue.column || 1) - 1;
          
          if (lineIndex < lines.length) {
            lines[lineIndex] = 
              lines[lineIndex].substring(0, colIndex) + 
              lines[lineIndex].substring(colIndex + 1);
          }
        } else if (issue.message.includes('Indentation error')) {
          // Fix Python indentation
          const match = issue.message.match(/expected (\d+) spaces, got (\d+)/);
          if (match) {
            const expected = parseInt(match[1]);
            const got = parseInt(match[2]);
            
            const lineIndex = issue.line - 1;
            if (lineIndex < lines.length) {
              // Calculate how many spaces to add or remove
              const diff = expected - got;
              if (diff > 0) {
                // Add spaces
                lines[lineIndex] = ' '.repeat(diff) + lines[lineIndex];
              } else {
                // Remove spaces
                lines[lineIndex] = lines[lineIndex].substring(-diff);
              }
            }
          }
        }
      } else if (issue.severity === 'warning') {
        // Handle warnings
        if (issue.message.includes('Missing semicolon')) {
          // Add missing semicolon
          const lineIndex = issue.line - 1;
          if (lineIndex < lines.length) {
            lines[lineIndex] = lines[lineIndex] + ';';
          }
        } else if (issue.message.includes('console.log')) {
          // Comment out console.log
          const lineIndex = issue.line - 1;
          if (lineIndex < lines.length) {
            lines[lineIndex] = '// ' + lines[lineIndex] + ' // Remove in production';
          }
        } else if (issue.message.includes('is declared but never used')) {
          // Comment out unused variable declarations
          const lineIndex = issue.line - 1;
          if (lineIndex < lines.length && lines[lineIndex].match(/\b(const|let|var)\b/)) {
            lines[lineIndex] = '// ' + lines[lineIndex] + ' // Unused variable';
          }
        }
      }
    }
    
    fixedCode = lines.join('\n');
    return fixedCode;
  }
  
  /**
   * Run tests for code
   */
  private async runTests(code: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    // In a real implementation, this would run the actual tests
    // For this simplified version, we'll just assume tests pass
    // unless there are obvious issues we can detect
    
    // Basic test: does the code compile/parse?
    try {
      // This is just a simplistic check for syntax errors
      new Function(code); // This will throw if there are syntax errors
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Syntax error: ${error}`
      };
    }
  }
  
  /**
   * Fix test failures using AI
   */
  private async fixTestFailures(
    code: string, 
    filePath: string, 
    testError: string,
    testCriteria: string[]
  ): Promise<string> {
    // In a real implementation, we'd use an AI to fix the test failures
    // For this demo, we'll make some basic fixes for common syntax issues
    
    let fixedCode = code;
    
    // Handle some common syntax errors
    if (testError.includes('Unexpected token')) {
      // Fix some basic syntax issues
      fixedCode = fixedCode.replace(/(\w+)\s*;\s*\(/g, '$1('); // Fix "foo; ()" -> "foo()"
      fixedCode = fixedCode.replace(/,\s*\)/g, ')'); // Fix ",)" -> ")"
      fixedCode = fixedCode.replace(/,\s*,/g, ','); // Fix ",," -> ","
    } else if (testError.includes('is not defined')) {
      // Define missing variables
      const match = testError.match(/\'(.+?)\'\s+is not defined/);
      if (match) {
        const varName = match[1];
        fixedCode = `let ${varName};\n${fixedCode}`;
      }
    } else if (testError.includes('Cannot read property')) {
      // Add null checks
      const match = testError.match(/Cannot read property \'(.+?)\' of (.+?)$/);
      if (match) {
        const propName = match[1];
        const objName = match[2];
        
        // Replace direct property access with optional chaining
        const regex = new RegExp(`${objName}\\.${propName}`, 'g');
        fixedCode = fixedCode.replace(regex, `${objName}?.${propName}`);
      }
    }
    
    return fixedCode;
  }
  
  /**
   * Assess code quality
   */
  private async assessCodeQuality(code: string, filePath: string): Promise<number> {
    // In a real implementation, this would use tools like SonarQube or CodeClimate
    // For this demo, we'll use a simple heuristic
    
    let score = 1.0; // Start with perfect score
    
    // Check for various quality issues
    const lines = code.split('\n');
    
    // 1. Long lines (reduce score slightly)
    const longLines = lines.filter(line => line.length > 100).length;
    score -= (longLines / lines.length) * 0.1; // Penalize up to 10% for long lines
    
    // 2. Comment density (higher is better)
    const commentLines = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('#') || 
      line.trim().startsWith('/*') || 
      line.trim().startsWith('*')
    ).length;
    
    const commentRatio = commentLines / lines.length;
    if (commentRatio < 0.1) {
      score -= 0.1; // Penalize up to 10% for too few comments
    }
    
    // 3. Function size (smaller is better)
    let currentFunctionLines = 0;
    let inFunction = false;
    let maxFunctionLines = 0;
    
    lines.forEach(line => {
      if (line.match(/\bfunction\b.*\{/) || line.match(/\=\>\s*\{/)) {
        inFunction = true;
        currentFunctionLines = 1;
      } else if (inFunction) {
        if (line.includes('}')) {
          inFunction = false;
          maxFunctionLines = Math.max(maxFunctionLines, currentFunctionLines);
        } else {
          currentFunctionLines++;
        }
      }
    });
    
    // Penalize large functions
    if (maxFunctionLines > 30) {
      score -= 0.15; // 15% penalty for very large functions
    } else if (maxFunctionLines > 20) {
      score -= 0.1; // 10% penalty for large functions
    } else if (maxFunctionLines > 10) {
      score -= 0.05; // 5% penalty for moderately large functions
    }
    
    // 4. Code duplication (simplistic check)
    const lineFrequency: { [key: string]: number } = {};
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 5) { // Ignore very short lines
        lineFrequency[trimmedLine] = (lineFrequency[trimmedLine] || 0) + 1;
      }
    });
    
    const duplicatedLines = Object.values(lineFrequency).filter(count => count > 1).length;
    score -= (duplicatedLines / lines.length) * 0.2; // Penalize up to 20% for duplicated code
    
    // 5. Magic numbers
    const magicNumberLines = lines.filter(line => {
      // Look for numbers that aren't 0, 1, or -1
      const numbers = line.match(/\b(\d+)\b/g) || [];
      return numbers.some(num => {
        const n = parseInt(num);
        return n !== 0 && n !== 1 && n !== -1;
      });
    }).length;
    
    score -= (magicNumberLines / lines.length) * 0.1; // Penalize up to 10% for magic numbers
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Optimize code quality using AI
   */
  private async optimizeCode(code: string, filePath: string): Promise<string> {
    // In a real implementation, we'd use AI to optimize the code
    // For this demo, we'll make some basic improvements
    
    let optimizedCode = code;
    const lines = code.split('\n');
    
    // 1. Add missing comments for functions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/\bfunction\s+\w+\s*\(/) && i > 0) {
        // If the previous line doesn't have a comment, add one
        const prevLine = lines[i-1].trim();
        if (!prevLine.startsWith('//') && !prevLine.startsWith('/*')) {
          // Insert a comment
          const functionName = line.match(/\bfunction\s+(\w+)\s*\(/)?.[1] || 'function';
          lines.splice(i, 0, `/**\n * ${functionName} function\n */`);
          i += 3; // Skip the lines we just inserted
        }
      }
    }
    
    // 2. Extract magic numbers as constants
    const magicNumbers = new Map<string, number[]>();
    
    lines.forEach((line, index) => {
      // Find numbers that aren't 0, 1, or -1
      const numbers = line.match(/\b(\d+)\b/g) || [];
      numbers.forEach(num => {
        const n = parseInt(num);
        if (n !== 0 && n !== 1 && n !== -1) {
          if (!magicNumbers.has(num)) {
            magicNumbers.set(num, []);
          }
          magicNumbers.get(num)!.push(index);
        }
      });
    });
    
    // Replace frequently used magic numbers with constants
    for (const [num, indices] of magicNumbers.entries()) {
      if (indices.length > 1) {
        // This number appears multiple times, extract it
        const constantName = `CONSTANT_${num}`;
        
        // Find a good place to insert the constant (near the top of the file)
        // Look for the first non-import statement
        let insertPosition = 0;
        while (insertPosition < lines.length && 
              (lines[insertPosition].trim().startsWith('import') || 
               lines[insertPosition].trim() === '')) {
          insertPosition++;
        }
        
        // Insert the constant definition
        lines.splice(insertPosition, 0, `const ${constantName} = ${num};`);
        
        // Increment all subsequent indices since we added a line
        indices.forEach((index, i) => {
          if (index >= insertPosition) {
            indices[i] = index + 1;
          }
        });
        
        // Replace all occurrences of this number with the constant
        indices.forEach(index => {
          lines[index] = lines[index].replace(new RegExp(`\\b${num}\\b`, 'g'), constantName);
        });
      }
    }
    
    // 3. Break up long lines
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 100) {
        // Try to break the line at a sensible place
        const line = lines[i];
        let breakPoint = -1;
        
        // Look for good places to break the line
        ['&&', '||', ',', ';'].forEach(token => {
          const pos = line.indexOf(token, 50); // Start looking from 50th char
          if (pos !== -1 && (breakPoint === -1 || pos < breakPoint)) {
            breakPoint = pos + token.length;
          }
        });
        
        if (breakPoint !== -1) {
          // Insert a line break
          const indent = line.match(/^\s*/)?.[0] || '';
          const newLine = line.substring(0, breakPoint) + '\n' + indent + '  ' + line.substring(breakPoint).trim();
          lines[i] = newLine;
        }
      }
    }
    
    optimizedCode = lines.join('\n');
    return optimizedCode;
  }
  
  /**
   * Run a command and capture output
   */
  private async runCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const process = spawn(command, args);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (exitCode) => {
        resolve({ stdout, stderr, exitCode: exitCode || 0 });
      });
    });
  }
}