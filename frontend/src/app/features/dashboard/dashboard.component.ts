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
  link: string | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="welcome">
      <div>
        <p class="welcome-kicker">{{ ctx.context()?.schoolName || 'School' }} · {{ ctx.context()?.academicYearName || 'Academic year' }}</p>
        <h1>Good {{ greeting }}, {{ user()?.firstName }}</h1>
        <p class="welcome-date">{{ todayLabel }}</p>
      </div>
      @if (canCreateAdmission) {
        <a routerLink="/admissions" class="primary-action"><i class="pi pi-plus"></i> New admission</a>
      }
    </header>

    @if (error()) {
      <div class="alert-banner" role="alert"><i class="pi pi-exclamation-circle"></i> Could not load dashboard statistics — {{ error() }}</div>
    }

    <section class="kpis" aria-label="School overview" [class.is-loading]="loading()">
      @for (stat of stats(); track stat.label) {
        @if (stat.link) {
          <a class="kpi" [routerLink]="stat.link">
            <ng-container *ngTemplateOutlet="kpiBody; context: { $implicit: stat }" />
          </a>
        } @else {
          <article class="kpi">
            <ng-container *ngTemplateOutlet="kpiBody; context: { $implicit: stat }" />
          </article>
        }
      }
    </section>
    <ng-template #kpiBody let-stat>
      <span class="kpi-icon" aria-hidden="true"><i [class]="stat.icon"></i></span>
      <span class="kpi-copy">
        <span class="kpi-label">{{ stat.label }}</span>
        <strong>{{ loading() ? '—' : stat.value }}</strong>
        <span class="kpi-note">{{ stat.sub }}</span>
      </span>
    </ng-template>

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
              <span class="work-icon" aria-hidden="true"><i class="pi pi-inbox"></i></span>
              <span class="work-copy"><span>New enquiries</span><small>{{ enquiryOpen() }} still open</small></span>
              <strong>{{ enquiryNew() }}</strong>
            </a>
            <a routerLink="/fees">
              <span class="work-icon" aria-hidden="true"><i class="pi pi-wallet"></i></span>
              <span class="work-copy"><span>Fees collected</span><small>This month</small></span>
              <strong>{{ locale.formatMoney(feeTotal()) }}</strong>
            </a>
            @if (canSeeAcademicOps) {
              <a routerLink="/substitutions">
                <span class="work-icon" aria-hidden="true"><i class="pi pi-users"></i></span>
                <span class="work-copy"><span>Periods to cover</span><small>{{ ops()?.onLeave ?? '—' }} on leave · {{ ops()?.presentStaff ?? '—' }} present</small></span>
                <strong>{{ ops()?.openSubstitutions ?? '—' }}</strong>
              </a>
            }
            @if (canSeeDiaryCompliance) {
              <a routerLink="/diary">
                <span class="work-icon" aria-hidden="true"><i class="pi pi-book"></i></span>
                <span class="work-copy"><span>Diary pending</span><small>{{ diarySubmitted() }} submitted today</small></span>
                <strong>{{ diaryPending() }}</strong>
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
    .welcome { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px 24px; margin: 0 0 18px; }
    .welcome-kicker { margin: 0 0 6px; color: var(--muted); font-size: 13px; font-weight: 600; }
    .welcome h1 { margin: 0; color: var(--ink); font-size: 28px; font-weight: 650; letter-spacing: -0.03em; line-height: 1.15; }
    .welcome-date { margin: 6px 0 0; color: var(--muted); font-size: 14px; }
    .primary-action, .open-link { display: inline-flex; align-items: center; height: 40px; border-radius: 10px; font-size: 14px; font-weight: 650; text-decoration: none; }
    .primary-action { gap: 8px; padding: 0 14px; background: var(--primary); color: white; flex: none; }
    .primary-action:hover { background: var(--primary-hover); }
    .alert-banner { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 12px 16px; border-radius: 12px; background: var(--warn-soft); color: var(--warn); font-size: 14px; }
    .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .kpis.is-loading { opacity: .72; }
    .kpi { display: flex; align-items: flex-start; gap: 14px; min-height: 112px; padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); box-shadow: var(--shadow-sm); color: inherit; text-decoration: none; }
    a.kpi:hover { border-color: var(--primary); }
    .kpi-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: none; border-radius: 10px; background: var(--primary-soft); color: var(--primary); }
    .kpi-copy { display: grid; gap: 2px; min-width: 0; }
    .kpi-label { color: var(--muted); font-size: 13px; font-weight: 650; }
    .kpi strong { color: var(--ink); font-size: 28px; font-weight: 650; letter-spacing: -0.03em; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .kpi-note { color: var(--muted); font-size: 13px; }
    .board { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, .9fr); gap: 12px; align-items: stretch; margin-top: 12px; }
    .panel { display: flex; min-width: 0; flex-direction: column; padding: 18px 18px 8px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); box-shadow: var(--shadow-sm); }
    .panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .panel-heading h2 { margin: 0; color: var(--ink); font-size: 16px; font-weight: 650; letter-spacing: -0.02em; }
    .panel-heading p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
    .open-link { padding: 0 12px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); }
    .open-link:hover { border-color: var(--primary); color: var(--primary); }
    .today-figure { display: grid; justify-items: end; margin-left: auto; }
    .today-figure strong { color: var(--ink); font-size: 22px; font-weight: 650; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .today-figure span { color: var(--muted); font-size: 12px; font-weight: 650; }
    .trend-chart { display: grid; height: 220px; grid-template-columns: repeat(7, minmax(0, 1fr)); align-items: end; gap: 12px; margin-top: 18px; padding-top: 8px; border-bottom: 1px solid var(--line); }
    .trend-day { display: grid; height: 100%; grid-template-rows: minmax(0, 1fr) 20px 18px; justify-items: center; align-items: end; gap: 6px; }
    .trend-track { display: flex; width: 18px; height: 100%; align-items: end; background: transparent; }
    .trend-bar { display: block; width: 100%; min-height: 4px; border-radius: 6px 6px 0 0; background: color-mix(in srgb, var(--primary) 35%, var(--navy2)); }
    .trend-day.is-latest .trend-bar { background: var(--primary); }
    .trend-day strong { color: var(--ink); font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }
    .trend-day small { color: var(--muted); font-size: 12px; font-weight: 650; }
    .chart-loading { display: grid; height: 220px; grid-template-columns: repeat(7, minmax(0, 1fr)); align-items: end; gap: 12px; margin-top: 18px; }
    .chart-loading .skeleton { height: 55%; border-radius: 6px; }
    .empty-chart { display: grid; flex: 1; min-height: 180px; align-content: center; justify-items: center; gap: 8px; color: var(--muted); font-size: 14px; text-align: center; }
    .queue { display: grid; gap: 8px; margin: 14px 0 10px; }
    .queue a { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 64px; padding: 8px 10px; border-radius: 12px; background: var(--canvas); color: inherit; text-decoration: none; }
    .queue a:hover { background: var(--primary-soft); }
    .work-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: var(--surface); color: var(--primary); }
    .work-copy { display: grid; min-width: 0; }
    .work-copy span { color: var(--ink); font-size: 14px; font-weight: 650; }
    .work-copy small { color: var(--muted); font-size: 12px; }
    .queue a > strong { color: var(--ink); font-size: 16px; font-weight: 650; font-variant-numeric: tabular-nums; text-align: right; }
    .inline-error { margin: 0 0 10px; padding: 8px 12px; border-radius: 8px; background: var(--danger-soft); color: var(--danger); font-size: 13px; }
    .cover-panel { margin-top: 12px; padding-bottom: 6px; }
    .cover-table { margin-top: 8px; }
    .cover-head, .cover-row { display: grid; grid-template-columns: 140px 72px minmax(0, 1fr); align-items: center; gap: 12px; min-height: 44px; padding: 0 4px; }
    .cover-head { color: var(--muted); font-size: 12px; font-weight: 650; border-bottom: 1px solid var(--line); }
    .cover-row { border-bottom: 1px solid var(--line); font-size: 14px; }
    .cover-row:last-child { border-bottom: 0; }
    .cover-row > span, .cover-row > strong { color: var(--ink); font-weight: 650; font-variant-numeric: tabular-nums; }
    .cover-row > small { overflow: hidden; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; }
    .skeleton { display: block; border-radius: 8px; background: var(--navy2); }
    .operation-loading { display: grid; gap: 8px; margin: 14px 0; }
    .operation-loading .skeleton { height: 64px; }
    @media (max-width: 1100px) {
      .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .board { grid-template-columns: minmax(0, 1fr); }
    }
    @media (max-width: 720px) {
      .welcome { flex-direction: column; align-items: flex-start; }
      .welcome h1 { font-size: 24px; }
      .kpis { grid-template-columns: minmax(0, 1fr); }
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
    { label: 'Active students', value: '—', sub: 'Enrolled this academic year', icon: 'pi pi-users', link: null },
    { label: 'Staff strength', value: '—', sub: 'Active employees', icon: 'pi pi-id-card', link: null },
    { label: 'Attendance today', value: '—', sub: 'Present or late', icon: 'pi pi-check-square', link: '/attendance' },
    { label: 'Fees this month', value: '—', sub: 'Successful payments', icon: 'pi pi-wallet', link: '/fees' },
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
          { label: 'Active students', value: Number(data.studentCount ?? 0).toLocaleString(this.ctx.locale), sub: 'Enrolled this academic year', icon: 'pi pi-users', link: this.canSeeStudents ? '/students' : null },
          { label: 'Staff strength', value: Number(data.staffCount ?? 0).toLocaleString(this.ctx.locale), sub: 'Active employees', icon: 'pi pi-id-card', link: this.canSeeStaff ? '/staff' : null },
          { label: 'Attendance today', value: data.attendanceMarked ? `${data.attendancePct}%` : 'Not marked', sub: data.attendanceMarked ? 'Present or late' : 'Awaiting attendance entry', icon: 'pi pi-check-square', link: '/attendance' },
          { label: 'Fees this month', value: this.locale.formatMoney(data.feeCollectedThisMonth ?? 0), sub: 'Successful payments', icon: 'pi pi-wallet', link: '/fees' },
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
