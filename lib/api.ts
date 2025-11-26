import { Graph3D, GraphMode } from './types';

export function buildGraphUrl(
  mode: GraphMode,
  options?: {
    category?: string;
    limit?: number;
  }
): string {
  const params = new URLSearchParams();
  params.set('mode', mode);

  if (options?.category && options.category !== '') {
    params.set('category', options.category);
  }
  if (options?.limit !== undefined) {
    params.set('limit', options.limit.toString());
  }

  return `/api/graph?${params.toString()}`;
}

export async function fetchGraph(
  mode: GraphMode,
  options?: {
    category?: string;
    limit?: number;
  }
): Promise<Graph3D> {
  const url = buildGraphUrl(mode, options);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch graph: ${response.statusText}`);
  }

  return response.json();
}

