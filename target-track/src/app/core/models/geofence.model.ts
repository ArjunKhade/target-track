export type GeofenceShape = 'polygon' | 'circle';

export interface GeofenceZone {
  id: string;
  name: string;
  color: string;
  shape: GeofenceShape;
  // For polygon
  coordinates?: [number, number][]; // [lat, lng] pairs
  // For circle
  center?: [number, number];
  radius?: number; // meters
  description?: string;
  createdBy: string;
  createdAt: string; // ISO 8601
  active: boolean;
}

