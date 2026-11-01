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
    <header class="home-bar">
      <div>
        <p class="kicker">{{ ctx.context()?.schoolName || 'School' }} · {{ ctx.context()?.academicYearName || 'Academic year' }}</p>
        <h1>Good {{ greeting }}, {{ user()?.firstName }}</h1>
      </div>
      <div class="home-tools">
        <span class="date-chip"><i class="pi pi-calendar"></i> {{ todayLabel }}</span>
        @if (canCreateAdmission) {
          <a routerLink="/admissions" class="primary-action"><i class="pi pi-plus"></i> New admission</a>
        }
      </div>
    </header>

    @if (error()) {
      <div class="alert-banner" role="alert"><i class="pi pi-exclamation-circle"></i> Could not load dashboard statistics — {{ error() }}</div>
    }

    <section class="metrics" aria-label="School overview" [class.is-loading]="loading()">
      @for (stat of stats(); track stat.label) {
        <article class="metric">
          <span class="metric-icon" aria-hidden="true"><i [class]="stat.icon"></i></span>
          <span class="metric-label">{{ stat.label }}</span>
          <strong>{{ loading() ? '—' : stat.value }}</strong>
          <span class="metric-note">{{ stat.sub }}</span>
        </article>
      }
    </section>

    <section class="board">
      <article class="panel">
        <div class="panel-heading">
          <div>
            <h2>Attendance this week</h2>
            <p>Present or late, from marked sessions</p>
          </div>
          <div class="today-figure">
            <strong>{{ loading() ? '—' : (attendanceMarked() ? attendancePct() + '%' : '—') }}</strong>
            <span>{{ attendanceMarked() ? 'Today' : 'Not marked' }}</span>
          </div>
          <a routerLink="/attendance" class="open-link">Open</a>
        </div>
        @if (loading()) {
          <div class="chart-loading"><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span></div>
        } @else if (attendanceTrend().length) {
          <div class="trend-chart" role="img" aria-label="Daily attendance trend for the last seven days">
            @for (point of attendanceTrend(); track point.date; let last = $last) {
              <div class="trend-day" [class.is-latest]="last" [attr.aria-label]="(point.date | date:'EEE, d MMM') + ': ' + point.pct + '%'">
                <div class="trend-track"><span class="trend-bar" [style.height.%]="point.pct"></span></div>
                <strong>{{ point.pct }}</strong>
                <small>{{ point.date | date:'EEE' }}</small>
              </div>
            }
          </div>
        } @else {
          <div class="empty-chart"><i class="pi pi-chart-bar"></i><span>No attendance has been recorded this week.</span></div>
        }
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <h2>Needs attention</h2>
            <p>Open work for today</p>
          </div>
        </div>
        @if (loading()) {
          <div class="operation-loading"><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span></div>
        } @else {
          <div class="queue">
            <a routerLink="/enquiries">
              <span>New enquiries</span>
              <strong>{{ enquiryNew() }}</strong>
              <small>{{ enquiryOpen() }} still open</small>
            </a>
            <a routerLink="/fees">
              <span>Fees collected</span>
              <strong>{{ locale.formatMoney(feeTotal()) }}</strong>
              <small>This month</small>
            </a>
            @if (canSeeAcademicOps) {
              <a routerLink="/substitutions">
                <span>Periods to cover</span>
                <strong>{{ ops()?.openSubstitutions ?? '—' }}</strong>
                <small>{{ ops()?.onLeave ?? '—' }} on leave · {{ ops()?.presentStaff ?? '—' }} present</small>
              </a>
            }
            @if (canSeeDiaryCompliance) {
              <a routerLink="/diary">
                <span>Diary pending</span>
                <strong>{{ diaryPending() }}</strong>
                <small>{{ diarySubmitted() }} submitted today</small>
              </a>
            }
          </div>
          @if (opsError()) { <div class="inline-error" role="alert">{{ opsError() }}</div> }
          @if (diaryError()) { <div class="inline-error" role="alert">{{ diaryError() }}</div> }
        }
      </article>
    </section>

    @if (canSeeAcademicOps && ops()?.availability?.length) {
      <section class="panel cover-panel">
        <div class="panel-heading">
          <div>
            <h2>Free teachers</h2>
            <p>Who can cover a period today</p>
          </div>
          <a routerLink="/substitutions" class="open-link">Assign</a>
        </div>
        <div class="cover-table">
          <div class="cover-head"><span>Period</span><span>Free</span><span>Teachers</span></div>
          @for (period of ops()?.availability || []; track period.periodId) {
            <div class="cover-row">
              <span>{{ period.period }}</span>
              <strong>{{ period.free }}</strong>
              <small>{{ teacherNames(period) || 'No teachers available' }}</small>
            </div>
          }
        </div>
      </section>
    }
  `,
  styles: [`
    :host { display: block; }
    .home-bar { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px 24px; margin: 0 0 20px; }
    .kicker { margin: 0 0 6px; color: var(--muted); font-size: 13px; font-weight: 600; line-height: 1.4; }
    .home-bar h1 { margin: 0; color: var(--navy); font-size: 32px; font-weight: 650; letter-spacing: -0.04em; line-height: 1.1; }
    .home-tools { display: flex; align-items: center; gap: 10px; flex: none; }
    .date-chip, .primary-action, .open-link { display: inline-flex; align-items: center; height: 40px; border-radius: 10px; font-size: 14px; font-weight: 650; text-decoration: none; }
    .date-chip { gap: 8px; padding: 0 12px; border: 1px solid var(--line); background: var(--surface); color: var(--navy); }
    .primary-action { gap: 8px; padding: 0 14px; background: var(--primary); color: white; }
    .primary-action:hover { background: var(--primary-hover); }
    .alert-banner { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 12px 16px; border-radius: 12px; background: var(--warn-soft); color: var(--warn); font-size: 14px; }
    .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .metrics.is-loading { opacity: .72; }
    .metric { display: grid; grid-template-columns: auto minmax(0, 1fr); align-content: start; column-gap: 12px; row-gap: 4px; min-height: 124px; padding: 18px; border: 1px solid var(--line); border-radius: 18px; background: var(--surface); box-shadow: var(--shadow-sm); }
    .metric-icon { grid-row: span 3; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--primary-soft); color: var(--teal); font-size: 16px; }
    .metric-label, .metric strong, .metric-note { grid-column: 2; }
    .metric-label { color: var(--muted); font-size: 13px; font-weight: 650; line-height: 1.3; }
    .metric strong { color: var(--navy); font-size: 32px; font-weight: 700; letter-spacing: -0.04em; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .metric-note { color: var(--muted); font-size: 13px; line-height: 1.4; }
    .board { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.85fr); gap: 16px; align-items: stretch; margin-top: 16px; }
    .panel { display: flex; min-width: 0; flex-direction: column; padding: 20px 22px; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); box-shadow: var(--shadow-sm); }
    .panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .panel-heading h2 { margin: 0; color: var(--navy); font-size: 17px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; }
    .panel-heading p { margin: 4px 0 0; color: var(--muted); font-size: 13px; line-height: 1.45; }
    .open-link { padding: 0 14px; border: 1px solid var(--line); background: var(--surface); color: var(--navy); }
    .open-link:hover { border-color: var(--primary); color: var(--primary); }
    .today-figure { display: grid; justify-items: end; margin-left: auto; }
    .today-figure strong { color: var(--navy); font-size: 28px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums; }
    .today-figure span { color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .trend-chart { display: grid; height: 228px; grid-template-columns: repeat(7, minmax(0, 1fr)); align-items: end; gap: 14px; margin-top: 22px; padding-top: 8px; border-bottom: 1px solid var(--line); }
    .trend-day { display: grid; height: 100%; grid-template-rows: minmax(0, 1fr) 22px 18px; justify-items: center; align-items: end; gap: 6px; }
    .trend-track { display: flex; width: min(28px, 100%); height: 100%; align-items: end; justify-content: center; background: transparent; }
    .trend-bar { display: block; width: 100%; min-height: 4px; border-radius: 8px 8px 0 0; background: var(--navy); }
    .trend-day.is-latest .trend-bar { background: var(--teal); }
    .trend-day strong { color: var(--navy); font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; }
    .trend-day small { color: var(--muted); font-size: 12px; font-weight: 650; line-height: 1; }
    .chart-loading { display: grid; height: 228px; grid-template-columns: repeat(7, minmax(0, 1fr)); align-items: end; gap: 10px; margin-top: 18px; }
    .chart-loading .skeleton { height: 55%; border-radius: 8px; }
    .empty-chart { display: grid; flex: 1; min-height: 200px; align-content: center; justify-items: center; gap: 8px; color: var(--muted); font-size: 14px; text-align: center; }
    .queue { display: grid; gap: 8px; margin-top: 16px; }
    .queue a { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-rows: auto auto; align-items: center; column-gap: 16px; min-height: 68px; padding: 10px 14px; border-radius: 14px; background: var(--canvas); color: inherit; text-decoration: none; }
    .queue a:hover { background: var(--primary-soft); }
    .queue a > span { color: var(--navy); font-size: 14px; font-weight: 650; }
    .queue a > strong { color: var(--navy); font-size: 18px; font-weight: 700; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; text-align: right; }
    .queue a > small { grid-column: 1 / -1; color: var(--muted); font-size: 13px; }
    .inline-error { margin-top: 8px; padding: 8px 12px; border-radius: 8px; background: var(--danger-soft); color: var(--danger); font-size: 13px; }
    .cover-panel { margin-top: 16px; }
    .cover-table { margin-top: 12px; }
    .cover-head, .cover-row { display: grid; grid-template-columns: 140px 72px minmax(0, 1fr); align-items: center; gap: 12px; min-height: 44px; }
    .cover-head { color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid var(--line); }
    .cover-row { border-bottom: 1px solid var(--line); font-size: 14px; }
    .cover-row:last-child { border-bottom: 0; }
    .cover-row > span, .cover-row > strong { color: var(--navy); font-weight: 700; font-variant-numeric: tabular-nums; }
    .cover-row > small { overflow: hidden; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; }
    .skeleton { display: block; border-radius: 8px; background: #e7eef6; }
    .operation-loading { display: grid; gap: 12px; margin-top: 16px; }
    .operation-loading .skeleton { height: 52px; }
    @media (max-width: 1100px) {
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .board { grid-template-columns: minmax(0, 1fr); }
    }
    @media (max-width: 720px) {
      .home-bar { flex-direction: column; align-items: flex-start; }
      .home-tools { flex-wrap: wrap; }
      .metrics { grid-template-columns: minmax(0, 1fr); }
      .home-bar h1 { font-size: 26px; }
      .cover-head, .cover-row { grid-template-columns: 1fr 48px; }
      .cover-head span:last-child, .cover-row small { grid-column: 1 / -1; }
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
