import {
  PensieveData,
  PensieveProjectRelationsResponse,
  PensieveProjectRelationsListResponse,
  PensieveProjectSnapshot,
  PensieveGrant,
} from './types';
import { readFile } from 'fs/promises';
import { join } from 'path';

const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10);
let cache: { data: PensieveData; timestamp: number } | null = null;

// Task 4: Implement proper "fetch all pages" helper
async function fetchAllProjectRelations(
  baseUrl: string,
  apiKey: string,
  isFullEndpoint: boolean
): Promise<PensieveProjectSnapshot[]> {
  const all: PensieveProjectSnapshot[] = [];
  const limit = 300; // Max allowed
  let offset = 0;
  let hasMore = true;
  let requestCount = 0;
  let firstResponse: PensieveProjectRelationsListResponse | null = null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  };

  console.log('[Pensieve API] Starting fetchAllProjectRelations with limit=', limit);

  while (hasMore) {
    // Use includeSnapshot=false to get max limit of 300 (vs 50 with snapshots)
    const url = isFullEndpoint 
      ? `${baseUrl}?limit=${limit}&offset=${offset}&includeSnapshot=false`
      : `${baseUrl}/api/project-relations?limit=${limit}&offset=${offset}&includeSnapshot=false`;
    
    requestCount++;
    
    // Log request details
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Pensieve API] Request ${requestCount}:`, {
        url,
        offset,
        limit,
        hasApiKey: !!apiKey,
      });
    }

    let response: Response | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    // Task 11: Handle rate limits with retry
    while (retryCount < maxRetries) {
      response = await fetch(url, { headers });

      if (response.ok) {
        break; // Success, exit retry loop
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;
        retryCount++;
        
        if (retryCount >= maxRetries) {
          throw new Error(
            `Rate limit exceeded after ${maxRetries} retries. Last status: ${response.status}`
          );
        }

        console.warn(
          `[Pensieve API] Rate limit (429) on page ${requestCount}, retry ${retryCount}/${maxRetries}. Waiting ${waitTime}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue; // Retry same request
      }

      // Other errors
      throw new Error(
        `Failed to fetch project relations: ${response.status} ${response.statusText}`
      );
    }

    if (!response || !response.ok) {
      throw new Error(
        `Failed to fetch project relations after retries: ${response?.status || 'unknown'} ${response?.statusText || 'unknown'}`
      );
    }

    const data: PensieveProjectRelationsListResponse = await response.json();

    // Task 3: Verify we're using data.projects (not data.project) in list mode
    if (!data.data.projects || !Array.isArray(data.data.projects)) {
      console.error('[Pensieve API] ERROR: Expected data.projects array in list mode, got:', {
        hasProjects: !!data.data.projects,
        isArray: Array.isArray(data.data.projects),
        hasProject: !!(data as any).data?.project,
      });
      throw new Error('Invalid response format: expected data.projects array in list mode');
    }

    // Task 5: Log pagination details
    if (data.pagination) {
      if (requestCount === 1) {
        firstResponse = data;
        console.log('[Pensieve API] First response pagination:', {
          total: data.pagination.total,
          limit: data.pagination.limit,
          offset: data.pagination.offset,
          hasMore: data.pagination.hasMore,
          projectsInPage: data.data.projects.length,
        });
      }

      // Add projects from this page
      all.push(...data.data.projects);

      // Update pagination state
      hasMore = data.pagination.hasMore;
      // IMPORTANT: Use pagination.limit, not hardcoded limit (in case API returns different limit)
      offset += data.pagination.limit;

      console.log(`[Pensieve API] Page ${requestCount} complete:`, {
        projectsInPage: data.data.projects.length,
        totalFetched: all.length,
        totalExpected: data.pagination.total,
        hasMore,
        nextOffset: offset,
      });
    } else {
      // No pagination info - assume this is the last page
      all.push(...data.data.projects);
      hasMore = false;
      console.log(`[Pensieve API] No pagination info, assuming last page`);
    }

    // Small delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Task 5: Final summary log
  const totalExpected = firstResponse?.pagination?.total || all.length;
  console.log('[Pensieve API] fetchAllProjectRelations complete:', {
    pages: requestCount,
    totalProjects: all.length,
    totalExpected,
    matches: all.length === totalExpected,
  });

  if (all.length !== totalExpected) {
    console.warn(
      `[Pensieve API] WARNING: Fetched ${all.length} projects but expected ${totalExpected}. Some projects may be missing.`
    );
  }

  return all;
}

async function fetchPensieveAPI(): Promise<PensieveData> {
  let baseUrl = process.env.PENSIEVE_API_BASE;
  const apiKey = process.env.PENSIEVE_API_KEY || process.env.API_KEY;

  if (!baseUrl) {
    throw new Error('PENSIEVE_API_BASE not configured');
  }

  if (!apiKey) {
    throw new Error('PENSIEVE_API_KEY or API_KEY not configured');
  }

  // Normalize base URL - remove trailing slash
  baseUrl = baseUrl.trim().replace(/\/+$/, '');
  
  // Check if baseUrl already includes /api/project-relations
  const isFullEndpoint = baseUrl.includes('/api/project-relations');
  
  console.log('[Pensieve API] Configuration:', {
    baseUrl,
    isFullEndpoint,
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey?.substring(0, 10) + '...',
  });

  // Task 4: Use the proper fetchAllProjectRelations helper
  const allProjects = await fetchAllProjectRelations(baseUrl, apiKey, isFullEndpoint);

  // Task 8: Build a map of ALL project IDs (including referenced ones)
  // First, collect all referenced project IDs from relations
  const referencedProjectIds = new Set<string | number>();
  const missingProjects: Array<{ id: string | number; name: string }> = [];
  
  for (const project of allProjects) {
    // Add the project itself
    referencedProjectIds.add(project.id);
    
    // Collect IDs from affiliations
    if (project.affiliation && Array.isArray(project.affiliation)) {
      for (const item of project.affiliation) {
        const refId = item.project || item.project_id;
        if (refId) referencedProjectIds.add(refId);
      }
    }
    
    // Collect IDs from stack_and_integrations
    if (project.stack_and_integrations && Array.isArray(project.stack_and_integrations)) {
      for (const item of project.stack_and_integrations) {
        const refId = item.project || item.project_id;
        if (refId) referencedProjectIds.add(refId);
      }
    }
    
    // Collect IDs from contributing_teams
    if (project.contributing_teams && Array.isArray(project.contributing_teams)) {
      for (const item of project.contributing_teams) {
        const refId = item.project || item.project_id;
        if (refId) referencedProjectIds.add(refId);
      }
    }
    
    // Collect IDs from funding_received_grants (organization and projectDonator)
    if (project.funding_received_grants && Array.isArray(project.funding_received_grants)) {
      for (const grant of project.funding_received_grants) {
        if (grant.organization) {
          const orgIds = Array.isArray(grant.organization) 
            ? grant.organization 
            : [grant.organization];
          orgIds.forEach(id => referencedProjectIds.add(id));
        }
        if (grant.projectDonator) {
          const donatorIds = Array.isArray(grant.projectDonator)
            ? grant.projectDonator
            : [grant.projectDonator];
          donatorIds.forEach(id => referencedProjectIds.add(id));
        }
      }
    }
  }
  
  // Build a map of project IDs for quick lookup (including referenced ones)
  // Use normalized string IDs as keys for consistent lookup
  const projectIdMap = new Map<string, string>();
  const projectNameMap = new Map<string, string>();
  
  // Helper function to normalize ID for consistent lookup
  const normalizeId = (id: string | number): string => String(id);
  
  // Helper function to check if ID exists (check both string and number variants)
  const hasId = (id: string | number): boolean => {
    const normalized = normalizeId(id);
    return projectIdMap.has(normalized);
  };
  
  // Add all projects from dataset
  for (const project of allProjects) {
    const normalizedId = normalizeId(project.id);
    projectIdMap.set(normalizedId, normalizedId);
    projectNameMap.set(normalizedId, project.name);
  }
  
  // Task 8: Create placeholder entries for referenced projects not in dataset
  // First pass: collect names from all projects to build a comprehensive name map
  // This ensures we find names even if a project is only referenced as a giver in grants
  const referencedProjectNames = new Map<string, string>();
  
  // Search for names in all relations and grants of all projects
  for (const project of allProjects) {
    // Search in relations (affiliation, stack_and_integrations, contributing_teams)
    const searchInRelations = (items: any[]) => {
      for (const item of items || []) {
        const itemId = item.project || item.project_id;
        if (itemId) {
          const normalizedItemId = normalizeId(itemId);
          const name = item.project_name || item.name;
          if (name && !referencedProjectNames.has(normalizedItemId)) {
            referencedProjectNames.set(normalizedItemId, name);
          }
        }
      }
    };
    
    searchInRelations(project.affiliation || []);
    searchInRelations(project.stack_and_integrations || []);
    searchInRelations(project.contributing_teams || []);
    
    // Search in grants (organization and projectDonator)
    for (const grant of project.funding_received_grants || []) {
      // Check organization array
      if (grant.organization) {
        const orgIds = Array.isArray(grant.organization) 
          ? grant.organization 
          : [grant.organization];
        
        if (grant.organization_name && Array.isArray(grant.organization_name)) {
          for (let idx = 0; idx < orgIds.length && idx < grant.organization_name.length; idx++) {
            const normalizedOrgId = normalizeId(orgIds[idx]);
            const orgName = grant.organization_name[idx];
            if (orgName && !referencedProjectNames.has(normalizedOrgId)) {
              referencedProjectNames.set(normalizedOrgId, orgName);
            }
          }
        }
      }
      
      // Check projectDonator array
      if (grant.projectDonator) {
        const donatorIds = Array.isArray(grant.projectDonator)
          ? grant.projectDonator
          : [grant.projectDonator];
        
        if (grant.projectDonator_name && Array.isArray(grant.projectDonator_name)) {
          for (let idx = 0; idx < donatorIds.length && idx < grant.projectDonator_name.length; idx++) {
            const normalizedDonatorId = normalizeId(donatorIds[idx]);
            const donatorName = grant.projectDonator_name[idx];
            if (donatorName && !referencedProjectNames.has(normalizedDonatorId)) {
              referencedProjectNames.set(normalizedDonatorId, donatorName);
            }
          }
        }
      }
    }
  }
  
  // Second pass: create placeholder entries for referenced projects not in dataset
  for (const refId of referencedProjectIds) {
    const normalizedRefId = normalizeId(refId);
    if (!projectIdMap.has(normalizedRefId)) {
      // Try to find name from the collected name map
      const refName = referencedProjectNames.get(normalizedRefId) || `Project ${refId}`;
      
      projectIdMap.set(normalizedRefId, normalizedRefId);
      projectNameMap.set(normalizedRefId, refName);
      missingProjects.push({ id: refId, name: refName });
    }
  }
  
  if (missingProjects.length > 0) {
    console.log(`[Pensieve API] Found ${missingProjects.length} referenced projects not in main dataset:`, 
      missingProjects.slice(0, 10).map(p => `${p.name} (${p.id})`).join(', '));
  }

  // Convert to legacy format for compatibility with normalize function
  const projects = allProjects.map((p) => ({
    id: String(p.id),
    name: p.name,
    tags: p.categories || [], // API uses 'categories' (array) as tags
    category: p.categories?.[0], // Use first category as primary category
    ecosystem: undefined,
    cp_total: p.cp_total || 0,
  }));

  // Task 8: Add missing referenced projects to the projects list
  // This ensures they become nodes in the graph even if not in main dataset
  for (const missing of missingProjects) {
    // Only add if not already in projects list
    if (!projects.find(p => p.id === String(missing.id))) {
      projects.push({
        id: String(missing.id),
        name: missing.name,
        tags: [],
        category: undefined,
        ecosystem: undefined,
        cp_total: 0,
      });
    }
  }
  
  if (missingProjects.length > 0) {
    console.log(`[Pensieve API] Added ${missingProjects.length} referenced projects to graph nodes`);
  }

  const affiliations: Array<{
    from_project_id: string;
    to_project_id: string;
    type: 'built_on' | 'library' | 'affiliated' | 'contributor';
  }> = [];

  for (const project of allProjects) {
    const projectId = String(project.id);

    // Process stack_and_integrations (built_on, library)
    if (project.stack_and_integrations && Array.isArray(project.stack_and_integrations)) {
      for (const item of project.stack_and_integrations) {
        // Try to find target project ID - the API uses 'project' field (not 'project_id')
        const targetIdRaw = item.project || item.project_id || item.id || item.target_project_id;
        if (targetIdRaw) {
          const targetId = String(targetIdRaw);
          // Only create link if target project exists in our dataset
          if (hasId(targetId)) {
            // Determine type based on context
            const itemType = (item.type || '').toLowerCase();
            let linkType: 'built_on' | 'library' = 'built_on';
            
            if (itemType === 'library' || itemType === 'uses' || itemType === 'dependency') {
              linkType = 'library';
            }
            
            affiliations.push({
              from_project_id: projectId,
              to_project_id: targetId,
              type: linkType,
            });
          }
        }
      }
    }

    // Process affiliation
    if (project.affiliation && Array.isArray(project.affiliation)) {
      for (const item of project.affiliation) {
        // The API uses 'project' field (not 'project_id')
        const targetIdRaw = item.project || item.project_id || item.id || item.target_project_id;
        if (targetIdRaw) {
          const targetId = String(targetIdRaw);
          if (hasId(targetId)) {
            affiliations.push({
              from_project_id: projectId,
              to_project_id: targetId,
              type: 'affiliated',
            });
          }
        }
      }
    }

    // Process contributing_teams (contributor)
    if (project.contributing_teams && Array.isArray(project.contributing_teams)) {
      for (const item of project.contributing_teams) {
        // The API uses 'project' field (not 'project_id')
        const targetIdRaw = item.project || item.project_id || item.id || item.target_project_id;
        if (targetIdRaw) {
          const targetId = String(targetIdRaw);
          if (hasId(targetId)) {
            affiliations.push({
              from_project_id: projectId,
              to_project_id: targetId,
              type: 'contributor',
            });
          }
        }
      }
    }
  }

  // Extract grants from funding_received_grants
  const grants: Array<{
    from_id: string;
    to_id: string;
    direction: 'given' | 'received';
    amount?: number;
    date?: string;
  }> = [];

  let grantsFound = 0;
  let grantsMapped = 0;
  let grantsSkipped = 0;

  for (const project of allProjects) {
    const projectId = String(project.id);

    // Process funding_received_grants
    if (project.funding_received_grants && Array.isArray(project.funding_received_grants)) {
      for (const grant of project.funding_received_grants) {
        grantsFound++;
        // Grants structure: funding_received_grants means current project RECEIVED funding
        // - organization[] = organization that gave/managed the grant (often same as receiver for self-grants)
        // - projectDonator[] = project that actually donated/gave the funding (might be different)
        // 
        // Logic: If projectDonator exists and is different, use it as giver
        // Otherwise, use organization as giver
        // Current project is always the receiver (since it's in funding_received_grants)
        
        let organizationIds: string[] = [];
        let projectDonatorIds: string[] = [];
        
        if (grant.organization) {
          if (Array.isArray(grant.organization)) {
            organizationIds = grant.organization.map(String);
          } else if (typeof grant.organization === 'string' || typeof grant.organization === 'number') {
            organizationIds = [String(grant.organization)];
          }
        }
        
        if (grant.projectDonator) {
          if (Array.isArray(grant.projectDonator)) {
            projectDonatorIds = grant.projectDonator.map(String);
          } else if (typeof grant.projectDonator === 'string' || typeof grant.projectDonator === 'number') {
            projectDonatorIds = [String(grant.projectDonator)];
          }
        }
        
        // Use ONLY projectDonator for grants (ignore organization completely)
        // Process ALL projectDonator IDs (if multiple)
        const receiverId = projectId;
        
        if (projectDonatorIds.length > 0) {
          for (let i = 0; i < projectDonatorIds.length; i++) {
            const giverId = projectDonatorIds[i];
            
            // Skip self-grants
            if (giverId === receiverId) {
              continue;
            }
            
            const giverName = grant.projectDonator_name?.[i] || giverId;
            const receiverExists = hasId(receiverId);
            const giverExists = hasId(giverId);
            
            if (giverExists && receiverExists) {
              const amount = grant.amount 
                ? (typeof grant.amount === 'string' ? parseFloat(grant.amount) : grant.amount)
                : undefined;

              const grantData: PensieveGrant = {
                from_id: giverId,
                to_id: receiverId,
                direction: 'received',
                amount,
                date: grant.date,
              };
              
              if (giverName) {
                grantData.from_name = giverName;
              }
              grantData.to_name = project.name;
              
              grants.push(grantData);
              grantsMapped++;
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`[Pensieve API] Grant mapped: ${giverName} (${giverId}) -> ${project.name} (${receiverId}), amount: ${amount}`);
              }
            } else {
              if (grantsSkipped < 10) {
                console.log(`[Pensieve API] Grant skipped: ${project.name} (${projectId}) - giver ${giverName} (${giverId}) exists: ${giverExists}, receiver exists: ${receiverExists}`);
              }
              grantsSkipped++;
            }
          }
        } else {
          // No projectDonator - skip this grant
          if (grantsSkipped < 10) {
            console.log(`[Pensieve API] Grant skipped: ${project.name} (${projectId}) - no projectDonator found`);
          }
          grantsSkipped++;
        }
      }
    }
  }

  console.log(`[Pensieve API] Grants processing: found=${grantsFound}, mapped=${grantsMapped}, skipped=${grantsSkipped} (giver not in dataset)`);

  return {
    projects,
    affiliations,
    grants,
  };
}

async function loadMockData(): Promise<PensieveData> {
  try {
    const filePath = join(process.cwd(), 'public', 'mock.json');
    const fileContents = await readFile(filePath, 'utf-8');
    return JSON.parse(fileContents) as PensieveData;
  } catch (e) {
    console.error('Failed to load mock data:', e);
    // Return minimal fallback
    return {
      projects: [],
      affiliations: [],
      grants: [],
    };
  }
}

export async function getPensieveData(forceRefresh = false): Promise<PensieveData> {
  const useMock = process.env.USE_MOCK === 'true';
  
  console.log(`[Pensieve Data] USE_MOCK=${useMock}, using ${useMock ? 'MOCK DATA' : 'REAL API'}`);

  // Check cache (skip if forceRefresh is true)
  if (!forceRefresh && cache && Date.now() - cache.timestamp < CACHE_TTL_SECONDS * 1000) {
    console.log('[Pensieve Data] Using cached data');
    console.log(`[Pensieve Data] Cache contains: ${cache.data.projects.length} projects, ${cache.data.affiliations?.length || 0} affiliations, ${cache.data.grants?.length || 0} grants`);
    return cache.data;
  }

  if (forceRefresh) {
    console.log('[Pensieve Data] Force refresh requested, skipping cache');
  }

  let data: PensieveData;
  try {
    if (useMock) {
      console.log('[Pensieve Data] Loading mock data...');
      data = await loadMockData();
      console.log(`[Pensieve Data] Mock data loaded: ${data.projects.length} projects`);
    } else {
      console.log('[Pensieve Data] Fetching from Pensieve API...');
      data = await fetchPensieveAPI();
      console.log(`[Pensieve Data] API data loaded: ${data.projects.length} projects, ${data.affiliations?.length || 0} affiliations`);
    }
  } catch (error) {
    console.error('[Pensieve Data] Error fetching Pensieve data:', error);
    // Fallback to mock data if API fails
    console.warn('[Pensieve Data] Falling back to mock data due to API error');
    try {
      data = await loadMockData();
      console.log(`[Pensieve Data] Fallback mock data loaded: ${data.projects.length} projects`);
    } catch (mockError) {
      console.error('[Pensieve Data] Failed to load mock data as fallback:', mockError);
      // Return empty data structure
      data = {
        projects: [],
        affiliations: [],
        grants: [],
      };
    }
  }

  // Update cache
  cache = {
    data,
    timestamp: Date.now(),
  };

  console.log(`[Pensieve Data] Cache updated with: ${data.projects.length} projects, ${data.affiliations?.length || 0} affiliations, ${data.grants?.length || 0} grants`);

  return data;
}

// Export a function to clear the cache manually
export function clearPensieveCache() {
  console.log('[Pensieve Data] Clearing cache');
  cache = null;
}

