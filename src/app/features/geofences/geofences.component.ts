import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';

import { GeofenceZone, GeofenceShape } from '../../core/models/geofence.model';
import { GeofenceService } from '../../core/services/geofence.service';
import { TargetService } from '../../core/services/target.service';
import { AuthService } from '../../core/services/auth.service';
import { AuditService } from '../../core/services/audit.service';
import { Target } from '../../core/models/target.model';
import { pointInPolygon, pointInCircle } from '../../shared/utils/geo.utils';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-geofences',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  template: `
    <div class="geofence-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Geofence Surveillance Zones</h1>
          <p class="page-subtitle">Configure spatial tripwires, perimeter exclusions, and tactical watch corridors</p>
        </div>
        @if (authService.isAdmin()) {
          <button mat-flat-button color="primary" class="create-zone-btn" (click)="openAddModal()">
            <mat-icon>add_location_alt</mat-icon> Create Geofence Zone
          </button>
        }
      </header>

      <!-- Zones Table / Cards -->
      <mat-card class="table-card">
        @if (zones().length === 0) {
          <div class="empty-state">No geofence perimeters deployed.</div>
        } @else {
          <!-- Desktop Table View -->
          @if (!isMobile()) {
            <div class="table-scroll">
              <table mat-table [dataSource]="zones()" class="w-full">
                <!-- Color & Name Column -->
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Zone Identifier</th>
                  <td mat-cell *matCellDef="let z">
                    <div class="zone-name-cell">
                      <span class="color-swatch" [style.background-color]="z.color"></span>
                      <div>
                        <div class="zone-name">{{ z.name }}</div>
                        <div class="zone-desc">{{ z.description || 'Surveillance zone' }}</div>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Geometry / Shape Column -->
                <ng-container matColumnDef="shape">
                  <th mat-header-cell *matHeaderCellDef>Geometry</th>
                  <td mat-cell *matCellDef="let z">
                    <span class="shape-badge">
                      <mat-icon>{{ z.shape === 'circle' ? 'radio_button_checked' : 'polyline' }}</mat-icon>
                      {{ z.shape | uppercase }}
                    </span>
                    @if (z.shape === 'circle' && z.radius) {
                      <span class="dim-info">{{ (z.radius / 1000) | number:'1.1-1' }} km radius</span>
                    }
                  </td>
                </ng-container>

                <!-- Violations Column -->
                <ng-container matColumnDef="violations">
                  <th mat-header-cell *matHeaderCellDef>Breaches Detected</th>
                  <td mat-cell *matCellDef="let z">
                    @if (getViolationCount(z) > 0) {
                      <span class="breach-pill warn">
                        <mat-icon>warning</mat-icon> {{ getViolationCount(z) }} Breaches
                      </span>
                    } @else {
                      <span class="breach-pill safe">
                        <mat-icon>shield</mat-icon> 0 Breaches
                      </span>
                    }
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Active Status</th>
                  <td mat-cell *matCellDef="let z">
                    <mat-slide-toggle
                      [checked]="z.active"
                      [disabled]="!authService.isAdmin()"
                      (change)="toggleZone(z)"
                      color="primary"
                    >
                      {{ z.active ? 'Armed' : 'Disarmed' }}
                    </mat-slide-toggle>
                  </td>
                </ng-container>

                <!-- Created Column -->
                <ng-container matColumnDef="created">
                  <th mat-header-cell *matHeaderCellDef>Created</th>
                  <td mat-cell *matCellDef="let z">
                    {{ z.createdAt | date:'mediumDate' }}
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let z">
                    @if (authService.isAdmin()) {
                      <button mat-icon-button color="warn" (click)="deleteZone(z)" matTooltip="Delete zone">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns"></tr>
              </table>
            </div>
          }

          <!-- Mobile Card View -->
          @if (isMobile()) {
            <div class="mobile-geofence-cards">
              @for (z of zones(); track z.id) {
                <div class="geofence-card" [style.border-left-color]="z.color">
                  <div class="geofence-card-header">
                    <div class="zone-name-cell">
                      <span class="color-swatch" [style.background-color]="z.color"></span>
                      <div>
                        <div class="zone-name">{{ z.name }}</div>
                        <div class="zone-desc">{{ z.description || 'Surveillance zone' }}</div>
                      </div>
                    </div>
                    @if (authService.isAdmin()) {
                      <button mat-icon-button color="warn" class="delete-btn" (click)="deleteZone(z)" matTooltip="Delete zone">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </div>

                  <div class="geofence-card-meta">
                    <span class="shape-badge">
                      <mat-icon>{{ z.shape === 'circle' ? 'radio_button_checked' : 'polyline' }}</mat-icon>
                      {{ z.shape | uppercase }}
                      @if (z.shape === 'circle' && z.radius) {
                        <span>({{ (z.radius / 1000) | number:'1.1-1' }} km)</span>
                      }
                    </span>

                    @if (getViolationCount(z) > 0) {
                      <span class="breach-pill warn">
                        <mat-icon>warning</mat-icon> {{ getViolationCount(z) }} Breaches
                      </span>
                    } @else {
                      <span class="breach-pill safe">
                        <mat-icon>shield</mat-icon> 0 Breaches
                      </span>
                    }
                  </div>

                  <div class="geofence-card-footer">
                    <span class="created-date">Created: {{ z.createdAt | date:'mediumDate' }}</span>
                    <mat-slide-toggle
                      [checked]="z.active"
                      [disabled]="!authService.isAdmin()"
                      (change)="toggleZone(z)"
                      color="primary"
                    >
                      {{ z.active ? 'Armed' : 'Disarmed' }}
                    </mat-slide-toggle>
                  </div>
                </div>
              }
            </div>
          }
        }
      </mat-card>

      <!-- Zone Creation Form Modal (Inline when open) -->
      @if (showAddForm()) {
        <mat-card class="create-zone-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">add_circle</mat-icon>
            <mat-card-title>Define Tactical Perimeter</mat-card-title>
          </mat-card-header>
          <mat-card-content class="form-content">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Zone Name</mat-label>
              <input matInput [(ngModel)]="formName" placeholder="e.g. Pune Central Depot Watch" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Description / Threat Brief</mat-label>
              <input matInput [(ngModel)]="formDesc" placeholder="Security sensitivity reasons..." />
            </mat-form-field>

            <div class="row-fields">
              <mat-form-field appearance="outline">
                <mat-label>Geometry Type</mat-label>
                <mat-select [(ngModel)]="formShape">
                  <mat-option value="circle">Radial Circle Buffer</mat-option>
                  <mat-option value="polygon">Custom Polygon Area</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Perimeter Color</mat-label>
                <mat-select [(ngModel)]="formColor">
                  <mat-option value="#ef4444">Red (High Alert)</mat-option>
                  <mat-option value="#f59e0b">Amber (Surveillance)</mat-option>
                  <mat-option value="#3b82f6">Blue (Maritime / Port)</mat-option>
                  <mat-option value="#8b5cf6">Purple (Border Buffer)</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Latitude</mat-label>
                <input matInput type="number" [(ngModel)]="formLat" placeholder="18.5204" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Longitude</mat-label>
                <input matInput type="number" [(ngModel)]="formLng" placeholder="73.8567" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Radius (meters)</mat-label>
                <input matInput type="number" [(ngModel)]="formRadius" placeholder="5000" />
              </mat-form-field>
            </div>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="showAddForm.set(false)">Cancel</button>
            <button mat-flat-button color="primary" [disabled]="!formName.trim()" (click)="saveZone()">
              Deploy Zone
            </button>
          </mat-card-actions>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .geofence-page {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 4px;
    }
    .page-subtitle {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin: 0;
    }
    .table-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }
    .w-full {
      width: 100%;
    }
    .zone-name-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
    }
    .color-swatch {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .zone-name {
      font-weight: 700;
      font-size: 0.92rem;
      color: var(--text-primary);
    }
    .zone-desc {
      font-size: 0.78rem;
      color: #94a3b8;
    }
    .shape-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 4px;
      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
    .dim-info {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-left: 6px;
    }
    .breach-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
    .breach-pill.warn {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
    .breach-pill.safe {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }
    .create-zone-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
    }
    .form-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 12px;
    }
    .row-fields {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    @media (max-width: 768px) {
      .geofence-page {
        padding: 12px 10px;
        gap: 12px;
      }
      .page-header {
        flex-direction: column;
        align-items: stretch !important;
        gap: 12px;
      }
      .create-zone-btn {
        width: 100% !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
      }
      .page-title {
        font-size: 1.35rem;
      }
      .row-fields {
        flex-direction: column;
        gap: 8px;
      }
      .table-card {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        overflow-x: visible;
      }
      .mobile-geofence-cards {
        padding: 0 !important;
        gap: 10px;
      }
      .geofence-card {
        padding: 12px;
      }
      table {
        min-width: 600px;
      }
    }
    .empty-state {
      padding: 32px;
      text-align: center;
      color: #94a3b8;
    }
    .table-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    /* Mobile Geofence Cards */
    .mobile-geofence-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
    }
    .geofence-card {
      background: var(--bg-app);
      border: 1px solid var(--border-color);
      border-left: 4px solid #38bdf8;
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .geofence-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .delete-btn {
      margin-top: -6px;
      margin-right: -6px;
    }
    .geofence-card-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .geofence-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      flex-wrap: wrap;
      gap: 8px;
    }
    .created-date {
      font-size: 0.75rem;
      color: #94a3b8;
    }
  `],
})
export class GeofencesComponent implements OnInit, OnDestroy {
  private readonly geofenceService = inject(GeofenceService);
  private readonly targetService = inject(TargetService);
  readonly authService = inject(AuthService);
  private readonly auditService = inject(AuditService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroy$ = new Subject<void>();

  readonly zones = this.geofenceService.zones;
  readonly isMobile = signal<boolean>(false);
  readonly targets = signal<Target[]>([]);
  readonly columns = ['name', 'shape', 'violations', 'status', 'created', 'actions'];

  readonly showAddForm = signal<boolean>(false);

  // Form states
  formName = '';
  formDesc = '';
  formShape: GeofenceShape = 'circle';
  formColor = '#ef4444';
  formLat = 18.5204;
  formLng = 73.8567;
  formRadius = 5000;

  ngOnInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });

    this.targetService.getTargets().subscribe(list => {
      this.targets.set(list);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getViolationCount(zone: GeofenceZone): number {
    let count = 0;
    this.targets().forEach(tgt => {
      tgt.history.forEach(pt => {
        if (zone.shape === 'polygon' && zone.coordinates) {
          if (pointInPolygon(pt.lat, pt.lng, zone.coordinates)) count++;
        } else if (zone.shape === 'circle' && zone.center && zone.radius) {
          if (pointInCircle(pt.lat, pt.lng, zone.center[0], zone.center[1], zone.radius / 1000)) count++;
        }
      });
    });
    return count;
  }

  toggleZone(zone: GeofenceZone): void {
    const user = this.authService.currentUser();
    this.geofenceService.updateZone(zone.id, { active: !zone.active });
    if (user) {
      this.auditService.record(
        'GEOFENCE_EDIT',
        user,
        `Toggled zone "${zone.name}" to ${!zone.active ? 'Armed' : 'Disarmed'}`
      );
    }
    this.snackBar.open(`Zone "${zone.name}" ${!zone.active ? 'armed' : 'disarmed'}`, 'Close', { duration: 2500 });
  }

  openAddModal(): void {
    this.showAddForm.set(true);
  }

  saveZone(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.geofenceService.addZone({
      name: this.formName.trim(),
      description: this.formDesc.trim(),
      shape: this.formShape,
      color: this.formColor,
      center: [this.formLat, this.formLng],
      radius: this.formRadius,
      active: true,
      createdBy: user.displayName,
    });

    this.auditService.record(
      'GEOFENCE_CREATE',
      user,
      `Deployed new perimeter zone "${this.formName.trim()}"`
    );

    this.snackBar.open(`Geofence zone "${this.formName}" armed`, 'Close', { duration: 3000 });
    this.showAddForm.set(false);
    this.formName = '';
    this.formDesc = '';
  }

  deleteZone(zone: GeofenceZone): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Geofence Perimeter',
        message: `Are you sure you want to dismantle geofence "${zone.name}"? This action is logged.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      const user = this.authService.currentUser();
      this.geofenceService.deleteZone(zone.id);

      if (user) {
        this.auditService.record(
          'GEOFENCE_DELETE',
          user,
          `Dismantled geofence perimeter "${zone.name}"`
        );
      }
      this.snackBar.open(`Perimeter "${zone.name}" removed`, 'Close', { duration: 3000 });
    });
  }
}

