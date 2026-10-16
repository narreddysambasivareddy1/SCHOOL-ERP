import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth/auth.service';
import { SchoolContextService } from '../core/services/school-context.service';
import { ApiService } from '../core/services/api.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  group: string;
}

const ADMIN = ['SchoolAdmin','PlatformSuperAdmin'];
const TEACH = ['Teacher','AttendanceOfficer'];
const OFFICE = ['AdmissionOfficer','Accountant','HRManager','TransportManager'];

const ALL_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-th-large', route: '/dashboard', group: 'Workspace', roles: [...ADMIN, ...OFFICE] },
  { label: 'My dashboard', icon: 'pi pi-th-large', route: '/teacher/dashboard', group: 'Workspace', roles: TEACH },
  { label: 'My dashboard', icon: 'pi pi-th-large', route: '/student/dashboard', group: 'Workspace', roles: ['Student'] },
  { label: 'Family', icon: 'pi pi-home', route: '/parent/dashboard', group: 'Workspace', roles: ['Parent'] },

  { label: 'Admissions', icon: 'pi pi-user-plus', route: '/admissions', group: 'People', roles: [...ADMIN, 'AdmissionOfficer'] },
  { label: 'Students', icon: 'pi pi-users', route: '/students', group: 'People', roles: [...ADMIN, 'AdmissionOfficer', ...TEACH] },
  { label: 'Staff & HR', icon: 'pi pi-id-card', route: '/staff', group: 'People', roles: [...ADMIN, 'HRManager'] },
  { label: 'Leave', icon: 'pi pi-calendar-plus', route: '/leave', group: 'People', roles: [...ADMIN, 'HRManager', ...TEACH] },

  { label: 'Classes', icon: 'pi pi-sitemap', route: '/academics', group: 'Academics', roles: [...ADMIN, ...TEACH, 'Parent', 'Student'] },
  { label: 'Timetable', icon: 'pi pi-table', route: '/timetable', group: 'Academics', roles: [...ADMIN, ...TEACH, 'Parent', 'Student'] },
  { label: 'Attendance', icon: 'pi pi-check-square', route: '/attendance', group: 'Academics', roles: [...ADMIN, ...TEACH, 'Parent', 'Student'] },
  { label: 'Homework', icon: 'pi pi-book', route: '/homework', group: 'Academics', roles: [...ADMIN, ...TEACH, 'Parent', 'Student'] },
  { label: 'Exams & results', icon: 'pi pi-file', route: '/examinations', group: 'Academics', roles: [...ADMIN, ...TEACH, 'Parent', 'Student'] },
  { label: 'Calendar', icon: 'pi pi-calendar', route: '/calendar', group: 'Academics', roles: [...ADMIN, ...TEACH, 'Parent', 'Student'] },

  { label: 'Fees', icon: 'pi pi-wallet', route: '/fees', group: 'Finance', roles: [...ADMIN, 'Accountant', 'Student', 'Parent'] },
  { label: 'Payroll', icon: 'pi pi-briefcase', route: '/payroll', group: 'Finance', roles: [...ADMIN, 'HRManager', 'PayrollOfficer'] },

  { label: 'Transport', icon: 'pi pi-map', route: '/transport', group: 'Operations', roles: [...ADMIN, 'TransportManager', 'Student', 'Parent'] },
  { label: 'Messages', icon: 'pi pi-send', route: '/communications', group: 'Operations', roles: [...ADMIN, ...TEACH] },
  { label: 'Announcements', icon: 'pi pi-megaphone', route: '/announcements', group: 'Operations', roles: [...ADMIN, ...TEACH, 'Parent', 'Student'] },

  { label: 'Analytics', icon: 'pi pi-chart-bar', route: '/analytics', group: 'Governance', roles: ADMIN },
  { label: 'Audit', icon: 'pi pi-history', route: '/audit', group: 'Governance', roles: ADMIN },
  { label: 'Settings', icon: 'pi pi-cog', route: '/settings', group: 'Governance', roles: ADMIN },
  { label: 'Integrations', icon: 'pi pi-link', route: '/integrations', group: 'Governance', roles: ADMIN },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <button class="icon-btn mobile-menu-btn" (click)="sidebarOpen.set(!sidebarOpen())" aria-label="Toggle navigation">
          <i class="pi pi-bars"></i>
        </button>
        <div class="brand">
          @if (ctx.context()?.logoUrl) {
            <img [src]="ctx.context()!.logoUrl" alt="" class="logo-img" />
          } @else {
            <div class="logo"><i class="pi pi-sparkles"></i></div>
          }
          <div>
            <strong>{{ ctx.context()?.schoolName ?? 'EduCampus' }}</strong>
            <small>{{ ctx.context()?.academicYearName || 'Workspace' }}</small>
          </div>
        </div>

        <button class="search-chip" type="button" (click)="openPalette()">
          <i class="pi pi-search"></i>
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>

        <div class="topbar-right">
          @if (years().length) {
            <select class="year-select" [ngModel]="ctx.academicYearId" (ngModelChange)="onYearChange($event)" aria-label="Academic year">
              @for (y of years(); track y.id) {
                <option [value]="y.id">{{ y.name }}</option>
              }
            </select>
          }
          <div class="user-wrap">
            <button class="user-btn" type="button" (click)="$event.stopPropagation(); userMenu.set(!userMenu())" [attr.aria-expanded]="userMenu()">
              <span class="avatar">{{ initials() }}</span>
              <span class="user-meta">
                <span class="user-name">{{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</span>
                <span class="role-badge" [class]="roleBadgeClass()">{{ primaryRole() }}</span>
              </span>
              <i class="pi pi-angle-down"></i>
            </button>
            @if (userMenu()) {
              <div class="menu">
                <div class="menu-meta">{{ auth.user()?.email }}</div>
                <div class="menu-meta">{{ ctx.locale }} · {{ ctx.currency }}</div>
                <button type="button" class="menu-item" (click)="auth.logout()">
                  <i class="pi pi-sign-out"></i> Sign out
                </button>
              </div>
            }
          </div>
        </div>
      </header>

      <div class="layout">
        <aside class="sidebar" [class.open]="sidebarOpen()">
          <nav>
            @for (group of navGroups(); track group.name) {
              <div class="nav-label">{{ group.name }}</div>
              @for (item of group.items; track item.route) {
                <a [routerLink]="item.route" routerLinkActive="active" class="nav-item" (click)="sidebarOpen.set(false)">
                  <i class="nav-icon" [class]="item.icon"></i>
                  <span>{{ item.label }}</span>
                </a>
              }
            }
          </nav>
          <div class="sidebar-footer">EduCampus</div>
        </aside>

        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>

    @if (paletteOpen()) {
      <div class="palette-back" (click)="paletteOpen.set(false)">
        <div class="palette" (click)="$event.stopPropagation()" role="dialog" aria-label="Jump to">
          <div class="palette-input">
            <i class="pi pi-search"></i>
            <input #cmdInput type="search" placeholder="Jump to a page…" [ngModel]="query()" (ngModelChange)="query.set($event)" />
          </div>
          <div class="palette-list">
            @for (item of filteredNav(); track item.route) {
              <button type="button" class="palette-item" (click)="go(item.route)">
                <i [class]="item.icon"></i>
                <span>{{ item.label }}</span>
                <small>{{ item.group }}</small>
              </button>
            } @empty {
              <div class="palette-empty">No matching pages</div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .app-shell { min-height: 100vh; display: flex; flex-direction: column; }
    .topbar { height: var(--topbar-h); background: white; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 16px; padding: 0 20px; position: sticky; top: 0; z-index: 20; }
    .brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .logo, .logo-img { height: 36px; width: 36px; border-radius: 10px; flex-shrink: 0; }
    .logo { background: linear-gradient(145deg, var(--primary), var(--teal)); display: grid; place-items: center; color: white; }
    .logo-img { object-fit: cover; border: 1px solid var(--line); }
    .brand strong { display: block; color: var(--navy); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
    .brand small { color: var(--muted); font-size: 10px; }
    .search-chip { margin-left: 12px; display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); background: var(--bg); border-radius: 10px; padding: 8px 12px; color: var(--muted); font-size: 12px; cursor: pointer; min-width: 220px; }
    .search-chip kbd { margin-left: auto; font-size: 10px; border: 1px solid var(--line); background: white; border-radius: 6px; padding: 1px 6px; }
    .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
    .year-select { height: 36px; border: 1px solid var(--line); border-radius: 8px; padding: 0 8px; font-size: 12px; background: white; color: var(--ink); }
    .user-wrap { position: relative; }
    .user-btn { display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); background: white; border-radius: 10px; padding: 4px 10px 4px 4px; cursor: pointer; }
    .avatar { width: 28px; height: 28px; border-radius: 8px; background: var(--primary-soft); color: var(--primary); display: grid; place-items: center; font-size: 10px; font-weight: 800; }
    .user-meta { display: flex; flex-direction: column; align-items: flex-start; }
    .user-name { font-size: 12px; color: var(--ink); font-weight: 600; }
    .role-badge { font-size: 10px; font-weight: 700; }
    .role-badge.admin { color: #174a91; }
    .role-badge.teacher { color: #087d68; }
    .role-badge.student { color: #4338ca; }
    .role-badge.parent { color: #9a6900; }
    .menu { position: absolute; right: 0; top: calc(100% + 8px); width: 220px; background: white; border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow); padding: 8px; z-index: 30; }
    .menu-meta { font-size: 11px; color: var(--muted); padding: 4px 8px; }
    .menu-item { width: 100%; display: flex; align-items: center; gap: 8px; border: 0; background: none; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 13px; }
    .menu-item:hover { background: var(--bg); }
    .icon-btn { border: 1px solid var(--line); background: white; border-radius: 8px; padding: 7px 10px; cursor: pointer; }
    .mobile-menu-btn { display: none; }
    .layout { display: flex; flex: 1; min-height: calc(100vh - var(--topbar-h)); }
    .sidebar { width: var(--sidebar-w); background: linear-gradient(180deg, var(--navy), var(--navy2)); color: #dce8f8; padding: 16px 10px; display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto; }
    .nav-label { font-size: 10px; letter-spacing: 1.3px; color: #8fa9ca; padding: 14px 12px 6px; text-transform: uppercase; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 9px; color: #c6d5e9; text-decoration: none; font-size: 13px; }
    .nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
    .nav-item.active { background: var(--primary); color: white; }
    .nav-icon { width: 16px; font-size: 13px; text-align: center; }
    .sidebar-footer { margin-top: auto; padding: 14px 12px; color: #8fa9ca; font-size: 10px; }
    .main-content { flex: 1; min-width: 0; padding: 24px; overflow: auto; }
    .palette-back { position: fixed; inset: 0; background: rgba(15,39,68,0.35); z-index: 50; display: grid; place-items: start center; padding-top: 12vh; }
    .palette { width: min(560px, calc(100% - 32px)); background: white; border-radius: 16px; box-shadow: 0 24px 80px rgba(15,39,68,0.25); overflow: hidden; }
    .palette-input { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--line); }
    .palette-input input { border: 0; outline: none; flex: 1; font-size: 15px; box-shadow: none; }
    .palette-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 16px; border: 0; background: none; cursor: pointer; font-size: 13px; }
    .palette-item:hover { background: var(--bg); }
    .palette-item small { margin-left: auto; color: var(--muted); }
    .palette-empty { padding: 24px; text-align: center; color: var(--muted); font-size: 13px; }
    @media (max-width: 900px) {
      .search-chip span, .search-chip kbd, .user-meta, .year-select { display: none; }
      .search-chip { min-width: 40px; padding: 8px; }
    }
    @media (max-width: 768px) {
      .mobile-menu-btn { display: block; }
      .sidebar { display: none; position: fixed; top: var(--topbar-h); bottom: 0; z-index: 20; width: 270px; }
      .sidebar.open { display: flex; }
      .main-content { padding: 16px 12px; }
    }
  `]
})
export class ShellComponent implements OnInit {
  sidebarOpen = signal(false);
  userMenu = signal(false);
  paletteOpen = signal(false);
  query = signal('');
  years = signal<{ id: string; name: string }[]>([]);

  visibleNav = computed(() => {
    const roles = this.auth.user()?.roles ?? [];
    return ALL_NAV.filter(item => !item.roles || item.roles.some(r => roles.includes(r)));
  });

  navGroups = computed(() => {
    const items = this.visibleNav();
    const groups: { name: string; items: NavItem[] }[] = [];
    for (const item of items) {
      const last = groups[groups.length - 1];
      if (!last || last.name !== item.group) groups.push({ name: item.group, items: [item] });
      else last.items.push(item);
    }
    return groups;
  });

  filteredNav = computed(() => {
    const q = this.query().trim().toLowerCase();
    const items = this.visibleNav();
    if (!q) return items;
    return items.filter(i => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q));
  });

  primaryRole = computed(() => {
    const roles = this.auth.user()?.roles ?? [];
    if (roles.includes('SchoolAdmin') || roles.includes('PlatformSuperAdmin')) return 'Admin';
    if (roles.includes('Parent')) return 'Parent';
    if (roles.includes('Teacher') || roles.includes('AttendanceOfficer')) return 'Teacher';
    if (roles.includes('Student')) return 'Student';
    return roles[0] ?? 'User';
  });

  roleBadgeClass = computed(() => this.primaryRole().toLowerCase());

  initials = computed(() => {
    const u = this.auth.user();
    return `${u?.firstName?.[0] ?? ''}${u?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  });

  constructor(
    public auth: AuthService,
    public ctx: SchoolContextService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.ctx.schoolId) return;
    this.api.getAcademicYears(this.ctx.schoolId).subscribe({
      next: (list) => this.years.set((list ?? []).map((y: any) => ({ id: y.id ?? y.Id, name: y.name ?? y.Name }))),
      error: () => this.years.set([])
    });
  }

  onYearChange(id: string) {
    const year = this.years().find(y => y.id === id);
    if (year) this.ctx.setAcademicYear(year.id, year.name);
  }

  openPalette() {
    this.paletteOpen.set(true);
    this.query.set('');
  }

  go(route: string) {
    this.paletteOpen.set(false);
    this.userMenu.set(false);
    this.router.navigateByUrl(route);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.paletteOpen.update(v => !v);
      this.query.set('');
    }
    if (e.key === 'Escape') {
      this.paletteOpen.set(false);
      this.userMenu.set(false);
    }
  }

  @HostListener('document:click')
  closeMenus() {
    this.userMenu.set(false);
  }
}
