import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to inspect grant data for a specific project
 * GET /api/debug-project-grants?projectId=6
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

    // Extract and analyze grants
    const grants = project.funding_received_grants || [];
    const grantsAnalysis = grants.map((grant: any, index: number) => {
      const orgIds = Array.isArray(grant.organization) 
        ? grant.organization 
        : (grant.organization ? [grant.organization] : []);
      const donatorIds = Array.isArray(grant.projectDonator)
        ? grant.projectDonator
        : (grant.projectDonator ? [grant.projectDonator] : []);
      
      return {
        index,
        raw_grant: grant,
        organization: {
          ids: orgIds,
          names: grant.organization_name || [],
          type: typeof grant.organization,
          isArray: Array.isArray(grant.organization),
        },
        projectDonator: {
          ids: donatorIds,
          names: grant.projectDonator_name || [],
          type: typeof grant.projectDonator,
          isArray: Array.isArray(grant.projectDonator),
        },
        amount: grant.amount,
        date: grant.date,
        analysis: {
          organization_ids_count: orgIds.length,
          donator_ids_count: donatorIds.length,
          has_organization_names: !!grant.organization_name,
          has_donator_names: !!grant.projectDonator_name,
        },
      };
    });

    // Search for ECF-related grants
    const ecfGrants = grantsAnalysis.filter((g: any) => {
      const orgNames = g.organization.names.join(' ').toLowerCase();
      const donatorNames = g.projectDonator.names.join(' ').toLowerCase();
      return orgNames.includes('ecf') || 
             orgNames.includes('ethereum community fund') ||
             donatorNames.includes('ecf') ||
             donatorNames.includes('ethereum community fund');
    });

    return NextResponse.json({
      projectId,
      project_name: project.name,
      total_grants: grants.length,
      grants_analysis: grantsAnalysis,
      ecf_grants: ecfGrants,
      ecf_grants_count: ecfGrants.length,
      raw_project_data: {
        id: project.id,
        name: project.name,
        funding_received_grants: project.funding_received_grants,
      },
    });
  } catch (error) {
    console.error('Error in /api/debug-project-grants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

