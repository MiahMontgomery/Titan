import { Protocol } from 'puppeteer';

declare module 'puppeteer' {
  interface Page {
    setUserAgent(userAgent: string): Promise<void>;
    cookies(
      ...urls: string[]
    ): Promise<Protocol.Network.Cookie[]>;
  }
}