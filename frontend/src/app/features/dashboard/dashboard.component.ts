import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { LocaleService } from '../../core/services/locale.service';

interface Stat {
  label: string;
  value: string;
  sub: string;
  icon: string;
  tone: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="dashboard-heading">
      <div>
        <div class="eyebrow">SCHOOL ERP / {{ ctx.context()?.academicYearName || 'ACADEMIC YEAR' }}</div>
        <h1>Overview</h1>
        <p>{{ ctx.context()?.schoolName }} · Welcome back, {{ user()?.firstName }}</p>
      </div>
      <div class="heading-actions">
        <span class="date-chip"><i class="pi pi-calendar"></i> {{ todayLabel }}</span>
        @if (canCreateAdmission) {
          <a routerLink="/admissions" class="primary-action"><i class="pi pi-plus"></i> New admission</a>
        }
      </div>
    </header>

    @if (error()) {
      <div class="alert-banner" role="alert"><i class="pi pi-exclamation-circle"></i> Could not load dashboard statistics — {{ error() }}</div>
    }

    <section class="stats-grid" aria-label="School overview">
      @for (stat of stats(); track stat.label) {
        <article class="stat-card" [class.is-loading]="loading()">
          <span [class]="'stat-icon ' + stat.tone"><i [class]="stat.icon"></i></span>
          <span class="stat-label">{{ stat.label }}</span>
          <strong class="stat-value">{{ loading() ? '—' : stat.value }}</strong>
          <span class="stat-sub">{{ stat.sub }}</span>
        </article>
      }
    </section>

    <section class="dashboard-content">
      <article class="panel attendance-panel">
        <div class="panel-heading">
          <div>
            <h2>Attendance report</h2>
            <p>Daily present or late rate from recorded sessions</p>
          </div>
          <a routerLink="/attendance" aria-label="Open attendance"><i class="pi pi-arrow-up-right"></i></a>
        </div>
        @if (loading()) {
          <div class="chart-loading"><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span></div>
        } @else if (attendanceTrend().length) {
          <div class="trend-chart" role="img" aria-label="Daily attendance trend for the last seven days">
            @for (point of attendanceTrend(); track point.date) {
              <div class="trend-day" [attr.aria-label]="(point.date | date:'EEE, d MMM') + ': ' + point.pct + '%'">
                <div class="trend-bar-wrap"><span class="trend-bar" [style.height.%]="point.pct"></span></div>
                <strong>{{ point.pct }}%</strong>
                <small>{{ point.date | date:'EEE' }}</small>
              </div>
            }
          </div>
        } @else {
          <div class="empty-chart"><i class="pi pi-chart-bar"></i><span>No attendance trend has been recorded this week.</span></div>
        }
      </article>

      <article class="panel operations-panel">
        <div class="panel-heading">
          <div>
            <h2>Today’s activity</h2>
            <p>Admissions, finance and school operations</p>
          </div>
        </div>
        @if (loading()) {
          <div class="operation-loading"><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span></div>
        } @else {
          <a routerLink="/enquiries" class="operation-row">
            <span class="operation-icon violet"><i class="pi pi-inbox"></i></span>
            <span class="operation-copy"><strong>{{ enquiryNew() }} new enquiries</strong><small>{{ enquiryOpen() }} open for follow-up</small></span>
            <i class="pi pi-chevron-right"></i>
          </a>
          <a routerLink="/fees" class="operation-row">
            <span class="operation-icon teal"><i class="pi pi-wallet"></i></span>
            <span class="operation-copy"><strong>{{ locale.formatMoney(feeTotal()) }} collected</strong><small>Successful payments this month</small></span>
            <i class="pi pi-chevron-right"></i>
          </a>
          @if (canSeeAcademicOps) {
            @if (opsError()) { <div class="inline-error" role="alert">{{ opsError() }}</div> }
            <a routerLink="/substitutions" class="operation-row">
              <span class="operation-icon amber"><i class="pi pi-users"></i></span>
              <span class="operation-copy"><strong>{{ ops()?.openSubstitutions ?? '—' }} periods need cover</strong><small>{{ ops()?.onLeave ?? '—' }} teacher(s) on leave · {{ ops()?.presentStaff ?? '—' }} present</small></span>
              <i class="pi pi-chevron-right"></i>
            </a>
            @if (ops()?.availability?.length) {
              <div class="availability">
                <div class="availability-heading"><strong>Available substitutes</strong><span>by period</span></div>
                @for (period of ops()?.availability || []; track period.periodId) {
                  <div class="availability-row">
                    <span>{{ period.period }}</span>
                    <strong>{{ period.free }}</strong>
                    <small>{{ teacherNames(period) || 'No teachers available' }}</small>
                  </div>
                }
              </div>
            }
          }
          @if (canSeeDiaryCompliance) {
            @if (diaryError()) { <div class="inline-error" role="alert">{{ diaryError() }}</div> }
            <a routerLink="/diary" class="operation-row">
              <span class="operation-icon blue"><i class="pi pi-book"></i></span>
              <span class="operation-copy"><strong>{{ diarySubmitted() }} submitted · {{ diaryPending() }} pending</strong><small>Daily class diary compliance</small></span>
              <i class="pi pi-chevron-right"></i>
            </a>
          }
        }
      </article>
    </section>

    <section class="quick-links">
      <div class="section-heading">
        <div><h2>Quick access</h2><p>Frequently used areas</p></div>
      </div>
      <div class="quick-grid">
        @if (canSeeStudents) {
          <a routerLink="/students"><i class="pi pi-users"></i><span><strong>Students</strong><small>Records and enrolments</small></span><i class="pi pi-arrow-up-right"></i></a>
        }
        @if (canSeeStaff) {
          <a routerLink="/staff"><i class="pi pi-id-card"></i><span><strong>Staff & HR</strong><small>Employees and teams</small></span><i class="pi pi-arrow-up-right"></i></a>
        }
        @if (canSeeTimetable) {
          <a routerLink="/timetable"><i class="pi pi-table"></i><span><strong>Timetable</strong><small>Classes and periods</small></span><i class="pi pi-arrow-up-right"></i></a>
        }
        @if (canSeeAnalytics) {
          <a routerLink="/analytics"><i class="pi pi-chart-bar"></i><span><strong>Analytics</strong><small>Reports and insights</small></span><i class="pi pi-arrow-up-right"></i></a>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .dashboard-heading { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 16px 24px; margin: 0 0 24px; padding: 24px; border-radius: 16px; background: linear-gradient(120deg, var(--sidebar), var(--primary)); color: white; }
    .dashboard-heading h1 { margin: 4px 0; color: white; font-size: 32px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.15; }
    .dashboard-heading p { margin: 0; color: rgba(255,255,255,.84); font-size: 15px; line-height: 1.5; }
    .dashboard-heading .eyebrow { color: rgba(255,255,255,.72); }
    .heading-actions { display: flex; align-items: center; gap: 12px; }
    .date-chip, .primary-action { display: inline-flex; align-items: center; height: 40px; border-radius: 10px; font-size: 14px; font-weight: 650; }
    .date-chip { gap: 8px; padding: 0 12px; border: 1px solid rgba(255,255,255,.28); background: rgba(255,255,255,.12); color: white; }
    .primary-action { gap: 8px; padding: 0 14px; background: white; color: var(--primary); text-decoration: none; }
    .primary-action:hover { background: var(--primary-soft); }
    .alert-banner { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 12px 16px; border-radius: 12px; background: var(--warn-soft); color: var(--warn); font-size: 14px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
    .stat-card { display: grid; align-content: start; gap: 8px; min-height: 156px; padding: 20px; border: 1px solid var(--line); border-radius: 16px; background: white; box-shadow: var(--shadow-sm); }
    .stat-card.is-loading { opacity: .72; }
    .stat-icon, .operation-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; font-size: 16px; }
    .blue { background: #eaf1ff; color: #245fc4; }
    .teal { background: #e4f6f2; color: #087d68; }
    .amber { background: #fff3dc; color: #996300; }
    .violet { background: #f0ecff; color: #6847b7; }
    .stat-label { color: var(--muted); font-size: 13px; font-weight: 650; line-height: 1.3; }
    .stat-value { color: var(--navy); font-size: 28px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.15; font-variant-numeric: tabular-nums; }
    .stat-sub { color: var(--muted); font-size: 13px; line-height: 1.4; }
    .dashboard-content { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(300px, .85fr); gap: 16px; align-items: stretch; margin-top: 16px; }
    .panel { display: flex; min-width: 0; flex-direction: column; padding: 20px; border: 1px solid var(--line); border-radius: 16px; background: white; box-shadow: var(--shadow-sm); }
    .panel-heading, .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .panel-heading h2, .section-heading h2 { margin: 0; color: var(--navy); font-size: 18px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; }
    .panel-heading p, .section-heading p { margin: 4px 0 0; color: var(--muted); font-size: 14px; line-height: 1.45; }
    .panel-heading > a { display: grid; width: 40px; height: 40px; flex: none; place-items: center; border: 1px solid var(--line); border-radius: 10px; color: var(--navy); text-decoration: none; }
    .trend-chart { display: grid; height: 220px; grid-template-columns: repeat(7, minmax(0, 1fr)); align-items: end; gap: 12px; margin-top: 20px; }
    .trend-day { display: grid; height: 100%; grid-template-rows: minmax(0, 1fr) 20px 20px; justify-items: center; align-items: end; }
    .trend-bar-wrap { display: flex; width: 100%; height: 100%; align-items: end; justify-content: center; border-bottom: 1px solid var(--line); }
    .trend-bar { display: block; width: 16px; min-height: 4px; border-radius: 6px 6px 0 0; background: var(--primary); }
    .trend-day strong, .trend-day small { font-size: 12px; font-variant-numeric: tabular-nums; line-height: 20px; }
    .trend-day strong { color: var(--navy); font-weight: 700; }
    .trend-day small { color: var(--muted); }
    .chart-loading { display: grid; height: 220px; grid-template-columns: repeat(7, minmax(0, 1fr)); align-items: end; gap: 12px; margin-top: 20px; }
    .chart-loading .skeleton { height: 60%; }
    .empty-chart { display: grid; flex: 1; min-height: 220px; align-content: center; justify-items: center; gap: 8px; color: var(--muted); font-size: 14px; text-align: center; }
    .operation-row { display: grid; grid-template-columns: 40px minmax(0, 1fr) 16px; align-items: center; gap: 12px; min-height: 64px; border-bottom: 1px solid var(--line); color: inherit; text-decoration: none; }
    .operation-row:last-of-type { border-bottom: 0; }
    .operation-row:hover { margin-inline: -8px; padding-inline: 8px; border-radius: 10px; background: var(--primary-soft); }
    .operation-copy { display: grid; min-width: 0; gap: 2px; }
    .operation-copy strong { overflow: hidden; color: var(--navy); font-size: 14px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
    .operation-copy small { overflow: hidden; color: var(--muted); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
    .operation-row > i { color: var(--muted); font-size: 12px; }
    .availability { margin-top: 8px; }
    .availability-heading { display: flex; align-items: center; justify-content: space-between; min-height: 36px; color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
    .availability-row { display: grid; grid-template-columns: 48px 36px minmax(0, 1fr); align-items: center; gap: 12px; }
    .availability-heading strong, .availability-heading span { font: inherit; color: inherit; }
    .availability-heading span { text-align: left; }
    .availability-row { min-height: 36px; border-top: 1px solid var(--line); font-size: 14px; }
    .availability-row > span, .availability-row > strong { color: var(--navy); font-weight: 700; font-variant-numeric: tabular-nums; }
    .availability-row > small { overflow: hidden; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; }
    .inline-error { margin-top: 8px; padding: 8px 12px; border-radius: 8px; background: var(--danger-soft); color: var(--danger); font-size: 13px; }
    .quick-links { margin-top: 24px; }
    .section-heading { margin-bottom: 12px; }
    .quick-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .quick-grid > a { display: grid; grid-template-columns: 40px minmax(0, 1fr) 16px; align-items: center; gap: 12px; min-height: 76px; padding: 16px; border: 1px solid var(--line); border-radius: 16px; background: white; color: var(--primary); text-decoration: none; box-shadow: var(--shadow-sm); }
    .quick-grid > a > i:first-child { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 12px; background: var(--primary-soft); font-size: 16px; }
    .quick-grid > a > span { display: grid; min-width: 0; gap: 2px; }
    .quick-grid > a > span strong { color: var(--navy); font-size: 14px; }
    .quick-grid > a > span small { color: var(--muted); font-size: 13px; }
    .quick-grid > a > i:last-child { color: var(--muted); font-size: 12px; }
    .skeleton { display: block; }
    .operation-loading { display: grid; gap: 12px; margin-top: 16px; }
    .operation-loading .skeleton { height: 56px; }
    @media (max-width: 1100px) {
      .stats-grid, .quick-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .dashboard-content { grid-template-columns: minmax(0, 1fr); }
    }
    @media (max-width: 720px) {
      .dashboard-heading { grid-template-columns: minmax(0, 1fr); align-items: start; padding: 20px; }
      .heading-actions { flex-wrap: wrap; }
      .stats-grid, .quick-grid { grid-template-columns: minmax(0, 1fr); }
      .dashboard-heading h1 { font-size: 26px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  user = this.auth.user;
  greeting = this.getGreeting();
  loading = signal(true);
  opsLoading = signal(true);
  diaryLoading = signal(true);
  error = signal<string | null>(null);
  opsError = signal<string | null>(null);
  diaryError = signal<string | null>(null);
  enquiryNew = signal(0);
  enquiryOpen = signal(0);
  feeTotal = signal(0);
  attendancePct = signal(0);
  attendanceMarked = signal(false);
  attendanceTrend = signal<{ date: string; pct: number }[]>([]);
  ops = signal<any>(null);
  diaryPending = signal(0);
  diarySubmitted = signal(0);
  canSeeAcademicOps = false;
  canSeeDiaryCompliance = false;
  canCreateAdmission = false;
  canSeeStudents = false;
  canSeeStaff = false;
  canSeeTimetable = false;
  canSeeAnalytics = false;

  stats = signal<Stat[]>([
    { label: 'Active students', value: '—', sub: 'Enrolled this academic year', icon: 'pi pi-users', tone: 'blue' },
    { label: 'Staff strength', value: '—', sub: 'Active employees', icon: 'pi pi-id-card', tone: 'teal' },
    { label: 'Attendance today', value: '—', sub: 'Present or late', icon: 'pi pi-check-square', tone: 'amber' },
    { label: 'Fees this month', value: '—', sub: 'Successful payments', icon: 'pi pi-wallet', tone: 'violet' },
  ]);

  constructor(
    public auth: AuthService,
    public ctx: SchoolContextService,
    private api: ApiService,
    public locale: LocaleService
  ) {
    this.canSeeAcademicOps = auth.hasRole('SchoolAdmin') || auth.hasRole('HRManager');
    this.canSeeDiaryCompliance = auth.hasRole('SchoolAdmin');
    this.canCreateAdmission = auth.hasRole('SchoolAdmin') || auth.hasRole('PlatformSuperAdmin') ||
      auth.hasRole('AdmissionOfficer') || auth.hasRole('FrontOffice');
    this.canSeeStudents = auth.hasRole('SchoolAdmin') || auth.hasRole('PlatformSuperAdmin') ||
      auth.hasRole('AdmissionOfficer') || auth.hasRole('Teacher') || auth.hasRole('AttendanceOfficer');
    this.canSeeStaff = auth.hasRole('SchoolAdmin') || auth.hasRole('PlatformSuperAdmin') || auth.hasRole('HRManager');
    this.canSeeTimetable = auth.hasRole('SchoolAdmin') || auth.hasRole('PlatformSuperAdmin') ||
      auth.hasRole('Teacher') || auth.hasRole('AttendanceOfficer') || auth.hasRole('Parent') || auth.hasRole('Student');
    this.canSeeAnalytics = auth.hasRole('SchoolAdmin') || auth.hasRole('PlatformSuperAdmin');
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString(this.ctx.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  ngOnInit() {
    if (!this.ctx.schoolId || !this.ctx.academicYearId) {
      this.loading.set(false);
      this.opsLoading.set(false);
      this.diaryLoading.set(false);
      return;
    }
    this.api.getDashboardStats(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
      next: data => {
        this.enquiryNew.set(data.enquiryNew ?? 0);
        this.enquiryOpen.set(data.enquiryOpen ?? 0);
        this.feeTotal.set(data.feeCollectedThisMonth ?? 0);
        this.attendancePct.set(data.attendancePct ?? 0);
        this.attendanceMarked.set(data.attendanceMarked ?? false);
        this.attendanceTrend.set(data.attendanceTrend ?? []);
        this.stats.set([
          { label: 'Active students', value: Number(data.studentCount ?? 0).toLocaleString(this.ctx.locale), sub: 'Enrolled this academic year', icon: 'pi pi-users', tone: 'blue' },
          { label: 'Staff strength', value: Number(data.staffCount ?? 0).toLocaleString(this.ctx.locale), sub: 'Active employees', icon: 'pi pi-id-card', tone: 'teal' },
          { label: 'Attendance today', value: data.attendanceMarked ? `${data.attendancePct}%` : 'Not marked', sub: data.attendanceMarked ? 'Present or late' : 'Awaiting attendance entry', icon: 'pi pi-check-square', tone: 'amber' },
          { label: 'Fees this month', value: this.locale.formatMoney(data.feeCollectedThisMonth ?? 0), sub: 'Successful payments', icon: 'pi pi-wallet', tone: 'violet' },
        ]);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error?.error?.message ?? 'API unavailable');
        this.loading.set(false);
      }
    });
    if (this.canSeeAcademicOps) {
      this.api.getOpsToday(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
        next: data => { this.ops.set(data); this.opsLoading.set(false); },
        error: () => { this.opsError.set('Could not load today’s staff cover.'); this.opsLoading.set(false); }
      });
    } else {
      this.opsLoading.set(false);
    }
    if (this.canSeeDiaryCompliance) {
      this.api.getDiaryCompliance(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
        next: data => {
          this.diaryPending.set(data.pending ?? 0);
          this.diarySubmitted.set(data.submitted ?? 0);
          this.diaryLoading.set(false);
        },
        error: () => { this.diaryError.set('Could not load diary compliance.'); this.diaryLoading.set(false); }
      });
    } else {
      this.diaryLoading.set(false);
    }
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  }

  teacherNames(period: any): string {
    const teachers = (period.freeTeachers || []).map((teacher: any) => teacher.name);
    if (teachers.length <= 2) return teachers.join(', ');
    return `${teachers.slice(0, 2).join(', ')} +${teachers.length - 2}`;
  }
}
