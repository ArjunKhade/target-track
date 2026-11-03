import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

interface QuickUser {
  label: string;
  username: string;
  role: string;
  icon: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NgClass,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _snackBar = inject(MatSnackBar);
  readonly themeService = inject(ThemeService);

  readonly isLoading = signal(false);
  readonly showPassword = signal(false);
  readonly loginError = signal('');

  readonly quickUsers: QuickUser[] = [
    { label: 'Admin', username: 'admin', role: 'Administrator', icon: 'admin_panel_settings' },
    { label: 'Officer', username: 'officer', role: 'Field Officer', icon: 'local_police' },
    { label: 'Viewer', username: 'viewer', role: 'Intel Analyst', icon: 'visibility' },
  ];

  readonly loginForm = this._fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    // If already authenticated, redirect immediately
    if (this._authService.isAuthenticated()) {
      this._router.navigate(['/dashboard']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  fillQuickLogin(username: string): void {
    this.loginForm.patchValue({ username, password: 'password' });
    this.loginError.set('');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.loginError.set('');

    const { username, password } = this.loginForm.value;

    // Simulate async delay for realistic UX
    setTimeout(() => {
      const result = this._authService.login(username ?? '', password ?? '');
      this.isLoading.set(false);

      if (result.success) {
        const user = this._authService.currentUser();
        this._snackBar.open(
          `Welcome, ${user?.displayName ?? 'Officer'}. Clearance verified.`,
          'DISMISS',
          { duration: 4000, panelClass: ['success-snackbar'] }
        );
        this._router.navigate(['/dashboard']);
      } else {
        this.loginError.set(result.error ?? 'Authentication failed. Access denied.');
        this.loginForm.controls.password.reset();
      }
    }, 900);
  }
}
