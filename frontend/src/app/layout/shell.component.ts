import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth/auth.service';
import { SchoolContextService } from '../core/services/school-context.service';
import { ApiService } from '../core/services/api.service';
import { EnquiryAlertService } from '../core/services/enquiry-alert.service';
import { ThemeService } from '../core/services/theme.service';
import { filter } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  group: string;
}

const ADMIN = ['SchoolAdmin','PlatformSuperAdmin'];
const TEACH = ['Teacher','AttendanceOfficer'];
const OFFICE = ['AdmissionOfficer','Accountant','HRManager','TransportManager','FrontOffice'];
const FO = ['FrontOffice','AdmissionOfficer'];

const ALL_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-th-large', route: '/dashboard', group: 'Workspace', roles: [...ADMIN, ...OFFICE] },
  { label: 'My dashboard', icon: 'pi pi-th-large', route: '/teacher/dashboard', group: 'Workspace', roles: TEACH },
  { label: 'My dashboard', icon: 'pi pi-th-large', route: '/student/dashboard', group: 'Workspace', roles: ['Student'] },
  { label: 'Family', icon: 'pi pi-home', route: '/parent/dashboard', group: 'Workspace', roles: ['Parent'] },

  { label: 'Enquiry desk', icon: 'pi pi-inbox', route: '/enquiries', group: 'People', roles: [...ADMIN, ...FO] },
  { label: 'Registrations', icon: 'pi pi-id-card', route: '/registrations', group: 'People', roles: [...ADMIN, ...FO] },
  { label: 'Admissions', icon: 'pi pi-user-plus', route: '/admissions', group: 'People', roles: [...ADMIN, ...FO] },
  { label: 'Students', icon: 'pi pi-users', route: '/students', group: 'People', roles: [...ADMIN, 'AdmissionOfficer', ...TEACH] },
  { label: 'Staff & HR', icon: 'pi pi-id-card', route: '/staff', group: 'People', roles: [...ADMIN, 'HRManager'] },
  { label: 'Leave', icon: 'pi pi-calendar-plus', route: '/leave', group: 'People', roles: [...ADMIN, 'HRManager', ...TEACH] },

  { label: 'Classes', icon: 'pi pi-sitemap', route: '/academics', group: 'Academics', roles: [...ADMIN, ...TEACH, 'Parent', 'Student'] },
  { label: 'Timetable', icon: 'pi pi-table', route: '/timetable', group: 'Academics', roles: [...ADMIN, ...TEACH, 'Parent', 'Student'] },
  { label: 'Substitutions', icon: 'pi pi-users', route: '/substitutions', group: 'Academics', roles: [...ADMIN, 'HRManager'] },
  { label: 'Lesson plans', icon: 'pi pi-calendar', route: '/lesson-plans', group: 'Academics', roles: [...ADMIN, ...TEACH, 'Parent', 'Student'] },
  { label: 'Class diary', icon: 'pi pi-book', route: '/diary', group: 'Academics', roles: [...ADMIN, ...TEACH, 'Parent', 'Student'] },
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
        <button class="icon-btn mobile-menu-btn" (click)="sidebarOpen.set(!sidebarOpen())"
          [attr.aria-expanded]="sidebarOpen()" aria-controls="primary-navigation" aria-label="Toggle navigation">
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
          <kbd>Ctrl K</kbd>
        </button>

        <div class="route-context" aria-live="polite">
          <span>{{ currentGroup() }}</span>
          <strong>{{ currentPage() }}</strong>
        </div>

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
                <div class="theme-block" (click)="$event.stopPropagation()">
                  <div class="menu-meta">Appearance</div>
                  <div class="mode-switch" role="group" aria-label="Appearance">
                    <button type="button" [class.on]="theme.mode() === 'light'" (click)="theme.setMode('light')">Light</button>
                    <button type="button" [class.on]="theme.mode() === 'dark'" (click)="theme.setMode('dark')">Dark</button>
                  </div>
                  <div class="menu-meta">Workspace colour</div>
                  <div class="swatches" role="listbox" aria-label="Workspace colour">
                    @for (preset of theme.presets; track preset.id) {
                      <button type="button" class="swatch" role="option" [class.on]="theme.active() === preset.hex"
                        [style.background]="preset.hex" [attr.aria-label]="preset.name" [attr.title]="preset.name"
                        [attr.aria-selected]="theme.active() === preset.hex" (click)="theme.choose(preset.hex)"></button>
                    }
                  </div>
                  <label class="custom-color">Custom
                    <input type="color" [value]="theme.active()" aria-label="Custom workspace colour"
                      (input)="theme.choose(colorValue($event))" />
                  </label>
                  <button type="button" class="menu-item" (click)="theme.resetToSchool(ctx.context()?.primaryColor)">
                    Use school colour
                  </button>
                </div>
                <button type="button" class="menu-item" (click)="auth.logout()">
                  <i class="pi pi-sign-out"></i> Sign out
                </button>
              </div>
            }
          </div>
        </div>
      </header>

      <button class="sidebar-backdrop" type="button" [hidden]="!sidebarOpen()"
        aria-label="Close navigation" (click)="sidebarOpen.set(false)"></button>

      <div class="layout">
        <aside class="sidebar" id="primary-navigation" [class.open]="sidebarOpen()"
          [class.collapsed]="sidebarCollapsed()">
          <div class="sidebar-heading">
            <span>School workspace</span>
            <button type="button" class="collapse-btn" (click)="toggleSidebar()"
              [attr.aria-expanded]="!sidebarCollapsed()"
              [attr.aria-label]="sidebarCollapsed() ? 'Expand navigation' : 'Collapse navigation'"
              [title]="sidebarCollapsed() ? 'Expand navigation' : 'Collapse navigation'">
              <i [class]="sidebarCollapsed() ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'"></i>
            </button>
          </div>
          <nav aria-label="Main navigation">
            @for (group of navGroups(); track group.name) {
              <div class="nav-label">{{ group.name }}</div>
              @for (item of group.items; track item.route) {
                <a [routerLink]="item.route" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
                  class="nav-item" [attr.title]="sidebarCollapsed() ? item.label : null"
                  [attr.aria-label]="sidebarCollapsed() ? item.label : null" (click)="sidebarOpen.set(false)">
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
    .topbar { height: var(--topbar-h); background: var(--topbar); border-bottom: 3px solid var(--primary); display: flex; align-items: center; gap: 14px; padding: 0 20px; position: sticky; top: 0; z-index: 40; }
    .brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .logo, .logo-img { height: 36px; width: 36px; border-radius: 10px; flex-shrink: 0; }
    .logo { background: var(--primary); display: grid; place-items: center; color: white; }
    .logo-img { object-fit: cover; border: 1px solid var(--line); }
    .brand strong { display: block; color: var(--navy); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
    .brand small { color: var(--muted); font-size: 10px; }
    .search-chip { height: 40px; margin-left: 8px; display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); background: var(--bg); border-radius: 10px; padding: 0 12px; color: var(--muted); font-size: 14px; cursor: pointer; min-width: 220px; transition: border-color 140ms ease, background 140ms ease; }
    .search-chip:hover { border-color: var(--primary); background: var(--surface); }
    .search-chip kbd { margin-left: auto; font-size: 10px; border: 1px solid var(--line); background: var(--surface); border-radius: 6px; padding: 1px 6px; color: var(--muted); }
    .route-context { display: grid; gap: 0; min-width: 0; margin-left: 4px; padding-left: 16px; border-left: 1px solid var(--line); line-height: 1.25; }
    .route-context span { color: var(--muted); font-size: 10px; }
    .route-context strong { overflow: hidden; color: var(--navy); font-size: 13px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
    .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
    .year-select { height: 40px; border: 1px solid var(--line); border-radius: 10px; padding: 0 10px; font-size: 14px; background: var(--surface); color: var(--ink); }
    .user-wrap { position: relative; }
    .user-btn { height: 40px; display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); background: var(--surface); border-radius: 10px; padding: 0 10px 0 4px; cursor: pointer; }
    .avatar { width: 28px; height: 28px; border-radius: 8px; background: var(--primary-soft); color: var(--primary); display: grid; place-items: center; font-size: 10px; font-weight: 800; }
    .user-meta { display: flex; flex-direction: column; align-items: flex-start; }
    .user-name { font-size: 12px; color: var(--ink); font-weight: 600; }
    .role-badge { font-size: 10px; font-weight: 700; }
    .role-badge.admin { color: #174a91; }
    .role-badge.teacher { color: #087d68; }
    .role-badge.student { color: #4338ca; }
    .role-badge.parent { color: #9a6900; }
    .menu { position: absolute; right: 0; top: calc(100% + 8px); width: 260px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow); padding: 8px; z-index: 30; }
    .mode-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 4px 8px 8px; }
    .mode-switch button { height: 36px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); cursor: pointer; font-weight: 650; }
    .mode-switch button.on { background: var(--primary); border-color: var(--primary); color: white; }
    .theme-block { margin: 6px 0; padding-top: 6px; border-top: 1px solid var(--line); }
    .swatches { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 8px 8px; }
    .swatch { width: 36px; height: 36px; border-radius: 10px; border: 2px solid transparent; cursor: pointer; box-shadow: inset 0 0 0 1px rgba(15, 23, 42, .18); }
    .swatch.on { border-color: var(--ink); }
    .custom-color { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 8px 4px; color: var(--muted); font-size: 12px; font-weight: 650; }
    .custom-color input { width: 44px; height: 32px; padding: 0; border: 0; background: transparent; cursor: pointer; }
    .menu-meta { font-size: 11px; color: var(--muted); padding: 4px 8px; }
    .menu-item { width: 100%; display: flex; align-items: center; gap: 8px; border: 0; background: none; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 13px; }
    .menu-item:hover { background: var(--bg); }
    .icon-btn { border: 1px solid var(--line); background: var(--surface); border-radius: 8px; padding: 7px 10px; cursor: pointer; color: var(--navy); }
    .mobile-menu-btn { display: none; }
    .layout { display: flex; flex: 1; min-height: calc(100vh - var(--topbar-h)); }
    .sidebar { width: var(--sidebar-w); background: var(--sidebar); color: var(--sidebar-text); padding: 12px 10px 16px; border-right: 0; display: flex; flex-direction: column; flex-shrink: 0; overflow-x: hidden; overflow-y: auto; transition: width 180ms ease; }
    .sidebar-heading { min-height: 44px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 10px; color: var(--sidebar-muted); font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
    .collapse-btn { width: 36px; height: 36px; flex: none; border: 1px solid rgba(255,255,255,.16); border-radius: 8px; background: transparent; color: var(--sidebar-text); cursor: pointer; }
    .collapse-btn:hover { background: rgba(255,255,255,.08); }
    .sidebar.collapsed { width: var(--sidebar-collapsed-w); }
    .sidebar.collapsed .sidebar-heading { justify-content: center; padding: 0; }
    .sidebar.collapsed .sidebar-heading > span, .sidebar.collapsed .nav-label, .sidebar.collapsed .nav-item span, .sidebar.collapsed .sidebar-footer { display: none; }
    .nav-label { margin-top: 8px; font-size: 11px; letter-spacing: 1.1px; color: var(--sidebar-muted); padding: 13px 12px 6px; text-transform: uppercase; }
    .nav-item { display: flex; align-items: center; gap: 11px; min-height: 44px; padding: 8px 12px; border-radius: 8px; color: var(--sidebar-muted); text-decoration: none; font-size: 14px; transition: background 150ms ease, color 150ms ease; }
    .nav-item:hover { background: rgba(255,255,255,.08); color: white; }
    .nav-item.active { background: var(--sidebar-active); color: white; box-shadow: none; font-weight: 700; }
    :host-context(html[data-theme="dark"]) .nav-item.active {
      background: #1a2740;
      color: #f4f7fb;
      box-shadow: inset 3px 0 0 var(--gold);
    }
    :host-context(html[data-theme="dark"]) .nav-item:hover { background: rgba(255,255,255,.06); color: #f4f7fb; }
    :host-context(html[data-theme="dark"]) .menu-item { background: transparent; color: var(--ink); }
    :host-context(html[data-theme="dark"]) .menu-item:hover { background: #1a2740; }
    .nav-icon { width: 18px; flex: none; color: inherit; font-size: 15px; text-align: center; }
    .nav-item.active .nav-icon { color: white; }
    .sidebar.collapsed .nav-item { justify-content: center; padding-inline: 0; }
    .sidebar.collapsed .nav-icon { font-size: 16px; }
    .sidebar-footer { margin-top: auto; padding: 14px 12px; color: var(--sidebar-muted); font-size: 12px; }
    .main-content { flex: 1; min-width: 0; padding: 24px; overflow: auto; background: var(--canvas); }
    .sidebar-backdrop { display: none; }
    .palette-back { position: fixed; inset: 0; background: rgba(15,39,68,0.35); z-index: 50; display: grid; place-items: start center; padding-top: 12vh; }
    .palette { width: min(560px, calc(100% - 32px)); background: var(--surface); color: var(--ink); border-radius: 16px; box-shadow: 0 24px 80px rgba(15,39,68,0.25); overflow: hidden; }
    .palette-input { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--line); }
    .palette-input input { border: 0; outline: none; flex: 1; font-size: 15px; box-shadow: none; background: transparent; color: var(--ink); }
    .palette-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 16px; border: 0; background: none; cursor: pointer; font-size: 13px; }
    .palette-item:hover { background: var(--bg); }
    .palette-item small { margin-left: auto; color: var(--muted); }
    .palette-empty { padding: 24px; text-align: center; color: var(--muted); font-size: 13px; }
    @media (max-width: 1100px) {
      .search-chip span, .search-chip kbd, .user-meta { display: none; }
      .search-chip { min-width: 38px; justify-content: center; padding: 9px; }
    }
    @media (max-width: 900px) { .year-select { display: none; } }
    @media (max-width: 768px) {
      .topbar { gap: 9px; padding: 0 12px; }
      .mobile-menu-btn { display: block; }
      .route-context { display: none; }
      .collapse-btn { display: none; }
      .sidebar { display: none; position: fixed; top: var(--topbar-h); bottom: 0; left: 0; z-index: 32; width: min(290px, calc(100vw - 52px)); }
      .sidebar.open { display: flex; }
      .sidebar.collapsed { width: min(290px, calc(100vw - 52px)); }
      .sidebar.collapsed .sidebar-heading > span, .sidebar.collapsed .nav-label, .sidebar.collapsed .nav-item span { display: block; }
      .sidebar.collapsed .sidebar-heading { justify-content: space-between; padding: 0 10px; }
      .sidebar.collapsed .nav-item { justify-content: flex-start; padding: 9px 12px; }
      .sidebar.collapsed .nav-icon { font-size: 14px; }
      .sidebar-backdrop:not([hidden]) { display: block; position: fixed; inset: var(--topbar-h) 0 0; z-index: 30; width: 100%; border: 0; background: rgba(15,39,68,.38); }
      .main-content { padding: 16px 12px; }
    }
  `]
})
export class ShellComponent implements OnInit {
  sidebarOpen = signal(false);
  userMenu = signal(false);
  paletteOpen = signal(false);
  sidebarCollapsed = signal(false);
  query = signal('');
  currentRoute = signal('');
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

  currentNavItem = computed(() =>
    this.visibleNav().find(item => item.route === this.currentRoute()) ??
    this.visibleNav().find(item => this.currentRoute().startsWith(`${item.route}/`))
  );
  currentPage = computed(() => this.currentNavItem()?.label ?? 'Workspace');
  currentGroup = computed(() => this.currentNavItem()?.group ?? 'School ERP');

  primaryRole = computed(() => {
    const roles = this.auth.user()?.roles ?? [];
    if (roles.includes('SchoolAdmin') || roles.includes('PlatformSuperAdmin')) return 'Admin';
    if (roles.includes('Parent')) return 'Parent';
    if (roles.includes('Teacher') || roles.includes('AttendanceOfficer')) return 'Teacher';
    if (roles.includes('Student')) return 'Student';
    if (roles.includes('FrontOffice') || roles.includes('AdmissionOfficer')) return 'Front office';
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
    private router: Router,
    private enquiryAlerts: EnquiryAlertService,
    public theme: ThemeService
  ) {}

  colorValue(event: Event) {
    return (event.target as HTMLInputElement).value;
  }

  ngOnInit() {
    this.currentRoute.set(this.router.url.split('?')[0]);
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.currentRoute.set(event.urlAfterRedirects.split('?')[0]));
    this.enquiryAlerts.start();
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

  toggleSidebar() {
    this.sidebarCollapsed.update(value => !value);
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
      this.sidebarOpen.set(false);
    }
  }

  @HostListener('document:click')
  closeMenus() {
    this.userMenu.set(false);
  }
}
