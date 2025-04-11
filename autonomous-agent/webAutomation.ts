import puppeteer, { Browser, Page } from "puppeteer";
import { AgentType, ActivityLogType } from "@shared/types";

/**
 * Web automation for FINDOM and CACHECOW agents
 */
class WebAutomation {
  private browser: Browser | null = null;
  
  /**
   * Initialize the web automation system
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      // Launch browser with sandbox disabled for compatibility in various environments
      this.browser = await puppeteer.launch({
        headless: true, // Use headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
        ]
      });
      
      console.log("Web automation system initialized");
    }
  }
  
  /**
   * Run web automation task
   */
  async run(url: string, options: {
    selectors?: string[];
    waitForSelector?: string;
    screenshotPath?: string;
    extractFullText?: boolean;
    extractTables?: boolean;
    extractLinks?: boolean;
    agentType?: AgentType;
    customScripts?: string;
  } = {}): Promise<{
    success: boolean;
    extractedData: any;
    screenshot?: string;
    error?: string;
  }> {
    try {
      await this.initialize();
      
      if (!this.browser) {
        throw new Error("Browser initialization failed");
      }
      
      // Create a new page
      const page = await this.browser.newPage();
      
      // Set viewport size
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      });
      
      // Set user agent to avoid bot detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log(`Navigating to ${url}`);
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000 // 60 second timeout
      });
      
      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 30000 });
      }
      
      // Extract data according to options
      const extractedData = await this.extractData(page, options);
      
      // Take screenshot if path provided
      let screenshot;
      if (options.screenshotPath) {
        screenshot = await page.screenshot({ 
          path: options.screenshotPath,
          fullPage: true
        });
      }
      
      // Close the page
      await page.close();
      
      return {
        success: true,
        extractedData,
        screenshot: screenshot ? screenshot.toString('base64') : undefined
      };
    } catch (error) {
      console.error("Web automation error:", error);
      return {
        success: false,
        extractedData: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Extract data from a page based on options
   */
  private async extractData(page: Page, options: any): Promise<any> {
    const result: any = {};
    
    // Extract data from specific selectors if provided
    if (options.selectors && options.selectors.length > 0) {
      result.selectedData = {};
      
      for (const selector of options.selectors) {
        try {
          const elements = await page.$$(selector);
          
          if (elements.length > 0) {
            result.selectedData[selector] = await Promise.all(
              elements.map(async (element) => {
                return page.evaluate((el) => el.textContent?.trim(), element);
              })
            );
          }
        } catch (error) {
          console.warn(`Failed to extract data for selector ${selector}:`, error);
        }
      }
    }
    
    // Extract full page text if requested
    if (options.extractFullText) {
      result.fullText = await page.evaluate(() => document.body.innerText);
    }
    
    // Extract tables if requested
    if (options.extractTables) {
      result.tables = await page.evaluate(() => {
        const tableData: any[] = [];
        const tables = document.querySelectorAll('table');
        
        tables.forEach((table, tableIndex) => {
          const tableObj: any = {
            index: tableIndex,
            headers: [],
            rows: []
          };
          
          // Extract headers
          const headerRows = table.querySelectorAll('thead tr');
          if (headerRows.length > 0) {
            const headerCells = headerRows[0].querySelectorAll('th');
            headerCells.forEach((cell) => {
              tableObj.headers.push(cell.textContent?.trim() || '');
            });
          }
          
          // Extract rows
          const rows = table.querySelectorAll('tbody tr');
          rows.forEach((row) => {
            const rowData: string[] = [];
            const cells = row.querySelectorAll('td');
            cells.forEach((cell) => {
              rowData.push(cell.textContent?.trim() || '');
            });
            tableObj.rows.push(rowData);
          });
          
          tableData.push(tableObj);
        });
        
        return tableData;
      });
    }
    
    // Extract links if requested
    if (options.extractLinks) {
      result.links = await page.evaluate(() => {
        const linkData: any[] = [];
        const links = document.querySelectorAll('a');
        
        links.forEach((link) => {
          linkData.push({
            text: link.textContent?.trim() || '',
            href: link.getAttribute('href') || '',
            title: link.getAttribute('title') || ''
          });
        });
        
        return linkData;
      });
    }
    
    // Execute custom scripts if provided
    if (options.customScripts) {
      try {
        // Use Function constructor to create a function from the string
        // This is a security risk if untrusted code is executed
        result.customScriptResult = await page.evaluate(
          new Function(`return (async () => { ${options.customScripts} })()`)
        );
      } catch (error) {
        console.error("Error running custom script:", error);
        result.customScriptError = error instanceof Error ? error.message : String(error);
      }
    }
    
    // Add agent-specific extraction based on agent type
    if (options.agentType) {
      switch (options.agentType) {
        case AgentType.FINDOM:
          // Financial domain specific extraction
          result.financialData = await this.extractFinancialData(page);
          break;
        case AgentType.CACHECOW:
          // Data caching specific extraction
          result.structuredData = await this.extractStructuredData(page);
          break;
      }
    }
    
    return result;
  }
  
  /**
   * Extract financial-specific data
   */
  private async extractFinancialData(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const data: any = {};
      
      // Extract prices and numeric values
      const priceElements = Array.from(document.querySelectorAll(
        '[class*="price"], [class*="cost"], [class*="value"], [id*="price"], [id*="cost"]'
      ));
      
      data.prices = priceElements.map(el => ({
        text: el.textContent?.trim() || '',
        element: el.tagName,
        classes: (el as HTMLElement).className
      }));
      
      // Extract tables with numbers (likely financial tables)
      const tables = document.querySelectorAll('table');
      data.financialTables = Array.from(tables).filter(table => {
        const text = table.textContent || '';
        return /\$|\€|\£|\¥|[0-9]+\.[0-9]+|[0-9]+\,[0-9]+/.test(text);
      }).map(table => ({
        id: table.id,
        className: table.className,
        rowCount: table.rows.length
      }));
      
      // Extract currency symbols and financial metrics
      const text = document.body.innerText;
      data.currencies = {
        usd: (text.match(/\$/g) || []).length,
        eur: (text.match(/\€/g) || []).length,
        gbp: (text.match(/\£/g) || []).length,
        yen: (text.match(/\¥/g) || []).length
      };
      
      return data;
    });
  }
  
  /**
   * Extract structured data for caching
   */
  private async extractStructuredData(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const data: any = {};
      
      // Try to extract JSON-LD structured data
      const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
      data.jsonLd = Array.from(jsonLdElements).map(el => {
        try {
          return JSON.parse(el.textContent || '{}');
        } catch (e) {
          return { error: 'Failed to parse JSON-LD' };
        }
      });
      
      // Try to extract OpenGraph metadata
      const ogMetaTags = document.querySelectorAll('meta[property^="og:"]');
      data.openGraph = {};
      ogMetaTags.forEach(tag => {
        const property = (tag as HTMLMetaElement).getAttribute('property');
        const content = (tag as HTMLMetaElement).getAttribute('content');
        if (property && content) {
          data.openGraph[property.replace('og:', '')] = content;
        }
      });
      
      // Extract other useful metadata
      data.metadata = {};
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(tag => {
        const name = (tag as HTMLMetaElement).getAttribute('name');
        const content = (tag as HTMLMetaElement).getAttribute('content');
        if (name && content) {
          data.metadata[name] = content;
        }
      });
      
      return data;
    });
  }
  
  /**
   * Close browser and clean up
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log("Web automation system closed");
    }
  }
}

// Create and export singleton instance
export const webAutomation = new WebAutomation();
