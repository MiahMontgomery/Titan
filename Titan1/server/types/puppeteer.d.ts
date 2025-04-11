declare module 'puppeteer' {
  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface Page {
    goto(url: string, options?: any): Promise<any>;
    waitForSelector(selector: string, options?: any): Promise<any>;
    $eval(selector: string, pageFunction: Function, ...args: any[]): Promise<any>;
    $$eval(selector: string, pageFunction: Function, ...args: any[]): Promise<any>;
    evaluate(pageFunction: Function | string, ...args: any[]): Promise<any>;
    click(selector: string, options?: any): Promise<void>;
    type(selector: string, text: string, options?: any): Promise<void>;
    waitForNavigation(options?: any): Promise<any>;
    content(): Promise<string>;
    title(): Promise<string>;
    url(): Promise<string>;
    screenshot(options?: any): Promise<Buffer|string>;
    waitForTimeout(milliseconds: number): Promise<void>;
    $(selector: string): Promise<any>;
    $$(selector: string): Promise<any[]>;
  }

  export function launch(options?: any): Promise<Browser>;
}