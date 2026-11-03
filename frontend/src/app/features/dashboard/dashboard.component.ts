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
    <div class="school-workspace">
      <header class="welcome-row">
        <div class="welcome-copy">
          <div class="workspace-kicker"><span class="online-dot"></span> SCHOOL WORKSPACE <span class="kicker-divider">/</span> {{ ctx.context()?.academicYearName || 'Academic year' }}</div>
          <h1>Good {{ greeting }}, {{ user()?.firstName || 'there' }}.</h1>
          <p>{{ todayLabel }} <span>·</span> Here’s what’s happening across your school today.</p>
        </div>
        <div class="welcome-actions">
          <div class="school-chip"><i class="pi pi-building"></i><span>{{ ctx.context()?.schoolName || 'Your school' }}</span></div>
          @if (canCreateAdmission) {
            <a routerLink="/admissions" class="create-action"><i class="pi pi-plus"></i> Create admission</a>
          }
        </div>
      </header>

      @if (error()) {
        <div class="workspace-error" role="alert"><i class="pi pi-exclamation-circle"></i>{{ error() }}</div>
      }

      <section class="metric-strip" aria-label="School performance indicators" [class.is-loading]="loading()">
        @for (stat of stats(); track stat.label) {
          <article class="metric">
            <div class="metric-label"><span>{{ stat.label }}</span><i [class]="stat.icon"></i></div>
            <strong>{{ loading() ? '—' : stat.value }}</strong>
            <small>{{ stat.sub }}</small>
            @if (stat.link) { <a [routerLink]="stat.link" [attr.aria-label]="'Open ' + stat.label">View <i class="pi pi-arrow-up-right"></i></a> }
          </article>
        }
      </section>

      <div class="content-heading">
        <div><span class="section-kicker">THE SCHOOL DAY</span><h2>Operations overview</h2></div>
        <span class="updated-indicator"><span class="online-dot"></span> School data overview</span>
      </div>

      <div class="workspace-grid">
        <main class="main-column">
          <section class="attendance-feature">
            <div class="feature-top">
              <div>
                <span class="section-kicker">ATTENDANCE INTELLIGENCE</span>
                <h3>Attendance at a glance</h3>
                <p>Student attendance recorded over the most recent seven days available</p>
              </div>
              <a routerLink="/attendance" class="subtle-link">Open attendance <i class="pi pi-arrow-up-right"></i></a>
            </div>
            <div class="attendance-summary">
              <div class="attendance-number">
                <strong>{{ loading() ? '—' : (attendanceMarked() ? attendancePct() + '%' : '—') }}</strong>
                <span>{{ attendanceMarked() ? 'Attendance recorded today' : 'Today’s register has not been submitted' }}</span>
              </div>
              <div class="register-state" [class.waiting]="!attendanceMarked()">
                <i [class]="attendanceMarked() ? 'pi pi-check-circle' : 'pi pi-clock'"></i>
                {{ attendanceMarked() ? 'Register complete' : 'Awaiting register' }}
              </div>
            </div>
            @if (loading()) {
              <div class="trend-loading"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
            } @else if (attendanceTrend().length) {
              <div class="trend-chart" role="img" [attr.aria-label]="'Daily attendance trend across ' + attendanceTrend().length + ' available days'">
                <div class="trend-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
                <div class="trend-columns" [style.grid-template-columns]="'repeat(' + attendanceTrend().length + ', minmax(0, 1fr))'">
                  @for (point of attendanceTrend(); track point.date; let last = $last) {
                    <div class="trend-day" [class.latest]="last" [attr.aria-label]="(point.date | date:'EEE, d MMM') + ': ' + point.pct + '%'">
                      <div class="trend-track"><span [style.height.%]="point.pct"></span></div>
                      <strong>{{ point.pct }}%</strong>
                      <small>{{ point.date | date:'EEE' }}</small><small class="trend-date">{{ point.date | date:'d MMM' }}</small>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <div class="trend-empty"><i class="pi pi-chart-line"></i><strong>Attendance history will appear here</strong><span>Once attendance is marked, the weekly trend will be available.</span></div>
            }
            <div class="feature-foot"><span><i class="pi pi-info-circle"></i> Trend is based on submitted attendance sessions</span><a routerLink="/attendance">View register history <i class="pi pi-arrow-right"></i></a></div>
          </section>

          @if (canSeeAcademicOps && ops()?.availability?.length) {
            <section class="staff-feature">
              <div class="feature-top">
                <div><span class="section-kicker">PEOPLE & CAPACITY</span><h3>Teacher availability</h3><p>Staff available for period coverage today</p></div>
                <a routerLink="/substitutions" class="subtle-link">Manage cover <i class="pi pi-arrow-up-right"></i></a>
              </div>
              <div class="staff-list">
                @for (period of ops()?.availability || []; track period.periodId) {
                  <article class="staff-row"><span class="period-name">{{ period.period }}</span><strong>{{ period.free }} <small>available</small></strong><span class="teacher-names">{{ teacherNames(period) || 'No teachers available' }}</span></article>
                }
              </div>
            </section>
          }
        </main>

        <aside class="side-column">
          <section class="focus-card">
            <div class="focus-heading">
              <div><span class="section-kicker">ACTION CENTRE</span><h3>Needs your attention</h3></div>
              <span class="focus-count" [attr.aria-label]="'Action items: ' + ((enquiryNew() + (ops()?.openSubstitutions ?? 0) + diaryPending()) || 0)">{{ (enquiryNew() + (ops()?.openSubstitutions ?? 0) + diaryPending()) || 0 }}</span>
            </div>
            <p class="focus-intro">Items that may need a follow-up from your team.</p>
            @if (loading()) {
              <div class="focus-loading"><span></span><span></span><span></span></div>
            } @else {
              <div class="focus-items">
                <a routerLink="/enquiries" class="focus-item">
                  <span class="focus-symbol enquiries"><i class="pi pi-inbox"></i></span>
                  <span class="focus-text"><strong>New enquiries</strong><small>{{ enquiryOpen() }} still open</small></span>
                  <b>{{ enquiryNew() }}</b><i class="pi pi-chevron-right"></i>
                </a>
                <a routerLink="/fees" class="focus-item">
                  <span class="focus-symbol finance"><i class="pi pi-wallet"></i></span>
                  <span class="focus-text"><strong>Fees collected</strong><small>Successful payments this month</small></span>
                  <b class="money-value">{{ locale.formatMoney(feeTotal()) }}</b><i class="pi pi-chevron-right"></i>
                </a>
                @if (canSeeAcademicOps) {
                  <a routerLink="/substitutions" class="focus-item">
                    <span class="focus-symbol staffing"><i class="pi pi-users"></i></span>
                    <span class="focus-text"><strong>Periods to cover</strong><small>{{ ops()?.onLeave ?? '—' }} on leave · {{ ops()?.presentStaff ?? '—' }} present</small></span>
                    <b>{{ ops()?.openSubstitutions ?? '—' }}</b><i class="pi pi-chevron-right"></i>
                  </a>
                }
                @if (canSeeDiaryCompliance) {
                  <a routerLink="/diary" class="focus-item">
                    <span class="focus-symbol diary"><i class="pi pi-book"></i></span>
                    <span class="focus-text"><strong>Class diary pending</strong><small>{{ diaryPending() }} awaiting · {{ diarySubmitted() }} submitted today</small></span>
                    <b>{{ diaryPending() }}</b><i class="pi pi-chevron-right"></i>
                  </a>
                }
              </div>
            }
            @if (opsError()) { <div class="inline-error" role="alert">{{ opsError() }}</div> }
            @if (diaryError()) { <div class="inline-error" role="alert">{{ diaryError() }}</div> }
            <div class="focus-foot"><i class="pi pi-shield"></i> Information shown according to your role</div>
          </section>

          <section class="shortcut-card">
            <span class="section-kicker">QUICK ACCESS</span>
            <h3>Go to a workspace</h3>
            <div class="shortcut-list">
              @if (canSeeStudents) { <a routerLink="/students"><i class="pi pi-users"></i><span>Student directory</span><i class="pi pi-arrow-up-right"></i></a> }
              @if (canSeeStaff) { <a routerLink="/staff"><i class="pi pi-id-card"></i><span>Staff & HR</span><i class="pi pi-arrow-up-right"></i></a> }
              <a routerLink="/timetable"><i class="pi pi-calendar"></i><span>Timetable</span><i class="pi pi-arrow-up-right"></i></a>
              @if (canSeeAnalytics) { <a routerLink="/analytics"><i class="pi pi-chart-bar"></i><span>School analytics</span><i class="pi pi-arrow-up-right"></i></a> }
            </div>
          </section>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block;color:#202637}
    .school-workspace{width:100%;max-width:1580px;margin:0 auto}
    .welcome-row{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin:2px 0 25px;padding:0 0 22px;border-bottom:1px solid #e8eaf0}
    .workspace-kicker,.section-kicker{display:flex;align-items:center;gap:8px;color:#8a91a4;font-size:9px;font-weight:800;letter-spacing:.13em}
    .online-dot{width:7px;height:7px;flex:none;border-radius:50%;background:#20a37b;box-shadow:0 0 0 4px #e7f5ef}
    .kicker-divider{color:#c6cad4}
    .welcome-copy h1{margin:12px 0 6px;color:#20263a;font-size:clamp(27px,3vw,36px);font-weight:760;letter-spacing:-.055em}
    .welcome-copy p{margin:0;color:#838ba0;font-size:12px}.welcome-copy p span{padding:0 5px;color:#c5c9d2}
    .welcome-actions{display:flex;align-items:center;gap:9px}
    .school-chip{display:flex;align-items:center;gap:8px;max-width:250px;padding:10px 12px;border:1px solid #e8eaf0;border-radius:9px;background:#fff;color:#586176;font-size:10px;font-weight:650}
    .school-chip i{color:#6475c9}.school-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .create-action{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:0 14px;border-radius:8px;background:#334fbd;color:#fff;text-decoration:none;font-size:10px;font-weight:750;transition:background .15s}
    .create-action:hover{background:#263f9e}
    .workspace-error{display:flex;align-items:center;gap:9px;margin:0 0 15px;padding:11px 13px;border:1px solid #f0dada;border-radius:9px;background:#fff7f6;color:#a84f56;font-size:11px}
    .metric-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:0 0 30px;border:1px solid #e8eaf0;border-radius:11px;background:#fff;box-shadow:0 2px 8px rgba(27,35,60,.025)}
    .metric{position:relative;min-width:0;padding:16px 19px;border-right:1px solid #edf0f4}
    .metric:last-child{border-right:0}
    .metric-label{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#68738a;font-size:11px;font-weight:680}
    .metric-label i{color:#8994c9;font-size:13px}
    .metric>strong{display:block;margin:10px 0 3px;color:#252b40;font-size:25px;font-weight:770;letter-spacing:-.05em;font-variant-numeric:tabular-nums}
    .metric>small{display:block;color:#969caf;font-size:9px}
    .metric>a{position:absolute;right:17px;bottom:17px;color:#4b60bf;font-size:9px;font-weight:750;text-decoration:none;opacity:.9}
    .metric>a:focus-visible,.metric:hover>a{opacity:1;outline-offset:3px}
    .content-heading{display:flex;align-items:flex-end;justify-content:space-between;margin:0 0 13px}
    .content-heading h2{margin:6px 0 0;color:#252b40;font-size:18px;font-weight:750;letter-spacing:-.035em}
    .updated-indicator{display:flex;align-items:center;gap:8px;color:#7d879b;font-size:9px}
    .updated-indicator .online-dot{width:6px;height:6px}
    .workspace-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.9fr);gap:15px;align-items:start}
    .main-column,.side-column{display:grid;min-width:0;gap:15px}
    .attendance-feature,.staff-feature,.focus-card,.shortcut-card{min-width:0;padding:19px;border:1px solid #e7eaf0;border-radius:11px;background:#fff;box-shadow:0 2px 8px rgba(27,35,60,.025)}
    .feature-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
    .feature-top h3,.focus-heading h3,.shortcut-card h3{margin:6px 0 4px;color:#252b40;font-size:15px;font-weight:750;letter-spacing:-.025em}
    .feature-top p{margin:0;color:#737e94;font-size:11px}
    .subtle-link{display:inline-flex;align-items:center;gap:7px;flex:none;margin-top:5px;color:#465dbb;text-decoration:none;font-size:9px;font-weight:750}
    .attendance-summary{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:18px 0 12px;padding:14px 16px;border-radius:9px;background:#f6f7fb}
    .attendance-number{display:flex;align-items:baseline;gap:11px;min-width:0}
    .attendance-number strong{color:#252b40;font-size:29px;font-weight:790;letter-spacing:-.055em}
    .attendance-number span{color:#858da1;font-size:10px}
    .register-state{display:flex;align-items:center;gap:7px;color:#168568;font-size:9px;font-weight:750;white-space:nowrap}
    .register-state.waiting{color:#ad7a34}
    .trend-chart{display:grid;grid-template-columns:34px 1fr;gap:10px;height:190px;margin-top:9px}
    .trend-axis{display:flex;flex-direction:column;justify-content:space-between;padding-bottom:24px;color:#a1a8b7;font-size:9px}
    .trend-columns{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:11px;border-bottom:1px solid #e9ebf1;background:repeating-linear-gradient(to bottom,transparent 0,transparent 24%,#eef0f5 24.5%,transparent 25%)}
    .trend-day{display:flex;min-width:0;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px}
    .trend-track{display:flex;width:100%;height:135px;align-items:flex-end;justify-content:center}
    .trend-track span{width:min(30px,68%);min-height:3px;border-radius:5px 5px 2px 2px;background:#aab3e8}
    .trend-day.latest .trend-track span{background:#35a98b}
    .trend-day strong{color:#4d5870;font-size:10px}.trend-day small{padding-bottom:2px;color:#778398;font-size:9px}.trend-day .trend-date{padding-bottom:7px;color:#9aa3b2;font-size:8px}
    .feature-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:13px;padding-top:12px;border-top:1px solid #eef0f4;color:#9aa1b0;font-size:9px}
    .feature-foot span,.feature-foot a{display:flex;align-items:center;gap:6px}
    .feature-foot a{color:#4d60b7;font-weight:700;text-decoration:none}
    .focus-card{padding:19px 17px}
    .focus-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .focus-count{display:grid;width:30px;height:30px;place-items:center;border-radius:9px;background:#f0f2fc;color:#4b60b9;font-size:11px;font-weight:800}
    .focus-intro{margin:6px 0 9px;color:#788398;font-size:11px;line-height:1.5}
    .focus-items{display:grid}
    .focus-item{display:flex;align-items:center;gap:9px;min-width:0;padding:13px 0;border-top:1px solid #eff1f5;color:inherit;text-decoration:none}
    .focus-item:hover .focus-text strong{color:#465dbb}
    .focus-symbol{display:grid;width:31px;height:31px;flex:none;place-items:center;border-radius:9px;font-size:12px}
    .focus-symbol.enquiries{background:#edf3ff;color:#5477c7}.focus-symbol.finance{background:#eaf6f1;color:#21866c}.focus-symbol.staffing{background:#fff4e7;color:#b17b35}.focus-symbol.diary{background:#f0effb;color:#7667b5}
    .focus-text{display:grid;min-width:0;gap:3px}
    .focus-text strong{color:#394257;font-size:10px;font-weight:730}
    .focus-text small{overflow:hidden;color:#7c879b;font-size:10px;text-overflow:ellipsis;white-space:nowrap}
    .focus-item>b{margin-left:auto;color:#3d465b;font-size:10px;white-space:nowrap}
    .focus-item>b.money-value{font-size:9px}
    .focus-item>i{color:#b2b8c4;font-size:9px}
    .focus-foot{display:flex;align-items:center;gap:7px;margin-top:11px;padding-top:12px;border-top:1px solid #eff1f5;color:#9aa2b0;font-size:9px}
    .shortcut-card{padding:18px 17px}
    .shortcut-card h3{margin-bottom:11px}
    .shortcut-list{display:grid}
    .shortcut-list a{display:flex;align-items:center;gap:10px;min-height:39px;border-top:1px solid #eff1f5;color:#59647a;text-decoration:none;font-size:10px;font-weight:650}
    .shortcut-list a>i:first-child{width:17px;color:#7885c2;font-size:12px}
    .shortcut-list a>i:last-child{margin-left:auto;color:#aab1bf;font-size:9px}
    .shortcut-list a:hover{color:#4057b5}
    .staff-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px;margin-top:16px}
    .staff-row{display:grid;gap:6px;padding:12px;border:1px solid #edf0f4;border-radius:8px;background:#fafbfc}
    .period-name{color:#858ea1;font-size:9px;font-weight:800;letter-spacing:.08em}
    .staff-row>strong{color:#2b3349;font-size:21px;font-weight:770}.staff-row>strong small{color:#929bad;font-size:9px;font-weight:500}
    .teacher-names{overflow:hidden;color:#8992a4;font-size:9px;text-overflow:ellipsis;white-space:nowrap}
    .trend-empty{display:grid;min-height:170px;place-content:center;justify-items:center;gap:7px;color:#9aa2b0;font-size:10px;text-align:center}
    .trend-empty i{color:#8792c8;font-size:20px}.trend-empty strong{color:#4d566c;font-size:11px}
    .trend-loading,.focus-loading{display:grid;gap:10px}
    .trend-loading{grid-template-columns:repeat(7,1fr);height:150px;align-items:end;padding:10px 0}
    .trend-loading span,.focus-loading span{display:block;border-radius:6px;background:#eff1f6}
    .trend-loading span{height:65%}.trend-loading span:nth-child(2n){height:88%}.trend-loading span:nth-child(3n){height:45%}
    .focus-loading{margin-top:20px}.focus-loading span{height:47px}
    .inline-error{margin-top:8px;color:#b44c59;font-size:10px}
    @media(max-width:1120px){.workspace-grid{grid-template-columns:minmax(0,1.35fr) minmax(270px,.9fr)}}
    @media(max-width:900px){.workspace-grid{grid-template-columns:1fr}.side-column{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}}
    @media(max-width:760px){.welcome-row{align-items:flex-start;flex-direction:column;margin-bottom:18px}.welcome-actions{width:100%;flex-wrap:wrap}.metric-strip{grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:23px}.metric{border-bottom:1px solid #edf0f4}.metric:nth-child(2){border-right:0}.metric:nth-child(n+3){border-bottom:0}.content-heading{align-items:flex-start;flex-direction:column;gap:8px}.side-column{grid-template-columns:1fr}.attendance-feature,.staff-feature,.focus-card,.shortcut-card{padding:14px}.attendance-summary{align-items:flex-start;flex-direction:column}.feature-foot{align-items:flex-start;flex-direction:column}.feature-top{flex-direction:column}.subtle-link{margin-top:0}}
    @media(max-width:390px){.metric{padding:13px}.metric>strong{font-size:22px}.welcome-copy h1{font-size:26px}.trend-columns{gap:4px}.trend-day strong{font-size:8px}.trend-day small{font-size:8px}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;animation-duration:.01ms!important}}\n    :host-context(html[data-theme='dark']) .metric-strip,:host-context(html[data-theme='dark']) .attendance-feature,:host-context(html[data-theme='dark']) .staff-feature,:host-context(html[data-theme='dark']) .focus-card,:host-context(html[data-theme='dark']) .shortcut-card{background:#182235;border-color:#303c50;box-shadow:none}\n    :host-context(html[data-theme='dark']) .welcome-copy h1,:host-context(html[data-theme='dark']) .content-heading h2,:host-context(html[data-theme='dark']) .feature-top h3,:host-context(html[data-theme='dark']) .focus-heading h3,:host-context(html[data-theme='dark']) .shortcut-card h3,:host-context(html[data-theme='dark']) .metric>strong,:host-context(html[data-theme='dark']) .attendance-number strong,:host-context(html[data-theme='dark']) .focus-text strong,:host-context(html[data-theme='dark']) .focus-item>b,:host-context(html[data-theme='dark']) .staff-row>strong{color:#e6eaf2}\n    :host-context(html[data-theme='dark']) .welcome-copy p,:host-context(html[data-theme='dark']) .feature-top p,:host-context(html[data-theme='dark']) .focus-intro,:host-context(html[data-theme='dark']) .focus-text small,:host-context(html[data-theme='dark']) .metric>small,:host-context(html[data-theme='dark']) .updated-indicator,:host-context(html[data-theme='dark']) .attendance-number span,:host-context(html[data-theme='dark']) .teacher-names{color:#aab5c7}\n    :host-context(html[data-theme='dark']) .attendance-summary,:host-context(html[data-theme='dark']) .staff-row{background:#202d42;border-color:#303c50}\n    :host-context(html[data-theme='dark']) .metric{border-color:#303c50}\n    :host-context(html[data-theme='dark']) .feature-foot,:host-context(html[data-theme='dark']) .focus-item,:host-context(html[data-theme='dark']) .focus-foot,:host-context(html[data-theme='dark']) .shortcut-list a{border-color:#303c50;color:#aab5c7}\n    :host-context(html[data-theme='dark']) .shortcut-list a{color:#c4ccda}\n    :host-context(html[data-theme='dark']) .trend-columns{border-color:#39465a;background:repeating-linear-gradient(to bottom,transparent 0,transparent 24%,#303c50 24.5%,transparent 25%)}\n    :host-context(html[data-theme='dark']) .trend-day strong,:host-context(html[data-theme='dark']) .trend-day small{color:#b9c3d2}\n    :host-context(html[data-theme='dark']) .online-dot{box-shadow:0 0 0 4px #203b35}
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
