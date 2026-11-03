import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MapViewComponent } from '../../map/map-view.component';

@Component({
  selector: 'app-target-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MapViewComponent],
  template: `<app-map-view></app-map-view>`,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
  `],
})
export class TargetDetailComponent {}

