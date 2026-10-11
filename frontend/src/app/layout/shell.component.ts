import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { SchoolContextService } from '../core/services/school-context.service';
import { ApiService } from '../core/services/api.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <button class="mobile-menu-btn" (click)="sidebarOpen.set(!sidebarOpen())" aria-label="Toggle navigation">☰</button>
        <div class="brand">
          <div class="logo">✦</div>
          <div>
            <strong>{{ ctx.context()?.schoolName ?? 'School ERP' }}</strong>
            <small>{{ ctx.context()?.academicYearName ?? 'Management Portal' }}</small>
          </div>
        </div>
        <div class="topbar-right">
          <span class="user-name">{{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</span>
          <span class="role-badge">{{ auth.user()?.roles?.[0] }}</span>
          <button class="logout-btn" (click)="auth.logout()">Sign out</button>
        </div>
      </header>
      <div class="layout">
        <aside class="sidebar" [class.open]="sidebarOpen()">
          <nav>
            <div class="nav-label">WORKSPACE</div>
            @for (item of navItems; track item.route) {
              <a [routerLink]="item.route" routerLinkActive="active" class="nav-item" (click)="sidebarOpen.set(false)">
                <span class="nav-icon">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
          <div class="sidebar-footer">School ERP · v1.0<br>
            @if (ctx.context()) {
              <span style="color:#6b9fd4;font-size:9px">{{ ctx.context()!.schoolId.slice(0,8) }}...</span>
            }
          </div>
        </aside>
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell { min-height: 100vh; display: flex; flex-direction: column; }
    .topbar { height: 64px; background: white; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 16px; padding: 0 24px; position: sticky; top: 0; z-index: 10; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .logo { height: 38px; width: 38px; border-radius: 11px; background: linear-gradient(145deg,#1c5cb7,#0b9c9a); display: grid; place-items: center; color: white; font-size: 20px; flex-shrink: 0; }
    .brand strong { display: block; color: var(--navy); font-size: 13px; }
    .brand small { color: var(--muted); font-size: 10px; }
    .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
    .user-name { font-size: 13px; color: var(--ink); }
    .role-badge { font-size: 10px; background: #eaf3ff; color: #174a91; padding: 3px 8px; border-radius: 20px; font-weight: 700; }
    .logout-btn { border: 1px solid var(--line); background: white; border-radius: 8px; padding: 7px 12px; font-size: 12px; cursor: pointer; }
    .mobile-menu-btn { display: none; border: 1px solid var(--line); background: white; border-radius: 8px; padding: 7px 10px; cursor: pointer; }
    .layout { display: flex; flex: 1; min-height: calc(100vh - 64px); }
    .sidebar { width: 248px; background: linear-gradient(180deg, var(--navy), var(--navy2)); color: #dce8f8; padding: 16px 10px; display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto; }
    .nav-label { font-size: 10px; letter-spacing: 1.3px; color: #8fa9ca; padding: 12px 12px 6px; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 9px; color: #c6d5e9; text-decoration: none; font-size: 12px; transition: background 0.15s; }
    .nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
    .nav-item.active { background: #2866b7; color: white; }
    .nav-icon { width: 18px; text-align: center; font-size: 14px; }
    .sidebar-footer { margin-top: auto; padding: 14px 12px; color: #8fa9ca; font-size: 10px; line-height: 1.6; }
    .main-content { flex: 1; min-width: 0; padding: 24px; overflow: auto; }
    @media (max-width: 768px) {
      .mobile-menu-btn { display: block; }
      .sidebar { display: none; position: fixed; top: 64px; bottom: 0; z-index: 20; width: 270px; }
      .sidebar.open { display: flex; }
      .main-content { padding: 16px 12px; }
      .role-badge, .user-name { display: none; }
    }
  `]
})
export class ShellComponent implements OnInit {
  sidebarOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '▦', route: '/dashboard' },
    { label: 'Students', icon: '🎓', route: '/students' },
    { label: 'Academics', icon: '📚', route: '/academics' },
    { label: 'Attendance', icon: '◷', route: '/attendance' },
    { label: 'Fees & Payments', icon: '₹', route: '/fees' },
    { label: 'Transport', icon: '🚌', route: '/transport' },
    { label: 'Staff & HRMS', icon: '👩🏫', route: '/staff' },
    { label: 'Payroll', icon: '💼', route: '/payroll' },
    { label: 'Communications', icon: '✉', route: '/communications' },
    { label: 'Analytics', icon: '◫', route: '/analytics' },
  ];

  constructor(public auth: AuthService, public ctx: SchoolContextService, private api: ApiService) {}

  ngOnInit() {
    if (!this.ctx.context()) this.loadSchoolContext();
  }

  private loadSchoolContext() {
    // Load first available school for the tenant after login
    // In production this would come from user profile / school selection
    const user = this.auth.user();
    if (!user) return;
    // Attempt to load school context from API - requires schoolId from user profile
    // For now, context is set after login via the login component
  }
}
