import { runPuppeteerTask, takeScreenshot, extractData } from "../server/puppeteer";

interface AutomationStep {
  type: 'navigate' | 'click' | 'type' | 'extract' | 'wait' | 'screenshot' | 'custom';
  params: Record<string, any>;
}

interface AutomationResult {
  success: boolean;
  data?: any;
  error?: string;
  screenshots?: Buffer[];
}

export async function runAutomationWorkflow(steps: AutomationStep[]): Promise<AutomationResult> {
  const result: AutomationResult = {
    success: true,
    data: {},
    screenshots: []
  };
  
  try {
    // Prepare the automation script based on steps
    const script = generateAutomationScript(steps);
    
    // Get the URL from the first navigate step
    const navigateStep = steps.find(step => step.type === 'navigate');
    
    if (!navigateStep) {
      throw new Error('Automation workflow must include a navigate step');
    }
    
    const url = navigateStep.params.url;
    
    // Execute the generated script
    const scriptResult = await runPuppeteerTask(url, script);
    
    if (scriptResult.error) {
      throw new Error(scriptResult.error);
    }
    
    // Store the result
    result.data = scriptResult;
    
    // If there's a screenshot step, add it to the result
    const screenshotStep = steps.find(step => step.type === 'screenshot');
    if (screenshotStep) {
      const screenshot = await takeScreenshot(url);
      result.screenshots?.push(screenshot);
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Generate a JavaScript string for Puppeteer to execute
function generateAutomationScript(steps: AutomationStep[]): string {
  let script = `
    async function run() {
      try {
        const result = {};
        
        // Wait for a short time to ensure page is loaded
        await new Promise(resolve => setTimeout(resolve, 1000));
  `;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    script += `\n        // Step ${i + 1}: ${step.type}\n`;
    
    switch (step.type) {
      case 'navigate':
        // Skip, as we handle navigation separately
        break;
        
      case 'click':
        script += `
        try {
          await document.querySelector('${step.params.selector}').click();
          await new Promise(resolve => setTimeout(resolve, ${step.params.delay || 1000}));
        } catch (e) {
          throw new Error('Failed to click on element: ${step.params.selector}');
        }
        `;
        break;
        
      case 'type':
        script += `
        try {
          const input = document.querySelector('${step.params.selector}');
          input.value = '${step.params.text}';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await new Promise(resolve => setTimeout(resolve, ${step.params.delay || 500}));
        } catch (e) {
          throw new Error('Failed to type text in element: ${step.params.selector}');
        }
        `;
        break;
        
      case 'extract':
        script += `
        try {
          const elements = document.querySelectorAll('${step.params.selector}');
          result['${step.params.name || `extract_${i}`}'] = Array.from(elements).map(el => el.textContent.trim());
        } catch (e) {
          result['${step.params.name || `extract_${i}`}'] = null;
          console.error('Failed to extract data from: ${step.params.selector}');
        }
        `;
        break;
        
      case 'wait':
        script += `
        await new Promise(resolve => setTimeout(resolve, ${step.params.milliseconds || 1000}));
        `;
        break;
        
      case 'custom':
        // Allow custom JavaScript to be executed
        script += `
        try {
          ${step.params.code}
        } catch (e) {
          throw new Error('Failed to execute custom code: ' + e.message);
        }
        `;
        break;
    }
  }
  
  // Close the function and return the result
  script += `
        return result;
      } catch (error) {
        return { error: error.message };
      }
    }
    
    return run();
  `;
  
  return script;
}
