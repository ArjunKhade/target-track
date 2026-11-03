import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_USERS } from '../mock/users.mock';
import { User, AuthSession, UserRole } from '../models/user.model';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _session = signal<AuthSession | null>(this._loadSession());
  private readonly _router = new Router(); // placeholder; real injection via constructor

  readonly session = this._session.asReadonly();
  readonly currentUser = computed(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly userRole = computed<UserRole | null>(() => this._session()?.user.role ?? null);

  constructor(private router: Router) {
    this._session.set(this._loadSession());
  }

  login(username: string, _password: string): { success: boolean; error?: string } {
    const user = MOCK_USERS.find(u => u.username === username);
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }
    const session: AuthSession = {
      user: { ...user, lastLogin: new Date().toISOString() },
      token: `mock-token-${Date.now()}`,
      expiresAt: Date.now() + 8 * 3600000, // 8 hours
    };
    this._session.set(session);
    localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    return { success: true };
  }

  logout(): void {
    this._session.set(null);
    localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_SESSION);
    this.router.navigate(['/login']);
  }

  hasRole(role: UserRole): boolean {
    const userRole = this.userRole();
    if (!userRole) return false;
    const hierarchy: UserRole[] = ['viewer', 'officer', 'admin'];
    return hierarchy.indexOf(userRole) >= hierarchy.indexOf(role);
  }

  isAdmin(): boolean { return this.userRole() === 'admin'; }
  isOfficer(): boolean { return this.hasRole('officer'); }

  private _loadSession(): AuthSession | null {
    try {
      const stored = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_SESSION);
      if (!stored) return null;
      const session = JSON.parse(stored) as AuthSession;
      if (session.expiresAt < Date.now()) {
        localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_SESSION);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }
}

