import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, MoneyPipe],
  template: `
    <div class="page-header">
      <div class="eyebrow">CONFIDENTIAL · PAYROLL</div>
      <h1>Payroll & Payslips</h1>
      <p class="text-muted">Demo PF (12% of PF wage cap ₹15,000), ESI (0.75% if gross ≤ ₹21,000), professional tax and illustrative TDS. Confirm with the school consultant before live use.</p>
    </div>
    @if (error()) { <div class="alert">{{ error() }}</div> }
    @if (notice()) { <div class="ok">{{ notice() }}</div> }

    <div class="toolbar">
      <button type="button" (click)="createCurrent()" [disabled]="busy()">Run current month (draft)</button>
    </div>

    @for (r of runs(); track r.id) {
      <article class="card">
        <header>
          <div>
            <strong>{{ r.periodLabel }}</strong>
            <span class="pill" [class.done]="r.status === 'Finalized'">{{ r.status }}</span>
          </div>
          @if (r.status !== 'Finalized') {
            <button type="button" (click)="finalize(r.id)">Finalize</button>
          }
        </header>
        <div class="nums">
          <span>{{ r.employeeCount }} staff</span>
          <span>Gross {{ r.grossTotal | money }}</span>
          <span>PF {{ r.pfTotal | money }}</span>
          <span>ESI {{ r.esiTotal | money }}</span>
          <span>TDS {{ r.tdsTotal | money }}</span>
          <span>Net {{ r.netTotal | money }}</span>
        </div>
        <button type="button" class="ghost" (click)="open(r.id)">View payslips</button>
      </article>
    }

    @if (slips().length) {
      <table>
        <thead><tr><th>Employee</th><th>Gross</th><th>PF</th><th>ESI</th><th>PT</th><th>TDS</th><th>Net</th></tr></thead>
        <tbody>
          @for (p of slips(); track p.id) {
            <tr>
              <td>{{ p.employee }} <small>{{ p.code }}</small></td>
              <td>{{ p.gross | money }}</td>
              <td>{{ p.pf | money }}</td>
              <td>{{ p.esi | money }}</td>
              <td>{{ p.professionalTax | money }}</td>
              <td>{{ p.tds | money }}</td>
              <td>{{ p.net | money }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [`
    h1 { margin: 4px 0; color: var(--navy); font-size: 28px; letter-spacing: -0.03em; }
    .toolbar { display: flex; align-items: center; margin: 0 0 16px; }
    .card { background: white; border: 1px solid var(--line); border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: var(--shadow-sm); }
    header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .nums { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px; margin: 16px 0; color: var(--muted); font-size: 14px; font-variant-numeric: tabular-nums; }
    .pill { margin-left: 8px; padding: 4px 8px; border-radius: 999px; background: var(--warn-soft); color: var(--warn); font-size: 12px; font-weight: 700; }
    .pill.done { background: var(--success-soft); color: var(--success); }
    button { height: 40px; padding: 0 14px; border: 0; border-radius: 10px; background: var(--primary); color: white; font-size: 14px; font-weight: 650; cursor: pointer; }
    .ghost { background: white; color: var(--navy); border: 1px solid var(--line); }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; font-size: 14px; }
    th, td { padding: 16px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
    @media (max-width: 900px) { .nums { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; }
    .ok { background: #e5f8f1; color: #087d68; padding: 10px; border-radius: 8px; margin-bottom: 8px; }
  `]
})
export class PayrollComponent implements OnInit {
  runs = signal<any[]>([]);
  slips = signal<any[]>([]);
  error = signal<string | null>(null);
  notice = signal<string | null>(null);
  busy = signal(false);

  constructor(private api: ApiService, private ctx: SchoolContextService) {}

  ngOnInit() { this.reload(); }

  reload() {
    if (!this.ctx.schoolId) return;
    this.api.getPayrollRuns(this.ctx.schoolId).subscribe({
      next: rows => this.runs.set(rows),
      error: () => this.error.set('Could not load payroll.')
    });
  }

  createCurrent() {
    const now = new Date();
    this.busy.set(true);
    this.api.createPayrollRun(this.ctx.schoolId, now.getFullYear(), now.getMonth() + 1).subscribe({
      next: () => { this.notice.set('Draft run created.'); this.busy.set(false); this.reload(); },
      error: (e) => { this.error.set(e?.error?.error || 'Could not create run (period may already exist).'); this.busy.set(false); }
    });
  }

  finalize(id: string) {
    this.api.finalizePayroll(this.ctx.schoolId, id).subscribe({
      next: () => { this.notice.set('Payroll finalized.'); this.reload(); },
      error: () => this.error.set('Finalize failed.')
    });
  }

  open(id: string) {
    this.api.getPayslips(this.ctx.schoolId, id).subscribe({ next: rows => this.slips.set(rows) });
  }
}
