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
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { Subject, takeUntil } from 'rxjs';

import { TargetService } from '../../core/services/target.service';
import { Target } from '../../core/models/target.model';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';
import { haversineKm } from '../../shared/utils/geo.utils';

interface IntersectSummary {
  target1: string;
  target2: string;
  target1Id: string;
  target2Id: string;
  city: string;
  distanceKm: number;
  timeDiffHours: number;
  time: string;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatTableModule,
    MatDividerModule,
    NgxEchartsDirective,
  ],
  template: `
    <div class="analytics-container">
      <header class="page-header">
        <div>
          <h1 class="page-title">Intelligence & Convergence Analytics</h1>
          <p class="page-subtitle">Cross-target network topology, operational density, and convergence matrix</p>
        </div>
      </header>

      <!-- TOP ROW: NETWORK TOPOLOGY -->
      <section class="section-card">
        <mat-card class="full-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">hub</mat-icon>
            <mat-card-title>Syndicate Association Graph</mat-card-title>
            <mat-card-subtitle>Direct connections, criminal network clusters, and shared operatives</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-wrapper">
              <div echarts [options]="associationGraphOption()" class="network-chart"></div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- MIDDLE ROW: TWO CHARTS -->
      <div class="grid-two">
        <!-- Threat Distribution by Category -->
        <mat-card class="dash-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="accent">security</mat-icon>
            <mat-card-title>Threat Intensity by Category</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div echarts [options]="threatCategoryOption()" class="small-chart"></div>
          </mat-card-content>
        </mat-card>

        <!-- Sighting Density by Hour of Day -->
        <mat-card class="dash-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">schedule</mat-icon>
            <mat-card-title>Operational Temporal Pattern (Hour of Day)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div echarts [options]="hourPatternOption()" class="small-chart"></div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- BOTTOM ROW: CONVERGENCE / INTERSECTIONS MATRIX -->
      <section class="section-card">
        <mat-card class="full-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="warn">merge_type</mat-icon>
            <mat-card-title>Cross-Target Meeting Convergences</mat-card-title>
            <mat-card-subtitle>Points where two different targets were within 15km and 8 hours of each other</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (intersections().length === 0) {
              <div class="empty-state">No convergence points identified across active targets.</div>
            } @else {
              <!-- Desktop Table -->
              @if (!isMobile()) {
                <div class="table-scroll">
                  <table mat-table [dataSource]="intersections()" class="w-full">
                    <ng-container matColumnDef="targets">
                      <th mat-header-cell *matHeaderCellDef>Target Convergence</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="tag alias-1" (click)="goToMap(row.target1Id)">{{ row.target1 }}</span>
                        <mat-icon class="intersect-icon">swap_horiz</mat-icon>
                        <span class="tag alias-2" (click)="goToMap(row.target2Id)">{{ row.target2 }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="city">
                      <th mat-header-cell *matHeaderCellDef>City / Hub</th>
                      <td mat-cell *matCellDef="let row"><strong>{{ row.city }}</strong></td>
                    </ng-container>
                    <ng-container matColumnDef="proximity">
                      <th mat-header-cell *matHeaderCellDef>Spatial Proximity</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="badge dist">{{ row.distanceKm | number:'1.1-1' }} km apart</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="temporal">
                      <th mat-header-cell *matHeaderCellDef>Time Delta</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="badge time">{{ row.timeDiffHours | number:'1.1-1' }}h apart</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="time">
                      <th mat-header-cell *matHeaderCellDef>Sighting Window</th>
                      <td mat-cell *matCellDef="let row">{{ row.time | date:'medium' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Action</th>
                      <td mat-cell *matCellDef="let row">
                        <button mat-stroked-button color="primary" (click)="goToMap(row.target1Id)">
                          <mat-icon>map</mat-icon> View on Map
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="columns"></tr>
                    <tr mat-row *matRowDef="let row; columns: columns"></tr>
                  </table>
                </div>
              }

              <!-- Mobile Cards -->
              @if (isMobile()) {
                <div class="mobile-cards">
                  @for (row of intersections(); track row.target1Id + row.target2Id + row.time) {
                    <div class="convergence-card">
                      <div class="convergence-targets">
                        <span class="tag alias-1" (click)="goToMap(row.target1Id)">{{ row.target1 }}</span>
                        <mat-icon class="intersect-icon">swap_horiz</mat-icon>
                        <span class="tag alias-2" (click)="goToMap(row.target2Id)">{{ row.target2 }}</span>
                      </div>
                      <div class="convergence-meta">
                        <div class="meta-row">
                          <mat-icon class="meta-icon">location_on</mat-icon>
                          <strong>{{ row.city }}</strong>
                        </div>
                        <div class="meta-row">
                          <span class="badge dist">{{ row.distanceKm | number:'1.1-1' }} km apart</span>
                          <span class="badge time">{{ row.timeDiffHours | number:'1.1-1' }}h delta</span>
                        </div>
                        <div class="meta-row time-row">
                          <mat-icon class="meta-icon">schedule</mat-icon>
                          <span class="time-text">{{ row.time | date:'medium' }}</span>
                        </div>
                      </div>
                      <button mat-stroked-button color="primary" class="map-btn" (click)="goToMap(row.target1Id)">
                        <mat-icon>map</mat-icon> View on Map
                      </button>
                    </div>
                  }
                </div>
              }
            }
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .page-title {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 4px;
      color: var(--text-primary);
    }
    .page-subtitle {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin: 0;
    }
    .section-card {
      width: 100%;
    }
    .full-card, .dash-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }
    .chart-wrapper {
      width: 100%;
      height: 440px;
      margin-top: 12px;
    }
    .network-chart {
      width: 100%;
      height: 100%;
    }
    .grid-two {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 900px) {
      .grid-two {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 768px) {
      .analytics-container {
        padding: 14px 10px;
        gap: 16px;
      }
      .page-title {
        font-size: 1.35rem;
      }
      .chart-wrapper {
        height: 300px;
      }
      .small-chart {
        height: 240px;
      }
    }
    .small-chart {
      width: 100%;
      height: 300px;
    }
    .w-full {
      width: 100%;
    }
    .tag {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 3px 8px;
      border-radius: 4px;
      cursor: pointer;
    }
    .alias-1 {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
    }
    .alias-2 {
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
    }
    .intersect-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      vertical-align: middle;
      margin: 0 6px;
      color: #f59e0b;
    }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .badge.dist {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
    }
    .badge.time {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
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
    /* Mobile Convergence Cards */
    .mobile-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 8px;
    }
    .convergence-card {
      background: var(--bg-app);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: border-color 0.2s;
      &:hover {
        border-color: #0284c7;
      }
    }
    .convergence-targets {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }
    .convergence-meta {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: var(--text-primary);
      flex-wrap: wrap;
    }
    .meta-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #94a3b8;
    }
    .time-row {
      color: var(--text-secondary);
      font-size: 0.75rem;
    }
    .time-text {
      color: var(--text-secondary);
    }
    .map-btn {
      width: 100%;
      height: 36px;
      margin-top: 4px;
    }
  `],
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private readonly targetService = inject(TargetService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroy$ = new Subject<void>();

  readonly targets = signal<Target[]>([]);
  readonly isMobile = signal<boolean>(false);
  readonly columns = ['targets', 'city', 'proximity', 'temporal', 'time', 'actions'];

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

  // Association graph option
  readonly associationGraphOption = computed<EChartsOption>(() => {
    const list = this.targets();
    if (list.length === 0) return {};

    const nodes = list.map(t => ({
      id: t.id,
      name: t.alias,
      value: t.organization,
      symbolSize: t.threatLevel === 'CRITICAL' ? 52 : t.threatLevel === 'HIGH' ? 44 : 36,
      itemStyle: {
        color: APP_CONSTANTS.THREAT_COLORS[t.threatLevel] || '#38bdf8',
        borderColor: '#ffffff',
        borderWidth: t.threatLevel === 'CRITICAL' ? 3 : 1,
      },
      label: { show: true, color: '#f8fafc', fontWeight: 'bold' as const, fontSize: 12 },
    }));

    const links: { source: string; target: string }[] = [];
    const addedPairs = new Set<string>();

    list.forEach(t => {
      t.knownAssociates.forEach(assocId => {
        const pairKey = [t.id, assocId].sort().join('--');
        if (!addedPairs.has(pairKey)) {
          addedPairs.add(pairKey);
          links.push({ source: t.id, target: assocId });
        }
      });
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { name: string; value?: string; data?: { id?: string } };
          const t = list.find(item => item.alias === p.name);
          if (!t) return p.name;
          return `
            <strong>${t.alias}</strong> (${t.fullName})<br/>
            Category: ${t.category}<br/>
            Org: ${t.organization}<br/>
            Threat: ${t.threatLevel}
          `;
        },
      },
      legend: {
        data: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
        textStyle: { color: '#94a3b8' },
        top: '2%',
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: nodes,
          links: links,
          roam: true,
          label: { position: 'bottom', distance: 6 },
          force: { repulsion: 300, edgeLength: 120, gravity: 0.1 },
          lineStyle: { color: 'rgba(56, 189, 248, 0.4)', width: 2.5, curveness: 0.15 },
        },
      ],
    };
  });

  // Threat Category Distribution Bar Option
  readonly threatCategoryOption = computed<EChartsOption>(() => {
    const list = this.targets();
    const categories: string[] = ['Terror Org', 'Organized Crime', 'Fugitive', 'Smuggler', 'Cyber Crime'];
    const threats = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

    const series = threats.map(threat => ({
      name: threat,
      type: 'bar' as const,
      stack: 'total',
      itemStyle: { color: APP_CONSTANTS.THREAT_COLORS[threat] },
      data: categories.map(cat => list.filter(t => t.category === cat && t.threatLevel === threat).length),
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { textStyle: { color: '#94a3b8' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#475569' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisLabel: { color: '#94a3b8' },
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#e2e8f0', fontSize: 11 },
      },
      series,
    };
  });

  // Hour of Day Pattern Line Chart Option
  readonly hourPatternOption = computed<EChartsOption>(() => {
    const list = this.targets();
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourCounts = new Array(24).fill(0);

    list.forEach(t => {
      t.history.forEach(p => {
        const h = new Date(p.timestamp).getHours();
        hourCounts[h]++;
      });
    });

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', interval: 2 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#475569' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisLabel: { color: '#94a3b8' },
      },
      series: [
        {
          name: 'Sightings',
          type: 'line',
          smooth: true,
          data: hourCounts,
          lineStyle: { color: '#38bdf8', width: 3 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(56, 189, 248, 0.4)' },
                { offset: 1, color: 'rgba(56, 189, 248, 0.0)' },
              ],
            },
          },
        },
      ],
    };
  });

  // Intersections list computed
  readonly intersections = computed<IntersectSummary[]>(() => {
    const list = this.targets();
    const res: IntersectSummary[] = [];

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const t1 = list[i];
        const t2 = list[j];

        t1.history.forEach(p1 => {
          t2.history.forEach(p2 => {
            const dist = haversineKm(p1.lat, p1.lng, p2.lat, p2.lng);
            const timeDiff = Math.abs(new Date(p1.timestamp).getTime() - new Date(p2.timestamp).getTime()) / 3600000;

            if (dist <= 15 && timeDiff <= 8) {
              res.push({
                target1: t1.alias,
                target2: t2.alias,
                target1Id: t1.id,
                target2Id: t2.id,
                city: p1.city,
                distanceKm: dist,
                timeDiffHours: timeDiff,
                time: p1.timestamp,
              });
            }
          });
        });
      }
    }

    return res;
  });

  goToMap(targetId: string): void {
    this.router.navigate(['/map'], { queryParams: { targetId } });
  }
}
