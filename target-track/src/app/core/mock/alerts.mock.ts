import { Alert } from '../models/alert.model';

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60000).toISOString();
}

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'ALT-001',
    targetId: 'TGT-001',
    targetAlias: 'PHANTOM',
    type: 'SIGHTING',
    severity: 'CRITICAL',
    message: 'PHANTOM detected at Panaji casino complex via CCTV',
    location: 'Panaji, Goa',
    timestamp: minutesAgo(45),
    read: false,
  },
  {
    id: 'ALT-002',
    targetId: 'TGT-007',
    targetAlias: 'SHADOW',
    type: 'SIGHTING',
    severity: 'CRITICAL',
    message: 'SHADOW denied boarding at IGI Airport, Delhi',
    location: 'New Delhi, Delhi',
    timestamp: minutesAgo(180),
    read: false,
  },
  {
    id: 'ALT-003',
    targetId: 'TGT-004',
    targetAlias: 'SPECTRE',
    type: 'ASSOCIATE_CONTACT',
    severity: 'WARNING',
    message: 'SPECTRE contact confirmed with known associate in Chennai',
    location: 'Chennai, Tamil Nadu',
    timestamp: minutesAgo(320),
    read: true,
  },
  {
    id: 'ALT-004',
    targetId: 'TGT-010',
    targetAlias: 'MANTIS',
    type: 'STATUS_CHANGE',
    severity: 'INFO',
    message: 'MANTIS status updated to Captured after Nagpur arrest',
    location: 'Nagpur, Maharashtra',
    timestamp: minutesAgo(720),
    read: true,
  },
  {
    id: 'ALT-005',
    targetId: 'TGT-003',
    targetAlias: 'WRAITH',
    type: 'SIGHTING',
    severity: 'CRITICAL',
    message: 'WRAITH photographed near Darjeeling hill station',
    location: 'Darjeeling, West Bengal',
    timestamp: minutesAgo(960),
    read: false,
  },
  {
    id: 'ALT-006',
    targetId: 'TGT-002',
    targetAlias: 'VIPER',
    type: 'SIGHTING',
    severity: 'WARNING',
    message: 'VIPER arrived at Mumbai CST; under surveillance',
    location: 'Mumbai, Maharashtra',
    timestamp: minutesAgo(1440),
    read: true,
  },
];

