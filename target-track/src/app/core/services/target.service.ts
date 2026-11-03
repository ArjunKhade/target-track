import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { Target, TargetStatus } from '../models/target.model';
import { CaseNote } from '../models/case-note.model';
import { MOCK_TARGETS } from '../mock/targets.mock';

@Injectable({ providedIn: 'root' })
export class TargetService {
  private readonly _targets = signal<Target[]>(
    MOCK_TARGETS.map(t => ({ ...t, history: t.history.map(h => ({ ...h })) }))
  );

  readonly targets = this._targets.asReadonly();

  readonly targetCount = computed(() => this._targets().length);

  readonly criticalCount = computed(
    () => this._targets().filter(t => t.threatLevel === 'CRITICAL').length
  );

  readonly activeCount = computed(
    () => this._targets().filter(t => t.status === 'Active').length
  );

  readonly capturedCount = computed(
    () => this._targets().filter(t => t.status === 'Captured').length
  );

  readonly lostContactCount = computed(
    () => this._targets().filter(t => t.status === 'Lost Contact').length
  );

  /** Fetch all targets (simulated API, 400ms delay) */
  getTargets(): Observable<Target[]> {
    return of(this._targets()).pipe(delay(400));
  }

  /** Fetch a single target by id (simulated API, 300ms delay) */
  getTarget(id: string): Observable<Target | undefined> {
    return of(this._targets().find(t => t.id === id)).pipe(delay(300));
  }

  /**
   * Update a target's status in-memory and signal reactivity.
   * Returns the updated target (simulated API, 500ms delay).
   */
  updateStatus(id: string, status: TargetStatus): Observable<Target> {
    this._targets.update(targets =>
      targets.map(t =>
        t.id === id
          ? { ...t, status, lastSeen: new Date().toISOString() }
          : t
      )
    );

    const updated = this._targets().find(t => t.id === id);
    if (!updated) {
      throw new Error(`Target ${id} not found`);
    }

    return of(updated).pipe(delay(500));
  }

  /**
   * Append a case note to a target's notes array.
   * Returns the created CaseNote (simulated API, 300ms delay).
   */
  addNote(targetId: string, content: string, author: string): Observable<CaseNote> {
    const noteId = `NOTE-${Date.now()}`;
    const now = new Date().toISOString();

    const newNote: CaseNote = {
      id: noteId,
      targetId,
      content,
      authorId: author,
      authorName: author,
      createdAt: now,
      updatedAt: now,
      tags: [],
    };

    this._targets.update(targets =>
      targets.map(t =>
        t.id === targetId
          ? { ...t, notes: [...t.notes, content] }
          : t
      )
    );

    return of(newNote).pipe(delay(300));
  }
}
