import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

/**
 * Endpoint to get detailed project information for the drawer
 * GET /api/project-details?projectId=57
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId parameter required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.PENSIEVE_API_BASE;
    const apiKey = process.env.PENSIEVE_API_KEY || process.env.API_KEY;

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'API configuration missing' },
        { status: 500 }
      );
    }

    // Normalize base URL
    let normalizedUrl = baseUrl.trim().replace(/\/+$/, '');
    const isFullEndpoint = normalizedUrl.includes('/api/project-relations');
    const url = isFullEndpoint
      ? `${normalizedUrl}?projectId=${projectId}`
      : `${normalizedUrl}/api/project-relations?projectId=${projectId}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API returned ${response.status}`, url },
        { status: response.status }
      );
    }

    const data = await response.json();
    const project = data.data?.project;

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found in response', data },
        { status: 404 }
      );
    }

    // Format the response for the drawer
    return NextResponse.json({
      id: project.id,
      name: project.name,
      categories: project.categories || [],
      category: project.categories?.[0] || project.category,
      affiliations: project.affiliation || [],
      stackAndIntegrations: project.stack_and_integrations || [],
      fundingReceivedGrants: project.funding_received_grants || [],
      cp_total: project.cp_total || 0,
    });
  } catch (error) {
    console.error('Error in /api/project-details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

