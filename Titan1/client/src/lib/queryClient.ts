<<<<<<< HEAD
import { QueryClient } from '@tanstack/react-query';

// Get API base URL from environment or intelligently derive it based on environment
const API_BASE_URL = (() => {
  // If explicitly set in environment variables, use that
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In Replit environment, use the same origin (no need to change port)
  if (window.location.hostname.includes('.replit.dev') || 
      window.location.hostname.includes('.repl.co')) {
    // Use the same origin as the client
    return window.location.origin;
  }
  
  // In local development, use localhost:5000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // Vercel deployment - if deployed to Vercel, the API is available at the same domain
  if (window.location.hostname.includes('vercel.app')) {
    return window.location.origin;
  }
  
  // For production domain (titan-steel.vercel.app or custom domain)
  if (window.location.hostname === 'titan-steel.vercel.app') {
    return 'https://titan-steel.vercel.app';
  }
  
  // Default to window origin for all other production deployments
  return window.location.origin;
})();

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  data?: any; // Alternative to body, used in some APIs
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Make an API request
 * @param endpoint API endpoint path
 * @param options Request options
 * @returns Promise with response data
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, data, headers = {}, signal } = options;
  
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
    signal,
  };
  
  // Use body if provided, otherwise use data if provided
  if (body !== undefined) {
    requestOptions.body = JSON.stringify(body);
  } else if (data !== undefined) {
    requestOptions.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, requestOptions);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      if (contentType.includes('text/')) {
        return await response.text() as unknown as T;
      }
      
      return undefined as unknown as T;
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(
        data.error?.message || `API request failed: ${response.status} ${response.statusText}`
      );
    }
    
    return data as T;
  } catch (error: any) {
    // Handle AbortError separately
    if (error.name === 'AbortError') {
      throw error;
    }
    
    console.error(`API request error for ${url}:`, error);
    throw error;
  }
}

// Default query client with global configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      queryFn: async ({ queryKey }) => {
        const [endpoint, ...params] = queryKey as [string, ...any[]];
        
        // If the endpoint is not a string or starts with '/', assume it's not an API endpoint
        if (typeof endpoint !== 'string' || !endpoint.startsWith('/')) {
          throw new Error(`Invalid query key: ${endpoint}`);
        }
        
        // Convert params to query string if needed
        let url = endpoint;
        if (params.length === 1 && typeof params[0] === 'object') {
          const searchParams = new URLSearchParams();
          Object.entries(params[0]).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          });
          
          const queryString = searchParams.toString();
          if (queryString) {
            url += `?${queryString}`;
          }
        }
        
        return apiRequest(url);
      },
    },
    mutations: {
      retry: 1,
    },
  },
});
=======
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
