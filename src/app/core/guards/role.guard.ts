import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/**
 * Functional guard factory – checks whether the current user has the required role.
 * Redirects to /dashboard and shows a snackbar on insufficient privileges.
 *
 * Usage in routes:
 *   canActivate: [roleGuard('admin')]
 */
export function roleGuard(requiredRole: UserRole): CanActivateFn {
  return (_route, _state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);

    if (auth.hasRole(requiredRole)) {
      return true;
    }

    snackBar.open('Access denied', 'Dismiss', {
      duration: 4000,
      panelClass: ['snack-error'],
    });

    router.navigate(['/dashboard']);
    return false;
  };
}
