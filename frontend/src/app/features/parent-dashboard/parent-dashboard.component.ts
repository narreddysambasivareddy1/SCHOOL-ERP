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
    <section class="welcome">
      <div>
        <div class="eyebrow">FAMILY PORTAL <span>·</span> {{ todayLabel }}</div>
        <h1>Welcome, {{ auth.user()?.firstName }}</h1>
        <p>Stay connected to your child's school day and progress.</p>
      </div>
      @if (children().length) {
        <a routerLink="/diary" class="primary-action"><i class="pi pi-book"></i> Today's class diary</a>
      }
    </section>

    @if (error()) {
      <div class="alert-banner" role="alert"><i class="pi pi-exclamation-circle"></i> {{ error() }}</div>
    }

    @if (!loading() && children().length === 0) {
      <div class="empty-card">
        <span class="empty-icon"><i class="pi pi-users"></i></span>
        <h2>No linked children yet</h2>
        <p>Ask the school office to link your guardian account to a student record. Once linked, their attendance, homework and fee updates will appear here.</p>
      </div>
    }

    @if (children().length) {
      <section class="children-section">
        <div class="section-heading"><div><span class="eyebrow">YOUR FAMILY</span><h2>Choose a student</h2></div><span class="child-count">{{ children().length }} linked</span></div>
        <div class="child-switcher">
        @for (c of children(); track c.studentId) {
          <button type="button" class="child-chip" [class.active]="c.studentId === activeId()" (click)="select(c)">
            <span class="av">{{ c.firstName[0] }}{{ c.lastName[0] }}</span>
            <span>
              <strong>{{ c.firstName }} {{ c.lastName }}</strong>
              <small>{{ c.className }} {{ c.sectionName }} · {{ c.relationship || 'Guardian' }}</small>
            </span>
            @if (c.studentId === activeId()) { <i class="pi pi-check-circle selected-mark" aria-label="Selected"></i> }
          </button>
        }
        </div>
      </section>

      <section class="stats-row" aria-label="Selected student's overview">
        <article class="stat-card">
          <span class="stat-icon blue"><i class="pi pi-check-circle"></i></span>
          <span><small>Attendance</small><strong>{{ loadingAtt() ? '—' : attendancePct() + '%' }}</strong><em>Recorded in the last 30 days</em></span>
          <a routerLink="/attendance" aria-label="View attendance"><i class="pi pi-arrow-up-right"></i></a>
        </article>
        <article class="stat-card">
          <span class="stat-icon violet"><i class="pi pi-wallet"></i></span>
          <span><small>Fees on record</small><strong>{{ loadingFees() ? '—' : (feeTotal() | money) }}</strong><em>{{ payments().length }} payment(s) recorded</em></span>
          <a routerLink="/fees" aria-label="View fees"><i class="pi pi-arrow-up-right"></i></a>
        </article>
        <article class="stat-card">
          <span class="stat-icon teal"><i class="pi pi-book"></i></span>
          <span><small>Homework</small><strong>{{ loadingHw() ? '—' : homework().length }}</strong><em>Published assignments</em></span>
          <a routerLink="/homework" aria-label="View homework"><i class="pi pi-arrow-up-right"></i></a>
        </article>
      </section>

      <nav class="shortcuts" aria-label="Family shortcuts">
        <a routerLink="/lesson-plans"><i class="pi pi-calendar"></i><span>Week topics</span><i class="pi pi-arrow-up-right"></i></a>
        <a routerLink="/diary"><i class="pi pi-book"></i><span>Class diary</span><i class="pi pi-arrow-up-right"></i></a>
        <a routerLink="/timetable"><i class="pi pi-table"></i><span>Timetable</span><i class="pi pi-arrow-up-right"></i></a>
        <a routerLink="/announcements"><i class="pi pi-megaphone"></i><span>School notices</span><i class="pi pi-arrow-up-right"></i></a>
      </nav>

      <section class="content-grid">
        <article class="panel">
          <div class="panel-heading"><div><span class="eyebrow">PAYMENT HISTORY</span><h2>Recent payments</h2><p>Fee receipts for the selected student.</p></div><a routerLink="/fees">View fees <i class="pi pi-arrow-up-right"></i></a></div>
          @if (loadingFees()) {
            <div class="empty-row">Loading payment history…</div>
          } @else if (!payments().length) {
            <div class="empty-row"><i class="pi pi-wallet"></i><strong>No payments yet</strong><span>Fee receipts will appear here when recorded.</span></div>
          } @else {
            @for (p of payments().slice(0,5); track p.id) {
              <div class="list-row"><span class="list-icon receipt"><i class="pi pi-receipt"></i></span><span class="list-copy"><strong>{{ p.receiptNumber }}</strong><small>{{ p.paidAt | date:'mediumDate' }}</small></span><strong class="list-amount">{{ p.amount | money }}</strong></div>
            }
          }
        </article>
        <article class="panel">
          <div class="panel-heading"><div><span class="eyebrow">LEARNING AT HOME</span><h2>Homework</h2><p>Recent work shared by teachers.</p></div><a routerLink="/homework">View all <i class="pi pi-arrow-up-right"></i></a></div>
          @if (loadingHw()) {
            <div class="empty-row">Loading assignments…</div>
          } @else if (!homework().length) {
            <div class="empty-row"><i class="pi pi-check-circle"></i><strong>All caught up</strong><span>No homework has been assigned yet.</span></div>
          } @else {
            @for (h of homework().slice(0,5); track h.id) {
              <div class="list-row"><span class="list-icon"><i class="pi pi-file-edit"></i></span><span class="list-copy"><strong>{{ h.title }}</strong><small>Due {{ h.dueDate | date:'mediumDate' }}</small></span><i class="pi pi-chevron-right row-arrow"></i></div>
            }
          }
        </article>
      </section>
    }
  `,
  styles: [`
    .welcome { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 20px; padding: 28px 32px; border: 1px solid #dce8f6; border-radius: 18px; background: linear-gradient(115deg,#fff 20%,#f1f7ff 100%); }
    .welcome h1 { margin: 5px 0 6px; color: var(--navy); font-size: clamp(24px,3vw,34px); letter-spacing: -.04em; }
    .welcome p { margin: 0; color: var(--muted); } .welcome .eyebrow span { padding: 0 5px; color: #aab8c8; }
    .primary-action { display: inline-flex; align-items: center; gap: 9px; padding: 12px 16px; border-radius: 10px; background: var(--primary); color: white; text-decoration: none; font-weight: 700; box-shadow: 0 6px 16px rgba(36,99,235,.2); white-space: nowrap; }
    .alert-banner { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 11px 14px; border: 1px solid #f5c97a; border-radius: 10px; background: #fff4e5; color: #7a4f00; font-size: 12px; }
    .empty-card { display: grid; justify-items: center; padding: 54px 24px; border: 1px dashed #cdd8e6; border-radius: 16px; background: white; color: var(--muted); text-align: center; }
    .empty-icon { display: grid; width: 54px; height: 54px; place-items: center; border-radius: 16px; background: #eaf3ff; color: var(--primary); font-size: 22px; }
    .empty-card h2 { margin: 14px 0 5px; color: var(--navy); font-size: 18px; } .empty-card p { max-width: 430px; margin: 0; font-size: 12px; line-height: 1.6; }
    .children-section { margin-bottom: 16px; padding: 16px 18px; border: 1px solid var(--line); border-radius: 14px; background: white; }
    .section-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .section-heading h2 { margin: 2px 0 0; color: var(--navy); font-size: 15px; }
    .child-count { padding: 4px 9px; border-radius: 20px; background: #f3f6fa; color: var(--muted); font-size: 10px; font-weight: 700; }
    .child-switcher { display: flex; gap: 9px; flex-wrap: wrap; }
    .child-chip { display: flex; flex: 1 1 220px; align-items: center; gap: 10px; min-width: 0; padding: 10px 12px; border: 1px solid var(--line); border-radius: 11px; background: #fcfdff; cursor: pointer; text-align: left; transition: border-color .18s ease, box-shadow .18s ease, background .18s ease; }
    .child-chip.active { border-color: #8eb1ef; background: #f5f9ff; box-shadow: 0 0 0 2px rgba(36,99,235,.08); }
    .child-chip:hover { border-color: #b8cbed; } .child-chip:focus-visible { outline: 3px solid rgba(36,99,235,.3); outline-offset: 2px; }
    .av { display: grid; flex: 0 0 auto; width: 38px; height: 38px; place-items: center; border-radius: 11px; background: #fff4db; color: #9a6900; font-size: 11px; font-weight: 800; }
    .child-chip > span:nth-child(2) { display: grid; min-width: 0; flex: 1; gap: 2px; }
    .child-chip strong { overflow: hidden; color: var(--navy); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
    .child-chip small { overflow: hidden; color: var(--muted); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
    .selected-mark { color: var(--primary); font-size: 15px; }
    .stats-row { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 13px; margin-bottom: 13px; }
    .stat-card { display: flex; align-items: center; gap: 11px; min-width: 0; padding: 16px; border: 1px solid var(--line); border-radius: 13px; background: white; box-shadow: var(--shadow-sm); }
    .stat-card > span:nth-child(2) { display: grid; min-width: 0; flex: 1; gap: 2px; }
    .stat-card small { color: var(--muted); font-size: 10px; font-weight: 750; letter-spacing: .05em; text-transform: uppercase; }
    .stat-card strong { overflow: hidden; color: var(--navy); font-size: 21px; text-overflow: ellipsis; white-space: nowrap; }
    .stat-card em { overflow: hidden; color: var(--muted); font-size: 10px; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }
    .stat-icon { display: grid; flex: 0 0 auto; width: 38px; height: 38px; place-items: center; border-radius: 11px; }
    .blue { background: #eaf3ff; color: #1c5cb7; } .violet { background: #f0ebff; color: #6b3fa0; } .teal { background: #e3f8f3; color: #087d68; }
    .stat-card > a { display: grid; width: 28px; height: 28px; flex: 0 0 auto; place-items: center; border-radius: 8px; background: #f5f8fc; color: var(--muted); text-decoration: none; }
    .shortcuts { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 9px; margin-bottom: 18px; }
    .shortcuts a { display: flex; align-items: center; gap: 9px; padding: 11px; border: 1px solid var(--line); border-radius: 10px; background: white; color: var(--navy); font-size: 10px; font-weight: 700; text-decoration: none; }
    .shortcuts a > i:first-child { color: var(--primary); } .shortcuts a > span { flex: 1; } .shortcuts a > i:last-child { color: #9aa8b8; font-size: 9px; }
    .content-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 15px; align-items: start; }
    .panel { min-width: 0; overflow: hidden; border: 1px solid var(--line); border-radius: 14px; background: white; box-shadow: var(--shadow-sm); }
    .panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 17px 18px; border-bottom: 1px solid var(--line); }
    .panel-heading h2 { margin: 2px 0; color: var(--navy); font-size: 15px; } .panel-heading p { margin: 0; color: var(--muted); font-size: 10px; }
    .panel-heading > a { color: var(--primary); font-size: 10px; font-weight: 700; text-decoration: none; white-space: nowrap; } .panel-heading > a i { margin-left: 2px; font-size: 9px; }
    .list-row { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #eff2f6; } .list-row:last-child { border-bottom: 0; }
    .list-icon { display: grid; flex: 0 0 auto; width: 33px; height: 33px; place-items: center; border-radius: 9px; background: #eaf3ff; color: #1c5cb7; } .list-icon.receipt { background: #f0ebff; color: #6b3fa0; }
    .list-copy { display: grid; min-width: 0; flex: 1; gap: 2px; } .list-copy strong { overflow: hidden; color: var(--navy); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; } .list-copy small { color: var(--muted); font-size: 10px; }
    .list-amount { color: var(--navy); font-size: 11px; white-space: nowrap; } .row-arrow { color: #a6b2c0; font-size: 9px; }
    .empty-row { display: grid; justify-items: center; gap: 6px; padding: 30px 18px; color: var(--muted); font-size: 10px; text-align: center; }
    .empty-row i { color: var(--teal); font-size: 19px; } .empty-row strong { color: var(--navy); font-size: 12px; }
    @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .stats-row { grid-template-columns: 1fr; } }
    @media (max-width: 650px) { .welcome { align-items: flex-start; flex-direction: column; padding: 22px; } .shortcuts { grid-template-columns: repeat(2,minmax(0,1fr)); } .child-chip { flex-basis: 100%; } .panel-heading { align-items: flex-start; } }
    @media (prefers-reduced-motion: reduce) { .child-chip { transition: none; } }
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
  todayLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

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
