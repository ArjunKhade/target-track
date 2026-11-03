export type UserRole = 'admin' | 'officer' | 'viewer';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  email: string;
  lastLogin?: string; // ISO 8601
  avatar?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number; // Unix timestamp
}

