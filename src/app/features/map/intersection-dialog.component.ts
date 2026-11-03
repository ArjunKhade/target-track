import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';

export interface IntersectionResult {
  target1Id: string;
  target1Alias: string;
  target2Id: string;
  target2Alias: string;
  city: string;
  lat: number;
  lng: number;
  time1: string;
  time2: string;
  timeDiffHours: number;
  distanceKm: number;
  activity1: string;
  activity2: string;
}

@Component({
  selector: 'app-intersection-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon color="warn">merge_type</mat-icon>
      Cross-Target Intelligence: Meeting Points Detected
    </h2>
    <mat-dialog-content>
      <p class="dialog-desc">
        Algorithm scanned target routes for proximity (within 10 km) and temporal convergence (within 6 hours).
        Found <strong>{{ data.intersections.length }}</strong> potential meeting points.
      </p>

      @if (data.intersections.length === 0) {
        <div class="empty-state">
          <mat-icon>check_circle</mat-icon>
          <p>No intersections found within the criteria for the selected targets.</p>
        </div>
      } @else {
        <table mat-table [dataSource]="data.intersections" class="w-full">
          <!-- Targets Column -->
          <ng-container matColumnDef="targets">
            <th mat-header-cell *matHeaderCellDef>Targets</th>
            <td mat-cell *matCellDef="let row">
              <span class="target-tag">{{ row.target1Alias }}</span>
              <mat-icon class="intersect-icon">sync_alt</mat-icon>
              <span class="target-tag">{{ row.target2Alias }}</span>
            </td>
          </ng-container>

          <!-- Location Column -->
          <ng-container matColumnDef="location">
            <th mat-header-cell *matHeaderCellDef>Location</th>
            <td mat-cell *matCellDef="let row">
              <strong>{{ row.city }}</strong>
              <div class="coords">{{ row.lat | number:'1.4-4' }}, {{ row.lng | number:'1.4-4' }}</div>
            </td>
          </ng-container>

          <!-- Delta Column -->
          <ng-container matColumnDef="delta">
            <th mat-header-cell *matHeaderCellDef>Time / Distance</th>
            <td mat-cell *matCellDef="let row">
              <span class="badge time">{{ row.timeDiffHours | number:'1.1-1' }}h apart</span>
              <span class="badge dist">{{ row.distanceKm | number:'1.1-1' }} km</span>
            </td>
          </ng-container>

          <!-- Activity Column -->
          <ng-container matColumnDef="activities">
            <th mat-header-cell *matHeaderCellDef>Activities & Timestamps</th>
            <td mat-cell *matCellDef="let row" class="activities-cell">
              <div><strong>{{ row.target1Alias }}:</strong> {{ row.activity1 }} ({{ row.time1 | date:'short' }})</div>
              <div><strong>{{ row.target2Alias }}:</strong> {{ row.activity2 }} ({{ row.time2 | date:'short' }})</div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      @if (data.intersections.length > 0) {
        <button mat-flat-button color="warn" [mat-dialog-close]="true">
          <mat-icon>map</mat-icon> Highlight on Map
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.25rem;
    }
    .dialog-desc {
      color: #94a3b8;
      font-size: 0.9rem;
      margin-bottom: 16px;
    }
    .w-full {
      width: 100%;
    }
    .target-tag {
      font-weight: 700;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
    }
    .intersect-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      vertical-align: middle;
      margin: 0 4px;
      color: #f59e0b;
    }
    .coords {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 4px;
      font-weight: 600;
    }
    .badge.time {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }
    .badge.dist {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
    }
    .activities-cell {
      font-size: 0.85rem;
      line-height: 1.4;
    }
    .empty-state {
      text-align: center;
      padding: 32px 0;
      color: #94a3b8;
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #10b981;
        margin-bottom: 8px;
      }
    }
  `],
})
export class IntersectionDialogComponent {
  displayedColumns = ['targets', 'location', 'delta', 'activities'];

  constructor(
    public dialogRef: MatDialogRef<IntersectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { intersections: IntersectionResult[] }
  ) {}
}

