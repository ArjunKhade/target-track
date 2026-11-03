import { Evidence } from '../models/evidence.model';

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString();
}

export const MOCK_EVIDENCE: Evidence[] = [
  {
    id: 'EVD-001',
    targetId: 'TGT-001',
    fileName: 'phantom_casino_surveillance_001.jpg',
    fileType: 'IMAGE',
    fileSize: 2345678,
    mimeType: 'image/jpeg',
    description: 'CCTV frame from Panaji casino showing PHANTOM at gaming table',
    uploadedBy: 'Field Officer',
    uploadedAt: daysAgo(4),
    tags: ['CCTV', 'casino', 'Goa'],
  },
  {
    id: 'EVD-002',
    targetId: 'TGT-001',
    fileName: 'financial_records_q3.pdf',
    fileType: 'DOCUMENT',
    fileSize: 892345,
    mimeType: 'application/pdf',
    description: 'Seized financial records showing offshore transactions',
    uploadedBy: 'Admin Officer',
    uploadedAt: daysAgo(8),
    tags: ['financial', 'offshore'],
  },
  {
    id: 'EVD-003',
    targetId: 'TGT-007',
    fileName: 'border_drone_footage_wagah.mp4',
    fileType: 'VIDEO',
    fileSize: 45678901,
    mimeType: 'video/mp4',
    description: 'Drone footage of suspected infiltration route near Wagah',
    uploadedBy: 'Field Officer',
    uploadedAt: daysAgo(5),
    tags: ['drone', 'border', 'Wagah'],
  },
  {
    id: 'EVD-004',
    targetId: 'TGT-004',
    fileName: 'intercepted_comms_log.txt',
    fileType: 'DOCUMENT',
    fileSize: 15234,
    mimeType: 'text/plain',
    description: 'Intercepted encrypted communication log decoded by cyber team',
    uploadedBy: 'Admin Officer',
    uploadedAt: daysAgo(7),
    tags: ['comms', 'encrypted', 'cyber'],
  },
  {
    id: 'EVD-005',
    targetId: 'TGT-003',
    fileName: 'fake_id_scan_siliguri.jpg',
    fileType: 'IMAGE',
    fileSize: 1123456,
    mimeType: 'image/jpeg',
    description: 'Scanned fake Aadhaar card recovered from Siliguri safe house',
    uploadedBy: 'Field Officer',
    uploadedAt: daysAgo(8),
    tags: ['fake-id', 'Aadhaar', 'Siliguri'],
  },
];

