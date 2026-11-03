import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';

import { TargetService } from '../../../core/services/target.service';
import { AuditService } from '../../../core/services/audit.service';
import { AuthService } from '../../../core/services/auth.service';
import { Target, TargetCategory, ThreatLevel, TargetStatus } from '../../../core/models/target.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ThreatChipComponent } from '../../../shared/components/threat-chip/threat-chip.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { APP_CONSTANTS } from '../../../shared/constants/app.constants';

/**
 * TargetListComponent — full-featured sortable, filterable, paginated
 * intelligence target roster with multi-select and column visibility control.
 */
@Component({
  selector: 'app-target-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './target-list.component.html',
  styleUrl: './target-list.component.scss',
  imports: [
    // Angular
    FormsModule,
    ReactiveFormsModule,
    // Material
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSelectModule,
    MatBadgeModule,
    // Shared
    StatusBadgeComponent,
    ThreatChipComponent,
    AvatarComponent,
    TimeAgoPipe,
  ],
})
export class TargetListComponent implements OnInit, AfterViewInit {
  // ── Injected services ──────────────────────────────────────────────────────
  private readonly targetService = inject(TargetService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auditService = inject(AuditService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── View children ──────────────────────────────────────────────────────────
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // ── Data source ────────────────────────────────────────────────────────────
  readonly dataSource = new MatTableDataSource<Target>([]);

  // ── Filter signals ─────────────────────────────────────────────────────────
  searchQuery = signal('');
  selectedCategories = signal<TargetCategory[]>([]);
  selectedThreatLevels = signal<ThreatLevel[]>([]);
  selectedStatuses = signal<TargetStatus[]>([]);

  // ── Column visibility ──────────────────────────────────────────────────────
  displayedColumns = signal<string[]>(
    this._loadColumnPref() ?? [
      'select', 'avatar', 'alias', 'category', 'threatLevel',
      'status', 'lastSeen', 'location', 'actions',
    ]
  );

  readonly allColumns: ReadonlyArray<string> = [
    'select', 'avatar', 'alias', 'fullName', 'category', 'organization',
    'threatLevel', 'status', 'lastSeen', 'location', 'actions',
  ];

  readonly columnLabels: Readonly<Record<string, string>> = {
    select: 'Select',
    avatar: 'Avatar',
    alias: 'Alias',
    fullName: 'Full Name',
    category: 'Category',
    organization: 'Organization',
    threatLevel: 'Threat',
    status: 'Status',
    lastSeen: 'Last Seen',
    location: 'Location',
    actions: 'Actions',
  };

  // ── Multi-select ───────────────────────────────────────────────────────────
  readonly selection = new SelectionModel<Target>(true, []);

  // ── Filter option lists ────────────────────────────────────────────────────
  readonly categories: ReadonlyArray<TargetCategory> = [
    'Terror Org', 'Organized Crime', 'Fugitive', 'Smuggler', 'Cyber Crime',
  ];
  readonly threatLevels: ReadonlyArray<ThreatLevel> = [
    'LOW', 'MEDIUM', 'HIGH', 'CRITICAL',
  ];
  readonly statuses: ReadonlyArray<TargetStatus> = [
    'Active', 'Under Surveillance', 'Captured', 'Lost Contact',
  ];

  // ── Category colors ────────────────────────────────────────────────────────
  readonly categoryColors: Readonly<Record<string, string>> =
    APP_CONSTANTS.CATEGORY_COLORS;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._subscribeToTargets();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    // Custom filter predicate already set in _subscribeToTargets
  }

  // ── Public methods ─────────────────────────────────────────────────────────

  applyFilter(): void {
    // Trigger MatTableDataSource's filter by concatenating a sentinel string
    this.dataSource.filter = JSON.stringify({
      search: this.searchQuery().toLowerCase().trim(),
      categories: this.selectedCategories(),
      threatLevels: this.selectedThreatLevels(),
      statuses: this.selectedStatuses(),
    });
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  toggleCategory(cat: TargetCategory): void {
    const current = this.selectedCategories();
    const idx = current.indexOf(cat);
    if (idx === -1) {
      this.selectedCategories.set([...current, cat]);
    } else {
      this.selectedCategories.set(current.filter(c => c !== cat));
    }
    this.applyFilter();
  }

  toggleThreatLevel(tl: ThreatLevel): void {
    const current = this.selectedThreatLevels();
    const idx = current.indexOf(tl);
    if (idx === -1) {
      this.selectedThreatLevels.set([...current, tl]);
    } else {
      this.selectedThreatLevels.set(current.filter(t => t !== tl));
    }
    this.applyFilter();
  }

  toggleStatus(s: TargetStatus): void {
    const current = this.selectedStatuses();
    const idx = current.indexOf(s);
    if (idx === -1) {
      this.selectedStatuses.set([...current, s]);
    } else {
      this.selectedStatuses.set(current.filter(st => st !== s));
    }
    this.applyFilter();
  }

  removeCategory(cat: TargetCategory): void {
    this.selectedCategories.set(this.selectedCategories().filter(c => c !== cat));
    this.applyFilter();
  }

  removeThreatLevel(tl: ThreatLevel): void {
    this.selectedThreatLevels.set(this.selectedThreatLevels().filter(t => t !== tl));
    this.applyFilter();
  }

  removeStatus(s: TargetStatus): void {
    this.selectedStatuses.set(this.selectedStatuses().filter(st => st !== s));
    this.applyFilter();
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.selectedCategories.set([]);
    this.selectedThreatLevels.set([]);
    this.selectedStatuses.set([]);
    this.applyFilter();
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchQuery().length > 0 ||
      this.selectedCategories().length > 0 ||
      this.selectedThreatLevels().length > 0 ||
      this.selectedStatuses().length > 0
    );
  }

  navigateToDetail(target: Target): void {
    const user = this.authService.currentUser();
    if (user) {
      this.auditService.record('TARGET_VIEW', user, `Viewed target list entry`, target.id, target.alias);
    }
    this.router.navigate(['/targets', target.id]);
  }

  viewOnMap(target: Target): void {
    this.router.navigate(['/map'], { queryParams: { targetId: target.id } });
  }

  compareOnMap(): void {
    const ids = this.selection.selected.map(t => t.id);
    if (ids.length === 0) return;
    if (ids.length > APP_CONSTANTS.MAX_MULTI_TARGET_COMPARE) {
      this.snackBar.open(
        `Maximum ${APP_CONSTANTS.MAX_MULTI_TARGET_COMPARE} targets can be compared at once.`,
        'Dismiss',
        { duration: 3000, panelClass: 'snack-warn' }
      );
      return;
    }
    this.router.navigate(['/map'], { queryParams: { targetIds: ids.join(',') } });
  }

  toggleColumn(col: string): void {
    const fixed = ['select', 'actions'];
    if (fixed.includes(col)) return; // always visible

    const current = this.displayedColumns();
    const idx = current.indexOf(col);
    let next: string[];
    if (idx === -1) {
      // Insert in canonical order
      const canonical = this.allColumns as string[];
      next = canonical.filter(c => current.includes(c) || c === col);
    } else {
      next = current.filter(c => c !== col);
    }
    this.displayedColumns.set(next);
    this._saveColumnPref(next);
  }

  isColumnVisible(col: string): boolean {
    return this.displayedColumns().includes(col);
  }

  /** True when all rows on the current page are selected. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.filteredData.length;
    return numSelected === numRows && numRows > 0;
  }

  /** Select/deselect all rows. */
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.filteredData.forEach(row => this.selection.select(row));
    }
  }

  /**
   * Returns the last known location string from the target's history.
   * Falls back to 'Unknown' if history is empty.
   */
  lastLocation(target: Target): string {
    if (!target.history || target.history.length === 0) return 'Unknown';
    const last = target.history[target.history.length - 1];
    return `${last.city}, ${last.state}`;
  }

  threatColor(level: ThreatLevel): string {
    return APP_CONSTANTS.THREAT_COLORS[level] ?? '#9e9e9e';
  }

  categoryColor(cat: TargetCategory): string {
    return APP_CONSTANTS.CATEGORY_COLORS[cat] ?? '#9e9e9e';
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _subscribeToTargets(): void {
    // Set custom filter predicate BEFORE loading data
    this.dataSource.filterPredicate = (target: Target, filterJson: string): boolean => {
      if (!filterJson) return true;
      let parsed: { search: string; categories: TargetCategory[]; threatLevels: ThreatLevel[]; statuses: TargetStatus[] };
      try {
        parsed = JSON.parse(filterJson) as typeof parsed;
      } catch {
        return true;
      }

      const matchesSearch =
        !parsed.search ||
        target.alias.toLowerCase().includes(parsed.search) ||
        target.fullName.toLowerCase().includes(parsed.search) ||
        target.organization.toLowerCase().includes(parsed.search) ||
        target.tags.some(tag => tag.toLowerCase().includes(parsed.search));

      const matchesCategory =
        parsed.categories.length === 0 ||
        parsed.categories.includes(target.category);

      const matchesThreat =
        parsed.threatLevels.length === 0 ||
        parsed.threatLevels.includes(target.threatLevel);

      const matchesStatus =
        parsed.statuses.length === 0 ||
        parsed.statuses.includes(target.status);

      return matchesSearch && matchesCategory && matchesThreat && matchesStatus;
    };

    this.targetService.getTargets().subscribe(targets => {
      this.dataSource.data = targets;
      this.cdr.markForCheck();
    });
  }

  private _loadColumnPref(): string[] | null {
    try {
      const stored = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.COLUMN_VISIBILITY);
      if (!stored) return null;
      return JSON.parse(stored) as string[];
    } catch {
      return null;
    }
  }

  private _saveColumnPref(cols: string[]): void {
    try {
      localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.COLUMN_VISIBILITY, JSON.stringify(cols));
    } catch {
      // Storage unavailable — silently skip
    }
  }
}
