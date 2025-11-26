import { NextRequest, NextResponse } from 'next/server';

/**
 * Task 9: Debug endpoint to test specific projects
 * GET /api/debug-project?projectId=57
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

    return NextResponse.json({
      projectId,
      project: {
        id: project.id,
        name: project.name,
        affiliation_count: project.affiliation?.length || 0,
        stack_and_integrations_count: project.stack_and_integrations?.length || 0,
        contributing_teams_count: project.contributing_teams?.length || 0,
        funding_received_grants_count: project.funding_received_grants?.length || 0,
        ecosystem_counts: project.ecosystem_counts,
      },
      raw_project: project,
      metadata: data.metadata,
    });
  } catch (error) {
    console.error('Error in /api/debug-project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

