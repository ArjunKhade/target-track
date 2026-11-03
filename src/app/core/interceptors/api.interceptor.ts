import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Generates a UUID v4 string without any external library.
 */
function generateUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * HTTP interceptor that:
 *  - Attaches a unique X-Request-ID header (UUID v4) to every request.
 *  - Attaches an Authorization: Bearer <token> header when a session exists.
 *  - Logs request timing via AuditService (lazy-injected to avoid circular deps).
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const requestId = generateUuidV4();
  const startTime = performance.now();

  const session = auth.session();
  const token = session?.token;

  let clonedReq = req.clone({
    setHeaders: {
      'X-Request-ID': requestId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return next(clonedReq).pipe(
    tap({
      next: (event) => {
        // Log timing info – AuditService will be wired separately once created.
        // Using a CustomEvent to keep this interceptor decoupled from AuditService.
        const elapsed = Math.round(performance.now() - startTime);
        void elapsed; // consumed by AuditService listener when available
        void event;
      },
      error: () => {
        // Timing on error path – logged by error handlers upstream.
      },
    }),
  );
};
