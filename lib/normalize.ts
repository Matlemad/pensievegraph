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

  // Build nodes from projects
  for (const project of data.projects || []) {
    const cp = project.cp_total || 0;

    // NOTE: Tag filter disabled until Pensieve API provides separate tags field
    // Currently API only provides 'categories' array

    // Apply category filter
    // Category can be in project.category or in project.tags array (since categories[] is mapped to tags[])
    if (category && category !== '') {
      const hasCategory = project.category === category || project.tags?.includes(category);
      if (!hasCategory) {
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
    const orgNodes = new Map<string, Graph3D['nodes'][0]>();

    for (const grant of data.grants || []) {
      // Determine source and target based on direction
      let sourceId: string;
      let targetId: string;

      if (grant.direction === 'given') {
        // from_id gives to to_id
        sourceId = grant.from_id.startsWith('org:')
          ? prefixId('org', grant.from_id.replace('org:', ''))
          : prefixId('project', grant.from_id);
        targetId = grant.to_id.startsWith('org:')
          ? prefixId('org', grant.to_id.replace('org:', ''))
          : prefixId('project', grant.to_id);
      } else {
        // received: to_id receives from from_id
        targetId = grant.to_id.startsWith('org:')
          ? prefixId('org', grant.to_id.replace('org:', ''))
          : prefixId('project', grant.to_id);
        sourceId = grant.from_id.startsWith('org:')
          ? prefixId('org', grant.from_id.replace('org:', ''))
          : prefixId('project', grant.from_id);
      }

      // Create org nodes if needed
      if (sourceId.startsWith('org:')) {
        if (!orgNodes.has(sourceId) && !nodesMap.has(sourceId)) {
          orgNodes.set(sourceId, {
            id: sourceId,
            kind: 'org',
            label: sourceId.replace('org:', ''),
            cp: 0,
          });
        }
      }
      if (targetId.startsWith('org:')) {
        if (!orgNodes.has(targetId) && !nodesMap.has(targetId)) {
          orgNodes.set(targetId, {
            id: targetId,
            kind: 'org',
            label: targetId.replace('org:', ''),
            cp: 0,
          });
        }
      }

      // Only include if both nodes exist (or will exist)
      const sourceExists =
        nodesMap.has(sourceId) || orgNodes.has(sourceId);
      const targetExists =
        nodesMap.has(targetId) || orgNodes.has(targetId);

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
      }
    }

    // Add org nodes to nodesMap
    for (const orgNode of orgNodes.values()) {
      nodesMap.set(orgNode.id, orgNode);
    }
  }

  // Filter links to only include those where both nodes are in nodesMap
  const filteredLinks = links.filter(
    (link) => nodesMap.has(link.source) && nodesMap.has(link.target)
  );

  // Apply limit by downsampling if needed
  let finalLinks = filteredLinks;
  const maxLinks = limit || 800;

  if (filteredLinks.length > maxLinks) {
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

