/**
 * Constants and utilities for graph configuration
 */

export const GRAPH_CONFIG = {
  cooldownTicks: 100,
  backgroundColor: '#0a0a0a',
  zoomDistance: 150,
  zoomDuration: 1500,
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

