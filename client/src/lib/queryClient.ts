import { QueryClient } from '@tanstack/react-query';

// Get API base URL from environment or default to window origin
const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
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
  const { method = 'GET', body, headers = {}, signal } = options;
  
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
  
  if (body !== undefined) {
    requestOptions.body = JSON.stringify(body);
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