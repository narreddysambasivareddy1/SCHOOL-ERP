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
    :host { display:block; min-height:100vh; color:var(--ink); }
    .app-shell { min-height:100vh; display:flex; flex-direction:column; background:var(--canvas); }
    .topbar { position:sticky; top:0; z-index:40; height:72px; flex:none; display:flex; align-items:center; gap:22px; padding:0 30px; background:rgba(255,255,255,.92); border-bottom:1px solid var(--line); backdrop-filter:blur(18px); }
    .brand { display:flex; align-items:center; gap:12px; min-width:236px; }
    .logo,.logo-img { width:38px; height:38px; flex:none; border-radius:12px; }
    .logo { display:grid; place-items:center; color:#fff; background:linear-gradient(145deg,#7668f6,#4f46d8); box-shadow:0 6px 16px rgba(91,78,220,.22); }
    .logo-img { object-fit:cover; border:1px solid var(--line); }
    .brand strong { display:block; max-width:200px; overflow:hidden; color:#17213b; font-size:14px; font-weight:760; letter-spacing:-.035em; text-overflow:ellipsis; white-space:nowrap; }
    .brand small { display:block; margin-top:3px; color:#8a93a8; font-size:10px; font-weight:600; }
    .search-chip { display:flex; align-items:center; gap:10px; width:min(34vw,390px); height:40px; margin:0; padding:0 13px; border:1px solid #e8eaf2; border-radius:10px; background:#f7f8fc; color:#818aa0; font-size:12px; cursor:pointer; transition:.16s ease; }
    .search-chip:hover { border-color:#c9c5fb; background:#fff; color:#5146cf; }
    .search-chip kbd { margin-left:auto; padding:3px 7px; border:1px solid #e8eaf2; border-radius:6px; background:#fff; color:#9aa1b2; font:10px ui-monospace,monospace; }
    .route-context { display:grid; min-width:0; gap:2px; margin-left:0; padding-left:20px; border-left:1px solid var(--line); line-height:1.25; }
    .route-context span { color:#969db0; font-size:10px; font-weight:600; }
    .route-context strong { overflow:hidden; color:#28314b; font-size:13px; font-weight:740; text-overflow:ellipsis; white-space:nowrap; }
    .topbar-right { display:flex; align-items:center; gap:12px; margin-left:auto; }
    .year-select { height:39px; padding:0 32px 0 11px; border:1px solid #e8eaf2; border-radius:9px; background:#fff; color:#525d75; font-size:12px; }
    .user-wrap { position:relative; }
    .user-btn { display:flex; align-items:center; gap:9px; height:42px; padding:0 9px 0 4px; border:1px solid transparent; border-radius:10px; background:transparent; cursor:pointer; }
    .user-btn:hover { border-color:#e8eaf2; background:#f7f8fc; }
    .avatar { display:grid; width:33px; height:33px; flex:none; place-items:center; border-radius:10px; background:#eeedff; color:#574bd5; font-size:11px; font-weight:800; }
    .user-meta { display:flex; flex-direction:column; align-items:flex-start; }
    .user-name { color:#28314b; font-size:12px; font-weight:720; }
    .role-badge { margin-top:2px; color:#9299aa; font-size:9px; font-weight:650; }
    .menu { position:absolute; top:calc(100% + 10px); right:0; z-index:45; width:286px; padding:10px; border:1px solid #e8eaf2; border-radius:14px; background:#fff; box-shadow:0 20px 55px rgba(30,35,70,.16); }
    .mode-switch { display:grid; grid-template-columns:1fr 1fr; gap:6px; padding:4px 8px 8px; }
    .mode-switch button { height:34px; border:1px solid var(--line); border-radius:8px; background:#f7f8fc; color:var(--ink); cursor:pointer; font-size:12px; }
    .mode-switch button.on { border-color:var(--primary); background:var(--primary); color:#fff; }
    .theme-block { margin:6px 0; padding-top:7px; border-top:1px solid var(--line); }
    .swatches { display:flex; flex-wrap:wrap; gap:8px; padding:5px 8px 9px; }
    .swatch { width:30px; height:30px; border:2px solid transparent; border-radius:9px; cursor:pointer; }
    .swatch.on { outline:2px solid var(--primary); outline-offset:2px; }
    .custom-color { display:flex; align-items:center; justify-content:space-between; margin:0 8px 5px; color:var(--muted); font-size:12px; }
    .custom-color input { width:40px; height:28px; border:0; background:transparent; cursor:pointer; }
    .menu-meta { padding:4px 8px; color:var(--muted); font-size:11px; }
    .menu-item { display:flex; align-items:center; gap:8px; width:100%; padding:9px; border:0; border-radius:8px; background:transparent; color:var(--ink); cursor:pointer; font-size:12px; text-align:left; }
    .menu-item:hover { background:#f4f3ff; color:#5146cf; }
    .layout { display:flex; flex:1; min-height:calc(100vh - 72px); }
    .sidebar { position:sticky; top:72px; display:flex; width:258px; height:calc(100vh - 72px); flex:none; flex-direction:column; overflow-y:auto; padding:20px 14px 16px; border-right:1px solid #e9eaf2; background:#fff; transition:width .18s ease; }
    .sidebar.collapsed { width:76px; }
    .sidebar-heading { display:flex; align-items:center; justify-content:space-between; min-height:40px; margin:0 3px 9px; padding:0 8px 12px; border-bottom:1px solid #eff0f5; color:#9a9fb0; font-size:9px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }
    .collapse-btn { display:grid; width:28px; height:28px; place-items:center; border:1px solid #ececf3; border-radius:8px; background:#fff; color:#8a8fa3; cursor:pointer; }
    .collapse-btn:hover { border-color:#d8d4ff; background:#f7f6ff; color:#574bd5; }
    .sidebar nav { display:block; }
    .nav-label { margin-top:18px; padding:7px 11px; color:#a1a6b6; font-size:9px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }
    .nav-item { position:relative; display:flex; align-items:center; min-height:40px; gap:12px; margin:2px 0; padding:8px 11px; border-radius:9px; color:#68728a; font-size:12px; font-weight:580; text-decoration:none; transition:background .14s ease,color .14s ease; }
    .nav-item:hover { background:#f6f6fc; color:#343b59; }
    .nav-icon { width:18px; flex:none; color:#9ba1b2; font-size:14px; text-align:center; }
    .nav-item.active { background:#f0efff; color:#5146cf; font-weight:750; }
    .nav-item.active::before { position:absolute; top:9px; bottom:9px; left:0; width:3px; border-radius:0 4px 4px 0; background:#6559e8; content:""; }
    .nav-item.active .nav-icon { color:#6559e8; }
    .sidebar.collapsed .sidebar-heading { justify-content:center; padding-inline:0; }
    .sidebar.collapsed .sidebar-heading > span,.sidebar.collapsed .nav-label,.sidebar.collapsed .nav-item span { display:none; }
    .sidebar.collapsed .nav-item { justify-content:center; padding-inline:0; }
    .sidebar-footer { margin:18px 4px 0; padding:13px 10px 2px; border-top:1px solid #eff0f5; color:#a2a8b7; font-size:10px; letter-spacing:.04em; }
    .sidebar-backdrop { display:none; }
    .main-content { flex:1; min-width:0; padding:28px clamp(20px,3vw,46px) 44px; overflow:auto; background:#f6f7fb; }
    .main-content > router-outlet + * { display:block; width:100%; max-width:1600px; margin-inline:auto; }
    .palette-back { position:fixed; inset:0; z-index:60; display:grid; place-items:start center; padding-top:12vh; background:rgba(22,27,54,.38); backdrop-filter:blur(5px); }
    .palette { width:min(560px,calc(100% - 32px)); overflow:hidden; border:1px solid #e8e8f1; border-radius:16px; background:#fff; box-shadow:0 24px 80px rgba(20,25,55,.22); }
    .palette-input { display:flex; align-items:center; gap:10px; padding:16px 18px; border-bottom:1px solid #eeeef5; }
    .palette-input input { flex:1; border:0; outline:none; background:transparent; color:#252d48; font-size:14px; box-shadow:none; }
    .palette-item { display:flex; align-items:center; gap:11px; width:100%; min-height:42px; padding:9px 16px; border:0; border-radius:8px; background:transparent; color:#49536d; cursor:pointer; font-size:12px; text-align:left; }
    .palette-item:hover { background:#f3f2ff; color:#5146cf; }
    .palette-item small { margin-left:auto; color:#a0a5b4; }
    .palette-empty { padding:24px; color:#9299aa; font-size:12px; text-align:center; }
    @media(max-width:1100px) { .brand { min-width:190px; } .search-chip { width:220px; } .route-context { display:none; } }
    @media(max-width:900px) { .year-select { display:none; } .sidebar { width:238px; } .sidebar.collapsed { width:76px; } }
    @media(max-width:768px) {
      .topbar { height:64px; gap:9px; padding:0 12px; }
      .mobile-menu-btn { display:block; }
      .brand { min-width:0; flex:1; }
      .brand strong { max-width:150px; }
      .search-chip { width:40px; min-width:40px; height:40px; justify-content:center; padding:0; }
      .search-chip span,.search-chip kbd,.user-meta { display:none; }
      .layout { min-height:calc(100vh - 64px); }
      .sidebar { position:fixed; top:64px; bottom:0; left:0; z-index:35; display:none; width:min(292px,calc(100vw - 48px)); height:auto; padding:18px 14px; box-shadow:12px 0 40px rgba(24,28,58,.12); }
      .sidebar.open { display:flex; }
      .sidebar.collapsed { width:min(292px,calc(100vw - 48px)); }
      .sidebar.collapsed .sidebar-heading { justify-content:space-between; padding-inline:8px; }
      .sidebar.collapsed .sidebar-heading > span,.sidebar.collapsed .nav-label,.sidebar.collapsed .nav-item span { display:block; }
      .sidebar.collapsed .nav-item { justify-content:flex-start; padding-inline:11px; }
      .sidebar-backdrop:not([hidden]) { position:fixed; inset:64px 0 0; z-index:30; display:block; width:100%; border:0; background:rgba(19,24,48,.35); }
      .main-content { padding:17px 13px 28px; }
    }
    @media(prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto!important; transition-duration:.01ms!important; animation-duration:.01ms!important; } }
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
