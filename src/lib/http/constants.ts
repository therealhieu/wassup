/**
 * HTTP timeout configurations
 */
export const TIMEOUTS = {
  DEFAULT: 10000, // 10 seconds
  RSS_FEED: 15000, // 15 seconds
  PREVIEW_IMAGE: 10000, // 10 seconds
  API_REQUEST: 30000, // 30 seconds
  SHORT_REQUEST: 5000, // 5 seconds
} as const;

/**
 * Common HTTP headers
 */
export const HEADERS = {
  JSON: {
    'Content-Type': 'application/json',
  },
  CORS: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
  NO_CACHE: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  BROWSER_LIKE: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
  RSS_FEED: {
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
  NODE_ONLY: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
  },
} as const;

/**
 * User agents for different scenarios
 */
export const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (compatible; RSS Reader)',
] as const;

/**
 * Retry configurations
 */
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 100, // milliseconds
  MAX_DELAY: 2000, // milliseconds
  EXPONENTIAL_BACKOFF: true,
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Storage key constants
 */
export const STORAGE_KEYS = {
  APP_STORE: 'app-store-storage',
  USER_PREFERENCES: 'user-preferences',
} as const;

/**
 * API route patterns
 */
export const API_ROUTES = {
  FETCH_TITLE: '/api/fetch-title',
} as const;

/**
 * Create fetch options with common defaults
 */
export const createFetchOptions = (options: RequestInit = {}): RequestInit => {
  const method = options.method || 'GET';
  const hasBody = options.body !== undefined;
  
  // Start with browser-like headers
  let headers = getRuntimeHeaders(HEADERS.BROWSER_LIKE);
  
  // Only add Content-Type when body is present or method is not GET
  if (hasBody || method !== 'GET') {
    headers = { ...headers, ...HEADERS.JSON };
  }
  
  // Merge with provided headers (caller headers override defaults)
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      // Handle array format [["key", "value"], ...]
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      // Handle plain object format
      headers = { ...headers, ...options.headers };
    }
  }
  
  return {
    method,
    headers,
    redirect: 'follow',
    credentials: 'same-origin', // Include cookies for same-origin requests (auth)
    ...options,
  };
};

/**
 * Create fetch options for RSS feeds
 */
export const createRssFetchOptions = (userAgent?: string, signal?: AbortSignal): RequestInit => {
  const baseHeaders = HEADERS.RSS_FEED;
  const runtimeHeaders = getRuntimeHeaders(baseHeaders);
  
  return {
    method: 'GET',
    headers: {
      ...runtimeHeaders,
      ...(userAgent && isNodeRuntime() ? { 'User-Agent': userAgent } : {}),
    },
    redirect: 'follow',
    signal,
  };
};

/**
 * Runtime detection utilities
 */
export const isNodeRuntime = (): boolean => {
  return typeof process !== 'undefined' && process?.versions?.node !== undefined;
};

export const isBrowserRuntime = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Get runtime-appropriate headers
 */
export const getRuntimeHeaders = (baseHeaders: Record<string, string>): Record<string, string> => {
  if (isNodeRuntime()) {
    return { ...baseHeaders, ...HEADERS.NODE_ONLY };
  }
  return baseHeaders;
};

/**
 * Create abort controller with timeout
 */
export const createTimeoutController = (timeout: number): AbortController => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
};
