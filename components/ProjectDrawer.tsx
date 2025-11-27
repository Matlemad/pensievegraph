'use client';

import { useEffect, useState } from 'react';
import { Graph3D } from '@/lib/types';

interface ProjectDetails {
  affiliations: Array<{
    name: string;
    type: string;
  }>;
  stackAndIntegrations: Array<{
    name: string;
    type: string;
    repository?: string;
  }>;
  fundingGrants: Array<{
    giverName: string;
    amount: number | null;
    date?: string;
  }>;
}

interface ProjectDrawerProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  graph: Graph3D | null;
}

export default function ProjectDrawer({
  projectId,
  isOpen,
  onClose,
  graph,
}: ProjectDrawerProps) {
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find the node in the graph for basic info
  const node = projectId && graph
    ? graph.nodes.find((n) => n.id === projectId)
    : null;

  // Fetch full project details from API when drawer opens
  useEffect(() => {
    if (!isOpen || !projectId) {
      setDetails(null);
      setError(null);
      return;
    }

    // Extract numeric ID from node ID (format: "project:123" or just "123")
    const numericId = projectId.replace(/^(project|org|person):/, '');

    async function fetchProjectDetails() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/project-details?projectId=${numericId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch project details: ${response.status}`);
        }

        const data = await response.json();
        
        // Format the data for display
        const formatted: ProjectDetails = {
          affiliations: (data.affiliations || []).map((aff: any) => ({
            name: aff.project_name || aff.name || `Project ${aff.project || aff.project_id || 'Unknown'}`,
            type: aff.affiliationType || 'affiliated',
          })),
          stackAndIntegrations: (data.stackAndIntegrations || []).map((item: any) => ({
            name: item.project_name || item.name || `Project ${item.project || item.project_id || 'Unknown'}`,
            type: item.type || 'built_on',
            repository: item.repository,
          })),
          fundingGrants: (data.fundingReceivedGrants || []).map((grant: any) => {
            const amount = grant.amount
              ? typeof grant.amount === 'string'
                ? parseFloat(grant.amount)
                : grant.amount
              : null;
            const giverName =
              grant.projectDonator_name?.[0] ||
              grant.organization_name?.[0] ||
              `Project ${grant.projectDonator?.[0] || grant.organization?.[0] || 'Unknown'}`;
            return {
              giverName,
              amount,
              date: grant.date,
            };
          }),
        };
        
        setDetails(formatted);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchProjectDetails();
  }, [isOpen, projectId]);

  // Close drawer on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pensieveUrl = projectId
    ? `https://pensieve.ecf.network/project/${projectId.replace(/^(project|org|person):/, '')}`
    : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity touch-none"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm md:w-96 bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingRight: 'env(safe-area-inset-right, 0)',
        }}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-800 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold text-white">Project Details</h2>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 hover:bg-gray-800 active:bg-gray-700 rounded transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close drawer"
            >
              <svg
                className="w-6 h-6 sm:w-5 sm:h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div 
            className="flex-1 overflow-y-auto p-3 sm:p-4"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0)',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400">Loading project details...</div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded p-4 text-red-400">
                Error: {error}
              </div>
            )}

            {node && !loading && (
              <div className="space-y-4 sm:space-y-6">
                {/* Name and Category */}
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 break-words">{node.label}</h3>
                  {node.tags && node.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {node.tags.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs sm:text-xs"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Affiliations */}
                {details && details.affiliations.length > 0 && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                      Affiliations ({details.affiliations.length})
                    </h4>
                    <div className="space-y-2">
                      {details.affiliations.slice(0, 10).map((aff, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 sm:p-3 bg-gray-800/50 rounded border border-gray-700"
                        >
                          <div className="text-sm sm:text-sm text-white break-words">
                            {aff.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Type: {aff.type}
                          </div>
                        </div>
                      ))}
                      {details.affiliations.length > 10 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{details.affiliations.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stack & Integrations */}
                {details && details.stackAndIntegrations.length > 0 && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                      Stack & Integrations ({details.stackAndIntegrations.length})
                    </h4>
                    <div className="space-y-2">
                      {details.stackAndIntegrations.slice(0, 10).map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 sm:p-3 bg-gray-800/50 rounded border border-gray-700"
                        >
                          <div className="text-sm sm:text-sm text-white break-words">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Type: {item.type}
                          </div>
                          {item.repository && (
                            <a
                              href={item.repository}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 active:text-blue-200 mt-1 inline-block touch-manipulation"
                            >
                              Repository →
                            </a>
                          )}
                        </div>
                      ))}
                      {details.stackAndIntegrations.length > 10 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{details.stackAndIntegrations.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Funding - Grants Received */}
                {details && details.fundingGrants.length > 0 && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                      Funding - Grants Received ({details.fundingGrants.length})
                    </h4>
                    <div className="space-y-2">
                      {details.fundingGrants.map((grant, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 sm:p-3 bg-gray-800/50 rounded border border-gray-700"
                        >
                          <div className="text-sm sm:text-sm text-white break-words">
                            From: {grant.giverName}
                          </div>
                          {grant.amount !== null && grant.amount > 0 && (
                            <div className="text-sm text-yellow-400 font-medium mt-1">
                              {grant.amount.toLocaleString()} USD
                            </div>
                          )}
                          {grant.date && (
                            <div className="text-xs text-gray-400 mt-1">
                              Date: {new Date(grant.date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty states */}
                {details && details.affiliations.length === 0 &&
                  details.stackAndIntegrations.length === 0 &&
                  details.fundingGrants.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No additional information available
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Footer with Pensieve link */}
          {pensieveUrl && (
            <div 
              className="p-3 sm:p-4 border-t border-gray-800 flex-shrink-0"
              style={{
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
              }}
            >
              <a
                href={pensieveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base"
              >
                View on Pensieve
                <svg
                  className="w-4 h-4 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

