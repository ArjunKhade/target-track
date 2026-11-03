import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ViewChild,
  computed,
  inject,
  signal,
  NgZone,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

import * as L from 'leaflet';
import 'leaflet.markercluster';

import { TargetService } from '../../core/services/target.service';
import { AlertService } from '../../core/services/alert.service';
import { Alert } from '../../core/models/alert.model';
import { Target } from '../../core/models/target.model';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

/** Stat card data structure */
interface StatCard {
  label: string;
  icon: string;
  colorClass: string;
  iconBg: string;
}

const STAT_CARDS: StatCard[] = [
  { label: 'Total Targets', icon: 'groups', colorClass: 'stat-total', iconBg: '#1565c0' },
  { label: 'Active', icon: 'my_location', colorClass: 'stat-active', iconBg: '#c62828' },
  { label: 'Critical Threat', icon: 'warning', colorClass: 'stat-critical', iconBg: '#b71c1c' },
  { label: 'Captured', icon: 'lock', colorClass: 'stat-captured', iconBg: '#2e7d32' },
  { label: 'Lost Contact', icon: 'signal_wifi_off', colorClass: 'stat-lost', iconBg: '#424242' },
];

const DARK_CHART_TEXT = '#b0bec5';
const DARK_CHART_BG = 'transparent';
const DARK_GRID_LINE = 'rgba(255,255,255,0.08)';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatButtonModule,
    NgxEchartsDirective,
    TimeAgoPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('miniMapContainer') miniMapContainer?: ElementRef<HTMLDivElement>;

  private readonly targetService = inject(TargetService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly ngZone = inject(NgZone);

  private readonly destroy$ = new Subject<void>();
  private miniMap: L.Map | null = null;

  // ── Stat signals from service ──────────────────────────────────────────────
  readonly totalTargets = this.targetService.targetCount;
  readonly activeTargets = this.targetService.activeCount;
  readonly criticalTargets = this.targetService.criticalCount;
  readonly capturedTargets = this.targetService.capturedCount;
  readonly lostContactTargets = this.targetService.lostContactCount;

  // ── Animated counter signals ───────────────────────────────────────────────
  readonly animatedTotal = signal(0);
  readonly animatedActive = signal(0);
  readonly animatedCritical = signal(0);
  readonly animatedCaptured = signal(0);
  readonly animatedLost = signal(0);

  // ── Stat card metadata ─────────────────────────────────────────────────────
  readonly statCards = STAT_CARDS;

  // ── Alerts ─────────────────────────────────────────────────────────────────
  readonly alerts = this.alertService.alerts;
  readonly unreadCount = this.alertService.unreadCount;

  // ── Chart computed options ─────────────────────────────────────────────────

  /** Donut chart: targets by category */
  readonly categoryChartOption = computed<EChartsOption>(() => {
    const targets = this.targetService.targets();
    const categoryMap = new Map<string, number>();
    for (const t of targets) {
      categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + 1);
    }
    const data = [...categoryMap.entries()].map(([name, value]) => ({
      name,
      value,
      itemStyle: { color: APP_CONSTANTS.CATEGORY_COLORS[name] ?? '#607d8b' },
    }));

    return {
      backgroundColor: DARK_CHART_BG,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1e2a3a',
        borderColor: '#37474f',
        textStyle: { color: DARK_CHART_TEXT },
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: DARK_CHART_TEXT, fontSize: 11 },
      },
      series: [
        {
          name: 'Category',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 13, fontWeight: 'bold', color: '#fff' },
          },
          labelLine: { show: false },
          data,
        },
      ],
    };
  });

  /** Bar chart: threat level distribution */
  readonly threatChartOption = computed<EChartsOption>(() => {
    const targets = this.targetService.targets();
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
    const counts = levels.map(l => targets.filter(t => t.threatLevel === l).length);
    const colors = levels.map(l => APP_CONSTANTS.THREAT_COLORS[l]);

    return {
      backgroundColor: DARK_CHART_BG,
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1e2a3a',
        borderColor: '#37474f',
        textStyle: { color: DARK_CHART_TEXT },
        axisPointer: { type: 'shadow' },
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        axisLabel: { color: DARK_CHART_TEXT, fontWeight: 'bold', fontSize: 11 },
        axisLine: { lineStyle: { color: DARK_GRID_LINE } },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: DARK_CHART_TEXT },
        splitLine: { lineStyle: { color: DARK_GRID_LINE } },
      },
      series: [
        {
          name: 'Targets',
          type: 'bar',
          barWidth: '45%',
          data: counts.map((value, i) => ({ value, itemStyle: { color: colors[i] } })),
        },
      ],
    };
  });

  /** Line chart: sightings per day over the last 14 days */
  readonly sightingsChartOption = computed<EChartsOption>(() => {
    const targets = this.targetService.targets();
    const dates = this._last14Days();
    const dateStrings = dates.map(d => this._formatDate(d));

    const countMap = new Map<string, number>(dateStrings.map(d => [d, 0]));
    for (const t of targets) {
      for (const pt of t.history) {
        const day = pt.timestamp.slice(0, 10);
        if (countMap.has(day)) {
          countMap.set(day, (countMap.get(day) ?? 0) + 1);
        }
      }
    }

    const seriesData = dateStrings.map(d => countMap.get(d) ?? 0);

    return {
      backgroundColor: DARK_CHART_BG,
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1e2a3a',
        borderColor: '#37474f',
        textStyle: { color: DARK_CHART_TEXT },
      },
      grid: {
        left: '4%',
        right: '4%',
        bottom: '12%',
        top: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dateStrings.map(d => d.slice(5)),
        axisLabel: { color: DARK_CHART_TEXT, rotate: 30, fontSize: 10 },
        axisLine: { lineStyle: { color: DARK_GRID_LINE } },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: DARK_CHART_TEXT },
        splitLine: { lineStyle: { color: DARK_GRID_LINE } },
      },
      series: [
        {
          name: 'Sightings',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#00bcd4' },
          lineStyle: { color: '#00bcd4', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0,188,212,0.35)' },
                { offset: 1, color: 'rgba(0,188,212,0.02)' },
              ],
            },
          },
          data: seriesData,
        },
      ],
    };
  });

  /** Horizontal bar chart: top cities by sighting count */
  readonly topCitiesChartOption = computed<EChartsOption>(() => {
    const targets = this.targetService.targets();
    const cityMap = new Map<string, number>();

    for (const t of targets) {
      for (const pt of t.history) {
        cityMap.set(pt.city, (cityMap.get(pt.city) ?? 0) + 1);
      }
    }

    const sorted = [...cityMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);

    const cities = sorted.map(([c]) => c).reverse();
    const counts = sorted.map(([, n]) => n).reverse();

    return {
      backgroundColor: DARK_CHART_BG,
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1e2a3a',
        borderColor: '#37474f',
        textStyle: { color: DARK_CHART_TEXT },
        axisPointer: { type: 'shadow' },
      },
      grid: {
        left: '5%',
        right: '8%',
        bottom: '5%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: DARK_CHART_TEXT },
        splitLine: { lineStyle: { color: DARK_GRID_LINE } },
      },
      yAxis: {
        type: 'category',
        data: cities,
        axisLabel: { color: DARK_CHART_TEXT, fontSize: 11 },
        axisLine: { lineStyle: { color: DARK_GRID_LINE } },
      },
      series: [
        {
          name: 'Sightings',
          type: 'bar',
          data: counts.map((value, i) => ({
            value,
            itemStyle: {
              color: i % 2 === 0 ? '#1976d2' : '#26a69a',
            },
          })),
        },
      ],
    };
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this._animateCounters();
    this._startLiveAlerts();
  }

  ngAfterViewInit(): void {
    this.initMiniMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.miniMap) {
      this.miniMap.remove();
      this.miniMap = null;
    }
  }

  private initMiniMap(): void {
    if (!this.miniMapContainer) return;
    this.ngZone.runOutsideAngular(() => {
      this.miniMap = L.map(this.miniMapContainer!.nativeElement, {
        center: [20.5937, 78.9629],
        zoom: 4,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
      }).addTo(this.miniMap);

      const cluster = L.markerClusterGroup({
        maxClusterRadius: 35,
        showCoverageOnHover: false,
      });

      const targets = this.targetService.targets();
      const bounds = L.latLngBounds([]);

      targets.forEach(tgt => {
        if (tgt.history.length === 0) return;
        const last = tgt.history[tgt.history.length - 1];
        bounds.extend([last.lat, last.lng]);

        const markerColor = APP_CONSTANTS.THREAT_COLORS[tgt.threatLevel] || '#38bdf8';
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:${markerColor};border:2px solid #fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px;color:#fff;box-shadow:0 0 8px ${markerColor};">${tgt.alias.slice(0, 2)}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([last.lat, last.lng], { icon });
        marker.bindPopup(`
          <div style="font-family:Roboto,sans-serif;font-size:12px;">
            <strong style="color:${markerColor};">${tgt.alias}</strong> (${tgt.fullName})<br/>
            <span>${last.city}, ${last.state}</span><br/>
            <span style="font-size:11px;color:#94a3b8;">Threat: ${tgt.threatLevel}</span>
          </div>
        `);
        marker.on('click', () => {
          this.ngZone.run(() => {
            void this.router.navigate(['/map'], { queryParams: { targetId: tgt.id } });
          });
        });
        cluster.addLayer(marker);
      });

      cluster.addTo(this.miniMap);
      if (bounds.isValid()) {
        this.miniMap.fitBounds(bounds, { padding: [20, 20] });
      }
    });
  }

  // ── Public helpers ─────────────────────────────────────────────────────────

  onAlertClick(alert: Alert): void {
    this.alertService.markRead(alert.id);
    void this.router.navigate(['/map'], { queryParams: { targetId: alert.targetId } });
  }

  markAllRead(): void {
    this.alertService.markAllRead();
  }

  severityIcon(severity: Alert['severity']): string {
    switch (severity) {
      case 'CRITICAL': return 'crisis_alert';
      case 'WARNING':  return 'warning_amber';
      default:         return 'info';
    }
  }

  severityColor(severity: Alert['severity']): string {
    switch (severity) {
      case 'CRITICAL': return '#ef5350';
      case 'WARNING':  return '#ffa726';
      default:         return '#42a5f5';
    }
  }

  navigateToTarget(targetId: string, event: MouseEvent): void {
    event.stopPropagation();
    void this.router.navigate(['/targets', targetId]);
  }

  /** Returns the live count value for a given stat card index */
  animatedValue(index: number): number {
    switch (index) {
      case 0: return this.animatedTotal();
      case 1: return this.animatedActive();
      case 2: return this.animatedCritical();
      case 3: return this.animatedCaptured();
      case 4: return this.animatedLost();
      default: return 0;
    }
  }

  isCriticalCardPulsing(index: number): boolean {
    return index === 2 && this.criticalTargets() > 0;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _animateCounters(): void {
    const targets: Array<{ target: number; setter: (v: number) => void }> = [
      { target: this.totalTargets(),    setter: v => this.animatedTotal.set(v) },
      { target: this.activeTargets(),   setter: v => this.animatedActive.set(v) },
      { target: this.criticalTargets(), setter: v => this.animatedCritical.set(v) },
      { target: this.capturedTargets(), setter: v => this.animatedCaptured.set(v) },
      { target: this.lostContactTargets(), setter: v => this.animatedLost.set(v) },
    ];

    for (const { target, setter } of targets) {
      this._countUp(0, target, 1200, setter);
    }
  }

  private _countUp(from: number, to: number, durationMs: number, setter: (v: number) => void): void {
    if (to === 0) { setter(0); return; }
    const steps = Math.min(to, 60);
    const stepMs = durationMs / steps;
    let current = from;
    const increment = Math.ceil((to - from) / steps);

    const tick = (): void => {
      current = Math.min(current + increment, to);
      setter(current);
      if (current < to) {
        setTimeout(tick, stepMs);
      }
    };
    setTimeout(tick, 80);
  }

  private _startLiveAlerts(): void {
    this.alertService.startLiveAlerts().pipe(takeUntil(this.destroy$)).subscribe(alert => {
      const ref = this.snackBar.open(
        `🚨 ${alert.severity}: ${alert.message}`,
        'VIEW',
        { duration: 6000, panelClass: [`snack-${alert.severity.toLowerCase()}`] }
      );
      ref.onAction().pipe(takeUntil(this.destroy$)).subscribe(() => {
        void this.router.navigate(['/map'], { queryParams: { targetId: alert.targetId } });
      });
    });
  }

  private _last14Days(): Date[] {
    const days: Date[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  }

  private _formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
