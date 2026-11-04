import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Target } from '../../../core/models/target.model';
import { TargetService } from '../../../core/services/target.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ThreatChipComponent } from '../../../shared/components/threat-chip/threat-chip.component';

export interface AssociateDialogData {
  target: Target;
}

export interface AssociateResult {
  associateId: string;
  bidirectional: boolean;
  relationship?: string;
  notes?: string;
}

@Component({
  selector: 'app-associate-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ThreatChipComponent,
  ],
  template: `
    <div class="tactical-dialog-container font-sans">
      <!-- Dialog Header -->
      <div class="dialog-header">
        <div class="header-icon-title">
          <div class="icon-avatar">
            <mat-icon>hub</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title font-mono">LINK KNOWN ASSOCIATE & NETWORK</h2>
            <p class="dialog-subtitle">
              Expand surveillance network graph for <span class="highlight-target font-mono">{{ data.target.alias }}</span> ({{ data.target.id }})
            </p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn" [disabled]="isSubmitting()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Form Content -->
      <mat-dialog-content class="dialog-content">
        <form [formGroup]="associateForm" (ngSubmit)="onSubmit()" id="associateForm" class="tactical-form">

          <!-- Association Source Mode -->
          <div class="mode-toggle-card">
            <div class="mode-label font-mono">ASSOCIATION TYPE</div>
            <mat-radio-group
              formControlName="mode"
              class="mode-radio-group"
              (change)="onModeChange($event.value)"
            >
              <mat-radio-button value="registered" class="mode-radio">
                <span class="radio-text">
                  <strong>Registered Tactical Target</strong>
                  <small>Select from active surveillance roster</small>
                </span>
              </mat-radio-button>
              <mat-radio-button value="custom" class="mode-radio">
                <span class="radio-text">
                  <strong>External / Unclassified Entity</strong>
                  <small>Specify custom ID, alias, or cell tag</small>
                </span>
              </mat-radio-button>
            </mat-radio-group>
          </div>

          <!-- Section: Associate Selection -->
          <div class="form-section">
            @if (associateForm.get('mode')?.value === 'registered') {
              <!-- Select from Registered Targets -->
              <div class="field-wrap">
                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Select Network Subject</mat-label>
                  <mat-select formControlName="selectedTargetId">
                    <mat-select-trigger>
                      @if (selectedTarget(); as sel) {
                        <div class="selected-trigger-row font-mono">
                          <span class="sel-alias font-bold">{{ sel.alias }}</span>
                          <span class="sel-name">({{ sel.fullName }})</span>
                          <span class="sel-id">[{{ sel.id }}]</span>
                        </div>
                      }
                    </mat-select-trigger>
                    @for (tgt of availableTargets(); track tgt.id) {
                      <mat-option [value]="tgt.id" class="target-option">
                        <div class="option-row">
                          <div class="option-left">
                            <span class="option-alias font-mono">{{ tgt.alias }}</span>
                            <span class="option-name">{{ tgt.fullName }}</span>
                            <span class="option-id font-mono">[{{ tgt.id }}]</span>
                          </div>
                          <div class="option-right">
                            <span class="option-cat">{{ tgt.category }}</span>
                            <app-threat-chip [threatLevel]="tgt.threatLevel"></app-threat-chip>
                          </div>
                        </div>
                      </mat-option>
                    }
                  </mat-select>
                  <mat-icon matPrefix>person_search</mat-icon>
                  @if (associateForm.get('selectedTargetId')?.hasError('required') && associateForm.get('selectedTargetId')?.touched) {
                    <mat-error>Please select a target from the surveillance registry</mat-error>
                  }
                </mat-form-field>

                @if (availableTargets().length === 0) {
                  <p class="registry-empty-warn font-mono">
                    <mat-icon>info</mat-icon> All registered targets are already linked to this network. Switch to "External / Unclassified Entity" to link a new subject.
                  </p>
                }
              </div>
            } @else {
              <!-- Custom / External Target ID -->
              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>External Subject Codename / Identifier</mat-label>
                <input
                  matInput
                  formControlName="customAssociateId"
                  placeholder="e.g. EXT-AL-QAEDA-LEAD, COURIER-09, ABU-SALAH"
                  style="text-transform: uppercase;"
                />
                <mat-icon matPrefix>badge</mat-icon>
                @if (associateForm.get('customAssociateId')?.hasError('required') && associateForm.get('customAssociateId')?.touched) {
                  <mat-error>Subject identifier is required</mat-error>
                }
                @if (associateForm.get('customAssociateId')?.hasError('minlength')) {
                  <mat-error>Minimum 2 characters required</mat-error>
                }
              </mat-form-field>
            }

            <!-- Tactical Role / Relationship -->
            <div class="form-row two-cols">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Operational Relationship / Role</mat-label>
                <mat-select formControlName="relationship">
                  @for (role of relationshipRoles; track role) {
                    <mat-option [value]="role">{{ role }}</mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>diversity_3</mat-icon>
                @if (associateForm.get('relationship')?.hasError('required')) {
                  <mat-error>Relationship role is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Link Classification Level</mat-label>
                <mat-select formControlName="classification">
                  <mat-option value="CONFIRMED">CONFIRMED (Direct Sighting / Wiretap)</mat-option>
                  <mat-option value="PROBABLE">PROBABLE (Repeated Cell Association)</mat-option>
                  <mat-option value="SUSPECTED">SUSPECTED (Single Sighting / Informant)</mat-option>
                </mat-select>
                <mat-icon matPrefix>verified</mat-icon>
              </mat-form-field>
            </div>

            <!-- Intercept / Intelligence Notes -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Intelligence Brief / Reason for Association</mat-label>
              <textarea
                matInput
                rows="2"
                formControlName="notes"
                placeholder="Log intercepted comms, meeting location, financial trail, or surveillance observation..."
              ></textarea>
              <mat-icon matPrefix>description</mat-icon>
            </mat-form-field>

            <!-- Bi-directional Link Option -->
            <div class="bidirectional-box">
              <mat-checkbox formControlName="bidirectional" color="primary">
                <div class="checkbox-label-wrap">
                  <span class="check-title font-mono">ESTABLISH BI-DIRECTIONAL NETWORK LINK</span>
                  <span class="check-desc">
                    Automatically update associate's intelligence file to display <strong class="font-mono">{{ data.target.alias }}</strong> as a confirmed associate.
                  </span>
                </div>
              </mat-checkbox>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <!-- Actions -->
      <mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button mat-dialog-close type="button" [disabled]="isSubmitting()">
          Cancel
        </button>
        <button
          mat-flat-button
          color="primary"
          type="submit"
          form="associateForm"
          class="submit-btn font-mono"
          [disabled]="associateForm.invalid || isSubmitting()"
        >
          @if (isSubmitting()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <span class="btn-content-wrap">
              <mat-icon>hub</mat-icon>
              <span>LINK TO NETWORK</span>
            </span>
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .tactical-dialog-container {
        display: flex;
        flex-direction: column;
        max-height: 90vh;
        background: var(--bg-surface, #ffffff);
        color: var(--text-primary, #0f172a);
      }

      .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 24px;
        background: var(--bg-surface, #ffffff);
        border-bottom: 1px solid var(--border-color, #e2e8f0);
      }

      .header-icon-title {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .icon-avatar {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: rgba(14, 165, 233, 0.12);
        color: #0284c7;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(14, 165, 233, 0.25);
      }

      .dialog-title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: var(--text-primary, #0f172a);
      }

      .dialog-subtitle {
        margin: 4px 0 0;
        font-size: 0.82rem;
        color: var(--text-secondary, #64748b);
      }

      .highlight-target {
        font-weight: 700;
        color: #0284c7;
      }

      .close-btn {
        color: var(--text-secondary, #64748b);
      }

      .dialog-content {
        padding: 20px 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 18px;
        background: var(--bg-app, #f8fafc);
      }

      .mode-toggle-card {
        padding: 14px 16px;
        background: var(--bg-surface, #ffffff);
        border: 1px solid var(--border-color, #e2e8f0);
        border-radius: 8px;
      }

      .mode-label {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #0284c7;
        margin-bottom: 10px;
      }

      .mode-radio-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .mode-radio {
        margin-bottom: 4px;
      }

      .radio-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        strong {
          font-size: 0.88rem;
          color: var(--text-primary, #0f172a);
        }
        small {
          font-size: 0.76rem;
          color: var(--text-secondary, #64748b);
        }
      }

      .form-section {
        display: flex;
        flex-direction: column;
        gap: 14px;
        background: var(--bg-surface, #ffffff);
        border: 1px solid var(--border-color, #e2e8f0);
        border-radius: 8px;
        padding: 16px;
      }

      .form-row {
        display: grid;
        gap: 14px;
      }

      .form-row.two-cols {
        grid-template-columns: repeat(2, 1fr);
      }

      .full-width {
        width: 100%;
      }

      .selected-trigger-row {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.88rem;
        .sel-alias {
          color: #0284c7;
        }
        .sel-name {
          color: var(--text-primary, #0f172a);
        }
        .sel-id {
          color: var(--text-secondary, #64748b);
          font-size: 0.8rem;
        }
      }

      .target-option {
        padding: 8px 12px;
      }

      .option-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 12px;
      }

      .option-left {
        display: flex;
        align-items: center;
        gap: 8px;
        .option-alias {
          font-weight: 700;
          color: #0284c7;
        }
        .option-name {
          font-size: 0.85rem;
          color: var(--text-primary, #0f172a);
        }
        .option-id {
          font-size: 0.78rem;
          color: var(--text-secondary, #64748b);
        }
      }

      .option-right {
        display: flex;
        align-items: center;
        gap: 8px;
        .option-cat {
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
        }
      }

      .registry-empty-warn {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 6px 0 0;
        font-size: 0.78rem;
        color: #d97706;
      }

      .bidirectional-box {
        padding: 12px 14px;
        background: rgba(14, 165, 233, 0.05);
        border: 1px dashed rgba(14, 165, 233, 0.4);
        border-radius: 6px;
      }

      .checkbox-label-wrap {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-left: 6px;
        .check-title {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #0284c7;
        }
        .check-desc {
          font-size: 0.76rem;
          color: var(--text-secondary, #64748b);
        }
      }

      .dialog-actions {
        padding: 14px 24px;
        background: var(--bg-surface, #ffffff);
        border-top: 1px solid var(--border-color, #e2e8f0);
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .submit-btn {
        min-width: 170px;
      }

      .btn-content-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      /* Dark Theme */
      body.theme-dark {
        .tactical-dialog-container {
          background: #0f172a;
          color: #f8fafc;
        }
        .dialog-header {
          background: #0f172a;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .dialog-title {
          color: #f8fafc;
        }
        .dialog-subtitle {
          color: #94a3b8;
        }
        .highlight-target {
          color: #38bdf8;
        }
        .dialog-content {
          background: #0b1120;
        }
        .mode-toggle-card, .form-section {
          background: #1e293b;
          border-color: rgba(255, 255, 255, 0.06);
        }
        .mode-label {
          color: #38bdf8;
        }
        .radio-text strong {
          color: #f8fafc;
        }
        .radio-text small {
          color: #94a3b8;
        }
        .selected-trigger-row {
          .sel-alias { color: #38bdf8; }
          .sel-name { color: #f8fafc; }
          .sel-id { color: #94a3b8; }
        }
        .option-left {
          .option-alias { color: #38bdf8; }
          .option-name { color: #f8fafc; }
          .option-id { color: #94a3b8; }
        }
        .option-right .option-cat {
          color: #94a3b8;
        }
        .bidirectional-box {
          background: rgba(56, 189, 248, 0.07);
          border-color: rgba(56, 189, 248, 0.35);
          .check-title { color: #38bdf8; }
          .check-desc { color: #94a3b8; }
        }
        .dialog-actions {
          background: #0f172a;
          border-color: rgba(255, 255, 255, 0.08);
        }
      }

      @media (max-width: 600px) {
        .form-row.two-cols {
          grid-template-columns: 1fr;
        }
        .dialog-actions {
          flex-direction: column-reverse;
          button {
            width: 100%;
          }
        }
      }
    `,
  ],
})
export class AssociateDialogComponent implements OnInit {
  readonly data: AssociateDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AssociateDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly targetService = inject(TargetService);

  readonly isSubmitting = signal<boolean>(false);

  readonly relationshipRoles: string[] = [
    'Lieutenant / Deputy',
    'Financier / Money Launderer',
    'Arms / Logistics Courier',
    'Cell Member / Operative',
    'Cyber Specialist',
    'Safehouse Host / Fixer',
    'Family / Kin',
    'Informant / Asset',
    'Associate / Operative',
  ];

  associateForm!: FormGroup;

  /** Registered targets available to link (excludes self and targets already in knownAssociates) */
  readonly availableTargets = computed(() => {
    const currentId = this.data.target.id;
    const existingAssocs = new Set(this.data.target.knownAssociates || []);
    return this.targetService
      .targets()
      .filter(t => t.id !== currentId && !existingAssocs.has(t.id));
  });

  /** Resolved selected target object for trigger */
  readonly selectedTarget = computed(() => {
    const selId = this.associateForm?.get('selectedTargetId')?.value;
    if (!selId) return null;
    return this.targetService.targets().find(t => t.id === selId) || null;
  });

  ngOnInit(): void {
    const hasAvailable = this.availableTargets().length > 0;
    const initialMode = hasAvailable ? 'registered' : 'custom';

    this.associateForm = this.fb.group({
      mode: [initialMode, [Validators.required]],
      selectedTargetId: [hasAvailable ? this.availableTargets()[0]?.id : null],
      customAssociateId: [''],
      relationship: ['Associate / Operative', [Validators.required]],
      classification: ['CONFIRMED', [Validators.required]],
      notes: [''],
      bidirectional: [true],
    });

    this.updateModeValidators(initialMode);
  }

  onModeChange(mode: 'registered' | 'custom'): void {
    this.updateModeValidators(mode);
  }

  private updateModeValidators(mode: 'registered' | 'custom'): void {
    const selControl = this.associateForm.get('selectedTargetId');
    const customControl = this.associateForm.get('customAssociateId');

    if (mode === 'registered') {
      selControl?.setValidators([Validators.required]);
      customControl?.clearValidators();
      customControl?.setValue('');
    } else {
      customControl?.setValidators([Validators.required, Validators.minLength(2)]);
      selControl?.clearValidators();
      selControl?.setValue(null);
    }

    selControl?.updateValueAndValidity();
    customControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.associateForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const formVal = this.associateForm.value;

    const associateId =
      formVal.mode === 'registered'
        ? formVal.selectedTargetId
        : formVal.customAssociateId?.trim().toUpperCase();

    const noteText = formVal.notes?.trim();
    const fullNote = noteText
      ? `${formVal.relationship} [${formVal.classification}]: ${noteText}`
      : `${formVal.relationship} [${formVal.classification}]`;

    const result: AssociateResult = {
      associateId,
      bidirectional: !!formVal.bidirectional,
      relationship: formVal.relationship,
      notes: fullNote,
    };

    this.dialogRef.close(result);
  }
}
