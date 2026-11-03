import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { AuditAction, AuditEntry } from '../models/audit.model';
import { User } from '../models/user.model';
import { MOCK_AUDIT_LOG } from '../mock/audit-log.mock';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly _log = signal<AuditEntry[]>(
    MOCK_AUDIT_LOG.map(e => ({ ...e }))
  );

  readonly log = this._log.asReadonly();

  readonly entryCount = computed(() => this._log().length);

  /**
   * Record a new audit entry at the front of the log.
   */
  record(
    action: AuditAction,
    user: User,
    details: string,
    targetId?: string,
    targetAlias?: string
  ): void {
    const entry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      userId: user.id,
      username: user.username,
      action,
      details,
      targetId,
      targetAlias,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0', // Resolved server-side in production
    };

    this._log.update(current => [entry, ...current]);
  }

  /** Return the full audit log as an Observable (simulated API, 300ms delay) */
  getLog(): Observable<AuditEntry[]> {
    return of(this._log()).pipe(delay(300));
  }

  /**
   * Filter the in-memory log by optional userId and/or action.
   * Returns a synchronous array for immediate UI use.
   */
  filterLog(userId?: string, action?: AuditAction): AuditEntry[] {
    return this._log().filter(entry => {
      const matchesUser = userId ? entry.userId === userId : true;
      const matchesAction = action ? entry.action === action : true;
      return matchesUser && matchesAction;
    });
  }
}
