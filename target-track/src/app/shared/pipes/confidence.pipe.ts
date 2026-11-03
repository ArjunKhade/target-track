import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pure pipe that formats a 0–100 confidence number as a percentage string.
 *
 * Usage: {{ confidence | confidence }}  →  "85%"
 */
@Pipe({
  name: 'confidence',
  standalone: true,
  pure: true,
})
export class ConfidencePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '—';
    }
    const clamped = Math.min(100, Math.max(0, Math.round(value)));
    return `${clamped}%`;
  }
}
