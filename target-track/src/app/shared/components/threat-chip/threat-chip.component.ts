import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { ThreatLevel } from '../../../core/models/target.model';
import { APP_CONSTANTS } from '../../constants/app.constants';

/**
 * Standalone component that renders a threat-level badge.
 * CRITICAL badges display a red pulsing glow animation.
 *
 * Usage: <app-threat-chip [threatLevel]="target.threatLevel" />
 */
@Component({
  selector: 'app-threat-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <span
      class="threat-chip"
      [class.critical]="threatLevel() === 'CRITICAL'"
      [style.background-color]="chipColor()"
      [attr.aria-label]="'Threat level: ' + threatLevel()"
    >
      @if (threatLevel() === 'CRITICAL') {
        <span class="critical-icon" aria-hidden="true">⚠</span>
      }
      {{ threatLevel() }}
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .threat-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #fff;
      white-space: nowrap;
      transition: box-shadow 0.2s;
    }

    .threat-chip.critical {
      animation: critical-pulse 1.2s ease-in-out infinite;
    }

    .critical-icon {
      font-size: 0.85rem;
    }

    @keyframes critical-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(183, 28, 28, 0.7); }
      50%  { box-shadow: 0 0 0 8px rgba(183, 28, 28, 0); }
      100% { box-shadow: 0 0 0 0 rgba(183, 28, 28, 0); }
    }
  `],
})
export class ThreatChipComponent {
  readonly threatLevel = input.required<ThreatLevel>();

  chipColor(): string {
    return APP_CONSTANTS.THREAT_COLORS[this.threatLevel()] ?? '#9e9e9e';
  }
}
