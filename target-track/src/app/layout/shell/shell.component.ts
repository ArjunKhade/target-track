import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  inject,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { AlertService } from '../../core/services/alert.service';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  protected readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpointObserver = inject(BreakpointObserver);

  // Sidenav state
  readonly sidenavOpened = signal(true);
  readonly isMobile = signal(false);
  readonly sidenavMode = computed<'side' | 'over'>(() =>
    this.isMobile() ? 'over' : 'side'
  );

  // Live clock
  readonly currentTime = signal<Date>(new Date());

  // Page title derived from router
  readonly pageTitle = signal('Dashboard');

  // Session timeout
  private _lastActivity = Date.now();
  private _sessionWarningShown = false;

  // Subscriptions
  private readonly _subs = new Subscription();

  // App constants
  readonly appName = APP_CONSTANTS.APP_NAME;
  readonly confidentialLabel = APP_CONSTANTS.CONFIDENTIAL_LABEL;

  // Nav items
  readonly navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',    route: '/dashboard', adminOnly: false },
    { label: 'Targets',    icon: 'person_search', route: '/targets',   adminOnly: false },
    { label: 'Map View',   icon: 'map',           route: '/map',       adminOnly: false },
    { label: 'Analytics',  icon: 'bar_chart',     route: '/analytics', adminOnly: false },
    { label: 'Geofences',  icon: 'fence',         route: '/geofences', adminOnly: false },
    { label: 'Audit Log',  icon: 'history',       route: '/audit-log', adminOnly: true  },
  ];

  readonly visibleNavItems = computed(() => {
    const isAdmin = this.auth.isAdmin();
    return this.navItems.filter(item => !item.adminOnly || isAdmin);
  });

  // User info
  readonly currentUser = computed(() => this.auth.currentUser());
  readonly userInitials = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return '?';
    return user.displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  // Theme
  readonly isDark = computed(() => this.themeService.isDark());
  readonly themeIcon = computed(() => this.isDark() ? 'light_mode' : 'dark_mode');

  // Alert count
  readonly unreadCount = computed(() => this.alertService.unreadCount());

  ngOnInit(): void {
    // Live clock
    this._subs.add(
      interval(1000).subscribe(() => this.currentTime.set(new Date()))
    );

    // Mobile breakpoint
    this._subs.add(
      this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.Tablet]).subscribe(result => {
        const mobile = result.matches;
        this.isMobile.set(mobile);
        if (mobile) {
          this.sidenavOpened.set(false);
        } else {
          this.sidenavOpened.set(true);
        }
      })
    );

    // Session timeout checker
    this._subs.add(
      interval(30000).subscribe(() => this._checkSessionTimeout())
    );

    // Update page title on navigation
    this._subs.add(
      this.router.events.subscribe(() => this._updatePageTitle())
    );

    this._updatePageTitle();
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  // Reset inactivity timer on any user interaction
  @HostListener('document:click')
  @HostListener('document:keydown')
  @HostListener('document:mousemove')
  @HostListener('document:touchstart')
  onUserActivity(): void {
    this._lastActivity = Date.now();
    this._sessionWarningShown = false;
  }

  // "/" global search focus shortcut
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (
      event.key === '/' &&
      !(event.target instanceof HTMLInputElement) &&
      !(event.target instanceof HTMLTextAreaElement)
    ) {
      event.preventDefault();
      const searchInput = document.querySelector<HTMLInputElement>('[data-global-search]');
      searchInput?.focus();
    }
  }

  toggleSidenav(): void {
    this.sidenavOpened.update(v => !v);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  navigateTo(route: string): void {
    if (this.isMobile()) {
      this.sidenavOpened.set(false);
    }
    this.router.navigate([route]);
  }

  logout(): void {
    this.auth.logout();
  }

  navigateToProfile(): void {
    this.snackBar.open('Profile settings coming soon', 'OK', { duration: 3000 });
  }

  navigateToSettings(): void {
    this.snackBar.open('Settings panel coming soon', 'OK', { duration: 3000 });
  }

  markAllAlertsRead(): void {
    this.alertService.markAllRead();
  }

  private _checkSessionTimeout(): void {
    const idle = Date.now() - this._lastActivity;
    const warningMs = APP_CONSTANTS.SESSION_TIMEOUT_WARNING_MS;
    const timeoutMs = APP_CONSTANTS.SESSION_TIMEOUT_MS;

    if (idle >= timeoutMs) {
      this.snackBar.open('Session expired due to inactivity.', 'OK', {
        duration: 5000,
        panelClass: ['snack-error'],
      });
      this.auth.logout();
    } else if (idle >= warningMs && !this._sessionWarningShown) {
      this._sessionWarningShown = true;
      const remaining = Math.round((timeoutMs - idle) / 60000);
      this.snackBar.open(
        `Your session will expire in ~${remaining} minute(s) due to inactivity.`,
        'Stay Active',
        { duration: 60000, panelClass: ['snack-warning'] }
      ).onAction().subscribe(() => {
        this._lastActivity = Date.now();
        this._sessionWarningShown = false;
      });
    }
  }

  private _updatePageTitle(): void {
    const url = this.router.url;
    const titleMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/targets': 'Targets',
      '/map': 'Map View',
      '/analytics': 'Analytics',
      '/geofences': 'Geofences',
      '/audit-log': 'Audit Log',
    };
    const matched = Object.keys(titleMap).find(k => url.startsWith(k));
    this.pageTitle.set(matched ? titleMap[matched] : 'TargetTrack');
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }
}
