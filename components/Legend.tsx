'use client';

import { GraphMode } from '@/lib/types';

interface LegendProps {
  mode: GraphMode;
}

export default function Legend({ mode }: LegendProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-4 space-y-3 min-w-[200px]">
      <h3 className="text-sm font-semibold text-white mb-2">Legenda</h3>

      {/* Nodes */}
      <div>
        <div className="text-xs font-medium text-gray-400 mb-2">Nodes</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: 'var(--node-project)' }}
            />
            <span className="text-xs text-gray-300">Project</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: 'var(--node-org)' }}
            />
            <span className="text-xs text-gray-300">Org</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: 'var(--node-person)' }}
            />
            <span className="text-xs text-gray-300">Person</span>
          </div>
        </div>
      </div>

      {/* Links */}
      <div>
        <div className="text-xs font-medium text-gray-400 mb-2">Link</div>
        <div className="space-y-1.5">
          {mode === 'affiliation' ? (
            <>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-0.5"
                  style={{ backgroundColor: 'var(--edge-aff)' }}
                />
                <span className="text-xs text-gray-300">built_on</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-0.5"
                  style={{ backgroundColor: 'var(--edge-aff)' }}
                />
                <span className="text-xs text-gray-300">library</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-0.5"
                  style={{ backgroundColor: 'var(--edge-aff)' }}
                />
                <span className="text-xs text-gray-300">affiliated</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-0.5"
                  style={{ backgroundColor: 'var(--edge-aff)' }}
                />
                <span className="text-xs text-gray-300">contributor</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-0.5"
                style={{ backgroundColor: 'var(--edge-grant)' }}
              />
              <span className="text-xs text-gray-300">grant (→)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

