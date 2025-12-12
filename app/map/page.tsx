'use client';

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Graph3D, GraphMode } from '@/lib/types';
import { fetchGraph } from '@/lib/api';
import Graph3DComponent from '@/components/Graph3D';
import Controls from '@/components/Controls';
import Sidebar from '@/components/Sidebar';
import ProjectDrawer from '@/components/ProjectDrawer';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';

function MapPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [graph, setGraph] = useState<Graph3D | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Graph3D['nodes'][0] | null>(
    null
  );
  const [focusedNodeId, setFocusedNodeId] = useState<string | undefined>();
  const isDesktop = useIsDesktop();
  const [drawerProjectId, setDrawerProjectId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Memoized URL params parsing - map old values for backward compatibility
  const { mode, category, limit, focusParam } = useMemo(() => {
  const modeParam = searchParams.get('mode') || 'stack_integration';
    let modeValue: GraphMode;
  if (modeParam === 'affiliations') {
      modeValue = 'affiliation';
  } else if (modeParam === 'funding') {
      modeValue = 'funding_received';
  } else {
      modeValue = modeParam as GraphMode;
  }
    
    return {
      mode: modeValue,
      category: searchParams.get('category') || '',
      limit: parseInt(searchParams.get('limit') || '999999', 10), // Effectively no limit
      focusParam: searchParams.get('focus'),
    };
  }, [searchParams]);

  // Update URL params - use replace to avoid too many history entries
  const updateURL = useCallback(
    (updates: {
      mode?: GraphMode;
      category?: string;
      limit?: number;
      focus?: string;
    }) => {
      const params = new URLSearchParams();
      params.set('mode', updates.mode || mode);

      const newCategory = updates.category !== undefined ? updates.category : category;
      if (newCategory) {
        params.set('category', newCategory);
      }

      if (updates.limit !== undefined) {
        params.set('limit', updates.limit.toString());
          } else if (limit !== 999999) {
        params.set('limit', limit.toString());
      }

      if (updates.focus) {
        params.set('focus', updates.focus);
      } else if (focusParam) {
        params.set('focus', focusParam);
      }

      // Use replace instead of push to avoid too many history entries
      router.replace(`/map?${params.toString()}`);
    },
    [mode, category, limit, focusParam, router]
  );

  // Fetch graph data
  useEffect(() => {
    let cancelled = false;

    async function loadGraph() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchGraph(mode, { category, limit });
        
        if (!cancelled) {
          setGraph(data);
          setLoading(false);

          // Auto-focus if focus param exists
          if (focusParam) {
            setTimeout(() => {
              setFocusedNodeId(focusParam);
            }, 500);
          }
        }
      } catch (err) {
        console.error('Error loading graph:', err);
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          setLoading(false);
        }
      }
    }

    loadGraph();

    return () => {
      cancelled = true;
    };
  }, [mode, category, limit, focusParam]);

  // Handle mode change
  const handleModeChange = useCallback(
    (newMode: GraphMode) => {
      updateURL({ mode: newMode });
    },
    [updateURL]
  );

  // Handle category change
  const handleCategoryChange = useCallback(
    (newCategory: string) => {
      updateURL({ category: newCategory });
    },
    [updateURL]
  );

  // Handle focus node - debounced to avoid too many URL updates
  const [pendingFocus, setPendingFocus] = useState<string | undefined>();
  const debouncedFocus = useDebounce(pendingFocus, 300); // 300ms debounce for focus

  useEffect(() => {
    if (debouncedFocus && debouncedFocus !== focusParam) {
      updateURL({ focus: debouncedFocus });
      setFocusedNodeId(debouncedFocus);
    }
  }, [debouncedFocus, focusParam, updateURL]);

  const handleFocusNode = useCallback(
    (nodeId: string) => {
      setPendingFocus(nodeId);
      setFocusedNodeId(nodeId); // Immediate UI update
    },
    []
  );

  // Handle search - debounced to avoid too many updates
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300); // 300ms debounce for search

  useEffect(() => {
    if (debouncedSearch && graph) {
      const found = graph.nodes.find(
        (n) =>
          n.label.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          n.id.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
      if (found) {
        handleFocusNode(found.id);
      }
    }
  }, [debouncedSearch, graph, handleFocusNode]);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
    },
    []
  );

  // Handle search suggestion selection
  const handleSearchSelect = useCallback(
    (nodeId: string) => {
      // Focus the node first (green pulsating)
      handleFocusNode(nodeId);
      // Also select the node to open sidebar (but focus takes priority for color)
      const node = graph?.nodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
      }
    },
    [graph, handleFocusNode]
  );

  // Handle node click - automatically open sidebar on mobile
  const handleNodeClick = useCallback(
    (node: Graph3D['nodes'][0]) => {
      setSelectedNode(node);
      // On mobile, we might want to show the sidebar differently
      // For now, the sidebar will be visible when a node is selected
    },
    []
  );

  // Handle node double click - open drawer
  const handleNodeDoubleClick = useCallback(
    (node: Graph3D['nodes'][0]) => {
      setDrawerProjectId(node.id);
      setIsDrawerOpen(true);
    },
    []
  );

  // Handle drawer close
  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    // Keep projectId for a moment to allow smooth closing animation
    setTimeout(() => {
      setDrawerProjectId(null);
    }, 300);
  }, []);

  // Handle isolate neighborhood
  const handleIsolateNeighborhood = useCallback(
    (nodeId: string) => {
      // This would filter the graph to show only neighbors
      // For now, just focus on the node
      handleFocusNode(nodeId);
    },
    [handleFocusNode]
  );

  // Handle copy share link
  const handleCopyShareLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-red-400 text-lg">Error: {error}</div>
      </div>
    );
  }

  if (!graph) {
    return null;
  }

  return (
    <div className="w-full h-screen bg-gray-950 flex flex-col overflow-hidden">
      <Controls
        mode={mode}
        onModeChange={handleModeChange}
        selectedCategory={category}
        onCategoryChange={handleCategoryChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSelect={handleSearchSelect}
        graph={graph}
      />
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        <div className="flex-1 relative">
          {graph?.nodes?.length > 0 ? (
              <Graph3DComponent
                data={graph}
                onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
                selectedNodeId={selectedNode?.id}
                focusedNodeId={focusedNodeId}
              />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              No data available in the graph
            </div>
          )}
        </div>
        
        {/* Sidebar: Hidden on mobile when no node selected, visible on desktop */}
        {(selectedNode || isDesktop) && (
          <Sidebar
            node={selectedNode}
            graph={graph}
            onFocusNode={handleFocusNode}
            onIsolateNeighborhood={handleIsolateNeighborhood}
            onCopyShareLink={handleCopyShareLink}
          />
        )}
      </div>

      {/* Project Drawer - opens on double click */}
      <ProjectDrawer
        projectId={drawerProjectId}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        graph={graph}
      />
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading graph...</div>
      </div>
    }>
      <MapPageContent />
    </Suspense>
  );
}
