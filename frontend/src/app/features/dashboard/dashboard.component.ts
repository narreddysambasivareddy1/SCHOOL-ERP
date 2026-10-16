import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { LocaleService } from '../../core/services/locale.service';

interface Stat { label: string; value: string; sub: string; icon: string; iconBg: string; iconColor: string; }
interface Mod { icon: string; label: string; desc: string; route: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="eyebrow">SCHOOL ADMIN</div>
      <h1>Good {{ greeting }}, {{ user()?.firstName }}</h1>
      <p class="sub">Principal workspace — people, academics, finance, transport and governance for {{ ctx.context()?.schoolName }}.</p>
    </div>

    @if (error()) {
      <div class="alert-banner">Could not load live stats — {{ error() }}</div>
    }

    <div class="stats-grid">
      @for (s of stats(); track s.label) {
        <div class="stat-card" [class.loading]="loading()">
          <div class="stat-icon" [style.background]="s.iconBg" [style.color]="s.iconColor"><i [class]="s.icon"></i></div>
          <div>
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-value">{{ loading() ? '—' : s.value }}</div>
            <div class="stat-sub">{{ s.sub }}</div>
          </div>
        </div>
      }
    </div>

    <div class="mod-section">Today</div>
    <div class="today-row">
      <a routerLink="/attendance" class="today-card">
        <strong>Attendance</strong>
        <small>Mark or review class sessions that are still open</small>
      </a>
      <a routerLink="/leave" class="today-card">
        <strong>Leave queue</strong>
        <small>Approve or reject pending staff leave</small>
      </a>
      <a routerLink="/admissions" class="today-card">
        <strong>Admissions</strong>
        <small>New enquiries and active enrolments</small>
      </a>
      <a routerLink="/fees" class="today-card">
        <strong>Fee exceptions</strong>
        <small>Collection, dues and receipts</small>
      </a>
    </div>

    <div class="mod-section">People</div>
    <div class="mod-grid">
      @for (m of people; track m.label) {
        <a class="mod-card" [routerLink]="m.route"><i [class]="m.icon"></i><strong>{{ m.label }}</strong><small>{{ m.desc }}</small></a>
      }
    </div>
    <div class="mod-section">Academics</div>
    <div class="mod-grid">
      @for (m of academics; track m.label) {
        <a class="mod-card" [routerLink]="m.route"><i [class]="m.icon"></i><strong>{{ m.label }}</strong><small>{{ m.desc }}</small></a>
      }
    </div>
    <div class="mod-section">Finance & operations</div>
    <div class="mod-grid">
      @for (m of operations; track m.label) {
        <a class="mod-card" [routerLink]="m.route"><i [class]="m.icon"></i><strong>{{ m.label }}</strong><small>{{ m.desc }}</small></a>
      }
    </div>
    <div class="mod-section">Governance</div>
    <div class="mod-grid">
      @for (m of governance; track m.label) {
        <a class="mod-card" [routerLink]="m.route"><i [class]="m.icon"></i><strong>{{ m.label }}</strong><small>{{ m.desc }}</small></a>
      }
    </div>
  `,
  styles: [`
    .sub { margin: 0; color: var(--muted); font-size: 13px; }
    .alert-banner { background: var(--warn-soft); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: var(--warn); margin-bottom: 16px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; }
    .stat-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 18px; display: flex; gap: 12px; box-shadow: var(--shadow); }
    .stat-card.loading { opacity: 0.6; }
    .stat-icon { width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; }
    .stat-label { font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: 800; color: var(--navy); }
    .stat-sub { font-size: 11px; color: var(--teal); }
    .today-row { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; }
    .today-card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 14px; text-decoration: none; color: var(--ink); }
    .today-card:hover { border-color: #93b4f0; }
    .today-card strong { display: block; font-size: 13px; color: var(--navy); margin-bottom: 4px; }
    .today-card small { color: var(--muted); font-size: 11px; line-height: 1.4; }
    @media (max-width: 1024px) { .stats-grid, .today-row { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  user = this.auth.user;
  greeting = this.getGreeting();
  loading = signal(true);
  error = signal<string | null>(null);

  stats = signal<Stat[]>([
    { label: 'Active students', value: '—', sub: 'Enrolments this year', icon: 'pi pi-users', iconBg: '#eaf3ff', iconColor: '#1c5cb7' },
    { label: 'Staff', value: '—', sub: 'Employees', icon: 'pi pi-id-card', iconBg: '#e3f8f3', iconColor: '#087d68' },
    { label: 'Attendance today', value: '—', sub: 'All sections', icon: 'pi pi-check-square', iconBg: '#fff4db', iconColor: '#9a6900' },
    { label: 'Fees this month', value: '—', sub: 'Collected', icon: 'pi pi-wallet', iconBg: '#f0ebff', iconColor: '#6b3fa0' },
  ]);

  people: Mod[] = [
    { icon: 'pi pi-user-plus', label: 'Admissions', desc: 'Enquiries, applicants and new admissions', route: '/admissions' },
    { icon: 'pi pi-users', label: 'Students', desc: 'SIS records, guardians and lifecycle', route: '/students' },
    { icon: 'pi pi-id-card', label: 'Staff & HR', desc: 'Employees, departments and designations', route: '/staff' },
    { icon: 'pi pi-calendar-plus', label: 'Leave approvals', desc: 'Staff leave apply / approve / reject', route: '/leave' },
  ];
  academics: Mod[] = [
    { icon: 'pi pi-sitemap', label: 'Classes & assignments', desc: 'Teacher–subject–section mapping', route: '/academics' },
    { icon: 'pi pi-table', label: 'Timetable', desc: 'Class and teacher allocations', route: '/timetable' },
    { icon: 'pi pi-check-square', label: 'Attendance', desc: 'Oversight and session marking', route: '/attendance' },
    { icon: 'pi pi-book', label: 'Homework', desc: 'Assignments, due dates and submissions', route: '/homework' },
    { icon: 'pi pi-file', label: 'Examinations', desc: 'Marks approval and report publication', route: '/examinations' },
    { icon: 'pi pi-calendar', label: 'Calendar', desc: 'Events, holidays and activities', route: '/calendar' },
  ];
  operations: Mod[] = [
    { icon: 'pi pi-wallet', label: 'Fees & payments', desc: 'Collection, receipts and dues', route: '/fees' },
    { icon: 'pi pi-briefcase', label: 'Payroll', desc: 'Restricted payroll runs and payslips', route: '/payroll' },
    { icon: 'pi pi-map', label: 'Transport', desc: 'Routes, trips and assignments', route: '/transport' },
    { icon: 'pi pi-send', label: 'Communications', desc: 'Announcements to parents and staff', route: '/communications' },
  ];
  governance: Mod[] = [
    { icon: 'pi pi-chart-bar', label: 'Analytics', desc: 'Strength, attendance and collection', route: '/analytics' },
    { icon: 'pi pi-history', label: 'Audit trail', desc: 'Who changed what, and when', route: '/audit' },
    { icon: 'pi pi-cog', label: 'School settings', desc: 'Branding, locale, currency, year', route: '/settings' },
  ];

  constructor(public auth: AuthService, public ctx: SchoolContextService, private api: ApiService, private locale: LocaleService) {}

  ngOnInit() {
    if (!this.ctx.schoolId || !this.ctx.academicYearId) { this.loading.set(false); return; }
    this.api.getDashboardStats(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
      next: (d) => {
        this.stats.set([
          { label: 'Active students', value: d.studentCount.toLocaleString(), sub: 'Enrolments this year', icon: 'pi pi-users', iconBg: '#eaf3ff', iconColor: '#1c5cb7' },
          { label: 'Staff', value: d.staffCount.toLocaleString(), sub: 'Employees', icon: 'pi pi-id-card', iconBg: '#e3f8f3', iconColor: '#087d68' },
          { label: 'Attendance today', value: d.attendanceMarked ? `${d.attendancePct}%` : 'Not marked', sub: d.attendanceMarked ? 'Present today' : 'Pending', icon: 'pi pi-check-square', iconBg: '#fff4db', iconColor: '#9a6900' },
          { label: 'Fees this month', value: this.locale.formatMoney(d.feeCollectedThisMonth), sub: 'Collected', icon: 'pi pi-wallet', iconBg: '#f0ebff', iconColor: '#6b3fa0' },
        ]);
        this.loading.set(false);
      },
      error: (e) => { this.error.set(e?.error?.message ?? 'API unavailable'); this.loading.set(false); }
    });
  }

  private getGreeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }
}
