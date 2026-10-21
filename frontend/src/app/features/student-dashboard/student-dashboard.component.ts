import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { ApiService } from '../../core/services/api.service';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe],
  template: `
    <section class="welcome">
      <div>
        <div class="eyebrow">STUDENT PORTAL <span>·</span> {{ todayLabel }}</div>
        <h1>Good {{ greeting }}, {{ auth.user()?.firstName }}</h1>
        <p>A clear view of your learning, attendance and school updates.</p>
      </div>
      <a routerLink="/homework" class="primary-action"><i class="pi pi-book"></i> View homework</a>
    </section>

    <section class="stats-row" aria-label="My school summary">
      <article class="stat-card">
        <span class="stat-icon blue"><i class="pi pi-check-circle"></i></span>
        <span><small>Attendance</small><strong>{{ loadingAtt() ? '—' : attendancePct() + '%' }}</strong><em>Recorded in the last 30 days</em></span>
        <a routerLink="/attendance" aria-label="View attendance"><i class="pi pi-arrow-up-right"></i></a>
      </article>
      <article class="stat-card">
        <span class="stat-icon teal"><i class="pi pi-book"></i></span>
        <span><small>Homework</small><strong>{{ loadingHw() ? '—' : homework().length }}</strong><em>Published assignments</em></span>
        <a routerLink="/homework" aria-label="View homework"><i class="pi pi-arrow-up-right"></i></a>
      </article>
      <article class="stat-card">
        <span class="stat-icon violet"><i class="pi pi-wallet"></i></span>
        <span><small>Fee receipts</small><strong>{{ loadingFees() ? '—' : payments().length }}</strong><em>Payments on record</em></span>
        <a routerLink="/fees" aria-label="View fees"><i class="pi pi-arrow-up-right"></i></a>
      </article>
    </section>

    <nav class="shortcuts" aria-label="Student shortcuts">
      <a routerLink="/timetable"><i class="pi pi-table"></i><span>My timetable</span><i class="pi pi-arrow-up-right"></i></a>
      <a routerLink="/lesson-plans"><i class="pi pi-calendar"></i><span>Week topics</span><i class="pi pi-arrow-up-right"></i></a>
      <a routerLink="/diary"><i class="pi pi-book"></i><span>Class diary</span><i class="pi pi-arrow-up-right"></i></a>
      <a routerLink="/examinations"><i class="pi pi-chart-bar"></i><span>My results</span><i class="pi pi-arrow-up-right"></i></a>
    </nav>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-heading"><div><span class="eyebrow">KEEP LEARNING</span><h2>Homework</h2><p>Your teachers' latest assignments.</p></div><a routerLink="/homework">View all <i class="pi pi-arrow-up-right"></i></a></div>
        @if (loadingHw()) { <div class="empty-row">Loading your assignments…</div> }
        @else if (!homework().length) { <div class="empty-row"><i class="pi pi-check-circle"></i><strong>You're all caught up</strong><span>No homework has been assigned yet.</span></div> }
        @else {
          @for (h of homework().slice(0,5); track h.id) {
            <div class="list-row"><span class="list-icon"><i class="pi pi-file-edit"></i></span><span class="list-copy"><strong>{{ h.title }}</strong><small>Due {{ h.dueDate | date:'mediumDate' }}</small></span><i class="pi pi-chevron-right row-arrow"></i></div>
          }
        }
      </article>
      <article class="panel">
        <div class="panel-heading"><div><span class="eyebrow">PAYMENT HISTORY</span><h2>Recent fees</h2><p>Receipts linked to your student account.</p></div><a routerLink="/fees">View fees <i class="pi pi-arrow-up-right"></i></a></div>
        @if (loadingFees()) { <div class="empty-row">Loading payment history…</div> }
        @else if (!payments().length) { <div class="empty-row"><i class="pi pi-wallet"></i><strong>No receipts yet</strong><span>Payment records will appear here.</span></div> }
        @else {
          @for (p of payments().slice(0,5); track p.id) {
            <div class="list-row"><span class="list-icon receipt"><i class="pi pi-receipt"></i></span><span class="list-copy"><strong>{{ p.receiptNumber }}</strong><small>{{ p.paidAt | date:'mediumDate' }}</small></span><strong class="list-amount">{{ p.amount | money }}</strong></div>
          }
        }
      </article>
    </section>
  `,
  styles: [`
    .welcome { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 20px; padding: 28px 32px; border: 1px solid #dce8f6; border-radius: 18px; background: linear-gradient(115deg,#fff 20%,#f1f7ff 100%); }
    .welcome h1 { margin: 5px 0 6px; color: var(--navy); font-size: clamp(24px,3vw,34px); letter-spacing: -.04em; }
    .welcome p { margin: 0; color: var(--muted); } .welcome .eyebrow span { padding: 0 5px; color: #aab8c8; }
    .primary-action { display: inline-flex; align-items: center; gap: 9px; padding: 12px 16px; border-radius: 10px; background: var(--primary); color: white; text-decoration: none; font-weight: 700; box-shadow: 0 6px 16px rgba(36,99,235,.2); white-space: nowrap; }
    .stats-row { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14px; margin-bottom: 14px; }
    .stat-card { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 17px; border: 1px solid var(--line); border-radius: 14px; background: white; box-shadow: var(--shadow-sm); }
    .stat-card > span:nth-child(2) { display: grid; min-width: 0; flex: 1; gap: 2px; }
    .stat-card small { color: var(--muted); font-size: 10px; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; }
    .stat-card strong { color: var(--navy); font-size: 24px; line-height: 1.2; }
    .stat-card em { overflow: hidden; color: var(--muted); font-size: 10px; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }
    .stat-icon { display: grid; flex: 0 0 auto; width: 40px; height: 40px; place-items: center; border-radius: 11px; }
    .blue { background: #eaf3ff; color: #1c5cb7; } .teal { background: #e3f8f3; color: #087d68; } .violet { background: #f0ebff; color: #6b3fa0; }
    .stat-card > a { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 8px; background: #f5f8fc; color: var(--muted); text-decoration: none; }
    .shortcuts { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; margin-bottom: 20px; }
    .shortcuts a { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 11px; background: white; color: var(--navy); font-size: 11px; font-weight: 700; text-decoration: none; transition: border-color .15s ease, background .15s ease; }
    .shortcuts a:hover { border-color: #b8cbed; background: #fbfdff; } .shortcuts a > i:first-child { color: var(--primary); } .shortcuts a > span { flex: 1; } .shortcuts a > i:last-child { color: #9aa8b8; font-size: 10px; }
    .content-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; align-items: start; }
    .panel { min-width: 0; overflow: hidden; border: 1px solid var(--line); border-radius: 15px; background: white; box-shadow: var(--shadow-sm); }
    .panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 18px 20px; border-bottom: 1px solid var(--line); }
    .panel-heading h2 { margin: 2px 0; color: var(--navy); font-size: 16px; } .panel-heading p { margin: 0; color: var(--muted); font-size: 11px; }
    .panel-heading > a { color: var(--primary); font-size: 11px; font-weight: 700; text-decoration: none; white-space: nowrap; }
    .panel-heading > a i { margin-left: 3px; font-size: 9px; }
    .list-row { display: flex; align-items: center; gap: 11px; padding: 13px 18px; border-bottom: 1px solid #eff2f6; }
    .list-row:last-child { border-bottom: 0; } .list-icon { display: grid; flex: 0 0 auto; width: 34px; height: 34px; place-items: center; border-radius: 10px; background: #eaf3ff; color: #1c5cb7; }
    .list-icon.receipt { background: #f0ebff; color: #6b3fa0; }
    .list-copy { display: grid; min-width: 0; flex: 1; gap: 2px; }
    .list-copy strong { overflow: hidden; color: var(--navy); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
    .list-copy small { color: var(--muted); font-size: 10px; } .list-amount { color: var(--navy); font-size: 12px; white-space: nowrap; }
    .row-arrow { color: #a6b2c0; font-size: 10px; }
    .empty-row { display: grid; justify-items: center; gap: 7px; padding: 32px 18px; color: var(--muted); font-size: 11px; text-align: center; }
    .empty-row i { color: var(--teal); font-size: 20px; } .empty-row strong { color: var(--navy); font-size: 13px; }
    @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } }
    @media (max-width: 700px) { .welcome { align-items: flex-start; flex-direction: column; padding: 22px; } .stats-row { grid-template-columns: 1fr; gap: 9px; } .shortcuts { grid-template-columns: repeat(2,minmax(0,1fr)); } .panel-heading { align-items: flex-start; } }
    @media (prefers-reduced-motion: reduce) { .shortcuts a { transition: none; } }
  `]
})
export class StudentDashboardComponent implements OnInit {
  payments = signal<any[]>([]);
  homework = signal<any[]>([]);
  attendancePct = signal(0);
  loadingFees = signal(true);
  loadingHw = signal(true);
  loadingAtt = signal(true);
  greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
  todayLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  constructor(public auth: AuthService, public ctx: SchoolContextService, private api: ApiService) {}

  ngOnInit() {
    const userId = this.auth.user()?.id;
    if (!this.ctx.schoolId || !userId) {
      this.loadingFees.set(false); this.loadingHw.set(false); this.loadingAtt.set(false);
      return;
    }

    this.api.getStudentPayments(this.ctx.schoolId, userId).subscribe({
      next: p => { this.payments.set(p); this.loadingFees.set(false); },
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
    this.api.getStudentAttendance(this.ctx.schoolId, userId, iso(from), iso(to)).subscribe({
      next: res => { this.attendancePct.set(Math.round(res?.percentage ?? 0)); this.loadingAtt.set(false); },
      error: () => this.loadingAtt.set(false)
    });
  }
}
