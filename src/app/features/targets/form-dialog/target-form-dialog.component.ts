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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  Target,
  TargetCategory,
  ThreatLevel,
  TargetStatus,
  DataSource,
} from '../../../core/models/target.model';
import { AuthService } from '../../../core/services/auth.service';
import { TargetService } from '../../../core/services/target.service';

export interface TargetFormDialogData {
  mode: 'create' | 'edit';
  target?: Target;
}

@Component({
  selector: 'app-target-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-shell">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-icon-title">
          <div class="icon-avatar" [class.edit-mode]="isEditMode">
            <mat-icon>{{ isEditMode ? 'edit_note' : 'person_add' }}</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title font-mono">
              {{ isEditMode ? 'UPDATE TARGET DOSSIER' : 'REGISTER NEW TARGET' }}
            </h2>
            <p class="dialog-subtitle">
              {{
                isEditMode
                  ? 'Modify classified surveillance record and operational profile'
                  : 'Classify and register new subject under tactical monitoring'
              }}
            </p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn" [disabled]="isSubmitting()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Unauthorized Warning (if non-admin tries to create) -->
      @if (!isEditMode && !isAdmin) {
        <div class="unauthorized-banner">
          <mat-icon color="warn">gpp_bad</mat-icon>
          <span>Restricted Operation: Only Command Administrators are authorized to register new targets.</span>
        </div>
      }

      <!-- Form Content -->
      <mat-dialog-content class="dialog-content">
        <form [formGroup]="targetForm" (ngSubmit)="onSubmit()" id="targetForm" class="tactical-form">
          <!-- Section 1: Identification & Classification -->
          <div class="form-section">
            <div class="section-badge font-mono">
              <mat-icon>badge</mat-icon> PRIMARY IDENTIFICATION
            </div>

            <div class="form-row two-cols">
              <!-- Alias -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Tactical Alias / Codename</mat-label>
                <input
                  matInput
                  formControlName="alias"
                  placeholder="e.g. VIPER, SPECTRE"
                  style="text-transform: uppercase;"
                />
                <mat-icon matPrefix>fingerprint</mat-icon>
                @if (targetForm.get('alias')?.hasError('required') && targetForm.get('alias')?.touched) {
                  <mat-error>Codename / Alias is required</mat-error>
                }
                @if (targetForm.get('alias')?.hasError('minlength')) {
                  <mat-error>Minimum 2 characters required</mat-error>
                }
              </mat-form-field>

              <!-- Full Name -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Full Legal Name / Known Identity</mat-label>
                <input matInput formControlName="fullName" placeholder="e.g. Rahul Sharma" />
                <mat-icon matPrefix>person</mat-icon>
                @if (targetForm.get('fullName')?.hasError('required') && targetForm.get('fullName')?.touched) {
                  <mat-error>Full name is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-row three-cols">
              <!-- Category -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Threat Category</mat-label>
                <mat-select formControlName="category">
                  @for (cat of categories; track cat) {
                    <mat-option [value]="cat">{{ cat }}</mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>category</mat-icon>
                @if (targetForm.get('category')?.hasError('required')) {
                  <mat-error>Category is required</mat-error>
                }
              </mat-form-field>

              <!-- Threat Level -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Threat Level</mat-label>
                <mat-select formControlName="threatLevel">
                  @for (tl of threatLevels; track tl) {
                    <mat-option [value]="tl">
                      <span [class]="'threat-pill ' + tl.toLowerCase()">{{ tl }}</span>
                    </mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>warning</mat-icon>
                @if (targetForm.get('threatLevel')?.hasError('required')) {
                  <mat-error>Threat level is required</mat-error>
                }
              </mat-form-field>

              <!-- Operational Status -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Surveillance Status</mat-label>
                <mat-select formControlName="status">
                  @for (st of statuses; track st) {
                    <mat-option [value]="st">{{ st }}</mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>radar</mat-icon>
                @if (targetForm.get('status')?.hasError('required')) {
                  <mat-error>Status is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-row two-cols">
              <!-- Syndicate / Organization -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Syndicate / Organization</mat-label>
                <input matInput formControlName="organization" placeholder="e.g. Eastern Syndicate, Cyber Cartel" />
                <mat-icon matPrefix>groups</mat-icon>
              </mat-form-field>

              <!-- Tags -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Intelligence Tags (comma-separated)</mat-label>
                <input matInput formControlName="tags" placeholder="e.g. narco, arms, red-notice, hawala" />
                <mat-icon matPrefix>tag</mat-icon>
              </mat-form-field>
            </div>

            <!-- Known Associates & Network -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>Known Associates & Network Subjects</mat-label>
                <mat-select formControlName="knownAssociates" multiple>
                  @for (tgt of allOtherTargets(); track tgt.id) {
                    <mat-option [value]="tgt.id">
                      <span class="font-mono font-bold">{{ tgt.alias }}</span>
                      <span> ({{ tgt.fullName }} - {{ tgt.id }})</span>
                    </mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>hub</mat-icon>
                <mat-hint>Select confirmed contacts or syndicate associates</mat-hint>
              </mat-form-field>
            </div>
          </div>

          <!-- Section 2: Initial Surveillance Telemetry (Only for New Targets) -->
          @if (!isEditMode) {
            <div class="form-section">
              <div class="section-badge font-mono">
                <mat-icon>satellite_alt</mat-icon> INITIAL SURVEILLANCE SIGHTING
              </div>

              <div class="form-row two-cols">
                <!-- City -->
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Sighting City</mat-label>
                  <input matInput formControlName="city" placeholder="e.g. Mumbai, Delhi, Bengaluru" />
                  <mat-icon matPrefix>location_city</mat-icon>
                  @if (targetForm.get('city')?.hasError('required') && targetForm.get('city')?.touched) {
                    <mat-error>City is required</mat-error>
                  }
                </mat-form-field>

                <!-- State -->
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>State / Region</mat-label>
                  <input matInput formControlName="state" placeholder="e.g. Maharashtra, Karnataka" />
                  <mat-icon matPrefix>map</mat-icon>
                  @if (targetForm.get('state')?.hasError('required') && targetForm.get('state')?.touched) {
                    <mat-error>State is required</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row three-cols">
                <!-- Latitude -->
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Latitude (-90 to 90)</mat-label>
                  <input matInput type="number" step="0.0001" formControlName="lat" placeholder="19.0760" />
                  <mat-icon matPrefix>explore</mat-icon>
                  @if (targetForm.get('lat')?.invalid && targetForm.get('lat')?.touched) {
                    <mat-error>Valid latitude (-90 to 90) required</mat-error>
                  }
                </mat-form-field>

                <!-- Longitude -->
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Longitude (-180 to 180)</mat-label>
                  <input matInput type="number" step="0.0001" formControlName="lng" placeholder="72.8777" />
                  <mat-icon matPrefix>explore</mat-icon>
                  @if (targetForm.get('lng')?.invalid && targetForm.get('lng')?.touched) {
                    <mat-error>Valid longitude (-180 to 180) required</mat-error>
                  }
                </mat-form-field>

                <!-- Source -->
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Intel Source</mat-label>
                  <mat-select formControlName="source">
                    @for (src of dataSources; track src) {
                      <mat-option [value]="src">{{ src }}</mat-option>
                    }
                  </mat-select>
                  <mat-icon matPrefix>sensors</mat-icon>
                </mat-form-field>
              </div>

              <div class="form-row two-cols">
                <!-- Activity -->
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Observed Activity</mat-label>
                  <input
                    matInput
                    formControlName="activity"
                    placeholder="e.g. Meeting at safehouse, airport departure"
                  />
                  <mat-icon matPrefix>visibility</mat-icon>
                </mat-form-field>

                <!-- Confidence -->
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Intel Confidence (0-100%)</mat-label>
                  <input matInput type="number" min="0" max="100" formControlName="confidence" placeholder="85" />
                  <mat-icon matPrefix>verified</mat-icon>
                </mat-form-field>
              </div>
            </div>
          }

          <!-- Section 3: Classified Case Notes -->
          <div class="form-section">
            <div class="section-badge font-mono">
              <mat-icon>description</mat-icon> INTELLIGENCE SUMMARY & NOTES
            </div>

            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>{{ isEditMode ? 'Add Dossier Note / Update Log' : 'Initial Classified Dossier Notes' }}</mat-label>
              <textarea
                matInput
                rows="3"
                formControlName="notes"
                placeholder="Enter operational intelligence remarks, surveillance priorities, or case history..."
              ></textarea>
              <mat-icon matPrefix>history_edu</mat-icon>
            </mat-form-field>
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
          form="targetForm"
          class="submit-btn font-mono"
          [disabled]="targetForm.invalid || isSubmitting() || (!isEditMode && !isAdmin)"
        >
          @if (isSubmitting()) {
            <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
            <span>SAVING...</span>
          } @else {
            <span class="btn-content-wrap">
              <mat-icon class="btn-icon">{{ isEditMode ? 'save' : 'how_to_reg' }}</mat-icon>
              <span class="btn-text">{{ isEditMode ? 'UPDATE DOSSIER' : 'REGISTER TARGET' }}</span>
            </span>
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-shell {
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
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-surface, #ffffff);
    }

    .header-icon-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-avatar {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      background: rgba(2, 132, 199, 0.12);
      color: #0284c7;
      border: 1px solid rgba(2, 132, 199, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-avatar.edit-mode {
      background: rgba(139, 92, 246, 0.15);
      color: #8b5cf6;
      border-color: rgba(139, 92, 246, 0.4);
    }

    .dialog-title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--text-primary, #0f172a);
    }

    .dialog-subtitle {
      margin: 2px 0 0;
      font-size: 0.78rem;
      color: var(--text-secondary, #64748b);
    }

    .close-btn {
      color: var(--text-secondary, #64748b);
    }

    .unauthorized-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: rgba(239, 68, 68, 0.15);
      border-left: 4px solid #ef4444;
      font-size: 0.85rem;
      color: #dc2626;
    }

    .dialog-content {
      padding: 20px;
      overflow-y: auto;
      max-height: calc(85vh - 130px);
      background: var(--bg-surface, #ffffff);
      color: var(--text-primary, #0f172a);
    }

    .tactical-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-section {
      background: var(--bg-app, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .section-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-primary, #0f172a);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      padding-bottom: 8px;
    }

    .section-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #0284c7;
    }

    .form-row {
      display: grid;
      gap: 14px;
      width: 100%;
    }

    .form-row.two-cols {
      grid-template-columns: repeat(2, 1fr);
    }

    .form-row.three-cols {
      grid-template-columns: repeat(3, 1fr);
    }

    .form-field {
      width: 100%;
    }

    .full-width {
      width: 100%;
    }

    .threat-pill {
      font-weight: 700;
      font-size: 0.78rem;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .threat-pill.critical { color: #ef4444; }
    .threat-pill.high { color: #f97316; }
    .threat-pill.medium { color: #eab308; }
    .threat-pill.low { color: #22c55e; }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 14px 20px;
      border-top: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-surface, #ffffff);
    }

    .submit-btn {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 170px;
      height: 40px !important;

      ::ng-deep .mdc-button__label {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        line-height: 1 !important;
      }

      .btn-content-wrap {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        line-height: 1 !important;
      }

      .btn-icon,
      mat-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
        line-height: 20px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 !important;
        vertical-align: middle !important;
      }

      .btn-text {
        display: inline-flex !important;
        align-items: center !important;
        line-height: 1 !important;
        letter-spacing: 0.04em;
      }
    }

    .btn-spinner {
      margin-right: 4px;
    }

    /* Responsive adjustments */
    @media (max-width: 680px) {
      .form-row.two-cols,
      .form-row.three-cols {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .dialog-content {
        padding: 12px;
      }

      .form-section {
        padding: 12px;
      }

      .dialog-header {
        padding: 12px 14px;
      }

      .dialog-actions {
        padding: 12px 14px;
        flex-direction: column-reverse;
      }

      .dialog-actions button {
        width: 100%;
      }
    }
  `],
})
export class TargetFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TargetFormDialogComponent>);
  readonly data = inject<TargetFormDialogData>(MAT_DIALOG_DATA);
  private readonly authService = inject(AuthService);
  private readonly targetService = inject(TargetService);

  readonly isSubmitting = signal<boolean>(false);

  readonly isEditMode = this.data.mode === 'edit';
  readonly isAdmin = this.authService.isAdmin();

  readonly allOtherTargets = computed(() =>
    this.targetService.targets().filter(t => t.id !== this.data.target?.id)
  );

  readonly categories: TargetCategory[] = [
    'Terror Org',
    'Organized Crime',
    'Fugitive',
    'Smuggler',
    'Cyber Crime',
  ];

  readonly threatLevels: ThreatLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  readonly statuses: TargetStatus[] = [
    'Active',
    'Under Surveillance',
    'Captured',
    'Lost Contact',
  ];

  readonly dataSources: DataSource[] = [
    'CCTV',
    'Informant',
    'Toll',
    'Phone Tower',
    'Hotel Record',
  ];

  targetForm!: FormGroup;

  ngOnInit(): void {
    const existing = this.data.target;

    this.targetForm = this.fb.group({
      alias: [
        existing?.alias ?? '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(30)],
      ],
      fullName: [
        existing?.fullName ?? '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
      ],
      category: [existing?.category ?? 'Organized Crime', [Validators.required]],
      threatLevel: [existing?.threatLevel ?? 'MEDIUM', [Validators.required]],
      status: [existing?.status ?? 'Active', [Validators.required]],
      organization: [existing?.organization ?? '', [Validators.maxLength(100)]],
      tags: [(existing?.tags ?? []).join(', ')],
      knownAssociates: [existing?.knownAssociates ?? []],
      notes: [existing?.notes?.[0] ?? ''],
      // Sighting telemetry (create mode)
      city: [
        existing?.history?.[0]?.city ?? 'Mumbai',
        this.isEditMode ? [] : [Validators.required],
      ],
      state: [
        existing?.history?.[0]?.state ?? 'Maharashtra',
        this.isEditMode ? [] : [Validators.required],
      ],
      lat: [
        existing?.history?.[0]?.lat ?? 19.076,
        this.isEditMode
          ? []
          : [Validators.required, Validators.min(-90), Validators.max(90)],
      ],
      lng: [
        existing?.history?.[0]?.lng ?? 72.8777,
        this.isEditMode
          ? []
          : [Validators.required, Validators.min(-180), Validators.max(180)],
      ],
      source: [existing?.history?.[0]?.source ?? 'Informant'],
      activity: [
        existing?.history?.[0]?.activity ??
          'Subject identified during active surveillance sweep',
      ],
      confidence: [
        existing?.history?.[0]?.confidence ?? 80,
        [Validators.min(0), Validators.max(100)],
      ],
    });
  }

  onSubmit(): void {
    if (this.targetForm.invalid) {
      this.targetForm.markAllAsTouched();
      return;
    }

    if (!this.isEditMode && !this.isAdmin) {
      return;
    }

    this.isSubmitting.set(true);

    const val = this.targetForm.value;
    const rawTags = (val.tags as string) || '';
    const parsedTags = rawTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const resultPayload: Partial<Target> = {
      alias: val.alias.trim().toUpperCase(),
      fullName: val.fullName.trim(),
      category: val.category,
      threatLevel: val.threatLevel,
      status: val.status,
      organization: val.organization?.trim() || 'Independent',
      tags: parsedTags,
      knownAssociates: val.knownAssociates || [],
    };

    if (val.notes && val.notes.trim()) {
      const noteText = val.notes.trim();
      if (this.isEditMode && this.data.target) {
        // preserve existing notes + append new note if not duplicate
        const existingNotes = this.data.target.notes || [];
        resultPayload.notes = existingNotes.includes(noteText)
          ? existingNotes
          : [noteText, ...existingNotes];
      } else {
        resultPayload.notes = [noteText];
      }
    }

    if (!this.isEditMode) {
      resultPayload.history = [
        {
          city: val.city?.trim() || 'Mumbai',
          state: val.state?.trim() || 'Maharashtra',
          lat: Number(val.lat) || 19.076,
          lng: Number(val.lng) || 72.8777,
          activity: val.activity?.trim() || 'Initial registration',
          source: (val.source as DataSource) || 'Informant',
          confidence: Number(val.confidence) || 80,
          timestamp: new Date().toISOString(),
        },
      ];
    }

    this.dialogRef.close(resultPayload);
  }
}
