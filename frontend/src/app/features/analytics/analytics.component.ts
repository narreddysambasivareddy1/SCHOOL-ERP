import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { LocaleService } from '../../core/services/locale.service';

interface ReportCard { icon: string; title: string; desc: string; value: string | null; sub: string; live: boolean; }

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">INSIGHTS & GOVERNANCE</div>
      <h1>Analytics & Reports</h1>
    </div>

    <!-- KPI strip -->
    <div class="kpi-strip">
      @for (k of kpis(); track k.label) {
        <div class="kpi-card" [class.loading]="loading()">
          <div class="kpi-icon" [style.background]="k.iconBg"><i [class]="k.icon"></i></div>
          <div>
            <div class="kpi-label">{{ k.label }}</div>
            <div class="kpi-value">{{ loading() ? '—' : k.value }}</div>
          </div>
        </div>
      }
    </div>

    @if (error()) {
      <div class="alert-error">{{ error() }}</div>
    }

    <!-- Report cards -->
    <div class="section-title">Available reports</div>
    <div class="reports-grid">
      @for (r of reports; track r.title) {
        <div class="report-card">
          <div class="report-top">
            <span class="report-icon"><i [class]="r.icon"></i></span>
            @if (r.live) { <span class="live-badge">Live</span> }
          </div>
          <div class="report-title">{{ r.title }}</div>
          <div class="report-desc">{{ r.desc }}</div>
          @if (r.value) {
            <div class="report-value">{{ r.value }}</div>
            <div class="report-sub">{{ r.sub }}</div>
          } @else {
            <div class="report-sub">{{ r.sub }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    h1 { margin: 4px 0; font-size: 22px; font-weight: 800; color: var(--navy); }
    .kpi-strip { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; margin-bottom: 28px; }
    .kpi-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 18px 20px; display: flex; gap: 14px; align-items: center; box-shadow: var(--shadow); }
    .kpi-card.loading { opacity: 0.6; }
    .kpi-icon { width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; font-size: 20px; flex-shrink: 0; }
    .kpi-label { font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .kpi-value { font-size: 26px; font-weight: 800; color: var(--navy); letter-spacing: -0.5px; margin-top: 2px; }
    .alert-error { background: #fff0f0; border: 1px solid #f5c6c6; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #c0392b; margin-bottom: 20px; }
    .section-title { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; }
    .reports-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }
    .report-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 6px; }
    .report-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .report-icon { font-size: 16px; color: var(--primary); }
    .live-badge { font-size: 10px; font-weight: 800; background: #e5f8f1; color: #087d68; padding: 2px 8px; border-radius: 20px; }
    .report-title { font-size: 14px; font-weight: 700; color: var(--navy); }
    .report-desc { font-size: 12px; color: var(--muted); line-height: 1.5; }
    .report-value { font-size: 22px; font-weight: 800; color: var(--navy); margin-top: 4px; }
    .report-sub { font-size: 11px; color: var(--teal); }
    @media (max-width: 1024px) { .kpi-strip { grid-template-columns: repeat(2,1fr); } .reports-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 600px) { .kpi-strip { grid-template-columns: 1fr; } .reports-grid { grid-template-columns: 1fr; } }
  `]
})
export class AnalyticsComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);

  kpis = signal([
    { label: 'Total students', value: '—', icon: 'pi pi-users', iconBg: '#eaf3ff' },
    { label: 'Active staff', value: '—', icon: 'pi pi-id-card', iconBg: '#e3f8f3' },
    { label: 'Fee collected (month)', value: '—', icon: 'pi pi-wallet', iconBg: '#f0ebff' },
  ]);

  reports: ReportCard[] = [
    { icon: 'pi pi-users', title: 'Student strength', desc: 'By academic year, grade, section and enrolment status.', value: null, sub: 'Loading from API…', live: true },
    { icon: 'pi pi-check-square', title: 'Attendance trends', desc: 'Daily, monthly and class-level attendance with exceptions.', value: null, sub: 'Requires attendance data', live: true },
    { icon: 'pi pi-wallet', title: 'Fee collection & dues', desc: 'Collections, ageing, payment status and reconciliation.', value: null, sub: 'Loading from API…', live: true },
    { icon: 'pi pi-id-card', title: 'Staff & leave', desc: 'Headcount, staffing changes, leave and attendance summaries.', value: null, sub: 'Phase 6 — leave workflows pending', live: false },
    { icon: 'pi pi-map', title: 'Route utilisation', desc: 'Vehicle assignments, capacity, trips and transport fees.', value: null, sub: 'Requires GPS device integration', live: false },
    { icon: 'pi pi-cog', title: 'Integration health', desc: 'Payment callbacks, device sync, notification delivery and job failures.', value: null, sub: 'Phase 7 — monitoring dashboard', live: false },
  ];

  constructor(private api: ApiService, public ctx: SchoolContextService, private locale: LocaleService) {}

  ngOnInit() {
    if (!this.ctx.schoolId || !this.ctx.academicYearId) { this.loading.set(false); return; }
    this.api.getDashboardStats(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
      next: (d) => {
        const studentVal = d.studentCount.toLocaleString();
        const staffVal = d.staffCount.toLocaleString();
        const feeVal = this.locale.formatMoney(d.feeCollectedThisMonth);

        this.kpis.set([
          { label: 'Total students', value: studentVal, icon: 'pi pi-users', iconBg: '#eaf3ff' },
          { label: 'Active staff', value: staffVal, icon: 'pi pi-id-card', iconBg: '#e3f8f3' },
          { label: 'Fee collected (month)', value: feeVal, icon: 'pi pi-wallet', iconBg: '#f0ebff' },
        ]);

        this.reports[0].value = studentVal;
        this.reports[0].sub = 'Active enrolments this year';
        this.reports[1].sub = d.attendanceMarked ? `${d.attendancePct}% present today` : 'Not yet marked today';
        this.reports[2].value = feeVal;
        this.reports[2].sub = 'Collected this month';

        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Failed to load analytics data.');
        this.loading.set(false);
      }
    });
  }
}
