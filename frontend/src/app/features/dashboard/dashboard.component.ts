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
    <div class="campus">
      <header class="mast">
        <div class="mast-copy">
          <p class="eyebrow"><span class="live"></span> {{ ctx.context()?.academicYearName || 'Academic year' }}</p>
          <h1>Good {{ greeting }},<br>{{ user()?.firstName || 'there' }}.</h1>
          <p class="lede">{{ todayLabel }}. The register, the front office, and fees for {{ ctx.context()?.schoolName || 'your school' }}.</p>
        </div>
        <div class="mast-side">
          <div class="school-plate">
            <span class="plate-mark"><i class="pi pi-building"></i></span>
            <div>
              <strong>{{ ctx.context()?.schoolName || 'Your school' }}</strong>
              <span>Today’s campus brief</span>
            </div>
          </div>
          @if (canCreateAdmission) {
            <a routerLink="/admissions" class="gold-btn"><i class="pi pi-plus"></i> Create admission</a>
          }
        </div>
      </header>

      @if (error()) {
        <div class="workspace-error" role="alert"><i class="pi pi-exclamation-circle"></i>{{ error() }}</div>
      }

      <section class="metric-strip" aria-label="School performance indicators" [attr.aria-busy]="loading()">
        @for (stat of stats(); track stat.label) {
          @if (stat.link) {
            <a class="metric" [routerLink]="stat.link">
              <div class="metric-label"><i [class]="stat.icon"></i><span>{{ stat.label }}</span></div>
              <strong>{{ loading() ? '—' : stat.value }}</strong>
              <small>{{ stat.sub }}</small>
            </a>
          } @else {
            <article class="metric">
              <div class="metric-label"><i [class]="stat.icon"></i><span>{{ stat.label }}</span></div>
              <strong>{{ loading() ? '—' : stat.value }}</strong>
              <small>{{ stat.sub }}</small>
            </article>
          }
        }
      </section>

      <div class="content-heading">
        <div><span class="section-kicker">The school day</span><h2>What needs a person</h2></div>
        @if (peakDay(); as peak) {
          <span class="updated-indicator">Strongest register · {{ peak.date | date:'EEE d MMM' }} · {{ peak.pct }}%</span>
        }
      </div>

      <div class="workspace-grid">
        <main class="main-column">
          <section class="attendance-feature">
            <div class="feature-top">
              <div>
                <span class="section-kicker">The register</span>
                <h3>Attendance across the week</h3>
                <p>Each bar is a day the school submitted a register.</p>
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
                <div><span class="section-kicker">Cover</span><h3>Teachers free this morning</h3><p>People who can take a period today.</p></div>
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
              <div><span class="section-kicker">Front of house</span><h3>Needs your attention</h3></div>
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
            <span class="section-kicker">Open a desk</span>
            <h3>Go straight to the work</h3>
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
:host{display:block;color:var(--ink, #172033)}
.campus{width:100%;max-width:1480px;margin:0 auto}
.mast{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(240px,.7fr);gap:28px;align-items:end;margin:0 0 28px}
.eyebrow{display:flex;align-items:center;gap:8px;margin:0 0 10px;color:#8a7040;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.live{width:8px;height:8px;border-radius:50%;background:#1f9d72;box-shadow:0 0 0 4px rgba(31,157,114,.16)}
.mast-copy h1{margin:0;color:var(--ink, #142033);font-family:"Playfair Display",Georgia,serif;font-size:clamp(40px,4.6vw,58px);font-weight:700;letter-spacing:-.03em;line-height:1.02}
.lede{max-width:46ch;margin:14px 0 0;color:var(--muted, #5c6b80);font-size:16px;line-height:1.55}
.mast-side{display:flex;flex-direction:column;align-items:flex-start;gap:12px}
.school-plate{display:flex;align-items:center;gap:12px;min-height:64px;padding:10px 14px;border:1px solid var(--glass-border, rgba(255,255,255,.66));border-radius:16px;background:var(--glass-surface, rgba(255,255,255,.62));box-shadow:var(--glass-shadow);backdrop-filter:blur(var(--glass-blur, 18px)) saturate(160%);-webkit-backdrop-filter:blur(var(--glass-blur, 18px)) saturate(160%)}
.plate-mark{display:grid;width:40px;height:40px;flex:none;place-items:center;border-radius:12px;background:#142033;color:#e8c96a;font-size:16px}
.school-plate strong{display:block;color:var(--ink, #142033);font-size:14px;font-weight:700}
.school-plate span{color:#6d7c90;font-size:13px}
.gold-btn{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border-radius:12px;background:#c9a84c;color:#142033;font-size:14px;font-weight:750;text-decoration:none}
.gold-btn:hover{background:#e0be68}
.workspace-error{display:flex;align-items:center;gap:8px;margin:0 0 16px;padding:12px 14px;border-radius:12px;background:#fff1f1;color:#9b3d48;font-size:14px}
.metric-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:0 0 32px}
.metric{display:flex;min-height:148px;flex-direction:column;padding:18px 18px 16px;border:1px solid var(--glass-border, rgba(255,255,255,.66));border-radius:18px;background:var(--glass-surface, rgba(255,255,255,.62));color:inherit;text-decoration:none;box-shadow:var(--glass-shadow, 0 10px 30px rgba(20,32,51,.04));backdrop-filter:blur(var(--glass-blur, 18px)) saturate(160%);-webkit-backdrop-filter:blur(var(--glass-blur, 18px)) saturate(160%);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
a.metric{cursor:pointer}
a.metric:hover{border-color:#c9a84c;transform:translateY(-2px)}
.metric-label{display:flex;align-items:center;gap:8px;color:#5c6b80;font-size:13px;font-weight:650}
.metric-label i{display:grid;width:28px;height:28px;place-items:center;border-radius:8px;background:#f6f0e2;color:#8a7040}
.metric>strong{display:block;margin-top:auto;padding-top:18px;color:var(--ink, #142033);font-size:34px;font-weight:720;letter-spacing:-.04em;font-variant-numeric:tabular-nums;line-height:1}
.metric>small{display:block;margin-top:8px;color:#6d7c90;font-size:13px}
.content-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:0 0 14px}
.section-kicker{display:block;margin:0 0 4px;color:#8a7040;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.content-heading h2,.feature-top h3,.focus-heading h3,.shortcut-card h3{margin:0;color:var(--ink, #142033);font-family:"Playfair Display",Georgia,serif;font-size:28px;font-weight:700;letter-spacing:-.02em}
.updated-indicator{color:#5c6b80;font-size:13px}
.workspace-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,.85fr);gap:16px;align-items:start}
.main-column,.side-column{display:grid;gap:16px;min-width:0}
.attendance-feature,.staff-feature,.focus-card,.shortcut-card{min-width:0;padding:22px;border:1px solid var(--glass-border, rgba(255,255,255,.66));border-radius:20px;background:var(--glass-surface, rgba(255,255,255,.62));box-shadow:var(--glass-shadow, 0 10px 30px rgba(20,32,51,.04));backdrop-filter:blur(var(--glass-blur, 18px)) saturate(160%);-webkit-backdrop-filter:blur(var(--glass-blur, 18px)) saturate(160%)}
.feature-top,.focus-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.feature-top p,.focus-intro{margin:8px 0 0;color:#5c6b80;font-size:14px;line-height:1.5}
.subtle-link,.feature-foot a{color:var(--ink, #142033);font-size:14px;font-weight:650;text-decoration:none}
.subtle-link{display:inline-flex;align-items:center;gap:6px;min-height:44px}
.attendance-summary{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:20px 0 8px;padding:16px 18px;border-radius:16px;background:#142033;color:#f6f1e6}
.attendance-number{display:flex;align-items:baseline;gap:12px}
.attendance-number strong{font-family:"Playfair Display",Georgia,serif;font-size:42px;font-weight:700;letter-spacing:-.03em}
.attendance-number span{color:#d9d0bf;font-size:14px}
.register-state{display:flex;align-items:center;gap:8px;color:#e8c96a;font-size:14px;font-weight:650}
.register-state.waiting{color:#f0d48a}
.trend-chart{display:grid;grid-template-columns:36px 1fr;gap:12px;height:220px;margin-top:12px}
.trend-axis{display:flex;flex-direction:column;justify-content:space-between;padding-bottom:36px;color:#8b97a8;font-size:12px}
.trend-columns{display:grid;gap:12px;align-items:end;border-bottom:1px solid #eadfcd}
.trend-day{display:flex;min-width:0;flex-direction:column;align-items:center;gap:6px}
.trend-track{display:flex;width:100%;height:140px;align-items:flex-end;justify-content:center}
.trend-track span{width:min(28px,70%);min-height:4px;border-radius:8px 8px 2px 2px;background:#142033}
.trend-day.latest .trend-track span{background:#c9a84c}
.trend-day strong{color:var(--ink, #142033);font-size:13px;font-variant-numeric:tabular-nums}
.trend-day small{color:#6d7c90;font-size:12px}
.trend-day .trend-date{margin-top:-4px}
.feature-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding-top:14px;border-top:1px solid var(--glass-line, #efe8da);color:var(--muted, #6d7c90);font-size:13px}
.feature-foot span{display:flex;align-items:center;gap:6px}
.focus-count{display:grid;min-width:36px;height:36px;place-items:center;border-radius:12px;background:#142033;color:#e8c96a;font-size:14px;font-weight:700}
.focus-items{display:grid;margin-top:8px}
.focus-item{display:flex;align-items:center;gap:12px;min-height:64px;padding:10px 0;border-top:1px solid var(--glass-line, #efe8da);color:inherit;text-decoration:none}
.focus-item:hover .focus-text strong{color:#8a7040}
.focus-symbol{display:grid;width:40px;height:40px;flex:none;place-items:center;border-radius:12px;background:#f6f0e2;color:#8a7040;font-size:16px}
.focus-text{display:grid;min-width:0;gap:2px}
.focus-text strong{color:var(--ink, #142033);font-size:15px;font-weight:680}
.focus-text small{overflow:hidden;color:#6d7c90;font-size:13px;text-overflow:ellipsis;white-space:nowrap}
.focus-item>b{margin-left:auto;color:var(--ink, #142033);font-size:15px;font-variant-numeric:tabular-nums;white-space:nowrap}
.focus-item>i{color:#b3a48a}
.focus-foot{display:flex;align-items:center;gap:8px;margin-top:8px;padding-top:12px;border-top:1px solid var(--glass-line, #efe8da);color:var(--muted, #6d7c90);font-size:13px}
.shortcut-list{display:grid;margin-top:12px}
.shortcut-list a{display:flex;align-items:center;gap:10px;min-height:48px;border-top:1px solid var(--glass-line, #efe8da);color:var(--ink, #142033);font-size:15px;font-weight:600;text-decoration:none}
.shortcut-list a>i:first-child{color:#8a7040}
.shortcut-list a>i:last-child{margin-left:auto;color:#b3a48a}
.shortcut-list a:hover{color:#8a7040}
.staff-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:16px}
.staff-row{display:grid;gap:6px;padding:14px;border-radius:14px;border:1px solid var(--glass-border, transparent);background:var(--glass-surface-strong, rgba(255,255,255,.78));backdrop-filter:blur(10px)}
.period-name{color:#8a7040;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.staff-row>strong{color:var(--ink, #142033);font-size:28px;font-weight:720;font-variant-numeric:tabular-nums}
.staff-row>strong small{margin-left:4px;color:#6d7c90;font-size:13px;font-weight:500}
.teacher-names{overflow:hidden;color:#5c6b80;font-size:13px;text-overflow:ellipsis;white-space:nowrap}
.trend-empty{display:grid;min-height:180px;place-content:center;justify-items:center;gap:6px;color:#6d7c90;font-size:14px;text-align:center}
.trend-empty strong{color:var(--ink, #142033);font-size:16px}
.trend-loading,.focus-loading{display:grid;gap:10px}
.trend-loading{grid-template-columns:repeat(7,1fr);height:150px;align-items:end}
.trend-loading span,.focus-loading span{display:block;border-radius:8px;background:#f3eee4}
.trend-loading span{height:60%}
.trend-loading span:nth-child(2n){height:85%}
.focus-loading span{height:48px}
.inline-error{margin-top:8px;color:#9b3d48;font-size:14px}
a:focus-visible,button:focus-visible{outline:3px solid rgba(201,168,76,.55);outline-offset:3px}
@media(max-width:1100px){.workspace-grid{grid-template-columns:1fr}.side-column{grid-template-columns:1fr 1fr}}
@media(max-width:800px){.mast,.metric-strip,.side-column{grid-template-columns:1fr}.mast{align-items:start}.content-heading,.attendance-summary,.feature-foot,.feature-top{align-items:flex-start;flex-direction:column}.attendance-number{flex-direction:column;gap:4px}}
@media(prefers-reduced-motion:reduce){a.metric{transition:none}}
:host-context(html[data-theme='dark']) .mast-copy h1,:host-context(html[data-theme='dark']) .content-heading h2{color:var(--ink, #f4f7fc)}
:host-context(html[data-theme='dark']) .lede,:host-context(html[data-theme='dark']) .updated-indicator{color:var(--muted, #c6d2e3)}
:host-context(html[data-theme='dark']) .mast .eyebrow,:host-context(html[data-theme='dark']) .content-heading .section-kicker{color:#c9b27a}
:host-context(html[data-theme='dark']) .feature-top h3,:host-context(html[data-theme='dark']) .focus-heading h3,:host-context(html[data-theme='dark']) .shortcut-card h3,:host-context(html[data-theme='dark']) .metric>strong,:host-context(html[data-theme='dark']) .focus-text strong,:host-context(html[data-theme='dark']) .focus-item>b,:host-context(html[data-theme='dark']) .staff-row>strong,:host-context(html[data-theme='dark']) .school-plate strong{color:var(--ink, #f4efe4)}
:host-context(html[data-theme='dark']) .feature-top p,:host-context(html[data-theme='dark']) .focus-intro,:host-context(html[data-theme='dark']) .metric>small,:host-context(html[data-theme='dark']) .focus-text small,:host-context(html[data-theme='dark']) .teacher-names,:host-context(html[data-theme='dark']) .shortcut-list a{color:var(--muted, #c4bba8)}
:host-context(html[data-theme='dark']) .metric,:host-context(html[data-theme='dark']) .attendance-feature,:host-context(html[data-theme='dark']) .staff-feature,:host-context(html[data-theme='dark']) .focus-card,:host-context(html[data-theme='dark']) .shortcut-card,:host-context(html[data-theme='dark']) .school-plate{background:var(--glass-surface);border-color:var(--glass-border);box-shadow:var(--glass-shadow)}
:host-context(html[data-theme='dark']) .staff-row{background:var(--glass-surface-strong);border-color:var(--glass-border)}
:host-context(html[data-theme='dark']) .focus-item,:host-context(html[data-theme='dark']) .shortcut-list a,:host-context(html[data-theme='dark']) .feature-foot,:host-context(html[data-theme='dark']) .focus-foot{border-color:var(--glass-line)}
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

  peakDay(): { date: string; pct: number } | null {
    const rows = this.attendanceTrend();
    if (!rows.length) return null;
    return rows.reduce((best, row) => row.pct > best.pct ? row : best);
  }

  teacherNames(period: any): string {
    const teachers = (period.freeTeachers || []).map((teacher: any) => teacher.name);
    if (teachers.length <= 2) return teachers.join(', ');
    return `${teachers.slice(0, 2).join(', ')} +${teachers.length - 2}`;
  }
}
