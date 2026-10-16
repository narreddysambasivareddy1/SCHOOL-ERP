import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { ApiService } from '../../core/services/api.service';
import { MoneyPipe } from '../../shared/money.pipe';

interface Child {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  className?: string;
  sectionName?: string;
  relationship?: string;
}

const CHILD_KEY = 'erp_active_child';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe],
  template: `
    <div class="page-header">
      <div class="eyebrow">FAMILY WORKSPACE</div>
      <h1>Hello, {{ auth.user()?.firstName }}</h1>
      <p class="sub">Follow attendance, homework and fees for your children.</p>
    </div>

    @if (error()) {
      <div class="alert-banner">{{ error() }}</div>
    }

    @if (!loading() && children().length === 0) {
      <div class="empty-card">
        <i class="pi pi-users"></i>
        <h2>No linked children yet</h2>
        <p>Ask the school office to link your guardian account to a student record.</p>
      </div>
    }

    @if (children().length) {
      <div class="child-switcher">
        @for (c of children(); track c.studentId) {
          <button type="button" class="child-chip" [class.active]="c.studentId === activeId()" (click)="select(c)">
            <span class="av">{{ c.firstName[0] }}{{ c.lastName[0] }}</span>
            <span>
              <strong>{{ c.firstName }} {{ c.lastName }}</strong>
              <small>{{ c.className }} {{ c.sectionName }} · {{ c.relationship || 'Guardian' }}</small>
            </span>
          </button>
        }
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon" style="background:#eaf3ff;color:#1c5cb7"><i class="pi pi-check-square"></i></div>
          <div>
            <div class="stat-label">Attendance</div>
            <div class="stat-value">{{ loadingAtt() ? '—' : attendancePct() + '%' }}</div>
            <div class="stat-sub">Last 30 days</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0ebff;color:#6b3fa0"><i class="pi pi-wallet"></i></div>
          <div>
            <div class="stat-label">Fees on record</div>
            <div class="stat-value">{{ loadingFees() ? '—' : (feeTotal() | money) }}</div>
            <div class="stat-sub">{{ payments().length }} payment(s)</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#e3f8f3;color:#087d68"><i class="pi pi-book"></i></div>
          <div>
            <div class="stat-label">Homework</div>
            <div class="stat-value">{{ loadingHw() ? '—' : homework().length }}</div>
            <div class="stat-sub">Published assignments</div>
          </div>
        </div>
      </div>

      <div class="two-col">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Recent payments</div>
            <a routerLink="/fees" class="card-link">View fees</a>
          </div>
          @if (loadingFees()) {
            <div class="empty-row">Loading…</div>
          } @else if (!payments().length) {
            <div class="empty-row">No payments yet for this child.</div>
          } @else {
            @for (p of payments().slice(0,5); track p.id) {
              <div class="list-row">
                <div class="list-body">
                  <div class="list-title">{{ p.receiptNumber }}</div>
                  <div class="list-sub">{{ p.paidAt | date:'mediumDate' }}</div>
                </div>
                <div class="list-amount">{{ p.amount | money }}</div>
              </div>
            }
          }
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title">Homework</div>
            <a routerLink="/academics" class="card-link">Academics</a>
          </div>
          @if (loadingHw()) {
            <div class="empty-row">Loading…</div>
          } @else if (!homework().length) {
            <div class="empty-row">No homework assigned.</div>
          } @else {
            @for (h of homework().slice(0,5); track h.id) {
              <div class="list-row">
                <div class="list-body">
                  <div class="list-title">{{ h.title }}</div>
                  <div class="list-sub">Due {{ h.dueDate | date:'mediumDate' }}</div>
                </div>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .sub { margin: 0; color: var(--muted); font-size: 13px; }
    .alert-banner { background: #fff4e5; border: 1px solid #f5c97a; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #7a4f00; margin-bottom: 16px; }
    .empty-card { background: white; border: 1px dashed var(--line); border-radius: 16px; padding: 48px 24px; text-align: center; color: var(--muted); }
    .empty-card i { font-size: 28px; color: var(--primary); }
    .empty-card h2 { color: var(--navy); font-size: 18px; margin: 12px 0 8px; }
    .child-switcher { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
    .child-chip { display: flex; align-items: center; gap: 10px; border: 1px solid var(--line); background: white; border-radius: 12px; padding: 10px 14px; cursor: pointer; text-align: left; }
    .child-chip.active { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(36,99,235,0.12); }
    .av { width: 36px; height: 36px; border-radius: 10px; background: #fff4db; color: #9a6900; display: grid; place-items: center; font-size: 11px; font-weight: 800; }
    .child-chip strong { display: block; font-size: 13px; color: var(--navy); }
    .child-chip small { color: var(--muted); font-size: 11px; }
    .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; display: flex; gap: 14px; box-shadow: var(--shadow); }
    .stat-icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-size: 16px; }
    .stat-label { font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: 800; color: var(--navy); }
    .stat-sub { font-size: 11px; color: var(--teal); }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { background: white; border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--line); }
    .card-title { font-size: 13px; font-weight: 700; color: var(--navy); }
    .card-link { font-size: 12px; color: var(--primary); text-decoration: none; }
    .list-row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--line); }
    .list-title { font-size: 13px; font-weight: 600; color: var(--navy); }
    .list-sub { font-size: 11px; color: var(--muted); }
    .list-amount { font-size: 13px; font-weight: 700; color: var(--navy); }
    .empty-row { padding: 24px 18px; font-size: 12px; color: var(--muted); text-align: center; }
    @media (max-width: 900px) { .stats-row, .two-col { grid-template-columns: 1fr; } }
  `]
})
export class ParentDashboardComponent implements OnInit {
  children = signal<Child[]>([]);
  activeId = signal<string | null>(null);
  payments = signal<any[]>([]);
  homework = signal<any[]>([]);
  attendancePct = signal(0);
  feeTotal = signal(0);
  loading = signal(true);
  loadingFees = signal(false);
  loadingHw = signal(false);
  loadingAtt = signal(false);
  error = signal<string | null>(null);

  constructor(public auth: AuthService, public ctx: SchoolContextService, private api: ApiService) {}

  ngOnInit() {
    this.api.getParentChildren().subscribe({
      next: (list) => {
        this.children.set(list);
        this.loading.set(false);
        const saved = sessionStorage.getItem(CHILD_KEY);
        const pick = list.find((c: Child) => c.studentId === saved) ?? list[0];
        if (pick) this.select(pick);
      },
      error: () => {
        this.error.set('Could not load linked children.');
        this.loading.set(false);
      }
    });
  }

  select(child: Child) {
    this.activeId.set(child.studentId);
    sessionStorage.setItem(CHILD_KEY, child.studentId);
    this.loadChild(child.studentId);
  }

  private loadChild(studentId: string) {
    if (!this.ctx.schoolId) return;
    this.loadingFees.set(true);
    this.loadingHw.set(true);
    this.loadingAtt.set(true);

    this.api.getStudentPayments(this.ctx.schoolId, studentId).subscribe({
      next: p => {
        this.payments.set(p);
        this.feeTotal.set(p.reduce((sum: number, x: any) => sum + Number(x.amount ?? 0), 0));
        this.loadingFees.set(false);
      },
      error: () => this.loadingFees.set(false)
    });

    this.api.getHomework(this.ctx.schoolId).subscribe({
      next: h => { this.homework.set(h); this.loadingHw.set(false); },
      error: () => this.loadingHw.set(false)
    });

    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    this.api.getStudentAttendance(this.ctx.schoolId, studentId, iso(from), iso(to)).subscribe({
      next: res => {
        this.attendancePct.set(Math.round(res?.percentage ?? 0));
        this.loadingAtt.set(false);
      },
      error: () => { this.attendancePct.set(0); this.loadingAtt.set(false); }
    });
  }
}
