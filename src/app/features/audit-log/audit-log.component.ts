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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';

import { AuditEntry, AuditAction } from '../../core/models/audit.model';
import { AuditService } from '../../core/services/audit.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="audit-log-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Law Enforcement Audit & Security Trail</h1>
          <p class="page-subtitle">Immutable chronological register of intelligence access, dossier views, notes, and exports</p>
        </div>
        <button mat-stroked-button class="export-btn" (click)="exportLogCSV()">
          <mat-icon>file_download</mat-icon> Export Audit Trail (.CSV)
        </button>
      </header>

      <!-- Filter Controls Toolbar -->
      <mat-card class="filter-card">
        <div class="filter-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <mat-label>Search audit events, users, details</mat-label>
            <input matInput [(ngModel)]="searchQuery" placeholder="Filter by target alias, IP, action..." />
          </mat-form-field>

          <mat-form-field appearance="outline" class="action-select">
            <mat-label>Filter Action Type</mat-label>
            <mat-select [(ngModel)]="selectedAction">
              <mat-option value="">All Actions</mat-option>
              @for (act of allActions; track act) {
                <mat-option [value]="act">{{ act }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <!-- Audit Entries Table / Cards -->
      <mat-card class="table-card">
        @if (filteredLog().length === 0) {
          <div class="empty-state">No audit entries match the current filter.</div>
        } @else {
          <!-- Desktop Table View -->
          @if (!isMobile()) {
            <div class="table-scroll">
              <table mat-table [dataSource]="filteredLog()" class="w-full">
                <!-- Timestamp Column -->
                <ng-container matColumnDef="timestamp">
                  <th mat-header-cell *matHeaderCellDef>Timestamp</th>
                  <td mat-cell *matCellDef="let entry" class="time-cell">
                    <div class="time-main">{{ entry.timestamp | date:'yyyy-MM-dd HH:mm:ss' }}</div>
                  </td>
                </ng-container>

                <!-- User Column -->
                <ng-container matColumnDef="user">
                  <th mat-header-cell *matHeaderCellDef>Operative</th>
                  <td mat-cell *matCellDef="let entry">
                    <span class="user-chip">
                      <mat-icon>person</mat-icon> {{ entry.username }}
                    </span>
                  </td>
                </ng-container>

                <!-- Action Column -->
                <ng-container matColumnDef="action">
                  <th mat-header-cell *matHeaderCellDef>Action Code</th>
                  <td mat-cell *matCellDef="let entry">
                    <span class="action-pill" [class]="'action-' + entry.action.toLowerCase()">
                      <mat-icon>{{ getActionIcon(entry.action) }}</mat-icon>
                      {{ entry.action }}
                    </span>
                  </td>
                </ng-container>

                <!-- Target Column -->
                <ng-container matColumnDef="target">
                  <th mat-header-cell *matHeaderCellDef>Subject Target</th>
                  <td mat-cell *matCellDef="let entry">
                    @if (entry.targetAlias) {
                      <span class="target-tag">{{ entry.targetAlias }}</span>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                </ng-container>

                <!-- Details Column -->
                <ng-container matColumnDef="details">
                  <th mat-header-cell *matHeaderCellDef>Audit Description</th>
                  <td mat-cell *matCellDef="let entry" class="details-cell">
                    {{ entry.details }}
                  </td>
                </ng-container>

                <!-- IP Address Column -->
                <ng-container matColumnDef="ip">
                  <th mat-header-cell *matHeaderCellDef>Source IP</th>
                  <td mat-cell *matCellDef="let entry" class="ip-cell">
                    <code>{{ entry.ipAddress }}</code>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns"></tr>
              </table>
            </div>
          }

          <!-- Mobile Card View -->
          @if (isMobile()) {
            <div class="mobile-audit-cards">
              @for (entry of filteredLog(); track entry.id) {
                <div class="audit-card">
                  <div class="audit-card-top">
                    <span class="action-pill" [class]="'action-' + entry.action.toLowerCase()">
                      <mat-icon>{{ getActionIcon(entry.action) }}</mat-icon>
                      {{ entry.action }}
                    </span>
                    <span class="time-main">{{ entry.timestamp | date:'MMM d, HH:mm:ss' }}</span>
                  </div>

                  <div class="audit-card-meta">
                    <span class="user-chip">
                      <mat-icon>person</mat-icon> {{ entry.username }}
                    </span>
                    @if (entry.targetAlias) {
                      <span class="target-tag">{{ entry.targetAlias }}</span>
                    }
                  </div>

                  <div class="audit-card-desc">
                    {{ entry.details }}
                  </div>

                  <div class="audit-card-footer">
                    <span class="ip-badge">
                      <mat-icon class="ip-icon">lan</mat-icon>
                      <code>{{ entry.ipAddress }}</code>
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .audit-log-page {
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
      color: #f8fafc;
      margin: 0 0 4px;
      color: var(--text-primary);
    }
    .page-subtitle {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin: 0;
    }
    .filter-card, .table-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }
    .filter-row {
      display: flex;
      gap: 16px;
      padding: 16px 16px 0;
    }
    .search-field {
      flex: 1;
      width: 100%;
    }
    .action-select {
      width: 240px;
    }
    .w-full {
      width: 100%;
    }
    .export-btn {
      white-space: nowrap;
    }
    @media (max-width: 768px) {
      .audit-log-page {
        padding: 14px 10px;
        gap: 14px;
      }
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .export-btn {
        width: 100%;
      }
      .page-title {
        font-size: 1.35rem;
      }
      .filter-row {
        flex-direction: column;
        gap: 12px;
        padding: 14px 14px 4px;
      }
      .search-field {
        width: 100% !important;
        min-width: 100% !important;
        flex: none !important;
      }
      .action-select {
        width: 100% !important;
        min-width: 100% !important;
        flex: none !important;
      }
      .table-card {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      table {
        min-width: 650px;
      }
    }
    .time-cell {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .user-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #cbd5e1;
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #38bdf8;
      }
    }
    .action-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
    .action-login { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .action-target_view { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .action-target_status_change { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .action-note_add, .action-note_edit { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .action-note_delete { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .action-export_pdf, .action-export_csv, .action-export_geojson { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .action-geofence_create, .action-geofence_edit, .action-geofence_delete { background: rgba(234, 88, 12, 0.15); color: #fb923c; }
    .action-evidence_upload { background: rgba(14, 165, 233, 0.15); color: #38bdf8; }

    .target-tag {
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.12);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .text-muted {
      color: #64748b;
    }
    .details-cell {
      font-size: 0.85rem;
      line-height: 1.4;
      color: #cbd5e1;
    }
    .ip-cell code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: #94a3b8;
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
    /* Mobile Audit Cards */
    .mobile-audit-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
    }
    .audit-card {
      background: var(--bg-app);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .audit-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .audit-card-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .audit-card-desc {
      font-size: 0.85rem;
      line-height: 1.4;
      color: var(--text-primary);
    }
    .audit-card-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-top: 4px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .ip-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #94a3b8;
      code {
        font-family: 'JetBrains Mono', monospace;
      }
    }
    .ip-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #64748b;
    }
  `],
})
export class AuditLogComponent implements OnInit, OnDestroy {
  private readonly auditService = inject(AuditService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroy$ = new Subject<void>();
  readonly authService = inject(AuthService);

  readonly isMobile = signal<boolean>(false);
  readonly rawLog = this.auditService.log;
  readonly columns = ['timestamp', 'user', 'action', 'target', 'details', 'ip'];

  searchQuery = '';
  selectedAction = '';

  readonly allActions: AuditAction[] = [
    'LOGIN',
    'LOGOUT',
    'TARGET_VIEW',
    'TARGET_STATUS_CHANGE',
    'NOTE_ADD',
    'NOTE_EDIT',
    'NOTE_DELETE',
    'EXPORT_CSV',
    'EXPORT_GEOJSON',
    'EXPORT_PDF',
    'GEOFENCE_CREATE',
    'GEOFENCE_EDIT',
    'GEOFENCE_DELETE',
    'EVIDENCE_UPLOAD',
  ];

  ngOnInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  readonly filteredLog = computed(() => {
    const list = this.rawLog();
    const query = this.searchQuery.trim().toLowerCase();
    const action = this.selectedAction;

    return list.filter(item => {
      if (action && item.action !== action) return false;
      if (query) {
        const match =
          item.username.toLowerCase().includes(query) ||
          item.details.toLowerCase().includes(query) ||
          (item.targetAlias && item.targetAlias.toLowerCase().includes(query)) ||
          item.ipAddress.includes(query);
        if (!match) return false;
      }
      return true;
    });
  });

  getActionIcon(action: AuditAction): string {
    switch (action) {
      case 'LOGIN': return 'login';
      case 'LOGOUT': return 'logout';
      case 'TARGET_VIEW': return 'visibility';
      case 'TARGET_STATUS_CHANGE': return 'published_with_changes';
      case 'NOTE_ADD': return 'note_add';
      case 'NOTE_EDIT': return 'edit_note';
      case 'NOTE_DELETE': return 'delete_forever';
      case 'EXPORT_PDF':
      case 'EXPORT_CSV':
      case 'EXPORT_GEOJSON': return 'file_download';
      case 'GEOFENCE_CREATE':
      case 'GEOFENCE_EDIT':
      case 'GEOFENCE_DELETE': return 'fence';
      case 'EVIDENCE_UPLOAD': return 'upload_file';
      default: return 'history';
    }
  }

  exportLogCSV(): void {
    const data = this.filteredLog();
    const headers = ['Timestamp', 'User', 'Action', 'Target ID', 'Target Alias', 'Details', 'IP Address'];
    const rows = data.map(e => [
      `"${e.timestamp}"`,
      `"${e.username}"`,
      `"${e.action}"`,
      `"${e.targetId || ''}"`,
      `"${e.targetAlias || ''}"`,
      `"${e.details.replace(/"/g, '""')}"`,
      `"${e.ipAddress}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

