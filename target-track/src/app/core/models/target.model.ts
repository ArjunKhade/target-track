export type TargetCategory = 'Terror Org' | 'Organized Crime' | 'Fugitive' | 'Smuggler' | 'Cyber Crime';
export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TargetStatus = 'Active' | 'Under Surveillance' | 'Captured' | 'Lost Contact';
export type DataSource = 'CCTV' | 'Informant' | 'Toll' | 'Phone Tower' | 'Hotel Record';

export interface LocationPoint {
  lat: number;
  lng: number;
  city: string;
  state: string;
  timestamp: string; // ISO 8601
  activity: string;
  source: DataSource;
  confidence: number; // 0-100
}

export interface Target {
  id: string;
  alias: string;
  fullName: string;
  photoUrl: string; // initials-based, generated in code
  category: TargetCategory;
  organization: string;
  threatLevel: ThreatLevel;
  status: TargetStatus;
  lastSeen: string; // ISO 8601
  knownAssociates: string[]; // Target IDs
  notes: string[];
  tags: string[];
  history: LocationPoint[];
}

export interface TargetFilter {
  search: string;
  categories: TargetCategory[];
  threatLevels: ThreatLevel[];
  statuses: TargetStatus[];
}

