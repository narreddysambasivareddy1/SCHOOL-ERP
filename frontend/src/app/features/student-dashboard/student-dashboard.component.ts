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
    <div class="page-header">
      <div class="eyebrow">STUDENT</div>
      <h1>Good {{ greeting }}, {{ auth.user()?.firstName }}</h1>
      <p class="sub">Your timetable, homework, attendance, published results and school notices — only your records.</p>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon" style="background:#eaf3ff;color:#1c5cb7"><i class="pi pi-check-square"></i></div>
        <div>
          <div class="stat-label">Attendance</div>
          <div class="stat-value">{{ loadingAtt() ? '—' : attendancePct() + '%' }}</div>
          <div class="stat-sub">Recorded sessions</div>
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
      <div class="stat-card">
        <div class="stat-icon" style="background:#f0ebff;color:#6b3fa0"><i class="pi pi-wallet"></i></div>
        <div>
          <div class="stat-label">Fee payments</div>
          <div class="stat-value">{{ loadingFees() ? '—' : payments().length }}</div>
          <div class="stat-sub">Receipts on file</div>
        </div>
      </div>
    </div>

    <div class="mod-section">Learning</div>
    <div class="mod-grid">
      <a class="mod-card" routerLink="/timetable"><i class="pi pi-table"></i><strong>Timetable</strong><small>Your class periods and subjects</small></a>
      <a class="mod-card" routerLink="/homework"><i class="pi pi-book"></i><strong>Homework</strong><small>Due work and teacher instructions</small></a>
      <a class="mod-card" routerLink="/attendance"><i class="pi pi-check-square"></i><strong>Attendance</strong><small>Your attendance history</small></a>
      <a class="mod-card" routerLink="/examinations"><i class="pi pi-file"></i><strong>Results</strong><small>Published exams and marksheets only</small></a>
      <a class="mod-card" routerLink="/academics"><i class="pi pi-bookmark"></i><strong>Subjects & languages</strong><small>Assigned subjects this year</small></a>
    </div>
    <div class="mod-section">School</div>
    <div class="mod-grid">
      <a class="mod-card" routerLink="/announcements"><i class="pi pi-megaphone"></i><strong>Announcements</strong><small>Circulars and school notices</small></a>
      <a class="mod-card" routerLink="/calendar"><i class="pi pi-calendar"></i><strong>Calendar</strong><small>Events and activities</small></a>
      <a class="mod-card" routerLink="/fees"><i class="pi pi-wallet"></i><strong>Fees</strong><small>Your payment history and receipts</small></a>
      <a class="mod-card" routerLink="/transport"><i class="pi pi-map"></i><strong>Transport</strong><small>Route and trip information</small></a>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-header"><div class="card-title">Recent payments</div><a routerLink="/fees">View fees</a></div>
        @if (loadingFees()) { <div class="empty-row">Loading…</div> }
        @else if (!payments().length) { <div class="empty-row">No payment records found.</div> }
        @else {
          @for (p of payments().slice(0,4); track p.id) {
            <div class="list-row">
              <div><div class="list-title">{{ p.receiptNumber }}</div><div class="list-sub">{{ p.paidAt | date:'mediumDate' }}</div></div>
              <div class="list-amount">{{ p.amount | money }}</div>
            </div>
          }
        }
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Homework</div><a routerLink="/homework">All</a></div>
        @if (loadingHw()) { <div class="empty-row">Loading…</div> }
        @else if (!homework().length) { <div class="empty-row">No homework assigned yet.</div> }
        @else {
          @for (h of homework().slice(0,4); track h.id) {
            <div class="list-row">
              <div><div class="list-title">{{ h.title }}</div><div class="list-sub">Due {{ h.dueDate | date:'mediumDate' }}</div></div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .sub { margin: 0; color: var(--muted); font-size: 13px; }
    .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
    .stat-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 18px; display: flex; gap: 14px; box-shadow: var(--shadow); }
    .stat-icon { width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; }
    .stat-label { font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: 800; color: var(--navy); }
    .stat-sub { font-size: 11px; color: var(--teal); }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .card { background: white; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--line); }
    .card-title { font-size: 13px; font-weight: 700; color: var(--navy); }
    .card-header a { font-size: 12px; color: var(--primary); text-decoration: none; }
    .list-row { display: flex; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid var(--line); }
    .list-title { font-size: 13px; font-weight: 600; color: var(--navy); }
    .list-sub { font-size: 11px; color: var(--muted); }
    .list-amount { font-size: 13px; font-weight: 700; }
    .empty-row { padding: 24px; font-size: 12px; color: var(--muted); text-align: center; }
    @media (max-width: 900px) { .stats-row, .two-col { grid-template-columns: 1fr; } }
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
