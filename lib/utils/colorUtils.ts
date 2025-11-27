/**
 * Utility functions for color calculations in the graph
 */

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Interpolate between two colors based on pulse value (0-1)
 */
export function interpolateColor(
  color1: ColorRGB,
  color2: ColorRGB,
  pulse: number
): ColorRGB {
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * pulse),
    g: Math.round(color1.g + (color2.g - color1.g) * pulse),
    b: Math.round(color1.b + (color2.b - color1.b) * pulse),
  };
}

/**
 * Convert RGB to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Get pulsing color for a link type
 */
export function getLinkColor(linkType: string, pulse: number): string {
  const colors: Record<string, { color1: ColorRGB; color2: ColorRGB }> = {
    grant: {
      color1: { r: 0xf5, g: 0xda, b: 0x61 },
      color2: { r: 0xf5, g: 0xd3, b: 0x35 },
    },
    affiliated: {
      color1: { r: 0xff, g: 0xff, b: 0xff },
      color2: { r: 0xe0, g: 0xe0, b: 0xe0 },
    },
    contributor: {
      color1: { r: 0xff, g: 0xff, b: 0xff },
      color2: { r: 0xe0, g: 0xe0, b: 0xe0 },
    },
    built_on: {
      color1: { r: 0xff, g: 0x00, b: 0xff },
      color2: { r: 0xff, g: 0x14, b: 0x93 },
    },
    library: {
      color1: { r: 0xff, g: 0x00, b: 0xff },
      color2: { r: 0xff, g: 0x14, b: 0x93 },
    },
  };

  const colorScheme = colors[linkType];
  if (!colorScheme) {
    return '#94a3b8'; // Default gray
  }

  const { r, g, b } = interpolateColor(
    colorScheme.color1,
    colorScheme.color2,
    pulse
  );
  return rgbToHex(r, g, b);
}

/**
 * Get pulsing green color for focused nodes
 */
export function getFocusedNodeColor(pulse: number, intensity: number): string {
  const color1 = { r: 0x00, g: 0xff, b: 0x00 };
  const color2 = { r: 0x39, g: 0xff, b: 0x14 };
  const { r, g, b } = interpolateColor(color1, color2, pulse);
  return rgbToHex(
    Math.round(r * intensity),
    Math.round(g * intensity),
    Math.round(b * intensity)
  );
}

