import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SchoolContext, SchoolContextService } from '../services/school-context.service';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface SchoolSession {
  tenantId: string;
  schoolId: string;
  schoolName: string;
  slug: string;
  academicYearId?: string | null;
  academicYearName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  locale: string;
  currency: string;
  timeZone: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
  school?: SchoolSession | null;
}

const TOKEN_KEY = 'erp_token';
const USER_KEY = 'erp_user';
const TENANT_KEY = 'erp_tenant';
const PORTAL_KEY = 'erp_portal';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<AuthUser | null>(this.loadUser());
  readonly user = this._user.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router,
    private school: SchoolContextService
  ) {}

  get tenantId(): string {
    return this.school.context()?.tenantId
      || sessionStorage.getItem(TENANT_KEY)
      || localStorage.getItem(TENANT_KEY)
      || '';
  }

  get token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  hasRole(role: string): boolean {
    return this._user()?.roles.includes(role) ?? false;
  }

  login(email: string, password: string, schoolCode: string, portal?: string) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
      email, password, schoolCode
    }).pipe(
      tap(res => {
        sessionStorage.setItem(TOKEN_KEY, res.accessToken);
        sessionStorage.setItem(USER_KEY, JSON.stringify(res.user));
        if (portal) sessionStorage.setItem(PORTAL_KEY, portal);
        this._user.set(res.user);
        if (res.school) {
          sessionStorage.setItem(TENANT_KEY, res.school.tenantId);
          this.school.set(this.toContext(res.school));
        }
      })
    );
  }

  dashboardRoute(): string {
    const roles = this._user()?.roles ?? [];
    if (roles.includes('Parent')) return '/parent/dashboard';
    if (roles.includes('Teacher') || roles.includes('AttendanceOfficer')) return '/teacher/dashboard';
    if (roles.includes('Student')) return '/student/dashboard';
    if (roles.includes('FrontOffice')) return '/enquiries';
    return '/dashboard';
  }

  loginPath(): string {
    const portal = sessionStorage.getItem(PORTAL_KEY);
    if (portal === 'parent') return '/parent/login';
    if (portal === 'teacher') return '/teacher/login';
    if (portal === 'student') return '/student/login';
    if (portal === 'admin') return '/admin/login';
    if (portal === 'frontOffice') return '/front-office/login';
    return '/login';
  }

  logout() {
    const path = this.loginPath();
    sessionStorage.clear();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TENANT_KEY);
    this._user.set(null);
    this.school.clear();
    this.router.navigate([path]);
  }

  private toContext(s: SchoolSession): SchoolContext {
    return {
      tenantId: s.tenantId,
      schoolId: s.schoolId,
      schoolName: s.schoolName,
      slug: s.slug,
      academicYearId: s.academicYearId ?? '',
      academicYearName: s.academicYearName ?? '',
      logoUrl: s.logoUrl,
      primaryColor: s.primaryColor,
      locale: s.locale || 'en-IN',
      currency: s.currency || 'INR',
      timeZone: s.timeZone || 'UTC',
    };
  }

  private loadUser(): AuthUser | null {
    const raw = sessionStorage.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
