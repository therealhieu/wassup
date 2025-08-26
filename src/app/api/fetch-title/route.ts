import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';
import { HEADERS } from '@/lib/http/constants';

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: HEADERS.CORS,
  });
}

export async function GET(request: NextRequest) {
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
