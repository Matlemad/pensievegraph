'use client';

import { useEffect, useRef, forwardRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Graph3D } from '@/lib/types';
import { getLinkColor, getFocusedNodeColor } from '@/lib/utils/colorUtils';
import { GRAPH_CONFIG, isEnhancedLinkType } from '@/lib/utils/graphConfig';

// Dynamic import for 3D graph
const ForceGraph3DBase = dynamic(
  () => import('react-force-graph-3d').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center text-white">Caricamento grafo 3D...</div>
  }
) as any;

// Wrap the dynamic component with forwardRef to support refs
const ForceGraph3D = forwardRef<any, any>((props, ref) => {
  return <ForceGraph3DBase {...props} ref={ref} />;
});

ForceGraph3D.displayName = 'ForceGraph3D';

interface Graph3DProps {
  data: Graph3D;
  onNodeClick?: (node: Graph3D['nodes'][0]) => void;
  onNodeDoubleClick?: (node: Graph3D['nodes'][0]) => void;
  selectedNodeId?: string;
  focusedNodeId?: string;
}

const DOUBLE_CLICK_THRESHOLD_MS = 300;

export default function Graph3DComponent({
  data,
  onNodeClick,
  onNodeDoubleClick,
  selectedNodeId,
  focusedNodeId,
}: Graph3DProps) {
    const fgRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastClickRef = useRef<{ nodeId: string; timestamp: number } | null>(null);

    // Callback ref to ensure we capture the instance when it's mounted
  const setFgRef = useCallback((instance: any) => {
      if (instance) {
        fgRef.current = instance;
    }
  }, []);

  // Memoized node label function
  const nodeLabel = useCallback((n: any) => {
    try {
      const node = n as Graph3D['nodes'][0];
      return `${node.label || 'Unknown'} • ${node.kind || 'project'}${node.cp ? ` • CP ${node.cp}` : ''}`;
    } catch {
      return 'Unknown';
    }
  }, []);

  // Memoized node value function
  const nodeVal = useCallback((n: any) => {
    try {
      const node = n as Graph3D['nodes'][0];
      const cp = node.cp || 0;
      return Math.max(
        GRAPH_CONFIG.nodeSizeRange.min,
        Math.min(GRAPH_CONFIG.nodeSizeRange.max, cp / GRAPH_CONFIG.nodeSizeDivisor)
      );
    } catch {
      return 1;
    }
  }, []);

  // Memoized node color function
  const nodeColor = useCallback((n: any) => {
    if (!n) return '#60a5fa';
    try {
      const node = n as Graph3D['nodes'][0];
      if (!node?.id) return '#60a5fa';
      
      if (node.id === focusedNodeId) {
        const currentTime = Date.now() / 1000;
        const pulse = (Math.sin(currentTime * 6) + 1) / 2;
        const intensity = 0.7 + pulse * 0.3;
        return getFocusedNodeColor(pulse, intensity);
      }
      
      if (node.id === selectedNodeId) {
        return '#ef4444';
      }
      
      const kind = node.kind || 'project';
      if (kind === 'org') return '#f59e0b';
      if (kind === 'person') return '#a78bfa';
      return '#60a5fa';
    } catch {
      return '#60a5fa';
    }
  }, [focusedNodeId, selectedNodeId]);

  // Memoized link color function
  const linkColor = useCallback((l: any) => {
    if (!l) return '#94a3b8';
    try {
      const link = l as Graph3D['links'][0];
      if (!link) return '#94a3b8';
      const linkType = link.type || 'affiliated';
      const currentTime = Date.now() / 1000;
      const pulse = (Math.sin(currentTime * 2) + 1) / 2;
      return getLinkColor(linkType, pulse);
    } catch {
      return '#94a3b8';
    }
  }, []);

  // Memoized link width function
  const linkWidth = useCallback((l: any) => {
    try {
      const link = l as Graph3D['links'][0];
      const baseWidth = link.weight || 1;
      const linkType = link.type || 'affiliated';
      
      if (isEnhancedLinkType(linkType)) {
        return Math.max(
          GRAPH_CONFIG.linkWidthRange.min,
          Math.min(GRAPH_CONFIG.linkWidthRange.max, baseWidth * GRAPH_CONFIG.linkWidthMultiplier)
        );
      }
      return Math.max(0.5, Math.min(4, baseWidth));
    } catch {
      return 1;
    }
  }, []);

  // Memoized enhanced link property function factory
  const createEnhancedLinkProperty = useCallback((value: number) => {
    return (l: any) => {
      try {
        const link = l as Graph3D['links'][0];
        const linkType = link.type || 'affiliated';
        return isEnhancedLinkType(linkType) ? value : 0;
      } catch {
        return 0;
      }
    };
  }, []);

  const linkDirectionalParticles = useMemo(
    () => createEnhancedLinkProperty(GRAPH_CONFIG.particleCount),
    [createEnhancedLinkProperty]
  );
  
  const linkDirectionalArrowLength = useMemo(
    () => createEnhancedLinkProperty(GRAPH_CONFIG.arrowLength),
    [createEnhancedLinkProperty]
  );
  
  const linkDirectionalParticleSpeed = useMemo(
    () => createEnhancedLinkProperty(GRAPH_CONFIG.particleSpeed),
    [createEnhancedLinkProperty]
  );
  
  const linkDirectionalParticleWidth = useMemo(
    () => createEnhancedLinkProperty(GRAPH_CONFIG.particleWidth),
    [createEnhancedLinkProperty]
  );

  // Memoized link particle color function
  const linkDirectionalParticleColor = useCallback((l: any) => {
    try {
      const link = l as Graph3D['links'][0];
      const linkType = link.type || 'affiliated';
      const currentTime = Date.now() / 1000;
      const pulse = (Math.sin(currentTime * 2) + 1) / 2;
      return getLinkColor(linkType, pulse);
    } catch {
      return '#94a3b8';
    }
  }, []);

  // Memoized node click handler
  const handleNodeClick = useCallback((node: any) => {
    try {
      const n = node as Graph3D['nodes'][0];
      const now = Date.now();
      const lastClick = lastClickRef.current;
      
      if (lastClick && lastClick.nodeId === n.id && (now - lastClick.timestamp) < DOUBLE_CLICK_THRESHOLD_MS) {
        onNodeDoubleClick?.(n);
        lastClickRef.current = null;
      } else {
        lastClickRef.current = { nodeId: n.id, timestamp: now };
        onNodeClick?.(n);
        setTimeout(() => {
          if (lastClickRef.current?.nodeId === n.id) {
            lastClickRef.current = null;
          }
        }, DOUBLE_CLICK_THRESHOLD_MS);
      }
    } catch (error) {
      console.error('onNodeClick error:', error);
    }
  }, [onNodeClick, onNodeDoubleClick]);

  // Memoized engine stop handler
  const handleEngineStop = useCallback(() => {
    try {
      if (fgRef.current) {
        fgRef.current.zoomToFit(400);
      }
    } catch (error) {
      console.warn('onEngineStop error:', error);
    }
  }, []);

  // Memoized graph props
  const graphProps = useMemo(() => ({
    graphData: data,
    nodeId: 'id',
    nodeLabel,
    nodeVal,
    nodeColor,
    linkColor,
    linkWidth,
    linkDirectionalParticles,
    linkDirectionalArrowLength,
    linkDirectionalParticleSpeed,
    linkDirectionalParticleWidth,
    linkDirectionalParticleColor,
    onNodeClick: handleNodeClick,
    backgroundColor: GRAPH_CONFIG.backgroundColor,
    cooldownTicks: GRAPH_CONFIG.cooldownTicks,
    onEngineStop: handleEngineStop,
  }), [
    data,
    nodeLabel,
    nodeVal,
    nodeColor,
    linkColor,
    linkWidth,
    linkDirectionalParticles,
    linkDirectionalArrowLength,
    linkDirectionalParticleSpeed,
    linkDirectionalParticleWidth,
    linkDirectionalParticleColor,
    handleNodeClick,
    handleEngineStop,
  ]);

  // Auto-zoom to focused node when searching - improved for better "first-person" view
  useEffect(() => {
    if (!fgRef.current || !focusedNodeId) return;

    const zoomToNode = () => {
      if (!fgRef.current) return;
      
      try {
        const graphData = fgRef.current.getGraphData();
        const node = graphData.nodes.find((n: any) => n.id === focusedNodeId);
        
        if (node) {
          const checkPosition = (attempts = 0) => {
            if (attempts > GRAPH_CONFIG.zoomMaxAttempts) {
              // Fallback: zoom to fit filtered to focused node
              fgRef.current.zoomToFit(400, 20, (n: any) => n.id === focusedNodeId);
              return;
            }
            
            const currentNode = fgRef.current.getGraphData().nodes.find(
              (n: any) => n.id === focusedNodeId
            );
            
            if (currentNode && (currentNode.x !== undefined || currentNode.y !== undefined)) {
              // Calculate distance for closer zoom
              const nodeDistance = Math.hypot(
                currentNode.x || 0,
                currentNode.y || 0,
                currentNode.z || 0
              );
              
              // Use shorter distance for "in primo piano" effect
              const distRatio = nodeDistance > 0 
                ? 1 + GRAPH_CONFIG.zoomDistance / nodeDistance
                : 2;
              
              if (fgRef.current.cameraPosition) {
                fgRef.current.cameraPosition(
                  {
                    x: (currentNode.x || 0) * distRatio,
                    y: (currentNode.y || 0) * distRatio,
                    z: (currentNode.z || 0) * distRatio,
                  },
                  currentNode, // Look at the node directly
                  GRAPH_CONFIG.zoomDuration
                );
              }
            } else {
              // Position not ready, retry
              setTimeout(() => checkPosition(attempts + 1), 100);
            }
          };
          
          checkPosition();
        } else {
          // Node not found, fallback
          fgRef.current.zoomToFit(400, 20, (n: any) => n.id === focusedNodeId);
        }
      } catch (error) {
        console.warn('[Graph3D] Error zooming to node:', error);
        try {
          fgRef.current.zoomToFit(400, 20, (n: any) => n.id === focusedNodeId);
        } catch (e2) {
          console.warn('[Graph3D] Fallback zoom also failed:', e2);
        }
      }
    };

    // Wait longer for graph to stabilize before zooming
    const timeout = setTimeout(zoomToNode, GRAPH_CONFIG.zoomInitialDelay);
    
    return () => clearTimeout(timeout);
  }, [focusedNodeId]);

  if (!data?.nodes?.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        No data available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* @ts-ignore - react-force-graph-3d types issue with dynamic import */}
      <ForceGraph3D ref={setFgRef} {...graphProps} />
    </div>
  );
}
