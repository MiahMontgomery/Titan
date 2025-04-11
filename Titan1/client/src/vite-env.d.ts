/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly [key: string]: string | undefined;
    readonly VITE_API_URL?: string;
    readonly VITE_WS_URL?: string;
    readonly VITE_OPENAI_API_KEY?: string;
  };
}