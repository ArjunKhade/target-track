import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  signal,
  computed,
  inject,
  NgZone,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, combineLatest } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

import * as L from 'leaflet';
import 'leaflet-polylinedecorator';
import 'leaflet.markercluster';
import 'leaflet.heat';
import 'leaflet-draw';
import { antPath } from 'leaflet-ant-path';

import { Target, LocationPoint } from '../../core/models/target.model';
import { GeofenceZone } from '../../core/models/geofence.model';
import { TargetService } from '../../core/services/target.service';
import { MapService, BaseLayerType } from '../../core/services/map.service';
import { GeofenceService } from '../../core/services/geofence.service';
import { AlertService } from '../../core/services/alert.service';
import { ExportService } from '../../core/services/export.service';
import { AuthService } from '../../core/services/auth.service';
import { AuditService } from '../../core/services/audit.service';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';
import {
  haversineKm,
  bearing,
  interpolatePosition,
  predictNextLocation,
  pathDistanceKm,
  pointInPolygon,
  pointInCircle,
} from '../../shared/utils/geo.utils';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ThreatChipComponent } from '../../shared/components/threat-chip/threat-chip.component';
import { FormatKmPipe } from '../../shared/pipes/format-km.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { ConfidencePipe } from '../../shared/pipes/confidence.pipe';
import { CaseNotesComponent } from './case-notes.component';
import { EvidenceComponent } from './evidence.component';
import {
  IntersectionDialogComponent,
  IntersectionResult,
} from './intersection-dialog.component';

export interface RouteStats {
  totalKm: number;
  avgSpeedKmh: number;
  citiesCount: number;
  durationDays: number;
  pointsCount: number;
}

interface DwellPoint extends LocationPoint {
  durationHours: number;
}

@Component({
  selector: 'app-map-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    NgxEchartsDirective,
    AvatarComponent,
    StatusBadgeComponent,
    ThreatChipComponent,
    FormatKmPipe,
    ConfidencePipe,
    CaseNotesComponent,
    EvidenceComponent,
  ],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss',
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  readonly showMobileDossier = signal<boolean>(false);

  toggleMobileDossier(): void {
    this.showMobileDossier.update(v => !v);
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 250);
  }

  scrollToDossier(): void {
    const el = document.getElementById('target-dossier-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private readonly targetService = inject(TargetService);
  private readonly mapService = inject(MapService);
  private readonly geofenceService = inject(GeofenceService);
  private readonly alertService = inject(AlertService);
  private readonly exportService = inject(ExportService);
  readonly authService = inject(AuthService);
  private readonly auditService = inject(AuditService);
  private readonly ngZone = inject(NgZone);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Targets state
  readonly allTargets = signal<Target[]>([]);
  readonly activeTargetId = signal<string>('TGT-001');
  readonly selectedTargetIds = signal<string[]>(['TGT-001']);

  // Date filter form
  readonly dateRangeForm = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  // Layer visibility signals
  readonly showRoute = signal<boolean>(true);
  readonly showHeatmap = signal<boolean>(false);
  readonly showClustering = signal<boolean>(false);
  readonly showGeofences = signal<boolean>(true);
  readonly showPrediction = signal<boolean>(false);
  readonly activeBaseLayer = signal<BaseLayerType>('osm');
  readonly isFullscreen = signal<boolean>(false);

  // Playback state
  readonly isPlaying = signal<boolean>(false);
  readonly playbackSpeed = signal<number>(1);
  readonly playbackProgress = signal<number>(0);
  readonly currentActiveIndex = signal<number>(-1);
  readonly currentPlaybackCity = signal<string>('');
  readonly currentPlaybackTime = signal<string>('');

  // Leaflet references
  private map: L.Map | null = null;
  private tileLayers: Record<string, L.TileLayer> = {};
  private activeRouteLayers: Map<string, L.LayerGroup> = new Map();
  private antPathLayers: Map<string, L.Polyline> = new Map();
  private markerLayers: Map<string, L.LayerGroup> = new Map();
  private clusterGroup: L.MarkerClusterGroup | null = null;
  private heatmapLayer: L.Layer | null = null;
  private geofenceLayerGroup: L.LayerGroup | null = null;
  private predictionLayerGroup: L.LayerGroup | null = null;
  private playbackMarker: L.Marker | null = null;
  private meetingMarkersGroup: L.LayerGroup | null = null;

  // Animation frame reference
  private playbackInterval: ReturnType<typeof setInterval> | null = null;
  private subs: Subscription = new Subscription();

  // Active target computed
  readonly activeTarget = computed(() => {
    const id = this.activeTargetId();
    return this.allTargets().find(t => t.id === id) || null;
  });

  // Filtered history computed based on date range
  readonly filteredHistory = computed(() => {
    const tgt = this.activeTarget();
    if (!tgt) return [];
    const { start, end } = this.dateRangeForm.value;
    if (!start && !end) return tgt.history;

    return tgt.history.filter(pt => {
      const ptTime = new Date(pt.timestamp).getTime();
      if (start && ptTime < new Date(start).getTime()) return false;
      if (end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (ptTime > endOfDay.getTime()) return false;
      }
      return true;
    });
  });

  // Route statistics computed
  readonly stats = computed<RouteStats>(() => {
    const history = this.filteredHistory();
    if (history.length === 0) {
      return { totalKm: 0, avgSpeedKmh: 0, citiesCount: 0, durationDays: 0, pointsCount: 0 };
    }

    const coords: [number, number][] = history.map(p => [p.lat, p.lng]);
    const totalKm = pathDistanceKm(coords);
    const uniqueCities = new Set(history.map(p => p.city)).size;

    const firstTime = new Date(history[0].timestamp).getTime();
    const lastTime = new Date(history[history.length - 1].timestamp).getTime();
    const durationHours = Math.max((lastTime - firstTime) / 3600000, 1);
    const durationDays = durationHours / 24;
    const avgSpeedKmh = totalKm / durationHours;

    return {
      totalKm,
      avgSpeedKmh,
      citiesCount: uniqueCities,
      durationDays,
      pointsCount: history.length,
    };
  });

  // Geofence breach detection computed
  readonly hasGeofenceViolation = computed(() => {
    const tgt = this.activeTarget();
    if (!tgt) return false;
    const zones = this.geofenceService.zones().filter(z => z.active);
    return tgt.history.some(pt => {
      return zones.some(zone => {
        if (zone.shape === 'polygon' && zone.coordinates) {
          return pointInPolygon(pt.lat, pt.lng, zone.coordinates);
        } else if (zone.shape === 'circle' && zone.center && zone.radius) {
          return pointInCircle(pt.lat, pt.lng, zone.center[0], zone.center[1], zone.radius / 1000);
        }
        return false;
      });
    });
  });

  // ECharts options for Associates Network Graph
  readonly associatesGraphOption = computed<EChartsOption>(() => {
    const tgt = this.activeTarget();
    if (!tgt) return {};

    const nodes: Array<{
      id: string;
      name: string;
      symbolSize: number;
      itemStyle: { color: string };
      label: { show: boolean; color: string; fontWeight?: 'bold' | 'normal'; fontSize?: number };
    }> = [
      {
        id: tgt.id,
        name: tgt.alias,
        symbolSize: 45,
        itemStyle: { color: APP_CONSTANTS.THREAT_COLORS[tgt.threatLevel] || '#38bdf8' },
        label: { show: true, color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
      },
    ];

    const links: { source: string; target: string }[] = [];

    tgt.knownAssociates.forEach(assocId => {
      const assoc = this.getTargetById(assocId);
      if (assoc) {
        nodes.push({
          id: assoc.id,
          name: assoc.alias,
          symbolSize: 32,
          itemStyle: { color: APP_CONSTANTS.CATEGORY_COLORS[assoc.category] || '#94a3b8' },
          label: { show: true, color: '#e2e8f0', fontWeight: 'normal', fontSize: 11 },
        });
        links.push({ source: tgt.id, target: assoc.id });
      }
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { name: string; data?: { id?: string } };
          return `Target: ${p.name}`;
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: nodes,
          links: links,
          roam: true,
          label: { position: 'right' },
          force: { repulsion: 200, edgeLength: 80 },
          lineStyle: { color: 'rgba(255,255,255,0.3)', width: 2, curveness: 0.1 },
        },
      ],
    };
  });

  ngOnInit(): void {
    // Load targets and respond to route params / query params (targetId, targetIds)
    this.subs.add(
      combineLatest([
        this.targetService.getTargets(),
        this.route.queryParamMap,
        this.route.paramMap,
      ]).subscribe(([targets, queryParams, paramMap]) => {
        this.allTargets.set(targets);
        if (targets.length === 0) return;

        const targetIdsParam = queryParams.get('targetIds');
        const queryId = queryParams.get('targetId');
        const paramId = paramMap.get('id');
        const singleTargetId = paramId || queryId;

        // Multiple target comparison mode via query param (e.g. ?targetIds=TGT-001,TGT-002)
        if (targetIdsParam) {
          const parsedIds = targetIdsParam
            .split(',')
            .map(id => id.trim())
            .filter(id => targets.some(t => t.id === id));

          if (parsedIds.length > 0) {
            const cappedIds = parsedIds.slice(0, APP_CONSTANTS.MAX_MULTI_TARGET_COMPARE);
            this.selectedTargetIds.set(cappedIds);
            this.activeTargetId.set(cappedIds[0]);
            this.renderAllLayers();
            return;
          }
        }

        // Single target tracking mode
        if (singleTargetId && targets.some(t => t.id === singleTargetId)) {
          this.activeTargetId.set(singleTargetId);
          this.selectedTargetIds.set([singleTargetId]);
        } else if (targets.length > 0 && !targets.some(t => t.id === this.activeTargetId())) {
          this.activeTargetId.set(targets[0].id);
          this.selectedTargetIds.set([targets[0].id]);
        }

        this.renderAllLayers();
      })
    );

    // Watch date range form changes
    this.subs.add(
      this.dateRangeForm.valueChanges.subscribe(() => {
        this.renderAllLayers();
      })
    );
  }

  ngAfterViewInit(): void {
    this.initMap();
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 400);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.map?.invalidateSize();
  }

  ngOnDestroy(): void {
    this.stopPlayback();
    this.subs.unsubscribe();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      this.togglePlayback();
    } else if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.toggleFullscreen();
    }
  }

  // --------------------------------------------------------------------------
  // LEAFLET MAP INITIALIZATION & BASE LAYERS
  // --------------------------------------------------------------------------
  private initMap(): void {
    this.ngZone.runOutsideAngular(() => {
      // Fix default Leaflet icon assets
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })['_getIconUrl'];
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
        iconUrl: 'assets/leaflet/marker-icon.png',
        shadowUrl: 'assets/leaflet/marker-shadow.png',
      });

      // Initialize map instance
      this.map = L.map(this.mapContainer.nativeElement, {
        center: [20.5937, 78.9629], // Center of India
        zoom: 5,
        zoomControl: true,
        attributionControl: false,
      });

      // Base Tile Layers
      this.tileLayers = {
        dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
        }),
        osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }),
        satellite: L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 }
        ),
        terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          maxZoom: 17,
        }),
      };

      // Add default street layer
      this.tileLayers['osm'].addTo(this.map);

      // Layer groups
      this.clusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        maxClusterRadius: 40,
      });
      this.geofenceLayerGroup = L.layerGroup().addTo(this.map);
      this.predictionLayerGroup = L.layerGroup().addTo(this.map);
      this.meetingMarkersGroup = L.layerGroup().addTo(this.map);

      // Render layers if targets are loaded
      this.ngZone.run(() => {
        this.renderAllLayers();
      });
    });
  }

  switchBaseLayer(layer: BaseLayerType): void {
    if (!this.map) return;
    this.activeBaseLayer.set(layer);

    this.ngZone.runOutsideAngular(() => {
      Object.values(this.tileLayers).forEach(tl => this.map?.removeLayer(tl));
      this.tileLayers[layer]?.addTo(this.map!);
    });
  }

  // --------------------------------------------------------------------------
  // LAYER RENDERING (ROUTES, NUMBERED MARKERS, CLUSTERS, HEATMAP)
  // --------------------------------------------------------------------------
  private renderAllLayers(): void {
    if (!this.map) return;

    this.ngZone.runOutsideAngular(() => {
      // 1. Clear existing route & marker layers
      this.activeRouteLayers.forEach(lg => this.map?.removeLayer(lg));
      this.activeRouteLayers.clear();

      this.antPathLayers.forEach(ap => this.map?.removeLayer(ap));
      this.antPathLayers.clear();

      this.markerLayers.forEach(mg => this.map?.removeLayer(mg));
      this.markerLayers.clear();

      if (this.clusterGroup) {
        this.clusterGroup.clearLayers();
        this.map?.removeLayer(this.clusterGroup);
      }

      if (this.heatmapLayer) {
        this.map?.removeLayer(this.heatmapLayer);
        this.heatmapLayer = null;
      }

      if (this.predictionLayerGroup) {
        this.predictionLayerGroup.clearLayers();
      }

      // 2. Render each selected target's route
      const selectedIds = this.selectedTargetIds();
      const allPointsForHeatmap: [number, number, number][] = [];
      const bounds = L.latLngBounds([]);

      selectedIds.forEach((targetId, index) => {
        const tgt = this.allTargets().find(t => t.id === targetId);
        if (!tgt || tgt.history.length === 0) return;

        // Use filtered points for active target; all points for others
        const points = targetId === this.activeTargetId() ? this.filteredHistory() : tgt.history;
        if (points.length === 0) return;

        const color = this.getTargetColor(targetId, index);
        const latlngs: [number, number][] = points.map(p => [p.lat, p.lng]);

        latlngs.forEach(ll => {
          bounds.extend(ll);
          allPointsForHeatmap.push([ll[0], ll[1], 0.8]);
        });

        // DRAW ROUTE POLYLINE
        if (this.showRoute()) {
          const routeGroup = L.layerGroup().addTo(this.map!);
          const polyline = L.polyline(latlngs, {
            color: color,
            weight: 4,
            opacity: 0.85,
            smoothFactor: 1,
          }).addTo(routeGroup);

          // Add direction arrows using leaflet-polylinedecorator
          try {
            const decorator = (L as unknown as {
              polylineDecorator: (pl: L.Polyline, opts: unknown) => L.Layer;
              Symbol: { arrowHead: (opts: unknown) => unknown };
            }).polylineDecorator(polyline, {
              patterns: [
                {
                  offset: '25px',
                  repeat: '100px',
                  symbol: (L as unknown as {
                    Symbol: { arrowHead: (opts: unknown) => unknown };
                  }).Symbol.arrowHead({
                    pixelSize: 10,
                    polygon: false,
                    pathOptions: { stroke: true, color: color, weight: 2 },
                  }),
                },
              ],
            });
            decorator.addTo(routeGroup);
          } catch {
            // polyline decorator fallback
          }

          this.activeRouteLayers.set(targetId, routeGroup);

          // ACTIVE ROUTE ANT-PATH ANIMATION
          if (targetId === this.activeTargetId()) {
            try {
              const animatedPath = antPath(latlngs, {
                delay: 800,
                dashArray: [10, 20],
                weight: 4,
                color: color,
                pulseColor: '#ffffff',
                paused: false,
              });
              animatedPath.addTo(this.map!);
              this.antPathLayers.set(targetId, animatedPath);
            } catch {
              // fallback
            }
          }
        }

        // DRAW NUMBERED MARKERS
        const markerGroup = L.layerGroup();
        points.forEach((pt, ptIdx) => {
          const isStart = ptIdx === 0;
          const isEnd = ptIdx === points.length - 1;
          const isLastSeen = isEnd && targetId === this.activeTargetId();

          let markerIcon: L.DivIcon;
          if (isLastSeen) {
            markerIcon = L.divIcon({
              className: '',
              html: `<div class="target-last-seen-marker" style="width:34px;height:34px;font-size:12px;font-weight:bold;">${ptIdx + 1}</div>`,
              iconSize: [34, 34],
              iconAnchor: [17, 17],
            });
          } else {
            const markerBg = isStart ? '#16a34a' : isEnd ? '#dc2626' : color;
            markerIcon = L.divIcon({
              className: '',
              html: `<div class="target-numbered-marker" style="background:${markerBg};width:26px;height:26px;">${ptIdx + 1}</div>`,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            });
          }

          const marker = L.marker([pt.lat, pt.lng], { icon: markerIcon });
          const popupHtml = `
            <div style="font-family: Roboto, sans-serif; min-width: 180px;">
              <div style="font-size: 13px; font-weight: 800; color: #38bdf8;">${tgt.alias} #${ptIdx + 1}</div>
              <div style="font-size: 14px; font-weight: 700; margin: 4px 0;">${pt.city}, ${pt.state}</div>
              <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 6px;">${pt.activity}</div>
              <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
                <span>Source: <strong>${pt.source}</strong></span> • 
                <span>Conf: <strong>${pt.confidence}%</strong></span>
              </div>
              <div style="font-size: 11px; color: #94a3b8;">${new Date(pt.timestamp).toLocaleString()}</div>
            </div>
          `;
          marker.bindPopup(popupHtml);

          if (this.showClustering() && this.clusterGroup) {
            this.clusterGroup.addLayer(marker);
          } else {
            marker.addTo(markerGroup);
          }
        });

        if (this.showClustering() && this.clusterGroup) {
          this.clusterGroup.addTo(this.map!);
        } else {
          markerGroup.addTo(this.map!);
          this.markerLayers.set(targetId, markerGroup);
        }

        // PREDICTED NEXT VECTOR (Requirement 21)
        if (targetId === this.activeTargetId() && this.showPrediction() && points.length >= 2) {
          this.renderPredictionVector(points);
        }
      });

      // 3. GEOFENCES (Requirement 29, 30)
      if (this.showGeofences()) {
        this.renderGeofenceZones();
      }

      // 4. HEATMAP (Requirement 19)
      if (this.showHeatmap() && allPointsForHeatmap.length > 0) {
        try {
          this.heatmapLayer = (L as unknown as {
            heatLayer: (pts: unknown[], opts: unknown) => L.Layer;
          }).heatLayer(allPointsForHeatmap, {
            radius: 35,
            blur: 20,
            maxZoom: 12,
            gradient: { 0.2: '#00f', 0.5: '#0ff', 0.8: '#ff0', 1.0: '#f00' },
          });
          this.heatmapLayer.addTo(this.map!);
        } catch {
          // Heatmap plugin fallback
        }
      }

      // Auto-fit if bounds are valid
      if (bounds.isValid()) {
        this.map!.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    });
  }

  // --------------------------------------------------------------------------
  // PREDICTED NEXT LOCATION (Requirement 21)
  // --------------------------------------------------------------------------
  private renderPredictionVector(points: LocationPoint[]): void {
    if (!this.predictionLayerGroup) return;
    this.predictionLayerGroup.clearLayers();

    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];
    const predicted = predictNextLocation(p1.lat, p1.lng, p2.lat, p2.lng, APP_CONSTANTS.PREDICTED_DISTANCE_KM);

    // Dashed predicted path
    L.polyline([[p2.lat, p2.lng], predicted], {
      color: '#f59e0b',
      dashArray: '6, 8',
      weight: 3,
      opacity: 0.9,
    }).addTo(this.predictionLayerGroup);

    // Translucent confidence circle
    L.circle(predicted, {
      radius: 40000, // 40 km confidence circle
      color: '#f59e0b',
      weight: 1,
      fillColor: '#f59e0b',
      fillOpacity: 0.15,
    }).addTo(this.predictionLayerGroup);

    // Predicted point marker
    const predIcon = L.divIcon({
      className: '',
      html: `<div style="background:#f59e0b;color:#000;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;border:2px solid #fff;box-shadow:0 0 10px #f59e0b;">?</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const predMarker = L.marker(predicted, { icon: predIcon });
    predMarker.bindPopup(`
      <div style="font-family: Roboto; font-size: 12px;">
        <strong style="color: #f59e0b;">PREDICTED NEXT VECTOR</strong>
        <p style="margin: 4px 0;">Estimated trajectory based on bearing & avg velocity.</p>
        <div>Radius: ±40 km confidence buffer</div>
      </div>
    `);
    predMarker.addTo(this.predictionLayerGroup);
  }

  // --------------------------------------------------------------------------
  // GEOFENCE RENDERING (Requirement 29, 30)
  // --------------------------------------------------------------------------
  private renderGeofenceZones(): void {
    if (!this.geofenceLayerGroup) return;
    this.geofenceLayerGroup.clearLayers();

    const zones = this.geofenceService.zones().filter(z => z.active);
    zones.forEach(zone => {
      let layer: L.Layer;
      if (zone.shape === 'polygon' && zone.coordinates) {
        layer = L.polygon(zone.coordinates, {
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.2,
          weight: 2,
        });
      } else if (zone.shape === 'circle' && zone.center && zone.radius) {
        layer = L.circle(zone.center, {
          radius: zone.radius,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.2,
          weight: 2,
        });
      } else {
        return;
      }

      layer.bindPopup(`
        <div style="font-family: Roboto;">
          <strong style="color: ${zone.color};">${zone.name}</strong>
          <p style="font-size: 12px; margin: 4px 0;">${zone.description || 'Restricted Surveillance Zone'}</p>
          <span style="font-size: 11px; color: #94a3b8;">Active Geofence</span>
        </div>
      `);
      layer.addTo(this.geofenceLayerGroup!);
    });
  }

  // --------------------------------------------------------------------------
  // INTERSECTION DETECTION (Requirement 27)
  // --------------------------------------------------------------------------
  detectIntersections(): void {
    const targets = this.allTargets();
    const results: IntersectionResult[] = [];

    // Compare all pairs of targets
    for (let i = 0; i < targets.length; i++) {
      for (let j = i + 1; j < targets.length; j++) {
        const t1 = targets[i];
        const t2 = targets[j];

        t1.history.forEach(p1 => {
          t2.history.forEach(p2 => {
            const dist = haversineKm(p1.lat, p1.lng, p2.lat, p2.lng);
            const timeDiff = Math.abs(new Date(p1.timestamp).getTime() - new Date(p2.timestamp).getTime()) / 3600000;

            if (dist <= 15 && timeDiff <= 8) {
              results.push({
                target1Id: t1.id,
                target1Alias: t1.alias,
                target2Id: t2.id,
                target2Alias: t2.alias,
                city: p1.city,
                lat: p1.lat,
                lng: p1.lng,
                time1: p1.timestamp,
                time2: p2.timestamp,
                timeDiffHours: timeDiff,
                distanceKm: dist,
                activity1: p1.activity,
                activity2: p2.activity,
              });
            }
          });
        });
      }
    }

    // Open MatDialog with meeting points
    const ref = this.dialog.open(IntersectionDialogComponent, {
      width: '780px',
      data: { intersections: results },
    });

    ref.afterClosed().subscribe(highlight => {
      if (highlight && results.length > 0) {
        this.highlightIntersectionsOnMap(results);
      }
    });
  }

  private highlightIntersectionsOnMap(intersections: IntersectionResult[]): void {
    if (!this.meetingMarkersGroup || !this.map) return;
    this.meetingMarkersGroup.clearLayers();

    const bounds = L.latLngBounds([]);
    intersections.forEach(item => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="target-meeting-point-marker" style="width:36px;height:36px;"><span style="font-size:18px;">⚠️</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([item.lat, item.lng], { icon });
      marker.bindPopup(`
        <div style="font-family: Roboto; font-size: 13px;">
          <strong style="color: #f59e0b;">MEETING CONVERGENCE DETECTED</strong>
          <div style="margin: 4px 0; font-weight: 700;">${item.target1Alias} ↔ ${item.target2Alias}</div>
          <div>Location: ${item.city}</div>
          <div>Proximity: ${item.distanceKm.toFixed(1)} km apart</div>
          <div>Delta: ${item.timeDiffHours.toFixed(1)} hours window</div>
        </div>
      `);
      marker.addTo(this.meetingMarkersGroup!);
      bounds.extend([item.lat, item.lng]);
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [80, 80] });
    }
    this.snackBar.open(`${intersections.length} meeting points highlighted on map`, 'Close', { duration: 4000 });
  }

  // --------------------------------------------------------------------------
  // REPLAY ENGINE (Requirement 16)
  // --------------------------------------------------------------------------
  togglePlayback(): void {
    if (this.isPlaying()) {
      this.pausePlayback();
    } else {
      this.startPlayback();
    }
  }

  startPlayback(): void {
    const history = this.filteredHistory();
    if (history.length < 2 || !this.map) return;

    this.isPlaying.set(true);
    const coords: [number, number][] = history.map(p => [p.lat, p.lng]);

    // Create playback marker if not present
    if (!this.playbackMarker) {
      const pIcon = L.divIcon({
        className: '',
        html: `<div style="background:#38bdf8;width:24px;height:24px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px #38bdf8;animation:pulse-critical 1.2s infinite;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      this.playbackMarker = L.marker(coords[0], { icon: pIcon, zIndexOffset: 2000 }).addTo(this.map);
    }

    if (this.playbackProgress() >= 100) {
      this.playbackProgress.set(0);
    }

    const stepMs = 50;
    this.playbackInterval = setInterval(() => {
      this.ngZone.run(() => {
        const speed = this.playbackSpeed();
        const delta = (0.25 * speed);
        const nextProgress = Math.min(this.playbackProgress() + delta, 100);
        this.playbackProgress.set(nextProgress);

        const frac = nextProgress / 100;
        const currentPos = interpolatePosition(coords, frac);

        if (this.playbackMarker) {
          this.playbackMarker.setLatLng(currentPos);
        }

        // Determine which point is active for timeline sync
        const activeIdx = Math.min(Math.floor(frac * history.length), history.length - 1);
        this.currentActiveIndex.set(activeIdx);
        this.currentPlaybackCity.set(history[activeIdx].city);
        this.currentPlaybackTime.set(new Date(history[activeIdx].timestamp).toLocaleString());

        if (nextProgress >= 100) {
          this.pausePlayback();
        }
      });
    }, stepMs);
  }

  pausePlayback(): void {
    this.isPlaying.set(false);
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  stopPlayback(): void {
    this.pausePlayback();
    this.playbackProgress.set(0);
    this.currentActiveIndex.set(-1);
    this.currentPlaybackCity.set('');
    this.currentPlaybackTime.set('');

    if (this.playbackMarker && this.map) {
      this.map.removeLayer(this.playbackMarker);
      this.playbackMarker = null;
    }
  }

  setSpeed(s: number): void {
    this.playbackSpeed.set(s);
  }

  onProgressScrub(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.playbackProgress.set(val);

    const history = this.filteredHistory();
    if (history.length < 2) return;

    const coords: [number, number][] = history.map(p => [p.lat, p.lng]);
    const frac = val / 100;
    const currentPos = interpolatePosition(coords, frac);

    if (!this.playbackMarker && this.map) {
      const pIcon = L.divIcon({
        className: '',
        html: `<div style="background:#38bdf8;width:24px;height:24px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px #38bdf8;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      this.playbackMarker = L.marker(currentPos, { icon: pIcon, zIndexOffset: 2000 }).addTo(this.map);
    } else if (this.playbackMarker) {
      this.playbackMarker.setLatLng(currentPos);
    }

    const activeIdx = Math.min(Math.floor(frac * history.length), history.length - 1);
    this.currentActiveIndex.set(activeIdx);
    this.currentPlaybackCity.set(history[activeIdx].city);
    this.currentPlaybackTime.set(new Date(history[activeIdx].timestamp).toLocaleString());
  }

  // --------------------------------------------------------------------------
  // TIMELINE & MAP INTERACTIONS
  // --------------------------------------------------------------------------
  flyToPoint(point: LocationPoint, index: number): void {
    if (!this.map) return;
    this.currentActiveIndex.set(index);
    this.map.flyTo([point.lat, point.lng], 13, { duration: 1.2 });
  }

  highlightMarker(index: number): void {
    this.currentActiveIndex.set(index);
  }

  resetHighlight(): void {
    // Keep active during playback
    if (!this.isPlaying()) {
      this.currentActiveIndex.set(-1);
    }
  }

  getDwellHours(point: LocationPoint): number {
    const history = this.filteredHistory();
    const idx = history.indexOf(point);
    if (idx === -1 || idx === history.length - 1) return 0;
    const nextPt = history[idx + 1];
    if (haversineKm(point.lat, point.lng, nextPt.lat, nextPt.lng) < 5) {
      return (new Date(nextPt.timestamp).getTime() - new Date(point.timestamp).getTime()) / 3600000;
    }
    return 0;
  }

  // --------------------------------------------------------------------------
  // TARGET & FILTER CONTROLS
  // --------------------------------------------------------------------------
  onTargetChange(targetId: string): void {
    this.stopPlayback();
    this.activeTargetId.set(targetId);
    if (!this.selectedTargetIds().includes(targetId)) {
      this.selectedTargetIds.update(ids => [...ids, targetId]);
    }
    this.renderAllLayers();
    this.fitToRoute();
  }

  toggleTargetComparison(targetId: string): void {
    const current = this.selectedTargetIds();
    if (current.includes(targetId)) {
      if (current.length === 1) return; // keep at least 1
      this.selectedTargetIds.set(current.filter(id => id !== targetId));
      if (this.activeTargetId() === targetId) {
        this.activeTargetId.set(this.selectedTargetIds()[0]);
      }
    } else {
      if (current.length >= APP_CONSTANTS.MAX_MULTI_TARGET_COMPARE) {
        this.snackBar.open(`Maximum of ${APP_CONSTANTS.MAX_MULTI_TARGET_COMPARE} targets can be compared`, 'Close', { duration: 2500 });
        return;
      }
      this.selectedTargetIds.set([...current, targetId]);
    }
    this.renderAllLayers();
  }

  isTargetSelected(id: string): boolean {
    return this.selectedTargetIds().includes(id);
  }

  getTargetColor(targetId: string, idx = 0): string {
    const index = this.selectedTargetIds().indexOf(targetId);
    const colorIdx = index >= 0 ? index : idx;
    return APP_CONSTANTS.ROUTE_COLORS[colorIdx % APP_CONSTANTS.ROUTE_COLORS.length];
  }

  getTargetById(id: string): Target | undefined {
    return this.allTargets().find(t => t.id === id);
  }

  applyPresetFilter(days: number): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    this.dateRangeForm.setValue({ start, end });
  }

  clearDateFilter(): void {
    this.dateRangeForm.reset();
  }

  // --------------------------------------------------------------------------
  // OVERLAY TOGGLES
  // --------------------------------------------------------------------------
  toggleRouteLayer(): void {
    this.showRoute.update(v => !v);
    this.renderAllLayers();
  }

  toggleHeatmap(): void {
    this.showHeatmap.update(v => !v);
    this.renderAllLayers();
  }

  toggleClustering(): void {
    this.showClustering.update(v => !v);
    this.renderAllLayers();
  }

  toggleGeofences(): void {
    this.showGeofences.update(v => !v);
    this.renderAllLayers();
  }

  togglePrediction(): void {
    this.showPrediction.update(v => !v);
    this.renderAllLayers();
  }

  fitToRoute(): void {
    if (!this.map) return;
    const history = this.filteredHistory();
    if (history.length === 0) return;
    const bounds = L.latLngBounds(history.map(p => [p.lat, p.lng]));
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  locateLastSeen(): void {
    if (!this.map) return;
    const history = this.filteredHistory();
    if (history.length === 0) return;
    const last = history[history.length - 1];
    this.map.flyTo([last.lat, last.lng], 14, { duration: 1.5 });
  }

  toggleFullscreen(): void {
    this.isFullscreen.update(v => !v);
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  // --------------------------------------------------------------------------
  // EXPORTS (Requirement 35)
  // --------------------------------------------------------------------------
  exportReport(format: 'pdf' | 'csv' | 'geojson'): void {
    const tgt = this.activeTarget();
    if (!tgt) return;
    const history = this.filteredHistory();

    if (format === 'csv') {
      this.exportService.exportCSV(tgt, history);
    } else if (format === 'geojson') {
      this.exportService.exportGeoJSON(tgt, history);
    } else if (format === 'pdf') {
      this.exportService.exportPDF(tgt, history, this.stats());
    }
  }
}
