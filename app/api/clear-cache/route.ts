import { NextRequest, NextResponse } from 'next/server';
import { clearPensieveCache } from '@/lib/pensieve';

/**
 * Endpoint to clear the Pensieve data cache
 * GET /api/clear-cache
 */
export async function GET(request: NextRequest) {
  try {
    clearPensieveCache();
    return NextResponse.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to clear cache', message: errorMessage },
      { status: 500 }
    );
  }
}

