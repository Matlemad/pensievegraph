export type NodeKind = 'project' | 'org' | 'person';

export type LinkType = 'built_on' | 'library' | 'affiliated' | 'contributor' | 'grant';

export type GraphMode = 'stack_integration' | 'affiliation' | 'funding_received';

export interface Graph3D {
  meta: {
    mode: GraphMode;
    generated_at: string; // ISO
    category?: string; // category filter
    limit?: number;
    counts: { nodes: number; links: number };
  };
  nodes: Array<{
    id: string; // "proj:<slug>" | "org:<slug>" | "person:<id>"
    kind: NodeKind;
    label: string; // display name
    cp?: number; // for sizing
    tags?: string[];
    category?: string; // category field
    ecosystem?: string;
  }>;
  links: Array<{
    source: string; // node id
    target: string; // node id
    type: LinkType;
    direction?: 'out' | 'in' | 'undirected'; // for grants you may mark as 'out' from giver
    weight?: number; // count or log1p(amount)
  }>;
}

// Note: The Pensieve API provides only 'categories' array for each project
// These categories serve both as tags and categories in the filtering system
export const AVAILABLE_CATEGORIES = [
  'Network States',
  'Zu-Villages',
  'Applications/dApps',
  'Community & Coordination',
  'Developer tools',
  'Hubs',
  'Infrastructure',
  'Security & Privacy',
  'Storage & Data',
  'Events',
  'Local Communities',
  'Other',
] as const;

// Tags use the same values as categories (API provides only 'categories')
export const AVAILABLE_TAGS = AVAILABLE_CATEGORIES;

// Pensieve API types (Real API structure)
export interface PensieveRelationItem {
  _id?: string;
  id?: number | string;
  name?: string;
  project?: number | string; // ID of the related project
  project_id?: number | string; // Alternative field name
  project_name?: string;
  type?: string;
  affiliationType?: string; // For affiliation items
  reference?: string;
  repository?: string;
  description?: string;
  date?: string; // For grants
  amount?: string | number; // For grants
  organization?: string[]; // For grants
  projectDonator?: string[]; // For grants
  organization_name?: string[]; // For grants
  projectDonator_name?: string[]; // For grants
  expenseSheetUrl?: string; // For grants
  [key: string]: any; // Allow additional fields
}

// Task 3: Properly model the API response types
export interface PensieveProjectSnapshot {
  id: number | string;
  name: string;
  categories?: string[];
  category?: string; // Single category field
  snapshot?: {
    id: number | string;
    createdAt?: string;
  };
  affiliation?: PensieveRelationItem[];
  stack_and_integrations?: PensieveRelationItem[];
  contributing_teams?: PensieveRelationItem[];
  funding_received_grants?: PensieveRelationItem[];
  cp_total?: number;
  ecosystem_counts?: {
    affiliated_projects?: number;
    stack_integrations?: number;
    contributing_teams?: number;
    funding_received_grants?: number;
    [key: string]: number | undefined;
  };
  [key: string]: any; // Allow additional fields
}

// List mode response (no projectId param)
export interface PensieveProjectRelationsListResponse {
  data: {
    projects: PensieveProjectSnapshot[]; // NOTE: projects[] in list mode
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  metadata?: {
    source?: string;
    snapshot_id?: number | string;
    last_updated?: string;
    counts?: {
      affiliated_projects?: number;
      stack_integrations?: number;
      contributing_teams?: number;
      funding_received_grants?: number;
      [key: string]: number | undefined;
    };
    keys?: string[];
  };
}

// Single project response (with projectId param)
export interface PensieveProjectRelationsSingleResponse {
  data: {
    project: PensieveProjectSnapshot; // NOTE: project in single mode
  };
  metadata?: {
    source?: string;
    snapshot_id?: number | string;
    last_updated?: string;
    counts?: {
      affiliated_projects?: number;
      stack_integrations?: number;
      contributing_teams?: number;
      funding_received_grants?: number;
      [key: string]: number | undefined;
    };
    keys?: string[];
  };
}

// Union type for backward compatibility
export interface PensieveProjectRelationsResponse {
  data: {
    project?: PensieveProjectSnapshot;
    projects?: PensieveProjectSnapshot[];
  };
  ecosystem_counts?: {
    affiliation?: number;
    stack_and_integrations?: number;
    contributing_teams?: number;
    [key: string]: number | undefined;
  };
  metadata?: {
    source?: string;
    snapshot_id?: number | string;
    last_updated?: string;
    counts?: {
      affiliated_projects?: number;
      stack_integrations?: number;
      contributing_teams?: number;
      funding_received_grants?: number;
      [key: string]: number | undefined;
    };
    keys?: string[];
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Legacy types for mock data compatibility
export interface PensieveProject {
  id: string;
  name: string;
  tags: string[];
  category?: string;
  ecosystem?: string;
  cp_total?: number;
}

export interface PensieveAffiliation {
  from_project_id: string;
  to_project_id: string;
  type: 'built_on' | 'library' | 'affiliated' | 'contributor';
}

export interface PensieveGrant {
  from_id: string;
  to_id: string;
  direction: 'given' | 'received';
  amount?: number;
  date?: string;
}

export interface PensieveData {
  projects: PensieveProject[];
  affiliations?: PensieveAffiliation[];
  grants?: PensieveGrant[];
}

