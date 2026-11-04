import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import * as L from 'leaflet';

import { Target, TargetStatus, LocationPoint } from '../../../core/models/target.model';
import { TargetService } from '../../../core/services/target.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuditService } from '../../../core/services/audit.service';
import { ThreatChipComponent } from '../../../shared/components/threat-chip/threat-chip.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import {
  TargetFormDialogComponent,
  TargetFormDialogData,
} from '../form-dialog/target-form-dialog.component';
import {
  LocationDialogComponent,
  LocationDialogData,
} from '../location-dialog/location-dialog.component';
import {
  AssociateDialogComponent,
  AssociateDialogData,
  AssociateResult,
} from '../associate-dialog/associate-dialog.component';

@Component({
  selector: 'app-target-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ThreatChipComponent,
    StatusBadgeComponent,
    AvatarComponent,
    TimeAgoPipe,
  ],
  templateUrl: './target-detail.component.html',
  styleUrl: './target-detail.component.scss',
})
export class TargetDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly targetService = inject(TargetService);
  private readonly authService = inject(AuthService);
  private readonly auditService = inject(AuditService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('miniMapContainer') miniMapRef?: ElementRef<HTMLDivElement>;

  readonly target = signal<Target | null>(null);
  readonly loading = signal<boolean>(true);
  readonly isAddingNote = signal<boolean>(false);

  readonly newNoteControl = new FormControl('', [
    Validators.required,
    Validators.minLength(2),
  ]);

  readonly statuses: TargetStatus[] = [
    'Active',
    'Under Surveillance',
    'Captured',
    'Lost Contact',
  ];

  private readonly destroy$ = new Subject<void>();
  private miniMap?: L.Map;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.loadTarget(id);
        } else {
          this.loading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupMap();
  }

  loadTarget(id: string): void {
    this.loading.set(true);
    this.targetService
      .getTarget(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tgt => {
          this.target.set(tgt ?? null);
          this.loading.set(false);

          if (tgt) {
            const user = this.authService.currentUser();
            if (user) {
              this.auditService.record(
                'TARGET_VIEW',
                user,
                `Viewed full intelligence dossier for ${tgt.alias}`,
                tgt.id,
                tgt.alias
              );
            }
            // Initialize mini map after DOM updates
            setTimeout(() => this.initMiniMap(tgt), 100);
          }
        },
        error: () => {
          this.target.set(null);
          this.loading.set(false);
        },
      });
  }

  private initMiniMap(tgt: Target): void {
    this.cleanupMap();
    if (!this.miniMapRef?.nativeElement) return;

    const el = this.miniMapRef.nativeElement;
    const history = tgt.history || [];

    const defaultLat = history[0]?.lat ?? 19.076;
    const defaultLng = history[0]?.lng ?? 72.8777;

    this.miniMap = L.map(el, {
      center: [defaultLat, defaultLng],
      zoom: 6,
      attributionControl: false,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(this.miniMap);

    if (history.length > 0) {
      const latLngs: L.LatLngExpression[] = [];

      history.forEach((pt, idx) => {
        const isLatest = idx === 0;
        const color = isLatest ? '#ef4444' : '#06b6d4';
        const marker = L.circleMarker([pt.lat, pt.lng], {
          radius: isLatest ? 8 : 5,
          color: color,
          fillColor: color,
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(this.miniMap!);

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 12px; color: #0f172a;">
            <strong>${pt.city}, ${pt.state}</strong><br/>
            <span>Source: ${pt.source}</span><br/>
            <span>Activity: ${pt.activity}</span>
          </div>
        `);

        latLngs.push([pt.lat, pt.lng]);
      });

      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: '#38bdf8',
          weight: 2,
          dashArray: '4, 4',
          opacity: 0.8,
        }).addTo(this.miniMap);
      }

      const bounds = L.latLngBounds(latLngs);
      this.miniMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
    }

    setTimeout(() => {
      this.miniMap?.invalidateSize();
    }, 200);
  }

  private cleanupMap(): void {
    if (this.miniMap) {
      this.miniMap.remove();
      this.miniMap = undefined;
    }
  }

  lastLocation(target: Target): string {
    if (target.history.length === 0) return 'Unknown';
    const latest = target.history[0];
    return `${latest.city}, ${latest.state}`;
  }

  goBack(): void {
    this.router.navigate(['/targets']);
  }

  trackOnMap(target: Target): void {
    this.router.navigate(['/map'], { queryParams: { targetId: target.id } });
  }

  navigateToAssociate(assocId: string): void {
    this.router.navigate(['/targets', assocId]);
  }

  getTargetById(assocId: string): Target | undefined {
    return this.targetService.targets().find(t => t.id === assocId);
  }

  onStatusChange(target: Target, newStatus: TargetStatus): void {
    if (target.status === newStatus) return;

    this.targetService
      .updateStatus(target.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updated => {
          this.target.set(updated);
          const user = this.authService.currentUser();
          if (user) {
            this.auditService.record(
              'TARGET_STATUS_CHANGE',
              user,
              `Changed status of ${target.alias} to ${newStatus}`,
              target.id,
              target.alias
            );
          }
          this.snackBar.open(
            `Target ${target.alias} status updated to "${newStatus}"`,
            'Dismiss',
            { duration: 3000 }
          );
        },
        error: () => {
          this.snackBar.open('Failed to update status', 'Dismiss', {
            duration: 3000,
          });
        },
      });
  }

  addCaseNote(target: Target): void {
    const text = this.newNoteControl.value?.trim();
    if (!text) return;

    this.isAddingNote.set(true);
    const user = this.authService.currentUser();
    const authorName = user?.displayName || user?.username || 'Command Officer';

    this.targetService
      .addNote(target.id, text, authorName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Re-fetch updated target
          this.targetService.getTarget(target.id).subscribe(updated => {
            if (updated) this.target.set(updated);
          });
          if (user) {
            this.auditService.record(
              'NOTE_ADD',
              user,
              `Added intelligence case note for ${target.alias}`,
              target.id,
              target.alias
            );
          }
          this.newNoteControl.reset();
          this.isAddingNote.set(false);
          this.snackBar.open('Intelligence note appended to dossier', 'Dismiss', {
            duration: 3000,
          });
        },
        error: () => {
          this.isAddingNote.set(false);
          this.snackBar.open('Failed to append case note', 'Dismiss', {
            duration: 3000,
          });
        },
      });
  }

  openEditDialog(target: Target): void {
    const dialogRef = this.dialog.open<
      TargetFormDialogComponent,
      TargetFormDialogData,
      Partial<Target>
    >(TargetFormDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      panelClass: 'tactical-dialog-panel',
      data: {
        mode: 'edit',
        target,
      },
    });

    dialogRef.afterClosed().subscribe(updates => {
      if (!updates) return;

      this.targetService
        .updateTarget(target.id, updates)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: updated => {
            this.target.set(updated);
            const user = this.authService.currentUser();
            if (user) {
              this.auditService.record(
                'TARGET_UPDATE',
                user,
                `Updated target dossier details for ${updated.alias}`,
                updated.id,
                updated.alias
              );
            }
            this.snackBar.open(
              `Target dossier for ${updated.alias} successfully updated`,
              'Dismiss',
              { duration: 3500 }
            );
            // Refresh mini-map with updated target
            setTimeout(() => this.initMiniMap(updated), 100);
          },
          error: () => {
            this.snackBar.open('Failed to update target dossier', 'Dismiss', {
              duration: 3000,
            });
          },
        });
    });
  }

  /**
   * Open dialog to log a new verified sighting location point for this target.
   */
  openAddLocationDialog(target: Target): void {
    const dialogRef = this.dialog.open<
      LocationDialogComponent,
      LocationDialogData,
      LocationPoint
    >(LocationDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      panelClass: 'tactical-dialog-panel',
      data: {
        target,
      },
    });

    dialogRef.afterClosed().subscribe(newPoint => {
      if (!newPoint) return;

      this.targetService
        .addLocationPoint(target.id, newPoint)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: updated => {
            this.target.set(updated);
            const user = this.authService.currentUser();
            if (user) {
              this.auditService.record(
                'TARGET_LOCATION_UPDATE',
                user,
                `Logged new surveillance sighting in ${newPoint.city}, ${newPoint.state} (${newPoint.activity})`,
                updated.id,
                updated.alias
              );
            }
            this.snackBar.open(
              `New location logged for ${updated.alias}: ${newPoint.city}, ${newPoint.state}`,
              'Dismiss',
              { duration: 4000 }
            );
            // Refresh mini-map with updated track
            setTimeout(() => this.initMiniMap(updated), 100);
          },
          error: () => {
            this.snackBar.open('Failed to log new sighting location.', 'Dismiss', {
              duration: 3000,
            });
          },
        });
    });
  }

  /**
   * Open dialog to link a new associate to this target's network.
   */
  openAddAssociateDialog(target: Target): void {
    const dialogRef = this.dialog.open<
      AssociateDialogComponent,
      AssociateDialogData,
      AssociateResult
    >(AssociateDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      panelClass: 'tactical-dialog-panel',
      data: {
        target,
      },
    });

    dialogRef.afterClosed().subscribe(res => {
      if (!res) return;

      this.targetService
        .addAssociate(target.id, res.associateId, res.bidirectional, res.notes)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: updated => {
            this.target.set(updated);
            const user = this.authService.currentUser();
            if (user) {
              this.auditService.record(
                'ASSOCIATE_ADD',
                user,
                `Linked associate ${res.associateId} to ${updated.alias} (${res.relationship})`,
                updated.id,
                updated.alias
              );
            }
            this.snackBar.open(
              `Associate ${res.associateId} successfully linked to ${updated.alias}`,
              'Dismiss',
              { duration: 3500 }
            );
          },
          error: () => {
            this.snackBar.open('Failed to link associate', 'Dismiss', {
              duration: 3000,
            });
          },
        });
    });
  }

  /**
   * Remove an associate link from this target's network.
   */
  removeAssociate(target: Target, assocId: string, event: Event): void {
    event.stopPropagation();

    this.targetService
      .removeAssociate(target.id, assocId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updated => {
          this.target.set(updated);
          const user = this.authService.currentUser();
          if (user) {
            this.auditService.record(
              'ASSOCIATE_REMOVE',
              user,
              `Unlinked associate ${assocId} from ${updated.alias}`,
              updated.id,
              updated.alias
            );
          }
          this.snackBar.open(
            `Associate ${assocId} unlinked from ${updated.alias}`,
            'Dismiss',
            { duration: 3000 }
          );
        },
        error: () => {
          this.snackBar.open('Failed to unlink associate', 'Dismiss', {
            duration: 3000,
          });
        },
      });
  }
}
