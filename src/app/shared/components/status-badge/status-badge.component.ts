import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { TargetStatus } from '../../../core/models/target.model';
import { APP_CONSTANTS } from '../../constants/app.constants';

/**
 * Standalone component that renders a Material chip coloured according to the
 * target's operational status.
 *
 * Usage: <app-status-badge [status]="target.status" />
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatChipsModule],
  template: `
    <span
      class="status-badge"
      [style.background-color]="badgeColor()"
      [attr.aria-label]="'Status: ' + status()"
    >
      @switch (status()) {
        @case ('Active') {
          <span class="dot pulse"></span>Active
        }
        @case ('Under Surveillance') {
          <span class="dot"></span>Under Surveillance
        }
        @case ('Captured') {
          <span class="dot"></span>Captured
        }
        @case ('Lost Contact') {
          <span class="dot"></span>Lost Contact
        }
        @default {
          {{ status() }}
        }
      }
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      color: #fff;
      white-space: nowrap;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.85);
      flex-shrink: 0;
    }

    .dot.pulse {
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
      70%  { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
    }
  `],
})
export class StatusBadgeComponent {
  readonly status = input.required<TargetStatus>();

  badgeColor(): string {
    return APP_CONSTANTS.STATUS_COLORS[this.status()] ?? '#9e9e9e';
  }
}
