import { CaseNote } from '../models/case-note.model';

function daysAgo(d: number, h = 0): string {
  return new Date(Date.now() - d * 86400000 - h * 3600000).toISOString();
}

export const MOCK_CASE_NOTES: CaseNote[] = [
  {
    id: 'NOTE-001',
    targetId: 'TGT-001',
    content: 'Source confirms PHANTOM met with Khatri Network representative in Mumbai. Possible financial arrangement being made for Q4 operations.',
    authorId: 'USR-002',
    authorName: 'Field Officer',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
    tags: ['financial', 'Khatri', 'Mumbai'],
  },
  {
    id: 'NOTE-002',
    targetId: 'TGT-001',
    content: 'Casino surveillance images obtained from Panaji. PHANTOM appears to have used digital currency exchange at casino. Request forensic accounting review.',
    authorId: 'USR-001',
    authorName: 'Admin Officer',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    tags: ['casino', 'crypto', 'Goa'],
  },
  {
    id: 'NOTE-003',
    targetId: 'TGT-007',
    content: 'Associate confirmed meeting at Wagah border area. Possible new infiltration route being scouted. Coordinate with BSF for border watch.',
    authorId: 'USR-002',
    authorName: 'Field Officer',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    tags: ['border', 'BSF', 'Wagah'],
  },
  {
    id: 'NOTE-004',
    targetId: 'TGT-004',
    content: 'Digital forensics confirms SPECTRE used rotating VPN nodes. Target has expertise in covering digital footprint. Physical surveillance essential.',
    authorId: 'USR-001',
    authorName: 'Admin Officer',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(3),
    tags: ['VPN', 'digital-forensics', 'SPECTRE'],
  },
  {
    id: 'NOTE-005',
    targetId: 'TGT-003',
    content: 'WRAITH identity documents recovered from Siliguri. Three separate IDs confirmed fake. Biometrics sent to central database for cross-matching.',
    authorId: 'USR-002',
    authorName: 'Field Officer',
    createdAt: daysAgo(8),
    updatedAt: daysAgo(8),
    tags: ['fake-id', 'biometrics', 'Siliguri'],
  },
];

