import puppeteer, { Browser, Page } from "puppeteer";

// Store browser instance to reuse
let browser: Browser | null = null;

// Initialize browser instance
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }
  return browser;
}

// Close browser on process exit
process.on('exit', async () => {
  if (browser) {
    await browser.close();
  }
});

// Run a Puppeteer task with provided URL and script
export async function runPuppeteerTask(url: string, script: string): Promise<any> {
  let page: Page | null = null;
  
  try {
    // Get browser instance
    const browser = await getBrowser();
    
    // Create a new page
    page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Execute the provided script in the page context
    const result = await page.evaluate(async (scriptToEval) => {
      try {
        // Create a function from the script string and execute it
        const scriptFn = new Function(scriptToEval);
        return await scriptFn();
      } catch (error) {
        return { error: error.message };
      }
    }, script);
    
    // Close the page to free resources
    await page.close();
    
    // Return the result
    return result;
  } catch (error) {
    // Close the page if it's open
    if (page) {
      await page.close();
    }
    
    // Throw the error
    throw new Error(`Puppeteer task error: ${error.message}`);
  }
}

// Take screenshot of a webpage
export async function takeScreenshot(url: string): Promise<Buffer> {
  let page: Page | null = null;
  
  try {
    // Get browser instance
    const browser = await getBrowser();
    
    // Create a new page
    page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Take screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    
    // Close the page
    await page.close();
    
    return screenshot;
  } catch (error) {
    // Close the page if it's open
    if (page) {
      await page.close();
    }
    
    // Throw the error
    throw new Error(`Screenshot error: ${error.message}`);
  }
}

// Extract data from a webpage
export async function extractData(url: string, selectors: Record<string, string>): Promise<Record<string, any>> {
  let page: Page | null = null;
  
  try {
    // Get browser instance
    const browser = await getBrowser();
    
    // Create a new page
    page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Extract data based on selectors
    const data: Record<string, any> = {};
    
    for (const [key, selector] of Object.entries(selectors)) {
      try {
        data[key] = await page.$eval(selector, (element) => {
          // For text content
          if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            return (element as HTMLInputElement).value;
          }
          // For images
          else if (element.tagName === 'IMG') {
            return (element as HTMLImageElement).src;
          }
          // For links
          else if (element.tagName === 'A') {
            return (element as HTMLAnchorElement).href;
          }
          // Default to text content
          return element.textContent?.trim() || '';
        });
      } catch (err) {
        // Set as null if selector not found
        data[key] = null;
      }
    }
    
    // Close the page
    await page.close();
    
    return data;
  } catch (error) {
    // Close the page if it's open
    if (page) {
      await page.close();
    }
    
    // Throw the error
    throw new Error(`Data extraction error: ${error.message}`);
  }
}
