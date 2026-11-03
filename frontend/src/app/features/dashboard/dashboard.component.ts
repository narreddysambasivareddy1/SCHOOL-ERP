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
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;animation-duration:.01ms!important}}
    :host-context(html[data-theme='dark']) .metric-strip,:host-context(html[data-theme='dark']) .attendance-feature,:host-context(html[data-theme='dark']) .staff-feature,:host-context(html[data-theme='dark']) .focus-card,:host-context(html[data-theme='dark']) .shortcut-card{background:#182235;border-color:#303c50;box-shadow:none}
    :host-context(html[data-theme='dark']) .welcome-copy h1,:host-context(html[data-theme='dark']) .content-heading h2,:host-context(html[data-theme='dark']) .feature-top h3,:host-context(html[data-theme='dark']) .focus-heading h3,:host-context(html[data-theme='dark']) .shortcut-card h3,:host-context(html[data-theme='dark']) .metric>strong,:host-context(html[data-theme='dark']) .attendance-number strong,:host-context(html[data-theme='dark']) .focus-text strong,:host-context(html[data-theme='dark']) .focus-item>b,:host-context(html[data-theme='dark']) .staff-row>strong{color:#e6eaf2}
    :host-context(html[data-theme='dark']) .welcome-copy p,:host-context(html[data-theme='dark']) .feature-top p,:host-context(html[data-theme='dark']) .focus-intro,:host-context(html[data-theme='dark']) .focus-text small,:host-context(html[data-theme='dark']) .metric>small,:host-context(html[data-theme='dark']) .updated-indicator,:host-context(html[data-theme='dark']) .attendance-number span,:host-context(html[data-theme='dark']) .teacher-names{color:#aab5c7}
    :host-context(html[data-theme='dark']) .attendance-summary,:host-context(html[data-theme='dark']) .staff-row{background:#202d42;border-color:#303c50}
    :host-context(html[data-theme='dark']) .metric{border-color:#303c50}
    :host-context(html[data-theme='dark']) .feature-foot,:host-context(html[data-theme='dark']) .focus-item,:host-context(html[data-theme='dark']) .focus-foot,:host-context(html[data-theme='dark']) .shortcut-list a{border-color:#303c50;color:#aab5c7}
    :host-context(html[data-theme='dark']) .shortcut-list a{color:#c4ccda}
    :host-context(html[data-theme='dark']) .trend-columns{border-color:#39465a;background:repeating-linear-gradient(to bottom,transparent 0,transparent 24%,#303c50 24.5%,transparent 25%)}
    :host-context(html[data-theme='dark']) .trend-day strong,:host-context(html[data-theme='dark']) .trend-day small{color:#b9c3d2}
    :host-context(html[data-theme='dark']) .online-dot{box-shadow:0 0 0 4px #203b35}

    /* Reference-matched premium education SaaS dashboard */
    .school-workspace{max-width:1680px;padding:2px 2px 28px;color:#18243b}
    .welcome-row{position:relative;isolation:isolate;overflow:hidden;align-items:center;min-height:166px;margin:0 0 24px;padding:28px 32px;border:0;border-radius:22px;background:linear-gradient(112deg,#172d58 0%,#244d91 58%,#3976c9 100%);box-shadow:0 16px 36px rgba(30,66,128,.18)}
    .welcome-row:after{position:absolute;z-index:-1;top:-115px;right:5%;width:330px;height:330px;border:1px solid rgba(255,255,255,.13);border-radius:50%;box-shadow:0 0 0 36px rgba(255,255,255,.035),0 0 0 76px rgba(255,255,255,.025);content:""}
    .workspace-kicker{color:#c7d9f5;font-size:10px;letter-spacing:.15em}
    .online-dot{background:#4be0ad;box-shadow:0 0 0 4px rgba(75,224,173,.13)}
    .kicker-divider{color:#8ca9d2}
    .welcome-copy h1{margin:13px 0 7px;color:#fff;font-size:clamp(29px,3vw,39px);font-weight:760;letter-spacing:-.045em}
    .welcome-copy p{color:#d4e1f5;font-size:13px}
    .welcome-copy p span{color:#91add5}
    .welcome-actions{position:relative;z-index:1}
    .school-chip{max-width:270px;padding:12px 15px;border:1px solid rgba(255,255,255,.2);border-radius:11px;background:rgba(255,255,255,.12);color:#fff;backdrop-filter:blur(8px);font-size:11px}
    .school-chip i{color:#b8d4ff}
    .create-action{min-height:42px;padding:0 17px;border-radius:10px;background:#fff;color:#244c91;font-size:11px;box-shadow:0 6px 16px rgba(10,29,64,.14)}
    .create-action:hover{background:#edf4ff;color:#173d7c}
    .workspace-error{border-radius:12px;font-size:12px}
    .metric-strip{gap:15px;margin:0 0 31px;border:0;border-radius:0;background:transparent;box-shadow:none}
    .metric{min-height:135px;padding:20px 21px;border:1px solid #e7edf6!important;border-radius:17px;background:#fff;box-shadow:0 7px 22px rgba(28,49,87,.055);transition:transform .18s ease,box-shadow .18s ease}
    .metric:hover{transform:translateY(-3px);box-shadow:0 14px 28px rgba(28,49,87,.10)}
    .metric-label{color:#697891;font-size:12px;font-weight:680}
    .metric-label i{display:grid;width:38px;height:38px;place-items:center;border-radius:12px;background:#edf3ff;color:#4779d1;font-size:16px}
    .metric:nth-child(2) .metric-label i{background:#eaf8f2;color:#219b77}
    .metric:nth-child(3) .metric-label i{background:#f1edff;color:#8065cf}
    .metric:nth-child(4) .metric-label i{background:#fff3e8;color:#d48a3b}
    .metric>strong{margin:13px 0 4px;color:#1d2b45;font-size:31px;letter-spacing:-.055em}
    .metric>small{color:#8c98aa;font-size:10px}
    .metric>a{right:20px;bottom:21px;color:#4674c6;font-size:10px}
    .content-heading{margin:0 0 15px}
    .section-kicker{color:#8291a8;font-size:10px;letter-spacing:.14em}
    .content-heading h2{margin-top:6px;color:#1d2b45;font-size:21px;font-weight:760}
    .updated-indicator{font-size:10px}
    .workspace-grid{grid-template-columns:minmax(0,1.65fr) minmax(315px,.88fr);gap:18px}
    .main-column,.side-column{gap:18px}
    .attendance-feature,.staff-feature,.focus-card,.shortcut-card{padding:23px;border:1px solid #e7edf5;border-radius:17px;background:#fff;box-shadow:0 7px 22px rgba(28,49,87,.045)}
    .feature-top h3,.focus-heading h3,.shortcut-card h3{color:#1d2b45;font-size:17px}
    .feature-top p{color:#8491a6;font-size:12px}
    .subtle-link{font-size:10px}
    .attendance-summary{margin:21px 0 15px;padding:17px 19px;border:1px solid #e8eff9;border-radius:13px;background:linear-gradient(110deg,#f2f6ff,#f8fbff)}
    .attendance-number strong{color:#244c91;font-size:36px}
    .attendance-number span{color:#73839c;font-size:11px}
    .register-state{font-size:10px}
    .trend-chart{height:215px;grid-template-columns:38px 1fr;gap:13px;margin-top:13px}
    .trend-axis{font-size:10px}
    .trend-columns{gap:14px;border-color:#e8edf5;background:repeating-linear-gradient(to bottom,transparent 0,transparent 24%,#edf1f7 24.5%,transparent 25%)}
    .trend-track{height:154px}
    .trend-track span{width:min(34px,70%);border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#80a8ef,#4e7ed2);box-shadow:0 4px 10px rgba(78,126,210,.15)}
    .trend-day.latest .trend-track span{background:linear-gradient(180deg,#55c9a5,#239b7b)}
    .trend-day strong{color:#3c4c66;font-size:11px}
    .trend-day small{font-size:10px}
    .trend-day .trend-date{font-size:9px}
    .feature-foot{margin-top:17px;padding-top:15px;color:#8996a9;font-size:10px}
    .focus-card{padding:22px}
    .focus-count{width:34px;height:34px;border-radius:11px;background:#edf3ff;color:#3769bd;font-size:13px}
    .focus-intro{font-size:12px;color:#8390a4}
    .focus-item{gap:12px;padding:15px 0}
    .focus-symbol{width:38px;height:38px;border-radius:12px;font-size:15px}
    .focus-text strong{font-size:11px;color:#35445e}
    .focus-text small{font-size:10px}
    .focus-item>b{font-size:12px}
    .focus-foot{font-size:10px}
    .shortcut-card{border:0;background:linear-gradient(145deg,#244d91,#326fc0);box-shadow:0 12px 25px rgba(35,77,145,.17)}
    .shortcut-card .section-kicker{color:#bcd2f2}
    .shortcut-card h3{margin-bottom:14px;color:#fff}
    .shortcut-list a{min-height:43px;border-top-color:rgba(255,255,255,.15);color:#e7f0ff;font-size:11px}
    .shortcut-list a>i:first-child{color:#b9d2fb;font-size:14px}
    .shortcut-list a>i:last-child{color:#c2d7f5}
    .shortcut-list a:hover{color:#fff}
    .staff-list{gap:12px}
    .staff-row{gap:8px;padding:15px;border:1px solid #e9eef6;border-radius:12px;background:#f8faff}
    .period-name{font-size:10px}
    .staff-row>strong{color:#254b88;font-size:24px}
    .teacher-names{font-size:10px}
    .trend-empty{min-height:190px;font-size:11px}
    .trend-empty strong{font-size:13px}
    .trend-loading span,.focus-loading span{background:#edf1f8}
    .focus-item:focus-visible,.shortcut-list a:focus-visible,.subtle-link:focus-visible{outline:3px solid rgba(70,116,198,.3);outline-offset:3px}
    :host-context(html[data-theme='dark']) .welcome-row{background:linear-gradient(112deg,#101f3d,#1c3d70 58%,#28599c)}
    :host-context(html[data-theme='dark']) .metric,:host-context(html[data-theme='dark']) .attendance-feature,:host-context(html[data-theme='dark']) .staff-feature,:host-context(html[data-theme='dark']) .focus-card{background:#1b2940;border-color:#2c3b54!important}
    :host-context(html[data-theme='dark']) .metric-label,:host-context(html[data-theme='dark']) .feature-top h3,:host-context(html[data-theme='dark']) .focus-heading h3,:host-context(html[data-theme='dark']) .content-heading h2,:host-context(html[data-theme='dark']) .metric>strong{color:#edf3fc}
    :host-context(html[data-theme='dark']) .metric>small,:host-context(html[data-theme='dark']) .feature-top p,:host-context(html[data-theme='dark']) .focus-intro{color:#a4b2c8}
    :host-context(html[data-theme='dark']) .attendance-summary,:host-context(html[data-theme='dark']) .staff-row{background:#202f48;border-color:#33445f}
    :host-context(html[data-theme='dark']) .attendance-number strong{color:#a9c8ff}
    :host-context(html[data-theme='dark']) .attendance-number span,:host-context(html[data-theme='dark']) .trend-day strong{color:#bdcbe0}
    :host-context(html[data-theme='dark']) .trend-columns{border-color:#35445a;background:repeating-linear-gradient(to bottom,transparent 0,transparent 24%,#2b3b52 24.5%,transparent 25%)}
    :host-context(html[data-theme='dark']) .focus-text strong,:host-context(html[data-theme='dark']) .focus-item>b{color:#e4ecf8}
    @media(max-width:900px){.welcome-row{align-items:flex-start;flex-direction:column;padding:24px}.welcome-actions{flex-wrap:wrap}.metric-strip{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:560px){.school-workspace{padding:0}.welcome-row{min-height:0;margin-bottom:18px;padding:22px 19px;border-radius:16px}.welcome-copy h1{font-size:29px}.welcome-actions{width:100%}.school-chip{max-width:100%}.metric-strip{gap:10px;margin-bottom:24px}.metric{min-height:125px;padding:15px}.metric>strong{font-size:26px}.metric>a{position:static;display:inline-block;margin-top:8px}.content-heading h2{font-size:18px}.attendance-feature,.staff-feature,.focus-card,.shortcut-card{padding:17px;border-radius:14px}.attendance-summary{align-items:flex-start;flex-direction:column}.attendance-number{align-items:flex-start;flex-direction:column;gap:3px}.trend-chart{height:190px;grid-template-columns:30px 1fr;gap:6px}.trend-track{height:132px}.trend-columns{gap:5px}.feature-foot{align-items:flex-start;flex-direction:column}}
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
