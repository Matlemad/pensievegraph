import { NextRequest, NextResponse } from 'next/server';
import { getPensieveData } from '@/lib/pensieve';
import { normalizeToGraph3D } from '@/lib/normalize';
import { GraphMode } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Read mode as string first to handle legacy values
    const modeParam = searchParams.get('mode') || 'stack_integration';
    
    // Map old mode values to new ones for backward compatibility
    let mode: GraphMode;
    if (modeParam === 'affiliations') {
      mode = 'affiliation';
    } else if (modeParam === 'funding') {
      mode = 'funding_received';
    } else {
      mode = modeParam as GraphMode;
    }

    if (mode !== 'stack_integration' && mode !== 'affiliation' && mode !== 'funding_received') {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "stack_integration", "affiliation", or "funding_received"' },
        { status: 400 }
      );
    }

    const category = searchParams.get('category') || undefined;

    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Fetch Pensieve data
    const pensieveData = await getPensieveData();

    // Normalize to Graph3D (tag parameter removed - will be added when API supports it)
    const graph = normalizeToGraph3D(pensieveData, mode, undefined, category, limit);

    return NextResponse.json(graph);
  } catch (error) {
    console.error('Error in /api/graph:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // In development, return more details
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: errorMessage,
          stack: errorStack,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

