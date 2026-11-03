import { Injectable, signal, computed } from '@angular/core';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';

export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<AppTheme>(this._loadTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  toggle(): void {
    const next: AppTheme = this._theme() === 'dark' ? 'light' : 'dark';
    this._theme.set(next);
    this._applyTheme(next);
    localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.THEME, next);
  }

  setTheme(theme: AppTheme): void {
    this._theme.set(theme);
    this._applyTheme(theme);
    localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.THEME, theme);
  }

  private _loadTheme(): AppTheme {
    try {
      const stored = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.THEME);
      if (stored === 'light' || stored === 'dark') return stored;
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch {
      // Fallback
    }
    return 'dark';
  }

  private _applyTheme(theme: AppTheme): void {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${theme}`);
  }

  initTheme(): void {
    this._applyTheme(this._theme());
  }
}

