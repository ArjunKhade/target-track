import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pure pipe that formats a numeric kilometre value as "1,234.5 km".
 *
 * Usage: {{ distance | formatKm }}
 */
@Pipe({
  name: 'formatKm',
  standalone: true,
  pure: true,
})
export class FormatKmPipe implements PipeTransform {
  private readonly _formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '— km';
    }
    return `${this._formatter.format(value)} km`;
  }
}
