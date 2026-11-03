import { User } from '../models/user.model';

export const MOCK_USERS: User[] = [
  {
    id: 'USR-001',
    username: 'admin',
    displayName: 'Admin Officer',
    role: 'admin',
    email: 'admin@targettrack.gov.in',
    avatar: '',
  },
  {
    id: 'USR-002',
    username: 'officer',
    displayName: 'Field Officer',
    role: 'officer',
    email: 'officer@targettrack.gov.in',
    avatar: '',
  },
  {
    id: 'USR-003',
    username: 'viewer',
    displayName: 'Intelligence Analyst',
    role: 'viewer',
    email: 'viewer@targettrack.gov.in',
    avatar: '',
  },
];

