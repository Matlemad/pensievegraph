import { NextRequest, NextResponse } from 'next/server';
import { getPensieveData } from '@/lib/pensieve';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check grants processing
 * GET /api/debug-grants?refresh=true&search=Ethereum Community Fund
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get('refresh') === 'true';
    const searchTerm = searchParams.get('search') || '';
    
    // Fetch Pensieve data
    const pensieveData = await getPensieveData(forceRefresh);
    
    // Filter grants by search term if provided
    const allGrants = pensieveData.grants || [];
    const filteredGrants = searchTerm
      ? allGrants.filter(g => 
          g.from_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.to_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.from_id.toString().includes(searchTerm) ||
          g.to_id.toString().includes(searchTerm)
        )
      : allGrants;
    
    // Check which grant givers/receivers exist in projects
    const projectIds = new Set(pensieveData.projects.map(p => String(p.id)));
    
    const grantsAnalysis = filteredGrants.map(grant => {
      const fromExists = projectIds.has(String(grant.from_id));
      const toExists = projectIds.has(String(grant.to_id));
      
      return {
        ...grant,
        from_exists_in_projects: fromExists,
        to_exists_in_projects: toExists,
        both_exist: fromExists && toExists,
      };
    });
    
    const stats = {
      total_grants: allGrants.length,
      filtered_grants: filteredGrants.length,
      grants_with_both_existing: grantsAnalysis.filter(g => g.both_exist).length,
      grants_missing_giver: grantsAnalysis.filter(g => !g.from_exists_in_projects).length,
      grants_missing_receiver: grantsAnalysis.filter(g => !g.to_exists_in_projects).length,
    };
    
    // Find projects that are grant givers but might not be in the dataset
    const allGiverIds = new Set(allGrants.map(g => String(g.from_id)));
    const missingGivers = Array.from(allGiverIds).filter(id => !projectIds.has(id));
    
    return NextResponse.json({
      search_term: searchTerm || null,
      force_refresh: forceRefresh,
      stats,
      grants: grantsAnalysis,
      missing_giver_ids: missingGivers,
      all_project_ids: Array.from(projectIds).slice(0, 20), // First 20 for reference
      total_projects: pensieveData.projects.length,
    });
  } catch (error) {
    console.error('Error in /api/debug-grants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

