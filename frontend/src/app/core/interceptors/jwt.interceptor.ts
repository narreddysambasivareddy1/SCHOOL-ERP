import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  if (req.url.includes('/api/')) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (auth.tenantId) headers['X-Tenant-Id'] = auth.tenantId;
    if (Object.keys(headers).length) req = req.clone({ setHeaders: headers });
  }
  return next(req);
};
