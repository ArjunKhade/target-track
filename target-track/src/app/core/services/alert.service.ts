import { Injectable, signal, computed } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

import { Alert, AlertSeverity, AlertType } from '../models/alert.model';
import { MOCK_ALERTS } from '../mock/alerts.mock';
import { MOCK_TARGETS } from '../mock/targets.mock';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly _alerts = signal<Alert[]>(
    MOCK_ALERTS.map(a => ({ ...a }))
  );

  readonly alerts = this._alerts.asReadonly();

  readonly unreadCount = computed(
    () => this._alerts().filter(a => !a.read).length
  );

  private readonly _alertTypes: AlertType[] = [
    'SIGHTING',
    'GEOFENCE_BREACH',
    'ASSOCIATE_CONTACT',
    'STATUS_CHANGE',
  ];

  private readonly _severities: AlertSeverity[] = ['INFO', 'WARNING', 'CRITICAL'];

  private readonly _sightingMessages = [
    'spotted at transit hub via CCTV',
    'detected at border crossing point',
    'sighted near restricted zone',
    'phone tower ping recorded',
    'vehicle identified at toll plaza',
    'observed at hotel check-in',
  ];

  private readonly _geofenceMessages = [
    'entered geofence exclusion zone',
    'breached monitored perimeter',
    'detected inside high-security zone',
  ];

  private readonly _associateMessages = [
    'contact confirmed with known associate',
    'meeting observed with person of interest',
    'communications intercept flagged',
  ];

  private readonly _statusMessages = [
    'status changed by field officer',
    'threat level elevated after new intelligence',
    'case priority updated',
  ];

  /** Generate a new live alert from a random MOCK_TARGET */
  generateLiveAlert(): Alert {
    const targets = MOCK_TARGETS;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const type = this._alertTypes[Math.floor(Math.random() * this._alertTypes.length)];
    const severity = this._severities[Math.floor(Math.random() * this._severities.length)];

    let message: string;
    let location: string | undefined;

    const lastPoint = target.history[target.history.length - 1];
    if (lastPoint) {
      location = `${lastPoint.city}, ${lastPoint.state}`;
    }

    switch (type) {
      case 'SIGHTING':
        message = `${target.alias} ${this._sightingMessages[Math.floor(Math.random() * this._sightingMessages.length)]}`;
        break;
      case 'GEOFENCE_BREACH':
        message = `${target.alias} ${this._geofenceMessages[Math.floor(Math.random() * this._geofenceMessages.length)]}`;
        break;
      case 'ASSOCIATE_CONTACT':
        message = `${target.alias} ${this._associateMessages[Math.floor(Math.random() * this._associateMessages.length)]}`;
        break;
      case 'STATUS_CHANGE':
        message = `${target.alias} ${this._statusMessages[Math.floor(Math.random() * this._statusMessages.length)]}`;
        break;
      default:
        message = `New activity detected for ${target.alias}`;
    }

    return {
      id: `ALT-LIVE-${Date.now()}`,
      targetId: target.id,
      targetAlias: target.alias,
      type,
      severity,
      message,
      location,
      timestamp: new Date().toISOString(),
      read: false,
    };
  }

  /** Mark a single alert as read */
  markRead(id: string): void {
    this._alerts.update(alerts =>
      alerts.map(a => (a.id === id ? { ...a, read: true } : a))
    );
  }

  /** Mark all alerts as read */
  markAllRead(): void {
    this._alerts.update(alerts => alerts.map(a => ({ ...a, read: true })));
  }

  /**
   * Start emitting live alerts at random intervals between
   * ALERT_INTERVAL_MIN_MS and ALERT_INTERVAL_MAX_MS.
   * Each emitted alert is also prepended to the internal signal.
   */
  startLiveAlerts(): Observable<Alert> {
    const minMs = APP_CONSTANTS.ALERT_INTERVAL_MIN_MS;
    const maxMs = APP_CONSTANTS.ALERT_INTERVAL_MAX_MS;
    const intervalMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

    return interval(intervalMs).pipe(
      map(() => {
        const alert = this.generateLiveAlert();
        this._alerts.update(current => [alert, ...current]);
        return alert;
      })
    );
  }
}
