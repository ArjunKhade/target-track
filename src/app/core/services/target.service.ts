import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { Target, TargetStatus, LocationPoint } from '../models/target.model';
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

  /**
   * Register and create a new target in-memory.
   * Generates next tactical ID (e.g. TGT-007) and initial tracking breadcrumb.
   */
  createTarget(data: Partial<Target>): Observable<Target> {
    const existing = this._targets();
    let nextNum = existing.length + 1;
    let nextId = `TGT-${String(nextNum).padStart(3, '0')}`;
    while (existing.some(t => t.id === nextId)) {
      nextNum++;
      nextId = `TGT-${String(nextNum).padStart(3, '0')}`;
    }

    const now = new Date().toISOString();
    const alias = (data.alias || 'UNKNOWN').trim().toUpperCase();

    const newTarget: Target = {
      id: nextId,
      alias,
      fullName: (data.fullName || alias).trim(),
      photoUrl: data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(alias)}&background=0284c7&color=ffffff&bold=true`,
      category: data.category || 'Organized Crime',
      organization: (data.organization || 'Independent').trim(),
      threatLevel: data.threatLevel || 'MEDIUM',
      status: data.status || 'Active',
      lastSeen: data.lastSeen || now,
      knownAssociates: data.knownAssociates || [],
      notes: data.notes || [],
      tags: data.tags || [],
      history: data.history && data.history.length > 0 ? data.history : [
        {
          lat: 19.0760,
          lng: 72.8777,
          city: 'Mumbai',
          state: 'Maharashtra',
          timestamp: now,
          activity: 'Initial target dossier registration',
          source: 'Informant',
          confidence: 80,
        },
      ],
    };

    this._targets.update(targets => [newTarget, ...targets]);
    return of(newTarget).pipe(delay(400));
  }

  /**
   * Update an existing target's profile details.
   */
  updateTarget(id: string, updates: Partial<Target>): Observable<Target> {
    let updatedTarget: Target | undefined;

    this._targets.update(targets =>
      targets.map(t => {
        if (t.id === id) {
          updatedTarget = {
            ...t,
            ...updates,
            id: t.id, // prevent changing ID
            lastSeen: updates.lastSeen || new Date().toISOString(),
          };
          return updatedTarget;
        }
        return t;
      })
    );

    if (!updatedTarget) {
      throw new Error(`Target ${id} not found`);
    }

    return of(updatedTarget).pipe(delay(350));
  }

  /**
   * Append a new surveillance sighting location to a target's tracking history.
   * Updates the target's lastSeen timestamp and positions the new sighting at the head of history.
   */
  addLocationPoint(targetId: string, point: LocationPoint): Observable<Target> {
    let updatedTarget: Target | undefined;

    this._targets.update(targets =>
      targets.map(t => {
        if (t.id === targetId) {
          const timestamp = point.timestamp || new Date().toISOString();
          const pointWithTimestamp: LocationPoint = {
            ...point,
            timestamp,
          };
          const history = [pointWithTimestamp, ...t.history];
          updatedTarget = {
            ...t,
            history,
            lastSeen: timestamp,
          };
          return updatedTarget;
        }
        return t;
      })
    );

    if (!updatedTarget) {
      throw new Error(`Target ${targetId} not found`);
    }

    return of(updatedTarget).pipe(delay(350));
  }

  /**
   * Add a known associate to a target's network.
   * If bidirectional is true, also links targetId to the associate target if it exists.
   */
  addAssociate(
    targetId: string,
    associateId: string,
    bidirectional = true,
    relationship?: string
  ): Observable<Target> {
    const cleanAssocId = associateId.trim();
    if (!cleanAssocId) {
      throw new Error('Associate ID cannot be empty');
    }

    let updatedTarget: Target | undefined;

    this._targets.update(targets =>
      targets.map(t => {
        if (t.id === targetId) {
          const associates = t.knownAssociates.includes(cleanAssocId)
            ? t.knownAssociates
            : [...t.knownAssociates, cleanAssocId];
          const notes = relationship
            ? [...t.notes, `[NETWORK LINK] Added associate ${cleanAssocId} (Role: ${relationship})`]
            : t.notes;
          updatedTarget = {
            ...t,
            knownAssociates: associates,
            notes,
            lastSeen: new Date().toISOString(),
          };
          return updatedTarget;
        }

        // If bidirectional and this is the associate target, link targetId to it as well
        if (bidirectional && t.id === cleanAssocId) {
          const associates = t.knownAssociates.includes(targetId)
            ? t.knownAssociates
            : [...t.knownAssociates, targetId];
          const notes = relationship
            ? [...t.notes, `[NETWORK LINK] Linked to associate ${targetId} (Role: ${relationship})`]
            : t.notes;
          return {
            ...t,
            knownAssociates: associates,
            notes,
          };
        }

        return t;
      })
    );

    if (!updatedTarget) {
      throw new Error(`Target ${targetId} not found`);
    }

    return of(updatedTarget).pipe(delay(350));
  }

  /**
   * Remove a known associate from a target's network.
   * If bidirectional is true, also unlinks targetId from the associate if present.
   */
  removeAssociate(
    targetId: string,
    associateId: string,
    bidirectional = true
  ): Observable<Target> {
    let updatedTarget: Target | undefined;

    this._targets.update(targets =>
      targets.map(t => {
        if (t.id === targetId) {
          updatedTarget = {
            ...t,
            knownAssociates: t.knownAssociates.filter(id => id !== associateId),
            lastSeen: new Date().toISOString(),
          };
          return updatedTarget;
        }

        if (bidirectional && t.id === associateId) {
          return {
            ...t,
            knownAssociates: t.knownAssociates.filter(id => id !== targetId),
          };
        }

        return t;
      })
    );

    if (!updatedTarget) {
      throw new Error(`Target ${targetId} not found`);
    }

    return of(updatedTarget).pipe(delay(350));
  }
}
