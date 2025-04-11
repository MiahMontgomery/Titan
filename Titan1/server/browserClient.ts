/**
 * Browser Automation Client for FINDOM
 * 
 * This module provides real browser automation capabilities to interact with
 * web platforms when direct API access is insufficient. It enables
 * the FINDOM system to navigate websites, fill forms, and perform
 * complex web interactions autonomously using Puppeteer.
 */

import { WebAccount } from '@shared/schema';
import { broadcastThinking } from './chatHandler';
import * as puppeteer from 'puppeteer';

// Extend the BrowserSession interface to include Puppeteer browser and page
export interface BrowserSession {
  id: string;
  accountId: number;
  cookies: Record<string, string>;
  active: boolean;
  lastActivity: Date;
  userAgent: string;
  browser?: puppeteer.Browser;
  page?: puppeteer.Page;
  screenshot?: string; // Base64 encoded screenshot
}

/**
 * Interface for page scraping results
 */
export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  links: string[];
  interactions: string[];
  html: string;
  screenshot: string; // Base64 encoded screenshot
}

/**
 * Browser Automation Client
 * Provides real headless browser automation capabilities for web platforms
 * where direct API access is insufficient or unavailable
 */
export class BrowserClient {
  private projectId: number;
  private sessions: Map<number, BrowserSession> = new Map();
  private activeBrowsers: number = 0;
  private maxConcurrentBrowsers: number = 3;
  
  constructor(projectId: number) {
    this.projectId = projectId;
    this.logThinking('Initializing browser automation client with Puppeteer');
  }
  
  /**
   * Create a new browser session for an account
   */
  async createSession(account: WebAccount): Promise<BrowserSession> {
    this.logThinking(`Creating browser session for ${account.service} account ${account.accountName}...`);
    
    try {
      // Launch a new browser instance
      const browser = await puppeteer.launch({
        headless: true, // Use headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        defaultViewport: {
          width: 1280,
          height: 800,
        }
      });
      
      // Create a new page
      const page = await browser.newPage();
      
      // Set user agent
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      await page.setUserAgent(userAgent);
      
      // Create a session ID
      const sessionId = `browser-session-${Date.now()}`;
      
      // Create the session object
      const session: BrowserSession = {
        id: sessionId,
        accountId: account.id,
        cookies: {},
        active: true,
        lastActivity: new Date(),
        userAgent,
        browser,
        page
      };
      
      // Store the session
      this.sessions.set(account.id, session);
      this.activeBrowsers++;
      
      this.logThinking(`Browser session created for ${account.service}`);
      return session;
    } catch (error) {
      this.logThinking(`Error creating browser session: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Navigate to a URL and scrape the page
   */
  async navigateAndScrape(accountId: number, url: string): Promise<ScrapedPage | null> {
    this.logThinking(`Navigating to ${url}...`);
    
    try {
      // Get session
      let session = this.sessions.get(accountId);
      if (!session || !session.active || !session.page) {
        this.logThinking(`No active session for account ${accountId}, creating a new one`);
        
        // Try to get the account and create a new session
        const account = await this.getAccountById(accountId);
        if (!account) {
          this.logThinking(`Account ${accountId} not found, cannot navigate`);
          return null;
        }
        
        session = await this.createSession(account);
      }
      
      // Page is guaranteed to be defined at this point because we checked earlier
      const page = session.page!;
      
      // Navigate to the URL
      this.logThinking(`Navigating browser to ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Get the page title
      const title = await page.title();
      
      // Get the page content
      const content = await page.content();
      
      // Extract links
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map(a => a.href)
          .filter(href => href && href.startsWith('http'));
      });
      
      // Extract interaction elements
      const interactions = await page.evaluate(() => {
        // Find forms, buttons, and input fields
        const forms = Array.from(document.querySelectorAll('form')).map(f => `form:${f.id || f.className || 'unnamed'}`);
        const buttons = Array.from(document.querySelectorAll('button')).map(b => `button:${b.textContent?.trim() || b.id || 'unnamed'}`);
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'))
          .map(i => {
            const input = i as HTMLInputElement;
            return `input:${input.id || input.name || 'unnamed'}`;
          });
        
        return [...forms, ...buttons, ...inputs];
      });
      
      // Take a screenshot
      const screenshot = await page.screenshot({ encoding: 'base64' });
      
      // Update session
      session.lastActivity = new Date();
      session.screenshot = `data:image/png;base64,${screenshot}`;
      this.sessions.set(accountId, session);
      
      // Create page scraping result
      const scrapedPage: ScrapedPage = {
        url,
        title,
        content: await page.evaluate(() => document.body.innerText),
        links,
        interactions,
        html: content,
        screenshot: `data:image/png;base64,${screenshot}`
      };
      
      this.logThinking(`Successfully scraped page: ${url} - Title: "${title}"`);
      return scrapedPage;
    } catch (error) {
      this.logThinking(`Error navigating to ${url}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * Fill and submit a form on a page
   */
  async fillForm(accountId: number, url: string, formData: Record<string, string>): Promise<boolean> {
    this.logThinking(`Filling form at ${url}...`);
    
    try {
      // Get session
      let session = this.sessions.get(accountId);
      if (!session || !session.active || !session.page) {
        this.logThinking(`No active session for account ${accountId}, cannot fill form`);
        return false;
      }
      
      const { page } = session;
      
      // Navigate to the URL if we're not already there
      const currentUrl = page.url();
      if (currentUrl !== url) {
        this.logThinking(`Navigating to form URL: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      }
      
      // Fill each form field
      for (const [field, value] of Object.entries(formData)) {
        this.logThinking(`Filling field: ${field}`);
        
        // Try different selector strategies
        const selectors = [
          `input[name="${field}"]`,
          `input[id="${field}"]`,
          `textarea[name="${field}"]`,
          `textarea[id="${field}"]`,
          `select[name="${field}"]`,
          `select[id="${field}"]`
        ];
        
        let filled = false;
        
        for (const selector of selectors) {
          const elementExists = await page.$(selector) !== null;
          
          if (elementExists) {
            // Clear any existing value
            await page.evaluate((sel) => {
              const element = document.querySelector(sel);
              if (element) {
                (element as HTMLInputElement).value = '';
              }
            }, selector);
            
            // Type the new value
            await page.type(selector, value);
            filled = true;
            break;
          }
        }
        
        if (!filled) {
          this.logThinking(`Could not find field: ${field}`);
        }
      }
      
      // Look for a submit button
      const submitSelectors = [
        'input[type="submit"]',
        'button[type="submit"]',
        'button:contains("Submit")',
        'button:contains("Login")',
        'button:contains("Sign In")',
        'button:contains("Send")'
      ];
      
      let submitted = false;
      
      for (const selector of submitSelectors) {
        try {
          const buttonExists = await page.$(selector) !== null;
          
          if (buttonExists) {
            this.logThinking(`Clicking submit button: ${selector}`);
            await page.click(selector);
            submitted = true;
            break;
          }
        } catch (err) {
          // Continue to next selector
        }
      }
      
      if (!submitted) {
        this.logThinking(`Could not find submit button, trying to submit form directly`);
        // Try to submit the form directly
        const submitted = await page.evaluate(() => {
          const form = document.querySelector('form');
          if (form) {
            form.submit();
            return true;
          }
          return false;
        });
        
        if (!submitted) {
          this.logThinking(`Could not submit form`);
          return false;
        }
      }
      
      // Wait for navigation to complete
      try {
        await page.waitForNavigation({ timeout: 5000 });
      } catch (err) {
        this.logThinking(`Navigation timeout after form submission, continuing`);
      }
      
      // Take a new screenshot after form submission
      const screenshot = await page.screenshot({ encoding: 'base64' });
      
      // Update session
      session.lastActivity = new Date();
      session.screenshot = `data:image/png;base64,${screenshot}`;
      this.sessions.set(accountId, session);
      
      this.logThinking(`Successfully submitted form at ${url}`);
      return true;
    } catch (error) {
      this.logThinking(`Error filling form at ${url}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Login to a service using the browser
   */
  async login(accountId: number, url: string, username?: string, password?: string): Promise<boolean> {
    this.logThinking(`Logging in to ${url}...`);
    
    try {
      // Create session if it doesn't exist
      if (!this.sessions.has(accountId)) {
        const account = await this.getAccountById(accountId);
        if (!account) {
          this.logThinking(`Account ${accountId} not found, cannot login`);
          return false;
        }
        
        await this.createSession(account);
      }
      
      // Get session
      const session = this.sessions.get(accountId)!;
      if (!session.page) {
        this.logThinking(`No browser page in session for account ${accountId}`);
        return false;
      }
      
      const { page } = session;
      
      // Navigate to the login URL
      this.logThinking(`Navigating to login page: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Take a screenshot before login attempt
      let screenshot = await page.screenshot({ encoding: 'base64' });
      session.screenshot = `data:image/png;base64,${screenshot}`;
      
      // Get account details if username/password not provided
      let loginUsername = username;
      let loginPassword = password;
      
      if (!loginUsername || !loginPassword) {
        const account = await this.getAccountById(accountId);
        if (account) {
          loginUsername = account.username;
          loginPassword = account.password;
        }
      }
      
      if (!loginUsername || !loginPassword) {
        this.logThinking(`No login credentials provided or found for account ${accountId}`);
        return false;
      }
      
      // Try to identify username and password fields
      const usernameSelectors = [
        'input[name="username"]',
        'input[id="username"]',
        'input[name="email"]',
        'input[id="email"]',
        'input[name="user"]',
        'input[id="user"]',
        'input[type="email"]',
        'input[type="text"]'
      ];
      
      const passwordSelectors = [
        'input[name="password"]',
        'input[id="password"]',
        'input[name="pass"]',
        'input[id="pass"]',
        'input[type="password"]'
      ];
      
      // Find and fill username field
      let usernameField;
      for (const selector of usernameSelectors) {
        usernameField = await page.$(selector);
        if (usernameField) {
          this.logThinking(`Found username field: ${selector}`);
          await page.type(selector, loginUsername);
          break;
        }
      }
      
      if (!usernameField) {
        this.logThinking(`Could not find username field`);
        return false;
      }
      
      // Find and fill password field
      let passwordField;
      for (const selector of passwordSelectors) {
        passwordField = await page.$(selector);
        if (passwordField) {
          this.logThinking(`Found password field: ${selector}`);
          await page.type(selector, loginPassword);
          break;
        }
      }
      
      if (!passwordField) {
        this.logThinking(`Could not find password field`);
        return false;
      }
      
      // Find and click login button
      const loginSelectors = [
        'input[type="submit"]',
        'button[type="submit"]',
        'button:contains("Login")',
        'button:contains("Sign In")',
        'button:contains("Log In")',
        'a:contains("Login")',
        'a:contains("Sign In")',
        'a:contains("Log In")'
      ];
      
      let loginButton;
      for (const selector of loginSelectors) {
        try {
          loginButton = await page.$(selector);
          if (loginButton) {
            this.logThinking(`Found login button: ${selector}`);
            await page.click(selector);
            break;
          }
        } catch (err) {
          // Continue to next selector
        }
      }
      
      if (!loginButton) {
        this.logThinking(`Could not find login button, trying to submit form directly`);
        // Try to submit the form directly
        const submitted = await page.evaluate(() => {
          const form = document.querySelector('form');
          if (form) {
            form.submit();
            return true;
          }
          return false;
        });
        
        if (!submitted) {
          this.logThinking(`Could not submit login form`);
          return false;
        }
      }
      
      // Wait for navigation to complete
      try {
        await page.waitForNavigation({ timeout: 5000 });
      } catch (err) {
        this.logThinking(`Navigation timeout after login, continuing`);
      }
      
      // Get cookies
      const cookies = await page.cookies();
      const cookieObj: Record<string, string> = {};
      
      for (const cookie of cookies) {
        cookieObj[cookie.name] = cookie.value;
      }
      
      // Take a screenshot after login attempt
      screenshot = await page.screenshot({ encoding: 'base64' });
      
      // Check if login was successful (basic check)
      const isLoggedIn = await page.evaluate((username: string) => {
        // Common indicators of successful login
        const pageText = document.body.innerText.toLowerCase();
        return (
          pageText.includes('logout') ||
          pageText.includes('sign out') ||
          pageText.includes('account') ||
          pageText.includes('profile') ||
          pageText.includes(`welcome ${username.toLowerCase()}`) ||
          pageText.includes(`hello ${username.toLowerCase()}`)
        );
      }, loginUsername as string);
      
      if (isLoggedIn) {
        this.logThinking(`Login appears successful`);
      } else {
        this.logThinking(`Login may have failed, please check screenshot`);
      }
      
      // Update session
      session.cookies = cookieObj;
      session.lastActivity = new Date();
      session.screenshot = `data:image/png;base64,${screenshot}`;
      this.sessions.set(accountId, session);
      
      this.logThinking(`Login attempt completed for ${url}`);
      return true;
    } catch (error) {
      this.logThinking(`Error logging in to ${url}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Close a browser session
   */
  async closeSession(accountId: number): Promise<boolean> {
    this.logThinking(`Closing browser session for account ${accountId}...`);
    
    try {
      // Get session
      const session = this.sessions.get(accountId);
      if (!session) {
        this.logThinking(`No session found for account ${accountId}`);
        return false;
      }
      
      // Close the browser if it exists
      if (session.browser) {
        await session.browser.close();
      }
      
      // Clean up session
      session.active = false;
      session.browser = undefined;
      session.page = undefined;
      this.sessions.delete(accountId);
      this.activeBrowsers--;
      
      this.logThinking(`Successfully closed browser session for account ${accountId}`);
      return true;
    } catch (error) {
      this.logThinking(`Error closing browser session: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Analyze a webpage for interaction opportunities using the current page
   */
  async analyzeWebPage(accountId: number): Promise<any> {
    // Get session
    const session = this.sessions.get(accountId);
    if (!session || !session.active || !session.page) {
      this.logThinking(`No active session for account ${accountId}, cannot analyze page`);
      return null;
    }
    
    const { page } = session;
    const url = page.url();
    
    this.logThinking(`Analyzing webpage at ${url}...`);
    
    try {
      // Extract page information for analysis
      const pageInfo = await page.evaluate(() => {
        // Find forms
        const forms = Array.from(document.querySelectorAll('form')).map(form => {
          const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"])')).map(input => {
            return {
              type: input.getAttribute('type'),
              name: input.getAttribute('name'),
              id: input.getAttribute('id'),
              placeholder: input.getAttribute('placeholder')
            };
          });
          
          const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
          
          return {
            id: form.getAttribute('id'),
            action: form.getAttribute('action'),
            method: form.getAttribute('method'),
            inputs,
            hasSubmit: !!submitButton,
            submitText: submitButton ? (submitButton.textContent || submitButton.getAttribute('value')) : null
          };
        });
        
        // Find buttons
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], a.btn, .button, [role="button"]')).map(btn => {
          return {
            text: btn.textContent?.trim(),
            id: btn.getAttribute('id'),
            class: btn.getAttribute('class'),
            type: btn.tagName.toLowerCase()
          };
        });
        
        // Find navigation links
        const navLinks = Array.from(document.querySelectorAll('nav a, .nav a, .navigation a, .menu a')).map(link => {
          return {
            text: link.textContent?.trim(),
            href: link.getAttribute('href')
          };
        });
        
        // Determine page type
        let pageType = 'unknown';
        const pageText = document.body.innerText.toLowerCase();
        const pageHtml = document.documentElement.outerHTML.toLowerCase();
        
        if (pageHtml.includes('login') || pageHtml.includes('sign in') || document.querySelector('form input[type="password"]')) {
          pageType = 'login';
        } else if (pageHtml.includes('register') || pageHtml.includes('sign up') || pageHtml.includes('create account')) {
          pageType = 'registration';
        } else if (pageHtml.includes('contact') && document.querySelector('form')) {
          pageType = 'contact';
        } else if (pageHtml.includes('checkout') || pageHtml.includes('payment')) {
          pageType = 'checkout';
        } else if (document.querySelector('form textarea')) {
          pageType = 'message';
        }
        
        return {
          title: document.title,
          forms,
          buttons,
          navLinks,
          pageType,
          headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()),
          mainContent: document.querySelector('main')?.textContent?.trim() || document.body.textContent?.trim()
        };
      });
      
      // Take a screenshot for visualization
      const screenshot = await page.screenshot({ encoding: 'base64' });
      session.screenshot = `data:image/png;base64,${screenshot}`;
      this.sessions.set(accountId, session);
      
      // Build analysis result
      const analysis = {
        url,
        title: pageInfo.title,
        pageType: pageInfo.pageType,
        forms: pageInfo.forms,
        interactionPoints: [
          ...pageInfo.buttons.map(btn => ({ 
            type: 'button', 
            text: btn.text, 
            purpose: this.inferButtonPurpose(btn.text || '')
          })),
          ...pageInfo.forms.map(form => ({ 
            type: 'form', 
            purpose: this.inferFormPurpose(form),
            fields: form.inputs.map(input => input.name || input.id)
          }))
        ],
        navigation: pageInfo.navLinks,
        screenshot: `data:image/png;base64,${screenshot}`
      };
      
      this.logThinking(`Completed analysis of ${url}`);
      return analysis;
    } catch (error) {
      this.logThinking(`Error analyzing webpage: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * Infer the purpose of a button from its text
   */
  private inferButtonPurpose(text: string): string {
    text = text.toLowerCase();
    
    if (text.includes('login') || text.includes('sign in')) {
      return 'login';
    } else if (text.includes('register') || text.includes('sign up')) {
      return 'register';
    } else if (text.includes('submit') || text.includes('send')) {
      return 'submit';
    } else if (text.includes('pay') || text.includes('checkout')) {
      return 'payment';
    } else if (text.includes('contact') || text.includes('message')) {
      return 'contact';
    } else if (text.includes('add')) {
      return 'add';
    } else if (text.includes('delete') || text.includes('remove')) {
      return 'delete';
    } else if (text.includes('edit') || text.includes('update')) {
      return 'edit';
    } else if (text.includes('search')) {
      return 'search';
    } else if (text.includes('filter')) {
      return 'filter';
    } else if (text.includes('sort')) {
      return 'sort';
    } else if (text.includes('view') || text.includes('show')) {
      return 'view';
    } else {
      return 'action';
    }
  }
  
  /**
   * Infer the purpose of a form from its fields and attributes
   */
  private inferFormPurpose(form: {
    id?: string | null;
    action?: string | null;
    submitText?: string | null;
    inputs: Array<{
      type?: string | null;
      name?: string | null;
      id?: string | null;
      placeholder?: string | null;
    }>;
  }): string {
    // Check form action/id/class
    const formAttributes = [
      form.id,
      form.action,
      form.submitText
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Look at input types and names
    const inputNames = form.inputs.map((input: any) => 
      (input.name || input.id || input.placeholder || '').toLowerCase()
    ).join(' ');
    
    const combined = `${formAttributes} ${inputNames}`;
    
    if (combined.includes('login') || combined.includes('sign in')) {
      return 'login';
    } else if (combined.includes('register') || combined.includes('sign up')) {
      return 'registration';
    } else if (combined.includes('contact') || combined.includes('message')) {
      return 'contact';
    } else if (combined.includes('search')) {
      return 'search';
    } else if (combined.includes('checkout') || combined.includes('payment') || combined.includes('credit card')) {
      return 'checkout';
    } else if (combined.includes('comment')) {
      return 'comment';
    } else if (combined.includes('subscribe') || combined.includes('newsletter')) {
      return 'subscription';
    } else if (form.inputs.some((input: any) => (input.type === 'password'))) {
      return 'login';
    } else if (form.inputs.some((input: any) => (input.type === 'file'))) {
      return 'upload';
    } else {
      return 'form';
    }
  }
  
  /**
   * Helper to get account by ID from storage
   */
  private async getAccountById(accountId: number): Promise<WebAccount | null> {
    try {
      // Import dynamically to avoid circular dependency
      const { storage } = await import('./storage');
      const account = await storage.getWebAccount(accountId);
      return account || null;
    } catch (error) {
      this.logThinking(`Error getting account: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * Log thinking process for full transparency
   */
  private logThinking(message: string): void {
    // Display in real-time on the Performance tab
    broadcastThinking(this.projectId, `[BrowserClient] ${message}`);
    
    // Also log to console
    console.log(`[BrowserClient:${this.projectId}] ${message}`);
  }
}

// Map of browser client instances by project ID
const browserClients: Map<number, BrowserClient> = new Map();

/**
 * Get or create a browser client for a project
 */
export function getBrowserClient(projectId: number): BrowserClient {
  if (!browserClients.has(projectId)) {
    browserClients.set(projectId, new BrowserClient(projectId));
  }
  
  return browserClients.get(projectId)!;
}

/**
 * Get all browser clients
 */
export function getAllBrowserClients(): Map<number, BrowserClient> {
  return browserClients;
}

/**
 * Get screenshot from active browser session
 */
export async function getBrowserScreenshot(projectId: number, accountId: number): Promise<string | null> {
  const client = getBrowserClient(projectId);
  const session = client['sessions'].get(accountId);
  
  if (!session || !session.active) {
    return null;
  }
  
  return session.screenshot || null;
}

/**
 * Close all browser sessions and clean up when server shutting down
 */
export async function cleanupAllBrowserSessions(): Promise<void> {
  console.log(`Cleaning up ${browserClients.size} browser clients...`);
  
  // Get all project IDs manually to avoid TypeScript errors
  const projectIds: number[] = [];
  browserClients.forEach((_, key) => {
    projectIds.push(key);
  });
  
  for (const projectId of projectIds) {
    try {
      const client = browserClients.get(projectId);
      if (!client) continue;
      
      // Get all session account IDs
      const sessionAccountIds = Array.from(client['sessions'].keys());
      
      for (const accountId of sessionAccountIds) {
        try {
          await client.closeSession(accountId);
        } catch (error) {
          console.error(`Error closing session for account ${accountId}: ${error}`);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up browser client for project ${projectId}: ${error}`);
    }
  }
  
  // Clear all clients
  browserClients.clear();
  console.log('Browser cleanup complete');
}