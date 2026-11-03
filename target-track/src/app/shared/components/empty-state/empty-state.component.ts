import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Standalone component that renders a centred empty-state placeholder with
 * a Material icon, title, and descriptive message.
 *
 * Usage:
 *   <app-empty-state
 *     icon="search_off"
 *     title="No targets found"
 *     message="Adjust your filters and try again."
 *   />
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="empty-state" role="status" aria-live="polite">
      <mat-icon class="empty-icon" aria-hidden="true">{{ icon() }}</mat-icon>
      <h3 class="empty-title">{{ title() }}</h3>
      <p class="empty-message">{{ message() }}</p>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      gap: 12px;
      color: var(--mat-sys-on-surface-variant, #757575);
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      opacity: 0.4;
    }

    .empty-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface, #212121);
    }

    .empty-message {
      margin: 0;
      font-size: 0.875rem;
      max-width: 320px;
      line-height: 1.5;
    }
  `],
})
export class EmptyStateComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}
