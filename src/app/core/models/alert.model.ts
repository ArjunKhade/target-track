export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertType = 'SIGHTING' | 'GEOFENCE_BREACH' | 'ASSOCIATE_CONTACT' | 'STATUS_CHANGE' | 'SYSTEM';

export interface Alert {
  id: string;
  targetId: string;
  targetAlias: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  location?: string;
  timestamp: string; // ISO 8601
  read: boolean;
}

