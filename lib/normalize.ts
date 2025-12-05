import {
  Graph3D,
  GraphMode,
  PensieveData,
  NodeKind,
  LinkType,
} from './types';

function log1p(x: number): number {
  return Math.log1p(x);
}

function prefixId(kind: NodeKind, id: string): string {
  return `${kind}:${id}`;
}

function parseId(prefixedId: string): { kind: NodeKind; id: string } {
  const [kind, ...rest] = prefixedId.split(':');
  return {
    kind: kind as NodeKind,
    id: rest.join(':'),
  };
}

export function normalizeToGraph3D(
  data: PensieveData,
  mode: GraphMode,
  _tag?: string, // Reserved for future use when API supports tags
  category?: string,
  limit?: number
): Graph3D {
  const nodesMap = new Map<string, Graph3D['nodes'][0]>();
  const links: Graph3D['links'] = [];

  // In funding_received mode, collect all project IDs involved in grants first
  // so we can include givers even if they don't match the category filter
  const projectsInvolvedInGrants = new Set<string>();
  if (mode === 'funding_received') {
    for (const grant of data.grants || []) {
      projectsInvolvedInGrants.add(String(grant.from_id));
      projectsInvolvedInGrants.add(String(grant.to_id));
    }
  }

  // Also collect projects involved in affiliations/stack for other modes
  const projectsInvolvedInLinks = new Set<string>();
  if (mode === 'stack_integration' || mode === 'affiliation') {
    for (const aff of data.affiliations || []) {
      if (
        (mode === 'stack_integration' && (aff.type === 'built_on' || aff.type === 'library')) ||
        (mode === 'affiliation' && (aff.type === 'affiliated' || aff.type === 'contributor'))
      ) {
        projectsInvolvedInLinks.add(String(aff.from_project_id));
        projectsInvolvedInLinks.add(String(aff.to_project_id));
      }
    }
  }

  // Build nodes from projects
  for (const project of data.projects || []) {
    const cp = project.cp_total || 0;
    const projectIdStr = String(project.id);

    // NOTE: Tag filter disabled until Pensieve API provides separate tags field
    // Currently API only provides 'categories' array

    // Apply category filter
    // Category can be in project.category or in project.tags array (since categories[] is mapped to tags[])
    // Exception: Always include projects involved in links/grants for the current mode
    if (category && category !== '') {
      const hasCategory = project.category === category || project.tags?.includes(category);
      const isInvolvedInLinks = 
        (mode === 'funding_received' && projectsInvolvedInGrants.has(projectIdStr)) ||
        ((mode === 'stack_integration' || mode === 'affiliation') && projectsInvolvedInLinks.has(projectIdStr));
      
      if (!hasCategory && !isInvolvedInLinks) {
        continue;
      }
    }

    const nodeId = prefixId('project', project.id);
    nodesMap.set(nodeId, {
      id: nodeId,
      kind: 'project',
      label: project.name,
      cp,
      tags: project.tags,
      category: project.category,
      ecosystem: project.ecosystem,
    });
  }

  // Process links based on mode
  if (mode === 'stack_integration') {
    // Process stack_and_integrations (built_on, library)
    for (const aff of data.affiliations || []) {
      if (aff.type === 'built_on' || aff.type === 'library') {
        const sourceId = prefixId('project', aff.from_project_id);
        const targetId = prefixId('project', aff.to_project_id);

        // Only include if both nodes exist
        if (nodesMap.has(sourceId) && nodesMap.has(targetId)) {
          links.push({
            source: sourceId,
            target: targetId,
            type: aff.type as LinkType,
            weight: 1,
          });
        }
      }
    }
  } else if (mode === 'affiliation') {
    // Process affiliations only
    for (const aff of data.affiliations || []) {
      if (aff.type === 'affiliated' || aff.type === 'contributor') {
        const sourceId = prefixId('project', aff.from_project_id);
        const targetId = prefixId('project', aff.to_project_id);

        // Only include if both nodes exist
        if (nodesMap.has(sourceId) && nodesMap.has(targetId)) {
          links.push({
            source: sourceId,
            target: targetId,
            type: aff.type as LinkType,
            weight: 1,
          });
        }
      }
    }
  } else if (mode === 'funding_received') {
    // Process grants
    // Note: All givers and receivers should be projects in the Pensieve dataset
    // (including referenced projects added by pensieve.ts logic)
    let grantsProcessed = 0;
    let grantsSkipped = 0;
    const missingNodes = new Set<string>();
    
    for (const grant of data.grants || []) {
      // All grant IDs should be project IDs (no org: prefix needed)
      const sourceId = prefixId('project', grant.from_id);
      const targetId = prefixId('project', grant.to_id);

      // Only include if both nodes exist in the dataset
      const sourceExists = nodesMap.has(sourceId);
      const targetExists = nodesMap.has(targetId);

      if (sourceExists && targetExists) {
        const amount = grant.amount || 0;
        const weight = Math.min(10, log1p(amount) + 1);

        links.push({
          source: sourceId,
          target: targetId,
          type: 'grant',
          direction: 'out',
          weight,
        });
        grantsProcessed++;
      } else {
        grantsSkipped++;
        if (!sourceExists) missingNodes.add(sourceId);
        if (!targetExists) missingNodes.add(targetId);
        
        // This shouldn't happen if pensieve.ts correctly adds referenced projects
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[Normalize] Grant skipped: ${grant.from_name || grant.from_id} -> ${grant.to_name || grant.to_id}. ` +
            `Source exists: ${sourceExists} (${sourceId}), Target exists: ${targetExists} (${targetId})`
          );
        }
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Normalize] Funding mode: processed ${grantsProcessed} grants, skipped ${grantsSkipped} grants`);
      if (missingNodes.size > 0) {
        console.warn(`[Normalize] Missing nodes for grants:`, Array.from(missingNodes).slice(0, 10));
      }
    }
  }

  // Filter links to only include those where both nodes are in nodesMap
  const filteredLinks = links.filter(
    (link) => nodesMap.has(link.source) && nodesMap.has(link.target)
  );

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Normalize] Mode: ${mode}, Total links created: ${links.length}, Filtered links: ${filteredLinks.length}, Nodes: ${nodesMap.size}`);
  }

  // Apply limit by downsampling if needed
  let finalLinks = filteredLinks;
  const maxLinks = limit || 800;

  if (filteredLinks.length > maxLinks) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Normalize] Downsampling: ${filteredLinks.length} links > ${maxLinks} limit`);
    }
    // Downsample: keep top-K links by weight per node
    const linksByNode = new Map<string, typeof filteredLinks>();
    for (const link of filteredLinks) {
      if (!linksByNode.has(link.source)) {
        linksByNode.set(link.source, []);
      }
      if (!linksByNode.has(link.target)) {
        linksByNode.set(link.target, []);
      }
      linksByNode.get(link.source)!.push(link);
      linksByNode.get(link.target)!.push(link);
    }

    const topLinks = new Set<string>();
    const kPerNode = Math.ceil(maxLinks / nodesMap.size);

    for (const [nodeId, nodeLinks] of linksByNode.entries()) {
      const sorted = nodeLinks
        .sort((a, b) => (b.weight || 0) - (a.weight || 0))
        .slice(0, kPerNode);
      for (const link of sorted) {
        topLinks.add(`${link.source}-${link.target}-${link.type}`);
      }
    }

    finalLinks = filteredLinks.filter((link) =>
      topLinks.has(`${link.source}-${link.target}-${link.type}`)
    );
  }

  return {
    meta: {
      mode,
      generated_at: new Date().toISOString(),
      category,
      limit,
      counts: {
        nodes: nodesMap.size,
        links: finalLinks.length,
      },
    },
    nodes: Array.from(nodesMap.values()),
    links: finalLinks,
  };
}

