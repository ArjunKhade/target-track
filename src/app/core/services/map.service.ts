import { Injectable, signal, computed } from '@angular/core';

export type BaseLayerType = 'osm' | 'satellite' | 'dark' | 'terrain';

export interface DateFilterRange {
  start: Date | null;
  end: Date | null;
}

@Injectable({ providedIn: 'root' })
export class MapService {
  // Target selections for single/multi-target analysis
  readonly selectedTargetIds = signal<string[]>([]);
  readonly activeTargetId = signal<string | null>(null);

  // Filters & visual layer states
  readonly dateRange = signal<DateFilterRange>({ start: null, end: null });
  readonly showHeatmap = signal<boolean>(false);
  readonly showGeofences = signal<boolean>(true);
  readonly showPrediction = signal<boolean>(false);
  readonly showDwellLocations = signal<boolean>(true);
  readonly showClustering = signal<boolean>(false);
  readonly activeBaseLayer = signal<BaseLayerType>('dark');

  // Computed state
  readonly isMultiTargetMode = computed(() => this.selectedTargetIds().length > 1);
  readonly selectedCount = computed(() => this.selectedTargetIds().length);

  selectTarget(id: string): void {
    if (!this.selectedTargetIds().includes(id)) {
      this.selectedTargetIds.update(ids => [...ids, id]);
    }
    this.activeTargetId.set(id);
  }

  deselectTarget(id: string): void {
    this.selectedTargetIds.update(ids => ids.filter(tId => tId !== id));
    if (this.activeTargetId() === id) {
      const remaining = this.selectedTargetIds();
      this.activeTargetId.set(remaining.length > 0 ? remaining[0] : null);
    }
  }

  toggleTarget(id: string): void {
    if (this.selectedTargetIds().includes(id)) {
      this.deselectTarget(id);
    } else {
      this.selectTarget(id);
    }
  }

  setTargets(ids: string[]): void {
    this.selectedTargetIds.set(ids);
    this.activeTargetId.set(ids.length > 0 ? ids[0] : null);
  }

  clearSelection(): void {
    this.selectedTargetIds.set([]);
    this.activeTargetId.set(null);
  }

  setDateRange(start: Date | null, end: Date | null): void {
    this.dateRange.set({ start, end });
  }

  setPresetDateRange(days: number): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    this.setDateRange(start, end);
  }

  setBaseLayer(layer: BaseLayerType): void {
    this.activeBaseLayer.set(layer);
  }
}

