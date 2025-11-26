import { NextRequest, NextResponse } from 'next/server';
import { getPensieveData } from '@/lib/pensieve';

/**
 * Endpoint to get statistics about the fetched Pensieve data
 * GET /api/stats
 */
export async function GET(request: NextRequest) {
  try {
    // Force refresh to get latest data
    const data = await getPensieveData(true);

    // Count projects with grants
    const projectsWithGrants = data.grants?.reduce((acc, grant) => {
      acc.add(grant.to_id);
      return acc;
    }, new Set<string>()).size || 0;

    // Count unique grant givers
    const uniqueGrantGivers = data.grants?.reduce((acc, grant) => {
      acc.add(grant.from_id);
      return acc;
    }, new Set<string>()).size || 0;

    // Group grants by giver
    const grantsByGiver = data.grants?.reduce((acc, grant) => {
      const giver = grant.from_id;
      if (!acc[giver]) {
        acc[giver] = [];
      }
      acc[giver].push(grant);
      return acc;
    }, {} as Record<string, typeof data.grants>) || {};

    return NextResponse.json({
      summary: {
        total_projects: data.projects.length,
        total_affiliations: data.affiliations?.length || 0,
        total_grants: data.grants?.length || 0,
        projects_with_grants: projectsWithGrants,
        unique_grant_givers: uniqueGrantGivers,
      },
      grants_by_giver: Object.entries(grantsByGiver).map(([giverId, grants]) => ({
        giver_id: giverId,
        grant_count: grants.length,
        recipients: grants.map(g => g.to_id),
      })),
      sample_grants: data.grants?.slice(0, 10) || [],
    });
  } catch (error) {
    console.error('Error in /api/stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

