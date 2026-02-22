import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';
import { HEADERS } from '@/lib/http/constants';
import { createRateLimiter } from '@/lib/rate-limit';

// ── SSRF protection ──────────────────────────────────────────────────────────

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // Cloud metadata endpoint
  '[::1]',
]);

function isUrlAllowed(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  if (BLOCKED_HOSTS.has(parsed.hostname)) return false;
  if (parsed.hostname.endsWith('.internal')) return false;
  // Block private IPv4 ranges (10.x, 172.16-31.x, 192.168.x)
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)) return false;

  return true;
}

// ── Route handlers ───────────────────────────────────────────────────────────

// 20 requests per minute per IP
const limiter = createRateLimiter(20, 60_000);

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: HEADERS.CORS,
  });
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
  const { success } = limiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: HEADERS.CORS }
    );
  }

  try {
    const { searchParams } = request.nextUrl;
    const url = searchParams.get('url');
    
    if (!url) {
      apiLogger.warn('Missing URL parameter in fetch-title request');
      return NextResponse.json(
        { error: 'Missing URL' },
        { status: 400, headers: HEADERS.CORS }
      );
    }

    if (!isUrlAllowed(url)) {
      apiLogger.warn(`Blocked SSRF attempt: ${url}`);
      return NextResponse.json(
        { error: 'URL not allowed' },
        { status: 400, headers: HEADERS.CORS }
      );
    }

    apiLogger.info(`Fetching title for URL: ${url}`);
    
    const res = await fetch(url);
    const html = await res.text();
    const match = html.match(/<title>(.*?)<\/title>/i);
    const title = match ? match[1] : url;

    return NextResponse.json(
      { title },
      { status: 200, headers: HEADERS.CORS }
    );
  } catch (err) {
    apiLogger.error('Failed to fetch title:', err);
    return NextResponse.json(
      { title: null, error: 'Fetch failed' },
      { status: 500, headers: HEADERS.CORS }
    );
  }
}

