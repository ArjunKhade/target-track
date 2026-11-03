import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Reusable confirmation dialog component.
 *
 * Usage:
 *   const ref = this.dialog.open(ConfirmDialogComponent, {
 *     data: { title: 'Delete target?', message: 'This action cannot be undone.' },
 *   });
 *   ref.afterClosed().subscribe((confirmed: boolean) => { ... });
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <mat-dialog-content>
      <p class="confirm-message">{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button
        mat-button
        [mat-dialog-close]="false"
        type="button"
      >
        {{ data.cancelText ?? 'Cancel' }}
      </button>
      <button
        mat-flat-button
        color="warn"
        [mat-dialog-close]="true"
        type="button"
        cdkFocusInitial
      >
        {{ data.confirmText ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-message {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--mat-sys-on-surface-variant, #555);
    }

    mat-dialog-actions {
      gap: 8px;
      padding-bottom: 16px;
      padding-right: 16px;
    }
  `],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
}
