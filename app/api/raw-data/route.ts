import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

/**
 * Endpoint to get raw Pensieve API data for debugging
 * GET /api/raw-data?limit=1
 * 
 * This endpoint fetches data directly from the Pensieve API without transformation
 * to show the exact structure returned by the API.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '1', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch directly from API to get raw structure
    let baseUrl = process.env.PENSIEVE_API_BASE;
    const apiKey = process.env.PENSIEVE_API_KEY || process.env.API_KEY;

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'PENSIEVE_API_BASE not configured' },
        { status: 500 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PENSIEVE_API_KEY or API_KEY not configured' },
        { status: 500 }
      );
    }

    // Normalize base URL
    baseUrl = baseUrl.trim().replace(/\/+$/, '');
    const isFullEndpoint = baseUrl.includes('/api/project-relations');
    const url = isFullEndpoint 
      ? `${baseUrl}?limit=${limit}&offset=${offset}`
      : `${baseUrl}/api/project-relations?limit=${limit}&offset=${offset}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    };

    console.log('[Raw Data API] Fetching from:', url);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: `Failed to fetch: ${response.status} ${response.statusText}`,
          url 
        },
        { status: response.status }
      );
    }

    const rawData = await response.json();

    // Return the raw API response
    return NextResponse.json({
      message: 'Raw Pensieve API response (untransformed)',
      url,
      request_params: { limit, offset },
      api_response: rawData,
    });
  } catch (error) {
    console.error('Error in /api/raw-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

