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
          <div class="stat-topline"><span [class]="'stat-icon ' + stat.tone"><i [class]="stat.icon"></i></span><span class="stat-context">{{ stat.label === 'Active students' ? 'ENROLMENT' : stat.label === 'Staff strength' ? 'PEOPLE' : stat.label === 'Attendance today' ? 'TODAY' : 'REVENUE' }}</span></div>
          <div class="stat-copy">
            <span class="stat-label">{{ stat.label }}</span>
            <strong class="stat-value">{{ loading() ? '—' : stat.value }}</strong>
            <span class="stat-sub">{{ stat.sub }}</span>
          </div>
          <span class="stat-rule"></span>
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
    .welcome { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 0 0 24px; }
    .welcome h1 { margin: 5px 0 6px; color: var(--navy); font-size: clamp(24px, 3vw, 32px); font-weight: 750; letter-spacing: -.04em; line-height: 1.15; }
    .welcome p { margin: 0; color: var(--muted); font-size: 13px; }
    .separator { padding: 0 5px; color: #a8b4c3; }
    .primary-action { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 0 14px; border-radius: 9px; background: var(--primary); color: white; text-decoration: none; font-size: 12px; font-weight: 700; white-space: nowrap; box-shadow: 0 3px 8px rgba(36,99,235,.16); }
    .primary-action:hover { background: var(--primary-hover); }
    .alert-banner { display: flex; align-items: center; gap: 9px; margin-bottom: 16px; padding: 11px 14px; border: 1px solid #f1d39a; border-radius: 10px; background: var(--warn-soft); color: var(--warn); font-size: 12px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .stat-card { display: flex; align-items: flex-start; gap: 13px; min-width: 0; padding: 18px; border: 1px solid var(--line); border-radius: 13px; background: white; box-shadow: var(--shadow-sm); }
    .stat-card.is-loading { opacity: .72; }
    .stat-icon, .insight-icon, .operation-icon { display: grid; place-items: center; flex: none; border-radius: 10px; }
    .stat-icon { width: 40px; height: 40px; font-size: 15px; }
    .blue { background: #eaf1ff; color: #245fc4; }
    .teal { background: #e4f6f2; color: #087d68; }
    .amber { background: #fff3dc; color: #996300; }
    .violet { background: #f0ecff; color: #6847b7; }
    .stat-copy { display: grid; min-width: 0; gap: 2px; }
    .stat-label { color: var(--muted); font-size: 10px; font-weight: 750; letter-spacing: .07em; text-transform: uppercase; }
    .stat-value { overflow: hidden; color: var(--navy); font-size: clamp(20px, 2vw, 25px); font-weight: 750; letter-spacing: -.035em; text-overflow: ellipsis; white-space: nowrap; }
    .stat-sub { color: var(--muted); font-size: 11px; }
    .section { margin-top: 28px; }
    .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
    .section-heading h2, .panel-heading h2 { margin: 0; color: var(--navy); font-size: 16px; font-weight: 750; letter-spacing: -.02em; }
    .section-heading p, .panel-heading p { margin: 3px 0 0; color: var(--muted); font-size: 11px; }
    .today-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; }
    .insight-card { display: flex; min-height: 176px; flex-direction: column; align-items: flex-start; padding: 15px; border: 1px solid var(--line); border-radius: 12px; background: white; color: var(--ink); text-decoration: none; transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease; }
    .insight-card:hover { border-color: #b6c8e1; box-shadow: var(--shadow); transform: translateY(-1px); }
    .insight-top { display: flex; align-items: center; gap: 9px; width: 100%; margin-bottom: 13px; }
    .insight-icon { width: 30px; height: 30px; font-size: 13px; }
    .card-kicker { color: var(--muted); font-size: 9px; font-weight: 800; letter-spacing: .09em; }
    .insight-card > strong { color: var(--navy); font-size: 19px; font-weight: 750; letter-spacing: -.025em; }
    .insight-card > span:not(.card-link) { margin-top: 3px; color: var(--muted); font-size: 11px; line-height: 1.4; }
    .card-link { display: flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 12px; color: var(--primary); font-size: 10px; font-weight: 700; }
    .card-link i { font-size: 9px; }
    .detail-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(360px, .9fr); align-items: stretch; gap: 14px; margin-top: 14px; }
    .panel { min-width: 0; padding: 18px; border: 1px solid var(--line); border-radius: 13px; background: white; box-shadow: var(--shadow-sm); }
    .panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .panel-heading > a { display: grid; width: 30px; height: 30px; place-items: center; border: 1px solid var(--line); border-radius: 8px; color: var(--muted); text-decoration: none; }
    .panel-heading > a:hover { color: var(--primary); border-color: #b6c8e1; }
    .trend-chart { display: grid; height: 194px; grid-template-columns: repeat(7, minmax(0, 1fr)); align-items: end; gap: 10px; margin-top: 20px; padding: 8px 2px 0; }
    .trend-day { display: grid; height: 100%; grid-template-rows: 1fr auto auto; justify-items: center; gap: 5px; }
    .trend-bar-wrap { display: flex; width: 100%; height: 100%; align-items: end; justify-content: center; border-bottom: 1px solid var(--line); background: linear-gradient(to top, #f8fafc 1px, transparent 1px); }
    .trend-bar { display: block; width: min(28px, 66%); min-height: 2px; border-radius: 5px 5px 0 0; background: #4c7de0; transition: height 220ms ease; }
    .trend-day strong { color: var(--navy); font-size: 10px; font-weight: 700; }
    .trend-day small { color: var(--muted); font-size: 10px; }
    .chart-loading { display: flex; height: 194px; align-items: end; gap: 10px; margin-top: 20px; }
    .chart-loading .skeleton { flex: 1; height: 70%; }
    .chart-loading .skeleton:nth-child(2n) { height: 48%; }
    .empty-chart { display: grid; min-height: 194px; align-content: center; justify-items: center; gap: 8px; color: var(--muted); font-size: 11px; text-align: center; }
    .empty-chart i { color: #9aa9bc; font-size: 22px; }
    .operation-loading { display: grid; gap: 12px; margin-top: 20px; }
    .operation-loading .skeleton { height: 54px; }
    .operation-row { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid #edf1f6; color: var(--ink); text-decoration: none; }
    .operation-row > i { color: #9aa9bc; font-size: 11px; }
    .operation-icon { width: 32px; height: 32px; font-size: 13px; }
    .operation-copy { display: grid; flex: 1; min-width: 0; gap: 2px; }
    .operation-copy strong { overflow: hidden; color: var(--navy); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
    .operation-copy small { color: var(--muted); font-size: 10px; }
    .operation-row:hover .operation-copy strong { color: var(--primary); }
    .availability { margin-top: 14px; }
    .availability-heading { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
    .availability-heading strong { color: var(--navy); font-size: 11px; }
    .availability-heading span { color: var(--muted); font-size: 10px; }
    .availability-row { display: grid; grid-template-columns: 36px 24px minmax(0,1fr); align-items: center; gap: 8px; padding: 5px 0; border-top: 1px solid #f0f3f7; }
    .availability-row > span { color: var(--ink); font-size: 10px; font-weight: 700; }
    .availability-row > strong { color: var(--success); font-size: 10px; text-align: center; }
    .availability-row > small { overflow: hidden; color: var(--muted); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
    .availability-empty { padding: 10px 0; color: var(--muted); font-size: 10px; }
    .inline-error { margin-top: 10px; padding: 8px 10px; border-radius: 8px; background: var(--danger-soft); color: var(--danger); font-size: 10px; }
    .quick-links { margin-top: 26px; }
    .quick-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; }
    .quick-grid > a { display: flex; min-width: 0; align-items: center; gap: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: white; color: var(--primary); text-decoration: none; }
    .quick-grid > a:hover { border-color: #b6c8e1; box-shadow: var(--shadow-sm); }
    .quick-grid > a > span { display: grid; flex: 1; min-width: 0; gap: 1px; }
    .quick-grid > a > span strong { color: var(--navy); font-size: 11px; }
    .quick-grid > a > span small { color: var(--muted); font-size: 9px; }
    .quick-grid > a > i:last-child { color: #9aa9bc; font-size: 10px; }
    @media (max-width: 1100px) {
      .stats-grid, .today-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
      .detail-grid { grid-template-columns: minmax(0,1fr); }
      .quick-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }
    @media (max-width: 600px) {
      .welcome { align-items: flex-start; flex-direction: column; gap: 14px; }
      .stats-grid, .today-grid, .quick-grid { grid-template-columns: minmax(0,1fr); }
      .stat-card { padding: 15px; }
      .insight-card { min-height: 154px; }
      .panel { padding: 15px; }
    }
    .welcome {
      position: relative;
      min-height: 248px;
      overflow: hidden;
      align-items: center;
      margin-bottom: 28px;
      padding: clamp(26px, 4vw, 42px);
      border: 1px solid #1d4679;
      border-radius: 22px;
      background:
        radial-gradient(ellipse at 78% 12%, rgba(68, 135, 226, .34), transparent 34%),
        radial-gradient(ellipse at 94% 100%, rgba(15, 139, 141, .24), transparent 30%),
        linear-gradient(112deg, #102847 0%, #173d6b 58%, #1d4c7b 100%);
      box-shadow: 0 18px 45px rgba(16, 40, 71, .18);
      color: white;
    }
    .welcome::after {
      position: absolute;
      top: -130px;
      right: 115px;
      width: 330px;
      height: 330px;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 50%;
      box-shadow: 0 0 0 34px rgba(255,255,255,.025), 0 0 0 72px rgba(255,255,255,.02);
      content: '';
      pointer-events: none;
    }
    .welcome-copy { position: relative; z-index: 1; max-width: 680px; }
    .welcome-kicker { display: flex; align-items: center; gap: 9px; color: #b8cee8; font-size: 9px; font-weight: 800; letter-spacing: .15em; }
    .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #56d4b3; box-shadow: 0 0 0 4px rgba(86,212,179,.13); }
    .kicker-divider { color: #7898bb; }
    .welcome h1 { margin: 14px 0 8px; color: white; font-size: clamp(32px, 4vw, 46px); font-weight: 700; letter-spacing: -.055em; line-height: 1.06; }
    .welcome h1 span { color: #76b8ff; }
    .welcome p { color: #c4d2e2; font-size: 13px; }
    .separator { color: #7f9ab8; }
    .welcome-actions { display: flex; align-items: center; gap: 20px; margin-top: 22px; }
    .welcome .primary-action { min-height: 42px; padding: 0 16px; border: 1px solid #fff; border-radius: 10px; background: white; color: #173d6b; box-shadow: 0 7px 18px rgba(5,19,37,.18); }
    .welcome .primary-action:hover { background: #eaf3ff; }
    .secondary-action { display: inline-flex; align-items: center; gap: 8px; color: #e1ecf8; font-size: 11px; font-weight: 700; text-decoration: none; }
    .secondary-action:hover { color: white; }
    .welcome-pulse { position: relative; z-index: 1; display: flex; align-items: center; gap: 16px; margin-left: auto; padding: 14px 18px 14px 14px; border: 1px solid rgba(255,255,255,.16); border-radius: 16px; background: rgba(5,22,44,.24); backdrop-filter: blur(8px); }
    .pulse-ring { display: grid; width: 86px; height: 86px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: conic-gradient(#62d7bb var(--pulse-progress), rgba(255,255,255,.17) 0); }
    .pulse-ring.not-marked { background: conic-gradient(rgba(255,255,255,.25) 100%, rgba(255,255,255,.1) 0); }
    .pulse-ring-inner { display: grid; width: 70px; height: 70px; align-content: center; justify-items: center; border-radius: 50%; background: #173d6b; }
    .pulse-ring-inner strong { color: white; font-size: 20px; line-height: 1.2; }
    .pulse-ring-inner span { color: #b7cbe1; font-size: 7px; font-weight: 800; letter-spacing: .1em; }
    .pulse-caption { display: grid; gap: 5px; min-width: 132px; }
    .pulse-caption span { color: white; font-size: 11px; font-weight: 700; }
    .pulse-caption small { color: #b7cbe1; font-size: 10px; }
    .overview-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin: 0 0 12px; }
    .section-kicker { color: var(--teal); font-size: 9px; font-weight: 850; letter-spacing: .14em; }
    .overview-heading h2 { margin: 2px 0 0; color: var(--navy); font-size: 20px; letter-spacing: -.035em; }
    .updated-indicator { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 10px; }
    .updated-indicator i { color: var(--success); font-size: 10px; }
    .stats-grid { gap: 12px; }
    .stat-card { position: relative; min-height: 152px; overflow: hidden; display: flex; flex-direction: column; align-items: stretch; gap: 15px; padding: 17px 18px 16px; border: 1px solid #e4eaf2; border-radius: 15px; box-shadow: 0 3px 12px rgba(18,38,66,.035); transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease; }
    .stat-card:hover { transform: translateY(-2px); border-color: #c8d7ea; box-shadow: 0 12px 26px rgba(18,38,66,.08); }
    .stat-card::before { position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: #5a8dea; content: ''; }
    .stat-card:nth-child(2)::before { background: #37b89e; }
    .stat-card:nth-child(3)::before { background: #e8b54c; }
    .stat-card:nth-child(4)::before { background: #9a7be0; }
    .stat-topline { display: flex; align-items: center; justify-content: space-between; }
    .stat-icon { width: 34px; height: 34px; border-radius: 10px; font-size: 13px; }
    .stat-context { color: #95a2b2; font-size: 8px; font-weight: 850; letter-spacing: .12em; }
    .stat-copy { gap: 1px; }
    .stat-label { color: #617187; font-size: 10px; letter-spacing: .035em; text-transform: none; }
    .stat-value { color: #142f50; font-size: clamp(23px, 2.5vw, 30px); font-weight: 760; letter-spacing: -.05em; }
    .stat-sub { color: #8290a2; font-size: 10px; }
    .stat-rule { position: absolute; right: 17px; bottom: 17px; left: 17px; height: 1px; background: #f0f3f7; }
    .section.pulse-section { margin-top: 34px; }
    .section-heading { align-items: center; margin-bottom: 15px; }
    .section-heading h2 { margin-top: 2px; font-size: 20px; letter-spacing: -.035em; }
    .section-heading p { margin-top: 4px; font-size: 11px; }
    .date-chip { display: inline-flex; align-items: center; gap: 7px; padding: 7px 10px; border: 1px solid #e2e9f2; border-radius: 8px; background: white; color: #63738a; font-size: 9px; font-weight: 700; }
    .date-chip i { color: var(--primary); }
    .today-grid { gap: 12px; }
    .insight-card { position: relative; min-height: 178px; padding: 17px; border-color: #e5eaf1; border-radius: 15px; box-shadow: 0 3px 12px rgba(18,38,66,.03); }
    .insight-card:hover { transform: translateY(-3px); border-color: #b8cbed; box-shadow: 0 14px 28px rgba(18,38,66,.09); }
    .insight-top { margin-bottom: 12px; }
    .insight-icon { width: 34px; height: 34px; border-radius: 11px; }
    .card-kicker { color: #8090a4; font-size: 8px; letter-spacing: .14em; }
    .insight-card > strong { color: #17365d; font-size: 22px; letter-spacing: -.04em; }
    .insight-card > span:not(.card-link) { color: #748398; font-size: 10px; }
    .card-link { padding-top: 14px; font-size: 9px; }
    .detail-grid { grid-template-columns: minmax(0,1.15fr) minmax(340px,.85fr); gap: 16px; margin-top: 16px; }
    .panel { padding: 21px; border-radius: 16px; box-shadow: 0 4px 16px rgba(18,38,66,.035); }
    .panel-heading h2 { font-size: 17px; }
    .panel-heading p { font-size: 10px; }
    .trend-chart { height: 220px; gap: 14px; margin-top: 24px; }
    .trend-bar-wrap { overflow: hidden; border: 1px solid #eff3f8; border-bottom: 0; border-radius: 8px 8px 0 0; background: repeating-linear-gradient(to top, #f8fafc 0 1px, transparent 1px 25%); }
    .trend-bar { width: min(30px, 58%); border-radius: 6px 6px 0 0; background: linear-gradient(180deg,#67a0f2,#3672d2); box-shadow: 0 3px 10px rgba(54,114,210,.2); }
    .trend-day strong { padding: 3px 5px; border-radius: 5px; background: #f2f6fc; color: #254e82; font-size: 9px; }
    .trend-day small { font-size: 9px; }
    .operation-row { margin-inline: -4px; padding: 13px 5px; border-radius: 9px; }
    .operation-row:hover { background: #f7faff; }
    .operation-icon { width: 36px; height: 36px; border-radius: 11px; }
    .operation-copy strong { font-size: 11px; }
    .operation-copy small { font-size: 9px; }
    .availability { margin-top: 17px; padding: 13px; border: 1px solid #edf1f6; border-radius: 11px; background: #fafbfd; }
    .availability-heading { margin-bottom: 8px; }
    .availability-heading strong { font-size: 10px; }
    .availability-row { grid-template-columns: 42px 28px minmax(0,1fr); gap: 9px; padding: 8px 0; }
    .availability-row > span, .availability-row > strong, .availability-row > small { font-size: 9px; }
    .quick-links { margin-top: 34px; }
    .quick-grid { gap: 10px; }
    .quick-grid > a { padding: 14px; border-radius: 12px; transition: border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease; }
    .quick-grid > a:hover { transform: translateY(-2px); border-color: #b6c8e1; box-shadow: 0 8px 20px rgba(18,38,66,.07); }
    .quick-grid > a > i:first-child { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 10px; background: #edf3ff; }
    .quick-grid > a > span strong { font-size: 10px; }
    .quick-grid > a > span small { font-size: 9px; }
    @media (max-width: 850px) {
      .welcome { align-items: flex-start; }
      .welcome-pulse { gap: 10px; padding: 10px; }
      .pulse-ring { width: 70px; height: 70px; }
      .pulse-ring-inner { width: 57px; height: 57px; }
      .pulse-ring-inner strong { font-size: 16px; }
      .pulse-caption { min-width: 100px; }
      .detail-grid { grid-template-columns: minmax(0,1fr); }
    }
    @media (max-width: 600px) {
      .welcome { min-height: 0; align-items: flex-start; gap: 22px; padding: 24px; border-radius: 17px; }
      .welcome::after { top: auto; right: -100px; bottom: -180px; }
      .welcome h1 { font-size: 35px; }
      .welcome-actions { align-items: flex-start; flex-direction: column; gap: 13px; }
      .welcome-pulse { width: 100%; margin-left: 0; }
      .overview-heading { align-items: flex-start; flex-direction: column; gap: 7px; }
      .stat-card { min-height: 137px; }
      .section-heading { align-items: flex-start; flex-direction: column; }
      .date-chip { align-self: flex-start; }
      .trend-chart { gap: 7px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .stat-card, .insight-card, .quick-grid > a, .trend-bar { transition: none; }
      .stat-card:hover, .insight-card:hover, .quick-grid > a:hover { transform: none; }
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
