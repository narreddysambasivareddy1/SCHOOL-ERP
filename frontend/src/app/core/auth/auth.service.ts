import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

const TOKEN_KEY = 'erp_token';
const USER_KEY = 'erp_user';
const TENANT_KEY = 'erp_tenant';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<AuthUser | null>(this.loadUser());
  readonly user = this._user.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  get tenantId(): string {
    return sessionStorage.getItem(TENANT_KEY) ?? localStorage.getItem(TENANT_KEY) ?? '';
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

  login(email: string, password: string, tenantId: string) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`,
      { email, password },
      { headers: new HttpHeaders({ 'X-Tenant-Id': tenantId }) }
    ).pipe(
      tap(res => {
        sessionStorage.setItem(TOKEN_KEY, res.accessToken);
        sessionStorage.setItem(USER_KEY, JSON.stringify(res.user));
        sessionStorage.setItem(TENANT_KEY, tenantId);
        this._user.set(res.user);
      })
    );
  }

  logout() {
    sessionStorage.clear();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TENANT_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private loadUser(): AuthUser | null {
    const raw = sessionStorage.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
