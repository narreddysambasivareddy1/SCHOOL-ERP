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
    <div class="command-dashboard">
      <header class="command-header">
        <div class="command-title">
          <div class="eyebrow"><span class="status-pulse"></span> SCHOOL OVERVIEW <span>/</span> {{ ctx.context()?.academicYearName || 'Academic year' }}</div>
          <h1>Dashboard</h1>
          <p>{{ todayLabel }} <span class="dot-separator">·</span> Welcome back, {{ user()?.firstName }}</p>
        </div>
        <div class="command-actions">
          <span class="school-context"><i class="pi pi-building"></i>{{ ctx.context()?.schoolName || 'Your school' }}</span>
          @if (canCreateAdmission) {
            <a routerLink="/admissions" class="command-primary"><i class="pi pi-plus"></i> New admission</a>
          }
        </div>
      </header>

      @if (error()) {
        <div class="command-alert" role="alert"><i class="pi pi-exclamation-circle"></i> {{ error() }}</div>
      }

      <section class="kpi-grid" aria-label="School key metrics" [class.loading]="loading()">
        @for (stat of stats(); track stat.label; let i = $index) {
          @if (stat.link) {
            <a class="kpi-card" [routerLink]="stat.link">
              <span class="kpi-topline"><span>{{ stat.label }}</span><i [class]="stat.icon"></i></span>
              <strong>{{ loading() ? '—' : stat.value }}</strong>
              <small>{{ stat.sub }}</small>
              <span class="kpi-open">View details <i class="pi pi-arrow-up-right"></i></span>
            </a>
          } @else {
            <article class="kpi-card">
              <span class="kpi-topline"><span>{{ stat.label }}</span><i [class]="stat.icon"></i></span>
              <strong>{{ loading() ? '—' : stat.value }}</strong>
              <small>{{ stat.sub }}</small>
            </article>
          }
        }
      </section>

      <div class="section-heading">
        <div><span class="eyebrow">OPERATIONS</span><h2>Today at a glance</h2></div>
        <span class="live-label"><span class="status-pulse"></span> Live school data</span>
      </div>

      <section class="operations-grid">
        <article class="attendance-panel">
          <div class="panel-heading">
            <div><span class="panel-label">ATTENDANCE</span><h3>Weekly attendance</h3><p>Daily student attendance across the current week</p></div>
            <a routerLink="/attendance" class="text-link">Open register <i class="pi pi-arrow-up-right"></i></a>
          </div>
          <div class="attendance-overview">
            <div class="attendance-score">
              <strong>{{ loading() ? '—' : (attendanceMarked() ? attendancePct() + '%' : '—') }}</strong>
              <span>{{ attendanceMarked() ? 'Attendance marked today' : 'Today’s register is pending' }}</span>
            </div>
            <div class="attendance-status" [class.pending]="!attendanceMarked()">
              <i [class]="attendanceMarked() ? 'pi pi-check-circle' : 'pi pi-clock'"></i>
              {{ attendanceMarked() ? 'Register updated' : 'Awaiting entry' }}
            </div>
          </div>
          @if (loading()) {
            <div class="chart-skeleton"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
          } @else if (attendanceTrend().length) {
            <div class="attendance-chart" role="img" aria-label="Daily attendance trend for the last seven days">
              <div class="chart-scale"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
              <div class="chart-bars">
                @for (point of attendanceTrend(); track point.date; let last = $last) {
                  <div class="chart-day-column" [class.current]="last" [attr.aria-label]="(point.date | date:'EEE, d MMM') + ': ' + point.pct + '%'" >
                    <div class="bar-track"><span [style.height.%]="point.pct"></span></div>
                    <strong>{{ point.pct }}%</strong>
                    <small>{{ point.date | date:'EEE' }}</small>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="chart-empty"><i class="pi pi-chart-line"></i><strong>No attendance trend yet</strong><span>Marked sessions will appear here.</span></div>
          }
          <div class="panel-foot"><span><i class="pi pi-info-circle"></i> Based on marked attendance sessions</span><a routerLink="/attendance">View attendance history <i class="pi pi-arrow-right"></i></a></div>
        </article>

        <aside class="priority-panel">
          <div class="panel-heading">
            <div><span class="panel-label">NEEDS ATTENTION</span><h3>Priority queue</h3><p>Follow-ups for your school team</p></div>
            <span class="queue-total">{{ (enquiryNew() + (ops()?.openSubstitutions ?? 0) + diaryPending()) || 0 }}</span>
          </div>
          @if (loading()) {
            <div class="queue-loading"><span></span><span></span><span></span></div>
          } @else {
            <div class="priority-list">
              <a routerLink="/enquiries" class="priority-row"><span class="priority-icon blue"><i class="pi pi-inbox"></i></span><span class="priority-copy"><strong>New enquiries</strong><small>{{ enquiryOpen() }} still open</small></span><b>{{ enquiryNew() }}</b><i class="pi pi-chevron-right"></i></a>
              <a routerLink="/fees" class="priority-row"><span class="priority-icon green"><i class="pi pi-wallet"></i></span><span class="priority-copy"><strong>Fees collected</strong><small>Successful payments this month</small></span><b>{{ locale.formatMoney(feeTotal()) }}</b><i class="pi pi-chevron-right"></i></a>
              @if (canSeeAcademicOps) {
                <a routerLink="/substitutions" class="priority-row"><span class="priority-icon amber"><i class="pi pi-users"></i></span><span class="priority-copy"><strong>Periods to cover</strong><small>{{ ops()?.onLeave ?? '—' }} on leave · {{ ops()?.presentStaff ?? '—' }} present</small></span><b>{{ ops()?.openSubstitutions ?? '—' }}</b><i class="pi pi-chevron-right"></i></a>
              }
              @if (canSeeDiaryCompliance) {
                <a routerLink="/diary" class="priority-row"><span class="priority-icon violet"><i class="pi pi-book"></i></span><span class="priority-copy"><strong>Diary pending</strong><small>{{ diarySubmitted() }} submitted today</small></span><b>{{ diaryPending() }}</b><i class="pi pi-chevron-right"></i></a>
              }
            </div>
          }
          @if (opsError()) { <div class="inline-error" role="alert">{{ opsError() }}</div> }
          @if (diaryError()) { <div class="inline-error" role="alert">{{ diaryError() }}</div> }
          <div class="priority-foot"><i class="pi pi-shield"></i> Role-based access is applied</div>
        </aside>
      </section>

      @if (canSeeAcademicOps && ops()?.availability?.length) {
        <section class="staff-panel">
          <div class="panel-heading"><div><span class="panel-label">STAFFING</span><h3>Teacher availability</h3><p>Available staff for period coverage today</p></div><a routerLink="/substitutions" class="text-link">Manage cover <i class="pi pi-arrow-up-right"></i></a></div>
          <div class="staff-grid">
            @for (period of ops()?.availability || []; track period.periodId) {
              <article class="staff-slot"><span>{{ period.period }}</span><strong>{{ period.free }} <small>available</small></strong><p>{{ teacherNames(period) || 'No teachers available' }}</p></article>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    :host{display:block;color:#182230}
    .command-dashboard{max-width:1500px;margin:0 auto}
    .command-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin:4px 0 27px;padding:0 0 22px;border-bottom:1px solid #e7eaf0}
    .eyebrow,.panel-label{display:flex;align-items:center;gap:8px;color:#8993a4;font-size:10px;font-weight:750;letter-spacing:.12em}
    .eyebrow>span:not(.status-pulse){color:#c0c6d1}
    .status-pulse{width:7px;height:7px;border-radius:50%;background:#16a37a;box-shadow:0 0 0 4px #e4f5ef}
    .command-title h1{margin:11px 0 4px;color:#172230;font-size:30px;font-weight:760;letter-spacing:-.055em}
    .command-title p{margin:0;color:#7b8798;font-size:12px}
    .dot-separator{padding:0 5px;color:#c0c6d1}
    .command-actions{display:flex;align-items:center;gap:10px}
    .school-context{display:inline-flex;align-items:center;gap:8px;max-width:250px;padding:10px 12px;border:1px solid #e8ebf1;border-radius:8px;color:#536174;background:#fff;font-size:11px;font-weight:650}
    .school-context i{color:#8b83e8}
    .command-primary{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:0 14px;border-radius:8px;background:#5146d8;color:#fff;text-decoration:none;font-size:11px;font-weight:700}
    .command-primary:hover{background:#4035bd}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:30px}
    .kpi-card{position:relative;display:flex;min-height:142px;flex-direction:column;align-items:flex-start;padding:16px 17px;border:1px solid #e7eaf0;border-radius:10px;background:#fff;color:inherit;text-decoration:none;transition:border-color .16s,transform .16s}
    a.kpi-card:hover{transform:translateY(-2px);border-color:#c7c2fa}
    .kpi-topline{display:flex;width:100%;align-items:center;justify-content:space-between;color:#788497;font-size:10px;font-weight:700}
    .kpi-topline i{display:grid;width:29px;height:29px;place-items:center;border-radius:8px;background:#f0efff;color:#6258df;font-size:12px}
    .kpi-card>strong{margin-top:12px;color:#172230;font-size:25px;font-weight:760;letter-spacing:-.05em}
    .kpi-card>small{margin-top:3px;color:#929bad;font-size:10px}
    .kpi-open{position:absolute;right:14px;bottom:14px;color:#6358d9;font-size:9px;font-weight:700;opacity:0;transition:opacity .15s}
    .kpi-card:hover .kpi-open{opacity:1}
    .section-heading{display:flex;align-items:flex-end;justify-content:space-between;margin:0 0 13px}
    .section-heading h2{margin:6px 0 0;color:#202b3a;font-size:18px;font-weight:740;letter-spacing:-.035em}
    .live-label{display:flex;align-items:center;gap:8px;color:#748294;font-size:10px}
    .live-label .status-pulse{width:6px;height:6px}
    .operations-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(330px,.85fr);gap:14px;align-items:stretch}
    .attendance-panel,.priority-panel,.staff-panel{min-width:0;padding:19px;border:1px solid #e6eaf0;border-radius:11px;background:#fff}
    .panel-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}
    .panel-heading h3{margin:6px 0 4px;color:#202b3a;font-size:15px;font-weight:730;letter-spacing:-.025em}
    .panel-heading p{margin:0;color:#8a95a5;font-size:10px}
    .text-link{display:inline-flex;align-items:center;gap:7px;flex:none;color:#5146d8;text-decoration:none;font-size:10px;font-weight:700}
    .attendance-overview{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:19px 0 10px;padding:13px 15px;border-radius:8px;background:#f7f8fb}
    .attendance-score{display:flex;align-items:baseline;gap:10px}
    .attendance-score strong{color:#172230;font-size:27px;font-weight:780;letter-spacing:-.05em}
    .attendance-score span{color:#8792a2;font-size:10px}
    .attendance-status{display:flex;align-items:center;gap:7px;color:#138566;font-size:10px;font-weight:700}
    .attendance-status.pending{color:#b17a2b}
    .attendance-chart{display:grid;grid-template-columns:34px 1fr;gap:9px;height:190px;margin-top:9px}
    .chart-scale{display:flex;flex-direction:column;justify-content:space-between;padding:0 0 25px;color:#a1aaba;font-size:9px}
    .chart-bars{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;border-bottom:1px solid #e8ebf1;background:repeating-linear-gradient(to bottom,transparent 0,transparent 24%,#edf0f4 24.5%,transparent 25%)}
    .chart-day-column{display:flex;min-width:0;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px}
    .bar-track{display:flex;width:100%;height:135px;align-items:flex-end;justify-content:center}
    .bar-track span{width:min(28px,65%);min-height:3px;border-radius:5px 5px 2px 2px;background:#a6a1f5}
    .chart-day-column.current .bar-track span{background:#26a887}
    .chart-day-column strong{color:#566174;font-size:9px}
    .chart-day-column small{padding-bottom:7px;color:#9aa4b2;font-size:9px}
    .panel-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;padding-top:12px;border-top:1px solid #edf0f4;color:#9aa4b2;font-size:9px}
    .panel-foot span,.panel-foot a{display:flex;align-items:center;gap:6px}
    .panel-foot a{color:#5c55d5;text-decoration:none;font-weight:700}
    .priority-panel{display:flex;flex-direction:column}
    .queue-total{display:grid;width:29px;height:29px;place-items:center;border-radius:8px;background:#f0efff;color:#5b51d3;font-size:11px;font-weight:750}
    .priority-list{display:grid;gap:0;margin-top:15px}
    .priority-row{display:flex;align-items:center;gap:10px;min-width:0;padding:13px 0;border-bottom:1px solid #edf0f4;color:inherit;text-decoration:none}
    .priority-row:last-child{border-bottom:0}
    .priority-row:hover .priority-copy strong{color:#5146d8}
    .priority-icon{display:grid;width:31px;height:31px;flex:none;place-items:center;border-radius:8px;font-size:12px}
    .priority-icon.blue{background:#edf4ff;color:#4b78c7}.priority-icon.green{background:#eaf7f1;color:#19866a}.priority-icon.amber{background:#fff5e8;color:#b67a27}.priority-icon.violet{background:#f2efff;color:#7664d8}
    .priority-copy{display:grid;min-width:0;gap:3px}
    .priority-copy strong{color:#344154;font-size:10px;font-weight:700}
    .priority-copy small{overflow:hidden;color:#929dad;font-size:9px;text-overflow:ellipsis;white-space:nowrap}
    .priority-row>b{margin-left:auto;color:#39465a;font-size:10px;white-space:nowrap}
    .priority-row>i{color:#b0b8c4;font-size:9px}
    .priority-foot{display:flex;align-items:center;gap:7px;margin-top:auto;padding-top:13px;border-top:1px solid #edf0f4;color:#9aa4b2;font-size:9px}
    .inline-error{margin-top:8px;color:#b44c59;font-size:10px}
    .staff-panel{margin-top:14px}
    .staff-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px;margin-top:16px}
    .staff-slot{padding:13px;border:1px solid #e9edf2;border-radius:8px;background:#fafbfd}
    .staff-slot>span{color:#8792a2;font-size:9px;font-weight:750;letter-spacing:.08em}
    .staff-slot>strong{display:block;margin:8px 0 4px;color:#202b3a;font-size:21px;font-weight:760}
    .staff-slot>strong small{color:#8a95a5;font-size:10px;font-weight:500}
    .staff-slot p{margin:0;color:#8490a0;font-size:9px}
    .chart-empty{display:grid;min-height:165px;place-content:center;justify-items:center;gap:7px;color:#9aa4b2;font-size:10px}
    .chart-empty i{font-size:20px;color:#8b83e8}
    .chart-empty strong{color:#4d596b;font-size:11px}
    .chart-skeleton,.queue-loading{display:grid;gap:10px}
    .chart-skeleton{grid-template-columns:repeat(7,1fr);height:150px;align-items:end;padding:10px 0}
    .chart-skeleton span,.queue-loading span{display:block;border-radius:6px;background:#eff1f6}
    .chart-skeleton span{height:65%}.chart-skeleton span:nth-child(2n){height:88%}.chart-skeleton span:nth-child(3n){height:45%}
    .queue-loading{margin-top:20px}.queue-loading span{height:48px}
    .command-alert{margin-bottom:16px;padding:11px 13px;border:1px solid #f2d9d9;border-radius:8px;background:#fff6f5;color:#a74b4b;font-size:11px}
    @media(max-width:1100px){.operations-grid{grid-template-columns:1fr}.priority-panel{min-height:0}}
    @media(max-width:760px){.command-header{align-items:flex-start;flex-direction:column;margin-bottom:18px}.command-actions{width:100%;flex-wrap:wrap}.kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.kpi-card{min-height:126px;padding:13px}.attendance-panel,.priority-panel,.staff-panel{padding:14px}.attendance-overview{align-items:flex-start;flex-direction:column}.panel-foot{align-items:flex-start;flex-direction:column}.section-heading h2{font-size:17px}}
    @media(max-width:390px){.kpi-grid{grid-template-columns:1fr}.command-title h1{font-size:26px}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;animation-duration:.01ms!important}}
  `],
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
