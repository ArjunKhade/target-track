import { Injectable, signal } from '@angular/core';

import { GeofenceZone } from '../models/geofence.model';
import { Target, LocationPoint } from '../models/target.model';
import { MOCK_GEOFENCES } from '../mock/geofences.mock';
import { pointInPolygon, pointInCircle } from '../../shared/utils/geo.utils';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';

@Injectable({ providedIn: 'root' })
export class GeofenceService {
  private readonly _zones = signal<GeofenceZone[]>(this._loadFromStorage());

  readonly zones = this._zones.asReadonly();

  /** Add a new geofence zone (id and createdAt are generated here) */
  addZone(zone: Omit<GeofenceZone, 'id' | 'createdAt'>): void {
    const newZone: GeofenceZone = {
      ...zone,
      id: `GEO-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this._zones.update(current => [...current, newZone]);
    this._saveToStorage();
  }

  /** Patch-update a geofence zone by id */
  updateZone(id: string, updates: Partial<GeofenceZone>): void {
    this._zones.update(current =>
      current.map(z => (z.id === id ? { ...z, ...updates } : z))
    );
    this._saveToStorage();
  }

  /** Remove a geofence zone by id */
  deleteZone(id: string): void {
    this._zones.update(current => current.filter(z => z.id !== id));
    this._saveToStorage();
  }

  /**
   * Check which active geofence zones a target's history points violate.
   * Returns an array of { zone, point } pairs for every violation found.
   */
  checkViolations(
    target: Target
  ): { zone: GeofenceZone; point: LocationPoint }[] {
    const violations: { zone: GeofenceZone; point: LocationPoint }[] = [];
    const activeZones = this._zones().filter(z => z.active);

    for (const point of target.history) {
      for (const zone of activeZones) {
        if (zone.shape === 'circle') {
          if (
            zone.center !== undefined &&
            zone.radius !== undefined &&
            pointInCircle(
              point.lat,
              point.lng,
              zone.center[0],
              zone.center[1],
              zone.radius / 1000 // convert metres → km
            )
          ) {
            violations.push({ zone, point });
          }
        } else if (zone.shape === 'polygon') {
          if (
            zone.coordinates !== undefined &&
            zone.coordinates.length >= 3 &&
            pointInPolygon(point.lat, point.lng, zone.coordinates)
          ) {
            violations.push({ zone, point });
          }
        }
      }
    }

    return violations;
  }

  // ── Storage helpers ────────────────────────────────────────────────────────

  private _saveToStorage(): void {
    try {
      localStorage.setItem(
        APP_CONSTANTS.STORAGE_KEYS.GEOFENCES,
        JSON.stringify(this._zones())
      );
    } catch {
      // localStorage not available (SSR / private mode) — silent fail
    }
  }

  private _loadFromStorage(): GeofenceZone[] {
    try {
      const raw = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.GEOFENCES);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as GeofenceZone[];
        }
      }
    } catch {
      // JSON parse error or no localStorage — fall through to mock data
    }
    return MOCK_GEOFENCES.map(z => ({ ...z }));
  }
}
