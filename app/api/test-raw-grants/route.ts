import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Endpoint to fetch raw API data and analyze grants structure
 * GET /api/test-raw-grants?projectId=6
 * GET /api/test-raw-grants (fetches first few projects)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

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
    
    // Build URL
    const url = projectId
      ? (isFullEndpoint
          ? `${normalizedUrl}?projectId=${projectId}`
          : `${normalizedUrl}/api/project-relations?projectId=${projectId}`)
      : (isFullEndpoint
          ? `${normalizedUrl}?limit=${limit}&offset=0&includeSnapshot=false`
          : `${normalizedUrl}/api/project-relations?limit=${limit}&offset=0&includeSnapshot=false`);

    console.log('[Test Raw Grants] Fetching from:', url);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API returned ${response.status}`, url, statusText: response.statusText },
        { status: response.status }
      );
    }

    const rawData = await response.json();
    
    // Analyze grants structure
    const projects = projectId 
      ? (rawData.data?.project ? [rawData.data.project] : [])
      : (rawData.data?.projects || []);
    
    const grantsAnalysis = [];
    const ecfGrants = [];
    
    for (const project of projects) {
      const grants = project.funding_received_grants || [];
      
      for (let i = 0; i < grants.length; i++) {
        const grant = grants[i];
        
        const analysis = {
          project_id: project.id,
          project_name: project.name,
          grant_index: i,
          raw_grant: grant,
          organization: {
            raw: grant.organization,
            type: typeof grant.organization,
            isArray: Array.isArray(grant.organization),
            value: grant.organization,
            ids: Array.isArray(grant.organization) 
              ? grant.organization 
              : (grant.organization ? [grant.organization] : []),
          },
          organization_name: {
            raw: grant.organization_name,
            type: typeof grant.organization_name,
            isArray: Array.isArray(grant.organization_name),
            value: grant.organization_name,
          },
          projectDonator: {
            raw: grant.projectDonator,
            type: typeof grant.projectDonator,
            isArray: Array.isArray(grant.projectDonator),
            value: grant.projectDonator,
            ids: Array.isArray(grant.projectDonator)
              ? grant.projectDonator
              : (grant.projectDonator ? [grant.projectDonator] : []),
          },
          projectDonator_name: {
            raw: grant.projectDonator_name,
            type: typeof grant.projectDonator_name,
            isArray: Array.isArray(grant.projectDonator_name),
            value: grant.projectDonator_name,
          },
          amount: grant.amount,
          date: grant.date,
        };
        
        grantsAnalysis.push(analysis);
        
        // Check if this is an ECF grant
        const orgNames = Array.isArray(grant.organization_name) 
          ? grant.organization_name.join(' ').toLowerCase()
          : (grant.organization_name || '').toLowerCase();
        const donatorNames = Array.isArray(grant.projectDonator_name)
          ? grant.projectDonator_name.join(' ').toLowerCase()
          : (grant.projectDonator_name || '').toLowerCase();
          
        if (orgNames.includes('ecf') || 
            orgNames.includes('ethereum community fund') ||
            donatorNames.includes('ecf') ||
            donatorNames.includes('ethereum community fund')) {
          ecfGrants.push(analysis);
        }
      }
    }

    return NextResponse.json({
      message: 'Raw API data analysis',
      url,
      project_id_requested: projectId || null,
      projects_found: projects.length,
      total_grants_analyzed: grantsAnalysis.length,
      ecf_grants_found: ecfGrants.length,
      grants_analysis: grantsAnalysis,
      ecf_grants: ecfGrants,
      raw_api_response: rawData,
      sample_project: projects[0] ? {
        id: projects[0].id,
        name: projects[0].name,
        funding_received_grants_count: (projects[0].funding_received_grants || []).length,
      } : null,
    });
  } catch (error) {
    console.error('Error in /api/test-raw-grants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

