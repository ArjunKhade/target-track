import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            m => m.DashboardComponent
          ),
      },
      {
        path: 'targets',
        loadComponent: () =>
          import('./features/targets/list/target-list.component').then(
            m => m.TargetListComponent
          ),
      },
      {
        path: 'targets/:id',
        loadComponent: () =>
          import('./features/targets/detail/target-detail.component').then(
            m => m.TargetDetailComponent
          ),
      },
      {
        path: 'map',
        loadComponent: () =>
          import('./features/map/map-view.component').then(
            m => m.MapViewComponent
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics.component').then(
            m => m.AnalyticsComponent
          ),
      },
      {
        path: 'geofences',
        loadComponent: () =>
          import('./features/geofences/geofences.component').then(
            m => m.GeofencesComponent
          ),
        canActivate: [roleGuard('admin')],
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./features/audit-log/audit-log.component').then(
            m => m.AuditLogComponent
          ),
        canActivate: [roleGuard('admin')],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
