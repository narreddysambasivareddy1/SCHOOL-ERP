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
    <div class="dashboard-v2">
      <header class="dash-intro">
        <div class="intro-copy">
          <div class="intro-overline"><span class="live-dot"></span> SCHOOL OPERATIONS <span class="overline-divider">/</span> {{ ctx.context()?.academicYearName || 'Academic year' }}</div>
          <h1>Good {{ greeting }}, {{ user()?.firstName }}.</h1>
          <p>Your school at a glance. Here is what needs your attention today.</p>
          <div class="intro-date"><i class="pi pi-calendar"></i> {{ todayLabel }}</div>
        </div>
        <div class="intro-actions">
          <div class="school-chip"><i class="pi pi-building"></i><span>{{ ctx.context()?.schoolName || 'Your school' }}</span></div>
          @if (canCreateAdmission) {
            <a routerLink="/admissions" class="intro-primary"><i class="pi pi-plus"></i> Create admission</a>
          }
        </div>
        <div class="intro-orbit orbit-one"></div>
        <div class="intro-orbit orbit-two"></div>
      </header>

      @if (error()) {
        <div class="alert-banner" role="alert"><i class="pi pi-exclamation-circle"></i> Could not load dashboard statistics — {{ error() }}</div>
      }

      <section class="metric-strip" aria-label="School overview" [class.is-loading]="loading()">
        @for (stat of stats(); track stat.label; let i = $index) {
          @if (stat.link) {
            <a class="metric-tile" [class]="'metric-tile metric-tone-' + i" [routerLink]="stat.link">
              <span class="metric-symbol"><i [class]="stat.icon"></i></span>
              <span class="metric-content">
                <span class="metric-label">{{ stat.label }}</span>
                <strong>{{ loading() ? '—' : stat.value }}</strong>
                <small>{{ stat.sub }}</small>
              </span>
              <i class="pi pi-arrow-up-right metric-arrow"></i>
            </a>
          } @else {
            <article class="metric-tile" [class]="'metric-tile metric-tone-' + i">
              <span class="metric-symbol"><i [class]="stat.icon"></i></span>
              <span class="metric-content">
                <span class="metric-label">{{ stat.label }}</span>
                <strong>{{ loading() ? '—' : stat.value }}</strong>
                <small>{{ stat.sub }}</small>
              </span>
            </article>
          }
        }
      </section>

      <div class="workbench-heading">
        <div><span class="section-overline">LIVE OVERVIEW</span><h2>Today's operations</h2></div>
        <span class="updated-label"><span class="live-dot"></span> Live school data</span>
      </div>

      <section class="workbench">
        <article class="attendance-feature">
          <div class="feature-heading">
            <div>
              <span class="feature-kicker">ATTENDANCE MONITOR</span>
              <h3>Weekly attendance</h3>
              <p>Daily student attendance across the current week</p>
            </div>
            <a routerLink="/attendance" class="feature-link">View attendance <i class="pi pi-arrow-up-right"></i></a>
          </div>
          <div class="attendance-summary">
            <div class="attendance-number">
              <strong>{{ loading() ? '—' : (attendanceMarked() ? attendancePct() + '%' : '—') }}</strong>
              <span>{{ attendanceMarked() ? 'Marked today' : 'Attendance not marked' }}</span>
            </div>
            <div class="attendance-state" [class.state-pending]="!attendanceMarked()">
              <i [class]="attendanceMarked() ? 'pi pi-check-circle' : 'pi pi-clock'"></i>
              {{ attendanceMarked() ? 'Daily register updated' : 'Awaiting attendance entry' }}
            </div>
          </div>
          @if (loading()) {
            <div class="v2-chart-loading"><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span></div>
          } @else if (attendanceTrend().length) {
            <div class="v2-chart" role="img" aria-label="Daily attendance trend for the last seven days">
              <div class="chart-guides"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
              <div class="chart-columns">
                @for (point of attendanceTrend(); track point.date; let last = $last) {
                  <div class="chart-column" [class.chart-column-current]="last" [attr.aria-label]="(point.date | date:'EEE, d MMM') + ': ' + point.pct + '%'">
                    <div class="chart-bar-track"><span class="chart-bar-fill" [style.height.%]="point.pct"></span></div>
                    <strong>{{ point.pct }}<small>%</small></strong>
                    <span class="chart-day">{{ point.date | date:'EEE' }}</span>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="v2-empty"><i class="pi pi-chart-line"></i><strong>No attendance data yet</strong><span>Attendance records will appear here once sessions are marked.</span></div>
          }
          <div class="feature-foot"><span><i class="pi pi-info-circle"></i> Based on marked attendance sessions</span><a routerLink="/attendance">Open register <i class="pi pi-arrow-right"></i></a></div>
        </article>

        <aside class="action-center">
          <div class="action-heading">
            <div><span class="feature-kicker">PRIORITY QUEUE</span><h3>Action center</h3><p>Items that may need follow-up</p></div>
            <span class="action-count">{{ (enquiryNew() + (ops()?.openSubstitutions ?? 0) + diaryPending()) || 0 }}</span>
          </div>
          @if (loading()) {
            <div class="operation-loading"><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span></div>
          } @else {
            <div class="action-list">
              <a routerLink="/enquiries" class="action-item">
                <span class="action-symbol action-blue"><i class="pi pi-inbox"></i></span>
                <span class="action-detail"><strong>New enquiries</strong><small>{{ enquiryOpen() }} still open</small></span>
                <span class="action-value">{{ enquiryNew() }}</span><i class="pi pi-chevron-right action-chevron"></i>
              </a>
              <a routerLink="/fees" class="action-item">
                <span class="action-symbol action-green"><i class="pi pi-wallet"></i></span>
                <span class="action-detail"><strong>Fees collected</strong><small>Successful payments this month</small></span>
                <span class="action-value action-money">{{ locale.formatMoney(feeTotal()) }}</span><i class="pi pi-chevron-right action-chevron"></i>
              </a>
              @if (canSeeAcademicOps) {
                <a routerLink="/substitutions" class="action-item">
                  <span class="action-symbol action-amber"><i class="pi pi-users"></i></span>
                  <span class="action-detail"><strong>Periods to cover</strong><small>{{ ops()?.onLeave ?? '—' }} on leave · {{ ops()?.presentStaff ?? '—' }} present</small></span>
                  <span class="action-value">{{ ops()?.openSubstitutions ?? '—' }}</span><i class="pi pi-chevron-right action-chevron"></i>
                </a>
              }
              @if (canSeeDiaryCompliance) {
                <a routerLink="/diary" class="action-item">
                  <span class="action-symbol action-violet"><i class="pi pi-book"></i></span>
                  <span class="action-detail"><strong>Diary pending</strong><small>{{ diarySubmitted() }} submitted today</small></span>
                  <span class="action-value">{{ diaryPending() }}</span><i class="pi pi-chevron-right action-chevron"></i>
                </a>
              }
            </div>
          }
          @if (opsError()) { <div class="inline-error" role="alert">{{ opsError() }}</div> }
          @if (diaryError()) { <div class="inline-error" role="alert">{{ diaryError() }}</div> }
          <div class="action-footer"><i class="pi pi-shield"></i><span>Role-based access · Your permissions are applied</span></div>
        </aside>
      </section>

      @if (canSeeAcademicOps && ops()?.availability?.length) {
        <section class="teacher-availability">
          <div class="availability-heading">
            <div><span class="feature-kicker">STAFFING</span><h3>Teacher availability</h3><p>Available staff for period coverage today</p></div>
            <a routerLink="/substitutions" class="feature-link">Manage cover <i class="pi pi-arrow-up-right"></i></a>
          </div>
          <div class="availability-grid">
            @for (period of ops()?.availability || []; track period.periodId) {
              <div class="availability-item">
                <span class="period-label">{{ period.period }}</span>
                <strong>{{ period.free }} <small>free</small></strong>
                <span class="teacher-names">{{ teacherNames(period) || 'No teachers available' }}</span>
              </div>
            }
          </div>
        </section>
      }
    </div>
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

    /* Premium A+D dashboard composition */
    .welcome {
      position: relative; align-items: center; min-height: 154px;
      margin: 0 0 20px; padding: 27px 30px; overflow: hidden;
      border: 1px solid var(--line); border-radius: 20px;
      background: linear-gradient(112deg, var(--surface) 0%, var(--surface) 68%, var(--primary-soft) 145%);
      box-shadow: 0 5px 20px rgba(24, 43, 75, .035);
    }
    .welcome::after {
      content: ""; position: absolute; width: 210px; height: 210px; right: 7%;
      top: -118px; border: 1px solid color-mix(in srgb, var(--primary) 12%, transparent);
      border-radius: 50%; pointer-events: none;
    }
    .welcome-kicker {
      margin: 0 0 9px; color: var(--primary); font-size: 11px;
      font-weight: 800; letter-spacing: .09em; text-transform: uppercase;
    }
    .welcome h1 { color: var(--ink); font-size: clamp(27px, 2.4vw, 34px); font-weight: 760; letter-spacing: -.045em; }
    .welcome-date { margin-top: 9px; color: var(--muted); font-size: 13px; }
    .primary-action {
      position: relative; z-index: 1; height: 44px; padding: 0 17px;
      border-radius: 11px; box-shadow: 0 5px 12px color-mix(in srgb, var(--primary) 18%, transparent);
      font-size: 13px; font-weight: 750;
    }
    .alert-banner { border: 1px solid color-mix(in srgb, var(--warn) 18%, transparent); border-radius: 13px; }
    .kpis { gap: 15px; }
    .kpi {
      position: relative; min-height: 142px; gap: 15px; padding: 22px 20px;
      border: 1px solid var(--line); border-radius: 17px; background: var(--surface);
      box-shadow: 0 4px 16px rgba(24, 43, 75, .035);
      transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
    }
    a.kpi:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--primary) 38%, var(--line)); box-shadow: 0 12px 26px rgba(24,43,75,.08); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 13px; font-size: 17px; }
    .kpi:nth-child(2) .kpi-icon { background: #eaf7f2; color: #16845f; }
    .kpi:nth-child(3) .kpi-icon { background: #fff5e7; color: #b7791f; }
    .kpi:nth-child(4) .kpi-icon { background: #f1edff; color: #7052bd; }
    .kpi-copy { gap: 5px; }
    .kpi-label { font-size: 12px; font-weight: 700; letter-spacing: .01em; }
    .kpi strong { color: var(--ink); font-size: clamp(25px, 2.1vw, 31px); font-weight: 760; letter-spacing: -.045em; }
    .kpi-note { font-size: 11px; line-height: 1.45; }
    .board { grid-template-columns: minmax(0, 1.55fr) minmax(300px, .9fr); gap: 15px; margin-top: 15px; }
    .panel {
      min-height: 310px; padding: 23px 24px 16px; border-radius: 18px;
      border-color: var(--line); box-shadow: 0 4px 18px rgba(24,43,75,.035);
    }
    .panel-heading { align-items: center; }
    .panel-heading h2 { color: var(--ink); font-size: 16px; font-weight: 760; letter-spacing: -.025em; }
    .panel-heading p { margin-top: 5px; font-size: 12px; }
    .open-link { height: 35px; padding: 0 13px; border-radius: 9px; font-size: 12px; font-weight: 700; }
    .today-figure { margin-left: auto; margin-right: 8px; }
    .today-figure strong { color: var(--primary); font-size: 25px; font-weight: 780; }
    .today-figure span { font-size: 10px; letter-spacing: .06em; text-transform: uppercase; }
    .trend-chart {
      position: relative; height: 222px; gap: 16px; margin-top: 22px;
      padding: 12px 8px 0; border: 0;
      background: repeating-linear-gradient(to bottom, transparent 0, transparent 53px, var(--line) 54px, transparent 55px);
    }
    .trend-day { grid-template-rows: minmax(0, 1fr) 18px 18px; gap: 5px; }
    .trend-track { width: min(34px, 100%); border-radius: 9px 9px 3px 3px; background: var(--navy2); overflow: hidden; }
    .trend-bar { border-radius: 8px 8px 2px 2px; background: color-mix(in srgb, var(--primary) 52%, #aebbd0); transition: height 300ms ease; }
    .trend-day.is-latest .trend-bar { background: var(--primary); }
    .trend-day strong { font-size: 12px; font-weight: 750; }
    .trend-day small { font-size: 11px; }
    .queue { gap: 9px; margin: 18px 0 12px; }
    .queue a {
      min-height: 66px; grid-template-columns: 40px minmax(0,1fr) auto;
      gap: 12px; padding: 10px 12px; border: 1px solid var(--line);
      border-radius: 13px; background: var(--surface); transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
    }
    .queue a:hover { background: var(--canvas); border-color: color-mix(in srgb, var(--primary) 35%, var(--line)); transform: translateX(2px); }
    .work-icon { width: 40px; height: 40px; border-radius: 12px; background: var(--primary-soft); font-size: 15px; }
    .queue a:nth-child(2) .work-icon { background: #eaf7f2; color: #16845f; }
    .queue a:nth-child(3) .work-icon { background: #fff5e7; color: #b7791f; }
    .queue a:nth-child(4) .work-icon { background: #f1edff; color: #7052bd; }
    .work-copy span { font-size: 12px; font-weight: 750; }
    .work-copy small { margin-top: 2px; font-size: 11px; }
    .queue a > strong { font-size: 15px; font-weight: 780; }
    .cover-panel { min-height: auto; margin-top: 15px; }
    .cover-table { margin-top: 16px; }
    .cover-head, .cover-row { min-height: 48px; }
    .cover-head { font-size: 10px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
    .cover-row { font-size: 13px; }
    .empty-chart { min-height: 190px; }
    .skeleton { background: linear-gradient(90deg, var(--navy2), color-mix(in srgb, var(--navy2) 55%, white), var(--navy2)); }
    @media (max-width: 1100px) {
      .board { grid-template-columns: minmax(0, 1fr); }
      .panel { min-height: 0; }
    }
    @media (max-width: 720px) {
      .welcome { min-height: 0; padding: 22px 20px; border-radius: 16px; }
      .welcome h1 { font-size: 25px; }
      .primary-action { height: 40px; }
      .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .kpi { min-height: 124px; padding: 15px 13px; gap: 10px; border-radius: 14px; }
      .kpi-icon { width: 36px; height: 36px; border-radius: 11px; }
      .kpi strong { font-size: 23px; overflow-wrap: anywhere; }
      .kpi-note { font-size: 10px; }
      .panel { padding: 18px 16px 12px; border-radius: 15px; }
      .trend-chart { height: 190px; gap: 8px; }
      .today-figure { margin-right: 0; }
      .cover-head, .cover-row { grid-template-columns: 1fr 48px; }
    }
    @media (max-width: 390px) {
      .kpis { grid-template-columns: minmax(0, 1fr); }
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
