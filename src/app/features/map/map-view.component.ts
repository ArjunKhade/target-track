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
import { Subject, Subscription } from 'rxjs';

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
  template: `
    <div class="map-view-shell" [class.is-fullscreen]="isFullscreen()">
      <!-- LEFT PANEL -->
      <aside class="left-panel" [class.mobile-hidden]="!showMobileDossier()">
        <!-- Target Selector & Quick Switcher -->
        <div class="target-selector-bar">
          <mat-form-field appearance="outline" class="w-full compact-field">
            <mat-label>Active Tracking Target</mat-label>
            <mat-select [value]="activeTargetId()" (selectionChange)="onTargetChange($event.value)">
              @for (tgt of allTargets(); track tgt.id) {
                <mat-option [value]="tgt.id">
                  {{ tgt.alias }} — {{ tgt.fullName }} ({{ tgt.threatLevel }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Multi-Target Compare Toggle -->
          <div class="multi-target-chips">
            <span class="chips-label">Compare (max 5):</span>
            <div class="chips-row">
              @for (tgt of allTargets(); track tgt.id) {
                <span
                  class="compare-chip"
                  [class.selected]="isTargetSelected(tgt.id)"
                  [style.border-color]="getTargetColor(tgt.id)"
                  (click)="toggleTargetComparison(tgt.id)"
                >
                  {{ tgt.alias }}
                </span>
              }
            </div>
          </div>
        </div>

        @if (activeTarget(); as tgt) {
          <!-- Profile Card -->
          <mat-card class="profile-card">
            <div class="profile-header">
              <app-avatar [name]="tgt.alias" size="lg"></app-avatar>
              <div class="profile-meta">
                <div class="alias-row">
                  <span class="alias">{{ tgt.alias }}</span>
                  <app-threat-chip [threatLevel]="tgt.threatLevel"></app-threat-chip>
                </div>
                <div class="full-name">{{ tgt.fullName }}</div>
                <div class="org-category">{{ tgt.organization }} • {{ tgt.category }}</div>
                <div class="status-row">
                  <app-status-badge [status]="tgt.status"></app-status-badge>
                  @if (hasGeofenceViolation()) {
                    <span class="geofence-warning-chip" matTooltip="Target entered a restricted zone">
                      <mat-icon>warning</mat-icon> ZONE BREACH
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Date Range Filter -->
            <div class="date-filter-section">
              <div class="preset-buttons">
                <button mat-button class="preset-btn" (click)="applyPresetFilter(1)">24h</button>
                <button mat-button class="preset-btn" (click)="applyPresetFilter(7)">7d</button>
                <button mat-button class="preset-btn" (click)="applyPresetFilter(14)">14d</button>
                <button mat-button class="preset-btn" (click)="clearDateFilter()">All</button>
              </div>
              <mat-form-field appearance="outline" class="w-full date-picker-field">
                <mat-label>Custom Date Range</mat-label>
                <mat-date-range-input [formGroup]="dateRangeForm" [rangePicker]="picker">
                  <input matStartDate formControlName="start" placeholder="Start date" />
                  <input matEndDate formControlName="end" placeholder="End date" />
                </mat-date-range-input>
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-date-range-picker #picker></mat-date-range-picker>
              </mat-form-field>
            </div>

            <!-- Route Stats Dashboard -->
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">{{ stats().totalKm | formatKm }}</div>
                <div class="stat-lbl">Distance</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">{{ stats().avgSpeedKmh | number:'1.0-1' }} km/h</div>
                <div class="stat-lbl">Avg Speed</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">{{ stats().citiesCount }}</div>
                <div class="stat-lbl">Cities</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">{{ stats().pointsCount }}</div>
                <div class="stat-lbl">Sightings</div>
              </div>
            </div>
          </mat-card>

          <!-- TABS: Timeline | Notes | Associates | Evidence -->
          <div class="tabs-container">
            <mat-tab-group animationDuration="150ms">
              <!-- Tab 1: Timeline -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="tab-icon">timeline</mat-icon> Timeline
                </ng-template>
                <div class="timeline-list">
                  @for (pt of filteredHistory(); track pt.timestamp; let idx = $index) {
                    <div
                      class="timeline-node"
                      [class.active-playback]="currentActiveIndex() === idx"
                      (click)="flyToPoint(pt, idx)"
                      (mouseenter)="highlightMarker(idx)"
                      (mouseleave)="resetHighlight()"
                    >
                      <div class="node-badge" [class.start]="idx === 0" [class.last]="idx === filteredHistory().length - 1">
                        {{ idx + 1 }}
                      </div>
                      <div class="node-info">
                        <div class="node-header">
                          <span class="city-name">{{ pt.city }}, {{ pt.state }}</span>
                          <span class="timestamp">{{ pt.timestamp | date:'short' }}</span>
                        </div>
                        <div class="node-activity">{{ pt.activity }}</div>
                        <div class="node-footer">
                          <span class="source-tag">{{ pt.source }}</span>
                          <span class="confidence-tag">Conf: {{ pt.confidence | confidence }}</span>
                          @if (getDwellHours(pt) > 2) {
                            <span class="dwell-tag" matTooltip="Target dwelled at this location">
                              <mat-icon>hourglass_top</mat-icon> {{ getDwellHours(pt) | number:'1.1-1' }}h dwell
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                  @if (filteredHistory().length === 0) {
                    <div class="empty-tab">No sightings recorded within selected date filter.</div>
                  }
                </div>
              </mat-tab>

              <!-- Tab 2: Case Notes -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="tab-icon">note_alt</mat-icon> Notes
                </ng-template>
                <app-case-notes [targetId]="tgt.id" [targetAlias]="tgt.alias"></app-case-notes>
              </mat-tab>

              <!-- Tab 3: Associates Graph -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="tab-icon">hub</mat-icon> Network
                </ng-template>
                <div class="associates-tab">
                  <div class="network-chart-container">
                    <div echarts [options]="associatesGraphOption()" class="network-chart"></div>
                  </div>
                  <div class="associates-list">
                    <h4>Direct Associates ({{ tgt.knownAssociates.length }})</h4>
                    @for (assocId of tgt.knownAssociates; track assocId) {
                      @if (getTargetById(assocId); as assoc) {
                        <div class="associate-card" (click)="onTargetChange(assoc.id)">
                          <app-avatar [name]="assoc.alias" size="sm"></app-avatar>
                          <div class="assoc-info">
                            <span class="assoc-alias">{{ assoc.alias }}</span>
                            <span class="assoc-role">{{ assoc.category }} • {{ assoc.threatLevel }}</span>
                          </div>
                          <button mat-icon-button matTooltip="Switch to target">
                            <mat-icon>chevron_right</mat-icon>
                          </button>
                        </div>
                      }
                    }
                  </div>
                </div>
              </mat-tab>

              <!-- Tab 4: Evidence -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="tab-icon">folder_shared</mat-icon> Evidence
                </ng-template>
                <app-evidence [targetId]="tgt.id" [targetAlias]="tgt.alias"></app-evidence>
              </mat-tab>
            </mat-tab-group>
          </div>
        }
      </aside>

      <!-- RIGHT PANEL: LEAFLET MAP & TACTICAL CONTROLS -->
      <main class="map-panel">
        <!-- MAP TOOLBAR -->
        <header class="map-toolbar">
          <!-- Mobile Dossier Toggle Button -->
          <button
            mat-button
            class="mobile-dossier-toggle"
            [class.active]="showMobileDossier()"
            (click)="toggleMobileDossier()"
          >
            <mat-icon>{{ showMobileDossier() ? 'map' : 'badge' }}</mat-icon>
            <span>{{ showMobileDossier() ? 'Full Map' : 'Dossier' }}</span>
          </button>

          <!-- Base Layer Switcher -->
          <div class="toolbar-group">
            <span class="group-label">Map:</span>
            <button
              mat-button
              class="toolbar-btn"
              [class.active]="activeBaseLayer() === 'dark'"
              (click)="switchBaseLayer('dark')"
            >
              Dark
            </button>
            <button
              mat-button
              class="toolbar-btn"
              [class.active]="activeBaseLayer() === 'osm'"
              (click)="switchBaseLayer('osm')"
            >
              Street
            </button>
            <button
              mat-button
              class="toolbar-btn"
              [class.active]="activeBaseLayer() === 'satellite'"
              (click)="switchBaseLayer('satellite')"
            >
              Satellite
            </button>
            <button
              mat-button
              class="toolbar-btn"
              [class.active]="activeBaseLayer() === 'terrain'"
              (click)="switchBaseLayer('terrain')"
            >
              Terrain
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- Layer Toggles -->
          <div class="toolbar-group">
            <span class="group-label">Overlays:</span>
            <button
              mat-icon-button
              [class.active-toggle]="showRoute()"
              (click)="toggleRouteLayer()"
              matTooltip="Toggle Travel Route"
            >
              <mat-icon>route</mat-icon>
            </button>
            <button
              mat-icon-button
              [class.active-toggle]="showHeatmap()"
              (click)="toggleHeatmap()"
              matTooltip="Toggle Heatmap"
            >
              <mat-icon>local_fire_department</mat-icon>
            </button>
            <button
              mat-icon-button
              [class.active-toggle]="showClustering()"
              (click)="toggleClustering()"
              matTooltip="Toggle Marker Clustering"
            >
              <mat-icon>bubble_chart</mat-icon>
            </button>
            <button
              mat-icon-button
              [class.active-toggle]="showGeofences()"
              (click)="toggleGeofences()"
              matTooltip="Toggle Geofence Zones"
            >
              <mat-icon>fence</mat-icon>
            </button>
            <button
              mat-icon-button
              [class.active-toggle]="showPrediction()"
              (click)="togglePrediction()"
              matTooltip="Predicted Next Vector"
            >
              <mat-icon>trending_flat</mat-icon>
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- Tactical Tools -->
          <div class="toolbar-group">
            <button mat-icon-button (click)="fitToRoute()" matTooltip="Fit Map to Route">
              <mat-icon>zoom_out_map</mat-icon>
            </button>
            <button mat-icon-button (click)="locateLastSeen()" matTooltip="Locate Last Known Position">
              <mat-icon>my_location</mat-icon>
            </button>
            <button
              mat-button
              class="warn-btn"
              (click)="detectIntersections()"
              matTooltip="Detect Cross-Target Convergences"
            >
              <mat-icon>merge_type</mat-icon> Intersections
            </button>
            <button mat-icon-button [matMenuTriggerFor]="exportMenu" matTooltip="Export Intelligence Report">
              <mat-icon>file_download</mat-icon>
            </button>
            <mat-menu #exportMenu="matMenu">
              <button mat-menu-item (click)="exportReport('pdf')">
                <mat-icon>picture_as_pdf</mat-icon> PDF Intelligence Dossier
              </button>
              <button mat-menu-item (click)="exportReport('csv')">
                <mat-icon>table_view</mat-icon> CSV Travel Log
              </button>
              <button mat-menu-item (click)="exportReport('geojson')">
                <mat-icon>public</mat-icon> GeoJSON Route Features
              </button>
            </mat-menu>
            <button mat-icon-button (click)="toggleFullscreen()" matTooltip="Toggle Fullscreen (F)">
              <mat-icon>{{ isFullscreen() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
            </button>
          </div>
        </header>

        <!-- MAP CONTAINER -->
        <div class="map-wrapper">
          <div #mapContainer class="map-canvas"></div>

          <!-- CONFIDENTIAL WATERMARK OVERLAY -->
          <div class="confidential-watermark-overlay">
            CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE
          </div>

          <!-- MULTI-TARGET LEGEND (if multi-mode) -->
          @if (selectedTargetIds().length > 1) {
            <div class="map-legend">
              <div class="legend-title">Active Routes:</div>
              @for (id of selectedTargetIds(); track id) {
                @if (getTargetById(id); as t) {
                  <div class="legend-item">
                    <span class="legend-dot" [style.background-color]="getTargetColor(id)"></span>
                    <span class="legend-alias">{{ t.alias }}</span>
                  </div>
                }
              }
            </div>
          }
        </div>

        <!-- BOTTOM REPLAY CONTROL BAR -->
        <footer class="replay-bar">
          <div class="replay-buttons">
            <button mat-icon-button (click)="stopPlayback()" matTooltip="Stop & Reset">
              <mat-icon>stop</mat-icon>
            </button>
            <button
              mat-mini-fab
              color="primary"
              (click)="togglePlayback()"
              matTooltip="Play / Pause (Space)"
            >
              <mat-icon>{{ isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
            </button>
          </div>

          <!-- Speed selector -->
          <div class="speed-selector">
            <button
              mat-button
              class="speed-btn"
              [class.active]="playbackSpeed() === 1"
              (click)="setSpeed(1)"
            >
              1x
            </button>
            <button
              mat-button
              class="speed-btn"
              [class.active]="playbackSpeed() === 2"
              (click)="setSpeed(2)"
            >
              2x
            </button>
            <button
              mat-button
              class="speed-btn"
              [class.active]="playbackSpeed() === 5"
              (click)="setSpeed(5)"
            >
              5x
            </button>
            <button
              mat-button
              class="speed-btn"
              [class.active]="playbackSpeed() === 10"
              (click)="setSpeed(10)"
            >
              10x
            </button>
          </div>

          <!-- Scrubber Slider -->
          <div class="scrubber-wrapper">
            <mat-slider min="0" max="100" step="0.5" class="scrubber-slider">
              <input
                matSliderThumb
                [value]="playbackProgress()"
                (input)="onProgressScrub($event)"
              />
            </mat-slider>
          </div>

          <!-- Live Playback Status -->
          <div class="replay-readout">
            <span class="readout-city">{{ currentPlaybackCity() || 'Ready' }}</span>
            <span class="readout-time">{{ currentPlaybackTime() }}</span>
          </div>
        </footer>
      </main>
    </div>
  `,
  styles: [`
    .map-view-shell {
      display: flex;
      height: calc(100vh - 64px);
      width: 100%;
      background: var(--bg-app, #090d16);
      color: var(--text-primary, #e2e8f0);
      overflow: hidden;
      position: relative;
    }
    .map-view-shell.is-fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
    }

    /* LEFT PANEL */
    .left-panel {
      width: 440px;
      min-width: 440px;
      max-width: 440px;
      background: var(--bg-sidebar, #0c121e);
      border-right: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      z-index: 10;
    }
    @media (max-width: 1024px) {
      .map-view-shell {
        flex-direction: column-reverse;
      }
      .left-panel {
        width: 100%;
        min-width: 100%;
        max-width: 100%;
        height: 50%;
        border-right: none;
        border-top: 1px solid var(--border-color);
        transition: all 0.25s ease;
      }
      .left-panel.mobile-hidden {
        display: none !important;
      }
      .map-panel {
        flex: 1;
        width: 100%;
      }
    }

    .target-selector-bar {
      padding: 12px 16px 8px;
      background: var(--bg-surface, #0f172a);
      border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
    }
    .compact-field {
      margin-bottom: -10px;
    }
    .w-full {
      width: 100%;
    }
    .multi-target-chips {
      margin-top: 8px;
    }
    .chips-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      color: var(--text-secondary, #94a3b8);
      display: block;
      margin-bottom: 4px;
    }
    .chips-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .compare-chip {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.2));
      cursor: pointer;
      user-select: none;
      background: var(--bg-app, rgba(255, 255, 255, 0.04));
      color: var(--text-secondary);
      transition: all 0.2s;
    }
    .compare-chip.selected {
      background: rgba(2, 132, 199, 0.15);
      color: #0284c7;
      border-color: #0284c7;
    }
    body.theme-dark .compare-chip.selected {
      background: rgba(56, 189, 248, 0.25);
      color: #38bdf8;
      border-color: #38bdf8;
    }

    .profile-card {
      margin: 12px 16px;
      padding: 16px;
      background: var(--bg-surface, #111827);
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      border-radius: 8px;
    }
    .profile-header {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    .profile-meta {
      flex: 1;
    }
    .alias-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .alias {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: var(--text-primary, #f8fafc);
    }
    .full-name {
      font-size: 0.9rem;
      color: var(--text-secondary, #cbd5e1);
      margin-top: 2px;
    }
    .org-category {
      font-size: 0.78rem;
      color: var(--text-muted, #94a3b8);
      margin: 4px 0;
    }
    .status-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }
    .geofence-warning-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
      padding: 2px 6px;
      border-radius: 4px;
      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .date-filter-section {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));
    }
    .preset-buttons {
      display: flex;
      gap: 4px;
      margin-bottom: 6px;
    }
    .preset-btn {
      font-size: 0.75rem;
      min-width: 44px;
      padding: 0 8px;
      height: 26px;
      line-height: 26px;
      background: var(--bg-app, rgba(255, 255, 255, 0.05));
      color: var(--text-secondary);
    }
    .date-picker-field {
      margin-bottom: -16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));
    }
    .stat-box {
      text-align: center;
      background: var(--bg-app, rgba(255, 255, 255, 0.02));
      padding: 6px 4px;
      border-radius: 6px;
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.04));
    }
    .stat-value {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0284c7;
      font-family: 'JetBrains Mono', monospace;
    }
    body.theme-dark .stat-value {
      color: #38bdf8;
    }
    .stat-lbl {
      font-size: 0.68rem;
      text-transform: uppercase;
      color: var(--text-secondary, #94a3b8);
      margin-top: 2px;
    }

    .tabs-container {
      flex: 1;
      padding: 0 16px 16px;
    }
    .tab-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }

    /* Timeline list */
    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px 0;
    }
    .timeline-node {
      display: flex;
      gap: 12px;
      padding: 10px;
      background: var(--bg-surface, rgba(255, 255, 255, 0.02));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        background: var(--menu-hover);
        border-color: #0284c7;
      }
    }
    .timeline-node.active-playback {
      border-color: #0284c7;
      background: rgba(2, 132, 199, 0.12);
    }
    body.theme-dark .timeline-node.active-playback {
      border-color: #38bdf8;
      background: rgba(56, 189, 248, 0.15);
    }
    .node-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--bg-app);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      border: 2px solid var(--border-color);
      flex-shrink: 0;
    }
    .node-badge.start {
      background: #15803d;
      color: #fff;
      border-color: #22c55e;
    }
    .node-badge.last {
      background: #b91c1c;
      color: #fff;
      border-color: #ef4444;
    }
    .node-info {
      flex: 1;
    }
    .node-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .city-name {
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--text-primary);
    }
    .timestamp {
      font-size: 0.72rem;
      color: var(--text-secondary);
    }
    .node-activity {
      font-size: 0.82rem;
      color: var(--text-secondary);
      margin: 4px 0;
    }
    .node-footer {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-top: 4px;
      flex-wrap: wrap;
    }
    .source-tag, .confidence-tag {
      font-size: 0.7rem;
      padding: 1px 6px;
      border-radius: 4px;
      background: var(--bg-app);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }
    .dwell-tag {
      font-size: 0.7rem;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(245, 158, 11, 0.15);
      color: #d97706;
      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }
    }
    body.theme-dark .dwell-tag {
      color: #fbbf24;
    }
    .empty-tab {
      padding: 24px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    /* Associates tab */
    .network-chart-container {
      width: 100%;
      height: 240px;
      background: var(--bg-app);
      border-radius: 8px;
      margin: 12px 0;
      border: 1px solid var(--border-color);
    }
    .network-chart {
      width: 100%;
      height: 100%;
    }
    .associates-list h4 {
      font-size: 0.85rem;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin: 12px 0 8px;
    }
    .associate-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      margin-bottom: 6px;
      cursor: pointer;
      &:hover {
        background: var(--menu-hover);
      }
    }
    .assoc-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .assoc-alias {
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--text-primary);
    }
    .assoc-role {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    /* RIGHT PANEL */
    .map-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      height: 100%;
    }

    .map-toolbar {
      height: 48px;
      background: var(--bg-toolbar);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
      overflow-x: auto;
      z-index: 5;
      color: var(--text-primary);

      button[mat-icon-button] {
        color: var(--text-primary);
        --mdc-icon-button-icon-color: var(--text-primary);
      }
    }
    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .group-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-right: 4px;
      font-weight: 700;
    }
    .toolbar-btn {
      font-size: 0.75rem;
      padding: 0 8px;
      height: 28px;
      line-height: 28px;
      color: var(--text-secondary);
      --mdc-text-button-label-text-color: var(--text-secondary);
    }
    .toolbar-btn.active {
      background: rgba(2, 132, 199, 0.15);
      color: #0284c7;
      --mdc-text-button-label-text-color: #0284c7;
      font-weight: 700;
    }
    body.theme-dark .toolbar-btn.active {
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      --mdc-text-button-label-text-color: #38bdf8;
    }
    .active-toggle {
      color: #0284c7 !important;
      --mdc-icon-button-icon-color: #0284c7 !important;
      background: rgba(2, 132, 199, 0.15) !important;
    }
    body.theme-dark .active-toggle {
      color: #38bdf8 !important;
      --mdc-icon-button-icon-color: #38bdf8 !important;
      background: rgba(56, 189, 248, 0.15) !important;
    }
    .toolbar-divider {
      width: 1px;
      height: 24px;
      background: var(--border-color);
    }
    .warn-btn {
      color: #d97706;
      --mdc-text-button-label-text-color: #d97706;
      font-size: 0.75rem;
      height: 28px;
      line-height: 28px;
    }
    body.theme-dark .warn-btn {
      color: #f59e0b;
      --mdc-text-button-label-text-color: #f59e0b;
    }

    .map-wrapper {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
    .map-canvas {
      width: 100%;
      height: 100%;
    }

    .map-legend {
      position: absolute;
      top: 16px;
      right: 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px 14px;
      z-index: 1000;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      color: var(--text-primary);
    }
    .legend-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .legend-alias {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    /* REPLAY BAR */
    .replay-bar {
      height: 56px;
      background: var(--bg-toolbar);
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 16px;
      z-index: 5;
      color: var(--text-primary);

      button[mat-icon-button] {
        color: var(--text-primary);
      }
    }
    .replay-buttons {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .speed-selector {
      display: flex;
      gap: 2px;
    }
    .speed-btn {
      font-size: 0.75rem;
      min-width: 32px;
      padding: 0 6px;
      height: 26px;
      line-height: 26px;
      color: var(--text-secondary);
    }
    .speed-btn.active {
      background: #0284c7;
      color: #fff;
      font-weight: 700;
    }
    body.theme-dark .speed-btn.active {
      background: #38bdf8;
      color: #000;
    }
    .scrubber-wrapper {
      flex: 1;
    }
    .scrubber-slider {
      width: 100%;
    }
    .replay-readout {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      min-width: 140px;
    }
    .readout-city {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0284c7;
    }
    body.theme-dark .readout-city {
      color: #38bdf8;
    }
    .readout-time {
      font-size: 0.72rem;
      color: var(--text-secondary);
      font-family: 'JetBrains Mono', monospace;
    }

    .mobile-dossier-toggle {
      display: none;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      height: 30px;
      line-height: 30px;
      padding: 0 10px;
      border-radius: 15px;
      background: rgba(2, 132, 199, 0.15);
      color: #0284c7;
      border: 1px solid #0284c7;
      white-space: nowrap;
      flex-shrink: 0;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.active {
        background: #0284c7;
        color: #fff;
      }
    }
    body.theme-dark .mobile-dossier-toggle {
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      border-color: #38bdf8;
      &.active {
        background: #38bdf8;
        color: #000;
      }
    }

    @media (max-width: 1024px) {
      .mobile-dossier-toggle {
        display: inline-flex !important;
      }
    }

    @media (max-width: 768px) {
      .map-toolbar {
        padding: 0 8px;
        gap: 6px;
        height: 44px;
      }
      .toolbar-group {
        gap: 2px;
      }
      .group-label {
        display: none;
      }
      .toolbar-btn {
        padding: 0 6px;
        font-size: 0.7rem;
        height: 26px;
        line-height: 26px;
      }
      .warn-btn {
        padding: 0 6px;
        font-size: 0.7rem;
      }
      
      /* Mobile Replay Bar Overhaul */
      .replay-bar {
        height: auto;
        min-height: 52px;
        padding: 8px 10px;
        flex-wrap: wrap;
        gap: 6px 10px;
      }
      .replay-buttons {
        order: 1;
        gap: 4px;
        button[mat-icon-button] {
          width: 32px;
          height: 32px;
        }
        button[mat-mini-fab] {
          width: 36px;
          height: 36px;
        }
      }
      .speed-selector {
        order: 2;
        gap: 2px;
        .speed-btn {
          min-width: 26px;
          padding: 0 4px;
          font-size: 0.68rem;
          height: 24px;
          line-height: 24px;
        }
      }
      .replay-readout {
        order: 3;
        margin-left: auto;
        min-width: unset;
        text-align: right;
        .readout-city {
          font-size: 0.78rem;
          line-height: 1.1;
        }
        .readout-time {
          font-size: 0.65rem;
          line-height: 1.1;
        }
      }
      .scrubber-wrapper {
        order: 4;
        width: 100%;
        flex: 1 1 100%;
        margin-top: -2px;
      }
      .map-legend {
        top: 8px;
        right: 8px;
        padding: 6px 10px;
      }
    }

    @media (max-width: 480px) {
      .map-toolbar {
        padding: 0 4px;
        gap: 4px;
      }
      .replay-bar {
        padding: 6px 8px;
      }
      .replay-readout {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  `],
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
  readonly activeBaseLayer = signal<BaseLayerType>('dark');
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
    // Load targets from TargetService
    this.subs.add(
      this.targetService.getTargets().subscribe(targets => {
        this.allTargets.set(targets);

        // Check route query param or url param
        const queryId = this.route.snapshot.queryParamMap.get('targetId');
        const paramId = this.route.snapshot.paramMap.get('id');
        const targetId = paramId || queryId;

        if (targetId && targets.some(t => t.id === targetId)) {
          this.activeTargetId.set(targetId);
          this.selectedTargetIds.set([targetId]);
        } else if (targets.length > 0) {
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

      // Add default dark layer
      this.tileLayers['dark'].addTo(this.map);

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
