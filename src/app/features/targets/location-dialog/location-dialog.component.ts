import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
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
  LocationPoint,
  DataSource,
} from '../../../core/models/target.model';

export interface LocationDialogData {
  target: Target;
}

@Component({
  selector: 'app-location-dialog',
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
          <div class="icon-avatar">
            <mat-icon>add_location_alt</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title font-mono">
              LOG NEXT LOCATION SIGHTING
            </h2>
            <p class="dialog-subtitle">
              Record verified surveillance telemetry for subject
              <strong class="target-name font-mono">{{ data.target.alias }}</strong> ({{ data.target.fullName }})
            </p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn" [disabled]="isSubmitting()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Current Location Quick Reference -->
      @if (latestLocation) {
        <div class="current-loc-bar">
          <mat-icon class="loc-pin-icon">place</mat-icon>
          <span>Last Known Position: <strong>{{ latestLocation.city }}, {{ latestLocation.state }}</strong> ({{ latestLocation.activity }})</span>
        </div>
      }

      <!-- Form Content -->
      <mat-dialog-content class="dialog-content">
        <form [formGroup]="locationForm" (ngSubmit)="onSubmit()" id="locationForm" class="tactical-form">
          <div class="form-section">
            <div class="section-badge font-mono">
              <mat-icon>pin_drop</mat-icon> NEW SIGHTING GEOGRAPHIC COORDINATES
            </div>

            <div class="form-row two-cols">
              <!-- City -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>City / Location Name</mat-label>
                <input matInput formControlName="city" placeholder="e.g. Pune, Delhi, Goa" />
                <mat-icon matPrefix>location_city</mat-icon>
                @if (locationForm.get('city')?.hasError('required') && locationForm.get('city')?.touched) {
                  <mat-error>City is required</mat-error>
                }
              </mat-form-field>

              <!-- State -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>State / Region</mat-label>
                <input matInput formControlName="state" placeholder="e.g. Maharashtra, Goa" />
                <mat-icon matPrefix>map</mat-icon>
                @if (locationForm.get('state')?.hasError('required') && locationForm.get('state')?.touched) {
                  <mat-error>State is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-row three-cols">
              <!-- Latitude -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Latitude (-90 to 90)</mat-label>
                <input matInput type="number" step="0.0001" formControlName="lat" placeholder="18.5204" />
                <mat-icon matPrefix>explore</mat-icon>
                @if (locationForm.get('lat')?.invalid && locationForm.get('lat')?.touched) {
                  <mat-error>Valid latitude required</mat-error>
                }
              </mat-form-field>

              <!-- Longitude -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Longitude (-180 to 180)</mat-label>
                <input matInput type="number" step="0.0001" formControlName="lng" placeholder="73.8567" />
                <mat-icon matPrefix>explore</mat-icon>
                @if (locationForm.get('lng')?.invalid && locationForm.get('lng')?.touched) {
                  <mat-error>Valid longitude required</mat-error>
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
          </div>

          <div class="form-section">
            <div class="section-badge font-mono">
              <mat-icon>visibility</mat-icon> SURVEILLANCE OBSERVATION & CONFIDENCE
            </div>

            <!-- Observed Activity -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Observed Activity / Surveillance Log</mat-label>
              <textarea
                matInput
                rows="2"
                formControlName="activity"
                placeholder="e.g. Subject sighted at expressway toll plaza travelling in dark SUV heading south"
              ></textarea>
              <mat-icon matPrefix>notes</mat-icon>
              @if (locationForm.get('activity')?.hasError('required') && locationForm.get('activity')?.touched) {
                <mat-error>Observation activity is required</mat-error>
              }
            </mat-form-field>

            <div class="form-row two-cols">
              <!-- Confidence -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Intel Confidence Score (1-100%)</mat-label>
                <input matInput type="number" min="1" max="100" formControlName="confidence" placeholder="85" />
                <mat-icon matPrefix>verified</mat-icon>
                @if (locationForm.get('confidence')?.invalid) {
                  <mat-error>Score between 1 and 100 required</mat-error>
                }
              </mat-form-field>

              <!-- Time -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Observation Timestamp (ISO)</mat-label>
                <input matInput formControlName="timestamp" placeholder="Current timestamp" />
                <mat-icon matPrefix>schedule</mat-icon>
              </mat-form-field>
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
          color="accent"
          type="submit"
          form="locationForm"
          class="submit-btn font-mono"
          [disabled]="locationForm.invalid || isSubmitting()"
        >
          @if (isSubmitting()) {
            <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
            <span>LOGGING...</span>
          } @else {
            <span class="btn-content-wrap">
              <mat-icon class="btn-icon">add_location_alt</mat-icon>
              <span class="btn-text">LOG NEXT LOCATION</span>
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
      background: rgba(234, 88, 12, 0.15);
      color: #ea580c;
      border: 1px solid rgba(234, 88, 12, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
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

    .target-name {
      color: #0284c7;
    }

    .close-btn {
      color: var(--text-secondary, #64748b);
    }

    .current-loc-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      background: rgba(2, 132, 199, 0.08);
      border-bottom: 1px solid rgba(2, 132, 199, 0.2);
      font-size: 0.8rem;
      color: var(--text-secondary, #475569);
    }

    .loc-pin-icon {
      color: #0284c7;
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .dialog-content {
      padding: 20px;
      overflow-y: auto;
      max-height: calc(85vh - 160px);
      background: var(--bg-surface, #ffffff);
      color: var(--text-primary, #0f172a);
    }

    .tactical-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
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
      color: #ea580c;
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
      min-width: 180px;
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
export class LocationDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<LocationDialogComponent>);
  readonly data = inject<LocationDialogData>(MAT_DIALOG_DATA);

  readonly isSubmitting = signal<boolean>(false);

  readonly dataSources: DataSource[] = [
    'CCTV',
    'Informant',
    'Toll',
    'Phone Tower',
    'Hotel Record',
  ];

  locationForm!: FormGroup;

  get latestLocation(): LocationPoint | undefined {
    return this.data.target.history?.[0];
  }

  ngOnInit(): void {
    const last = this.latestLocation;

    this.locationForm = this.fb.group({
      city: ['', [Validators.required, Validators.minLength(2)]],
      state: [last?.state ?? '', [Validators.required, Validators.minLength(2)]],
      lat: [
        last ? Number((last.lat + 0.05).toFixed(4)) : 19.076,
        [Validators.required, Validators.min(-90), Validators.max(90)],
      ],
      lng: [
        last ? Number((last.lng + 0.05).toFixed(4)) : 72.8777,
        [Validators.required, Validators.min(-180), Validators.max(180)],
      ],
      source: ['Informant' as DataSource, [Validators.required]],
      activity: ['', [Validators.required, Validators.minLength(3)]],
      confidence: [85, [Validators.required, Validators.min(1), Validators.max(100)]],
      timestamp: [new Date().toISOString()],
    });
  }

  onSubmit(): void {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const val = this.locationForm.value;
    const newPoint: LocationPoint = {
      city: val.city.trim(),
      state: val.state.trim(),
      lat: Number(val.lat),
      lng: Number(val.lng),
      source: val.source,
      activity: val.activity.trim(),
      confidence: Number(val.confidence) || 85,
      timestamp: val.timestamp || new Date().toISOString(),
    };

    this.dialogRef.close(newPoint);
  }
}

