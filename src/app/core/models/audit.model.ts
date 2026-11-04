export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'TARGET_VIEW'
  | 'TARGET_CREATE'
  | 'TARGET_UPDATE'
  | 'TARGET_LOCATION_UPDATE'
  | 'ASSOCIATE_ADD'
  | 'ASSOCIATE_REMOVE'
  | 'TARGET_STATUS_CHANGE'
  | 'NOTE_ADD'
  | 'NOTE_EDIT'
  | 'NOTE_DELETE'
  | 'EXPORT_CSV'
  | 'EXPORT_GEOJSON'
  | 'EXPORT_PDF'
  | 'GEOFENCE_CREATE'
  | 'GEOFENCE_EDIT'
  | 'GEOFENCE_DELETE'
  | 'EVIDENCE_UPLOAD';

export interface AuditEntry {
  id: string;
  userId: string;
  username: string;
  action: AuditAction;
  targetId?: string;
  targetAlias?: string;
  details: string;
  timestamp: string; // ISO 8601
  ipAddress: string;
}

