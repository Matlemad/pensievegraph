/**
 * Constants and utilities for graph configuration
 */

export const GRAPH_CONFIG = {
  cooldownTicks: 100,
  backgroundColor: '#0a0a0a',
  zoomDistance: 60, // Reduced from 150 to 60 for closer zoom (closer = more "in primo piano")
  zoomDuration: 1500,
  zoomMaxAttempts: 40, // Increased from 20 to 40 for better node position detection
  zoomInitialDelay: 800, // Increased from 300ms to 800ms to let graph stabilize
  nodeSizeRange: { min: 1, max: 12 },
  nodeSizeDivisor: 300,
  linkWidthMultiplier: 2,
  linkWidthRange: { min: 2, max: 6 },
  particleCount: 8,
  arrowLength: 8,
  particleSpeed: 0.02,
  particleWidth: 3,
} as const;

/**
 * Check if a link type should have enhanced visual features
 */
export const ENHANCED_LINK_TYPES = new Set([
  'grant',
  'affiliated',
  'contributor',
  'built_on',
  'library',
]);

export function isEnhancedLinkType(linkType: string): boolean {
  return ENHANCED_LINK_TYPES.has(linkType);
}

