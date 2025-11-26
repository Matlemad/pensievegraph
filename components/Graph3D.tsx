'use client';

import { useEffect, useRef, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import { Graph3D } from '@/lib/types';

// Dynamic import with proper error handling and forwardRef support
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
  selectedNodeId?: string;
  focusedNodeId?: string;
}

export default function Graph3DComponent({
  data,
  onNodeClick,
  selectedNodeId,
  focusedNodeId,
}: Graph3DProps) {
    const fgRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastClickRef = useRef<{ nodeId: string; timestamp: number } | null>(null);

    // Callback ref to ensure we capture the instance when it's mounted
    const setFgRef = (instance: any) => {
      if (instance) {
        fgRef.current = instance;
        console.log('[Graph3D] Instance captured and ready');
      }
    };


  // Auto-zoom to focused node when searching
  useEffect(() => {
    if (!fgRef.current || !focusedNodeId) return;

    const zoomToNode = () => {
      if (!fgRef.current) return;
      
      try {
        // Try multiple approaches to find and zoom to the node
        const graphData = fgRef.current.getGraphData();
        const node = graphData.nodes.find((n: any) => n.id === focusedNodeId);
        
        if (node) {
          // Wait for node to have position (force graph needs time to calculate)
          const checkPosition = (attempts = 0) => {
            if (attempts > 20) {
              // Fallback: use zoomToFit with filter
              fgRef.current.zoomToFit(400, 0, (n: any) => n.id === focusedNodeId);
              return;
            }
            
            const currentNode = fgRef.current.getGraphData().nodes.find(
              (n: any) => n.id === focusedNodeId
            );
            
            if (currentNode && (currentNode.x !== undefined || currentNode.y !== undefined || currentNode.z !== undefined)) {
              // Node has position, zoom to it
              const distance = 150; // Closer zoom for better visibility
              const distRatio = 1 + distance / Math.hypot(
                currentNode.x || 0, 
                currentNode.y || 0, 
                currentNode.z || 0
              );

              fgRef.current.cameraPosition(
                {
                  x: (currentNode.x || 0) * distRatio,
                  y: (currentNode.y || 0) * distRatio,
                  z: (currentNode.z || 0) * distRatio,
                },
                { 
                  x: currentNode.x || 0, 
                  y: currentNode.y || 0, 
                  z: currentNode.z || 0 
                },
                1500 // Faster animation
              );
            } else {
              // Node position not ready yet, retry
              setTimeout(() => checkPosition(attempts + 1), 100);
            }
          };
          
          checkPosition();
        } else {
          // Node not found, use zoomToFit as fallback
          fgRef.current.zoomToFit(400, 0, (n: any) => n.id === focusedNodeId);
        }
      } catch (e) {
        console.warn('[Graph3D] Error zooming to node:', e);
        // Fallback
        try {
          fgRef.current.zoomToFit(400, 0, (n: any) => n.id === focusedNodeId);
        } catch (e2) {
          console.warn('[Graph3D] Fallback zoom also failed:', e2);
        }
      }
    };

    // Immediate attempt, then retry after a short delay
    zoomToNode();
    const timeout = setTimeout(zoomToNode, 300);
    
    return () => clearTimeout(timeout);
  }, [focusedNodeId]);

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        No data available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* @ts-ignore - react-force-graph-3d types issue with dynamic import */}
      <ForceGraph3D
        ref={setFgRef}
        graphData={data}
        nodeId="id"
        nodeLabel={(n: any) => {
          try {
            const node = n as Graph3D['nodes'][0];
            return `${node.label || 'Unknown'} • ${node.kind || 'project'}${node.cp ? ` • CP ${node.cp}` : ''}`;
          } catch (e) {
            return 'Unknown';
          }
        }}
        nodeVal={(n: any) => {
          try {
            const node = n as Graph3D['nodes'][0];
            const cp = node.cp || 0;
            // Return normal size - no pulsing
            return Math.max(1, Math.min(12, cp / 300));
          } catch (e) {
            return 1;
          }
        }}
        nodeColor={(n: any) => {
          // Always ensure we have a valid node object
          if (!n) return '#60a5fa';
          
          try {
            const node = n as Graph3D['nodes'][0];
            if (!node || !node.id) return '#60a5fa';
            
            // ALWAYS return a valid hex color string
            // Prioritize focused over selected (focused = green pulsating, selected = red)
            if (node.id === focusedNodeId) {
              // Pulsing fluorescent green for focused/searched nodes
              // Calculate pulse directly from current time for real-time animation
              const currentTime = Date.now() / 1000;
              const pulse = (Math.sin(currentTime * 6) + 1) / 2; // 0 to 1, faster pulse (6x speed)
              
              // Use more contrasting colors: bright green to lime green with higher intensity
              const color1 = { r: 0x00, g: 0xFF, b: 0x00 }; // Bright green #00FF00
              const color2 = { r: 0x39, g: 0xFF, b: 0x14 }; // Lime green #39FF14 (fluorescent)
              
              // Increase intensity for better visibility
              const intensity = 0.7 + pulse * 0.3; // Pulse between 0.7 and 1.0 intensity
              
              const r = Math.round((color1.r + (color2.r - color1.r) * pulse) * intensity);
              const g = Math.round((color1.g + (color2.g - color1.g) * pulse) * intensity);
              const b = Math.round((color1.b + (color2.b - color1.b) * pulse) * intensity);
              
              return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
            if (node.id === selectedNodeId) {
              return '#ef4444'; // red for selected (only if not focused)
            }
            // Use color by kind
            const kind = node.kind || 'project';
            if (kind === 'org') {
              return '#f59e0b'; // orange for org
            }
            if (kind === 'person') {
              return '#a78bfa'; // purple for person
            }
            // Default: blue for project
            return '#60a5fa';
          } catch (e) {
            console.warn('nodeColor error:', e, n);
            return '#60a5fa'; // fallback color
          }
        }}
        linkColor={(l: any) => {
          // Always ensure we have a valid link object
          if (!l) return '#94a3b8';
          
          try {
            const link = l as Graph3D['links'][0];
            if (!link) return '#94a3b8';
            
            // ALWAYS return a valid hex color string
            const linkType = link.type || 'affiliated';
            const currentTime = Date.now() / 1000;
            const pulse = (Math.sin(currentTime * 2) + 1) / 2; // 0 to 1
            
            if (linkType === 'grant') {
              // Pulsing gold color animation
              const color1 = { r: 0xF5, g: 0xDA, b: 0x61 }; // #F5DA61
              const color2 = { r: 0xF5, g: 0xD3, b: 0x35 }; // #F5D335
              
              const r = Math.round(color1.r + (color2.r - color1.r) * pulse);
              const g = Math.round(color1.g + (color2.g - color1.g) * pulse);
              const b = Math.round(color1.b + (color2.b - color1.b) * pulse);
              
              return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            } else if (linkType === 'affiliated' || linkType === 'contributor') {
              // Pulsing bright white for affiliation links
              const color1 = { r: 0xFF, g: 0xFF, b: 0xFF }; // #FFFFFF pure white
              const color2 = { r: 0xE0, g: 0xE0, b: 0xE0 }; // #E0E0E0 light gray (slightly dimmed for contrast)
              
              const r = Math.round(color1.r + (color2.r - color1.r) * pulse);
              const g = Math.round(color1.g + (color2.g - color1.g) * pulse);
              const b = Math.round(color1.b + (color2.b - color1.b) * pulse);
              
              return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            } else if (linkType === 'built_on' || linkType === 'library') {
              // Pulsing fuchsia for stack integration links
              const color1 = { r: 0xFF, g: 0x00, b: 0xFF }; // #FF00FF pure fuchsia
              const color2 = { r: 0xFF, g: 0x14, b: 0x93 }; // #FF1493 deep pink (slightly darker)
              
              const r = Math.round(color1.r + (color2.r - color1.r) * pulse);
              const g = Math.round(color1.g + (color2.g - color1.g) * pulse);
              const b = Math.round(color1.b + (color2.b - color1.b) * pulse);
              
              return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
            // Default: gray for other link types
            return '#94a3b8';
          } catch (e) {
            console.warn('linkColor error:', e, l);
            return '#94a3b8'; // fallback color
          }
        }}
        linkWidth={(l: any) => {
          try {
            const link = l as Graph3D['links'][0];
            const baseWidth = link.weight || 1;
            const linkType = link.type || 'affiliated';
            
            // Make animated links more visible
            if (linkType === 'grant' || linkType === 'affiliated' || linkType === 'contributor' || 
                linkType === 'built_on' || linkType === 'library') {
              return Math.max(2, Math.min(6, baseWidth * 2));
            }
            return Math.max(0.5, Math.min(4, baseWidth));
          } catch (e) {
            return 1;
          }
        }}
        linkDirectionalParticles={(l: any) => {
          try {
            const link = l as Graph3D['links'][0];
            const linkType = link.type || 'affiliated';
            // Add particles for animated link types
            if (linkType === 'grant' || linkType === 'affiliated' || linkType === 'contributor' || 
                linkType === 'built_on' || linkType === 'library') {
              return 8;
            }
            return 0;
          } catch (e) {
            return 0;
          }
        }}
        linkDirectionalArrowLength={(l: any) => {
          try {
            const link = l as Graph3D['links'][0];
            const linkType = link.type || 'affiliated';
            // Add arrows for animated link types
            if (linkType === 'grant' || linkType === 'affiliated' || linkType === 'contributor' || 
                linkType === 'built_on' || linkType === 'library') {
              return 8;
            }
            return 0;
          } catch (e) {
            return 0;
          }
        }}
        linkDirectionalParticleSpeed={(l: any) => {
          try {
            const link = l as Graph3D['links'][0];
            const linkType = link.type || 'affiliated';
            // Add particle speed for animated link types
            if (linkType === 'grant' || linkType === 'affiliated' || linkType === 'contributor' || 
                linkType === 'built_on' || linkType === 'library') {
              return 0.02;
            }
            return 0;
          } catch (e) {
            return 0;
          }
        }}
        linkDirectionalParticleWidth={(l: any) => {
          try {
            const link = l as Graph3D['links'][0];
            const linkType = link.type || 'affiliated';
            // Add particle width for animated link types
            if (linkType === 'grant' || linkType === 'affiliated' || linkType === 'contributor' || 
                linkType === 'built_on' || linkType === 'library') {
              return 3;
            }
            return 0;
          } catch (e) {
            return 0;
          }
        }}
        linkDirectionalParticleColor={(l: any, t: number) => {
          try {
            const link = l as Graph3D['links'][0];
            const linkType = link.type || 'affiliated';
            const currentTime = Date.now() / 1000;
            const pulse = (Math.sin(currentTime * 2) + 1) / 2; // 0 to 1
            
            if (linkType === 'grant') {
              // Pulsing animation from #F5DA61 to #F5D335
              const color1 = { r: 0xF5, g: 0xDA, b: 0x61 }; // #F5DA61
              const color2 = { r: 0xF5, g: 0xD3, b: 0x35 }; // #F5D335
              
              const r = Math.round(color1.r + (color2.r - color1.r) * pulse);
              const g = Math.round(color1.g + (color2.g - color1.g) * pulse);
              const b = Math.round(color1.b + (color2.b - color1.b) * pulse);
              
              return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            } else if (linkType === 'affiliated' || linkType === 'contributor') {
              // Pulsing bright white for affiliation particles
              const color1 = { r: 0xFF, g: 0xFF, b: 0xFF }; // #FFFFFF pure white
              const color2 = { r: 0xE0, g: 0xE0, b: 0xE0 }; // #E0E0E0 light gray
              
              const r = Math.round(color1.r + (color2.r - color1.r) * pulse);
              const g = Math.round(color1.g + (color2.g - color1.g) * pulse);
              const b = Math.round(color1.b + (color2.b - color1.b) * pulse);
              
              return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            } else if (linkType === 'built_on' || linkType === 'library') {
              // Pulsing fuchsia for stack integration particles
              const color1 = { r: 0xFF, g: 0x00, b: 0xFF }; // #FF00FF pure fuchsia
              const color2 = { r: 0xFF, g: 0x14, b: 0x93 }; // #FF1493 deep pink
              
              const r = Math.round(color1.r + (color2.r - color1.r) * pulse);
              const g = Math.round(color1.g + (color2.g - color1.g) * pulse);
              const b = Math.round(color1.b + (color2.b - color1.b) * pulse);
              
              return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
            return '#94a3b8';
          } catch (e) {
            return '#94a3b8'; // fallback
          }
        }}
        onNodeClick={(node: any) => {
          try {
            const n = node as Graph3D['nodes'][0];
            const now = Date.now();
            const lastClick = lastClickRef.current;
            
            // Check if this is a double click (same node within 300ms)
            if (lastClick && lastClick.nodeId === n.id && (now - lastClick.timestamp) < 300) {
              // Double click detected - open Pensieve URL
              if (n.kind === 'project' && n.id) {
                // Extract project ID from node.id (format: "project:123")
                const projectId = n.id.replace(/^(project|org|person):/, '');
                const pensieveUrl = `https://pensieve.ecf.network/project/${projectId}?tab=profile`;
                window.open(pensieveUrl, '_blank', 'noopener,noreferrer');
              }
              // Reset to prevent triple clicks
              lastClickRef.current = null;
            } else {
              // Single click - store for potential double click
              lastClickRef.current = { nodeId: n.id, timestamp: now };
              // Call the original onNodeClick handler
              onNodeClick?.(n);
              
              // Clear the stored click after timeout to prevent accidental double clicks
              setTimeout(() => {
                if (lastClickRef.current?.nodeId === n.id) {
                  lastClickRef.current = null;
                }
              }, 300);
            }
          } catch (e) {
            console.error('onNodeClick error:', e);
          }
        }}
        backgroundColor="#0a0a0a"
        cooldownTicks={100}
        onEngineStop={() => {
          try {
            if (fgRef.current) {
              fgRef.current.zoomToFit(400);
              console.log('[Graph3D] Engine stopped, auto zoomToFit');
            }
          } catch (e) {
            console.warn('onEngineStop error:', e);
          }
        }}
      />
    </div>
  );
}

