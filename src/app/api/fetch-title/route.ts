import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  // Handle preflight
  return NextResponse.json(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json(
        { error: 'Missing URL' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Fetch the remote page HTML on the server to avoid CORS
    const res = await fetch(url);
    const html = await res.text();
    // Extract <title> tag
    const match = html.match(/<title>(.*?)<\/title>/i);
    const title = match ? match[1] : url;

    return NextResponse.json(
      { title },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('Failed to fetch title:', err);
    return NextResponse.json(
      { title: null, error: 'Fetch failed' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
