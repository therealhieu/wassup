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
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  },
  RSS_FEED: {
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
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
  USER_CONFIG: '/api/user-config',
  FETCH_TITLE: '/api/fetch-title',
} as const;

/**
 * Create fetch options with common defaults
 */
export const createFetchOptions = (options: RequestInit = {}): RequestInit => ({
  method: 'GET',
  headers: {
    ...HEADERS.JSON,
    ...HEADERS.BROWSER_LIKE,
  },
  redirect: 'follow',
  ...options,
});

/**
 * Create fetch options for RSS feeds
 */
export const createRssFetchOptions = (userAgent?: string, signal?: AbortSignal): RequestInit => ({
  method: 'GET',
  headers: {
    ...HEADERS.RSS_FEED,
    'User-Agent': userAgent || USER_AGENTS[0],
  },
  redirect: 'follow',
  signal,
});

/**
 * Create abort controller with timeout
 */
export const createTimeoutController = (timeout: number): AbortController => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
};