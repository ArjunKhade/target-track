export const APP_CONSTANTS = {
  APP_NAME: 'TargetTrack',
  APP_SUBTITLE: 'Intelligence Operations Dashboard',
  CONFIDENTIAL_LABEL: 'CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE',
  SESSION_TIMEOUT_MS: 10 * 60 * 1000, // 10 minutes
  SESSION_TIMEOUT_WARNING_MS: 9 * 60 * 1000, // warn at 9 min
  ALERT_INTERVAL_MIN_MS: 15000,
  ALERT_INTERVAL_MAX_MS: 30000,
  MAX_MULTI_TARGET_COMPARE: 5,
  INTERSECTION_DEFAULT_KM: 10,
  INTERSECTION_DEFAULT_HOURS: 6,
  DWELL_THRESHOLD_HOURS: 2,
  PREDICTED_DISTANCE_KM: 150,

  // Threat level colors (WCAG-safe)
  THREAT_COLORS: {
    LOW: '#4caf50',
    MEDIUM: '#ff9800',
    HIGH: '#f44336',
    CRITICAL: '#b71c1c',
  } as Record<string, string>,

  // Target status colors
  STATUS_COLORS: {
    Active: '#f44336',
    'Under Surveillance': '#ff9800',
    Captured: '#4caf50',
    'Lost Contact': '#9e9e9e',
  } as Record<string, string>,

  // Category colors
  CATEGORY_COLORS: {
    'Terror Org': '#b71c1c',
    'Organized Crime': '#e65100',
    Fugitive: '#f57f17',
    Smuggler: '#1a237e',
    'Cyber Crime': '#4a148c',
  } as Record<string, string>,

  // Route colors for multi-target view
  ROUTE_COLORS: ['#1976d2', '#e91e63', '#00bcd4', '#4caf50', '#ff9800'],

  STORAGE_KEYS: {
    AUTH_SESSION: 'tt_auth_session',
    THEME: 'tt_theme',
    GEOFENCES: 'tt_geofences',
    COLUMN_VISIBILITY: 'tt_col_visibility',
  },
} as const;

