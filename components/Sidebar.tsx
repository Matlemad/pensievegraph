'use client';

import { Graph3D, GraphMode } from '@/lib/types';

interface SidebarProps {
  node: Graph3D['nodes'][0] | null;
  graph: Graph3D;
  onFocusNode: (nodeId: string) => void;
  onIsolateNeighborhood: (nodeId: string) => void;
  onCopyShareLink: () => void;
}

export default function Sidebar({
  node,
  graph,
  onFocusNode,
  onIsolateNeighborhood,
  onCopyShareLink,
}: SidebarProps) {
  if (!node) {
    return (
      <div className="w-full md:w-80 bg-gray-900/90 backdrop-blur-sm border-l border-gray-800 p-6 hidden md:block">
        <p className="text-gray-400 text-sm">
          Click on a node to see details
        </p>
      </div>
    );
  }

  // Extract project ID from node.id (format: "project:123")
  const projectId = node.id.replace('project:', '').replace('org:', '').replace('person:', '');
  const pensieveUrl = `https://pensieve.ecf.network/project/${projectId}?tab=profile`;

  // Find related nodes in current mode
  const relatedLinks = graph.links.filter(
    (link) => link.source === node.id || link.target === node.id
  );

  const relatedNodes = relatedLinks
    .map((link) => {
      const relatedId = link.source === node.id ? link.target : link.source;
      const relatedNode = graph.nodes.find((n) => n.id === relatedId);
      if (!relatedNode) return null;
      return {
        node: relatedNode,
        link,
        weight: link.weight || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.weight || 0) - (a?.weight || 0))
    .slice(0, 10) as Array<{
    node: Graph3D['nodes'][0];
    link: Graph3D['links'][0];
    weight: number;
  }>;

  return (
    <div className="w-full md:w-80 bg-gray-900/90 backdrop-blur-sm border-l border-gray-800 p-4 md:p-6 overflow-y-auto">
      <div className="space-y-4 md:space-y-6">
        {/* Node Info */}
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white mb-2">{node.label}</h2>
          
          {/* Pensieve Link */}
          {node.kind === 'project' && (
            <a
              href={pensieveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm mb-3 transition-colors"
            >
              View on Pensieve
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Type: </span>
              <span className="text-gray-200 capitalize">{node.kind}</span>
            </div>
            {node.tags && node.tags.length > 0 && (
              <div>
                <span className="text-gray-400">Categories: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {node.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Entities */}
        {relatedNodes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Correlated Entities ({graph.meta.mode})
            </h3>
            <div className="space-y-2">
              {relatedNodes.map(({ node: relatedNode, link, weight }) => (
                <div
                  key={relatedNode.id}
                  className="p-3 bg-gray-800/50 rounded border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                  onClick={() => onFocusNode(relatedNode.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">
                        {relatedNode.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {relatedNode.kind} • {link.type}
                        {weight > 0 && ` • w: ${weight.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-4 border-t border-gray-800">
          <button
            onClick={() => onFocusNode(node.id)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Focus Node
          </button>
          <button
            onClick={() => onIsolateNeighborhood(node.id)}
            className="w-full px-4 py-2 bg-gray-800 text-gray-300 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Neighborhood cluster
          </button>
          <button
            onClick={onCopyShareLink}
            className="w-full px-4 py-2 bg-gray-800 text-gray-300 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Copy Share Link
          </button>
        </div>
      </div>
    </div>
  );
}

