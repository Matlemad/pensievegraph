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
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
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

