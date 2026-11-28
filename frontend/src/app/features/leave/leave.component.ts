import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">HRMS</div>
      <h1>Leave</h1>
      <p class="text-muted">Apply, approve and track staff leave. Payroll and salary remain restricted to HR roles.</p>
    </div>

    @if (error()) { <div class="alert">{{ error() }}</div> }

    <div class="card">
      <strong>Leave types</strong>
      @if (!types().length) {
        <p class="text-muted">No leave types configured for this school yet.</p>
      } @else {
        <ul>
          @for (t of types(); track t.id) {
            <li>{{ t.name }} · max {{ t.maxDaysPerYear }} days</li>
          }
        </ul>
      }
    </div>

    <form class="card" (ngSubmit)="apply()">
      <strong>Apply for leave</strong>
      <div class="row">
        @if (canApprove) {
          <select [(ngModel)]="employeeId" name="employee" required>
            <option value="">Staff member</option>
            @for (e of employees(); track e.id) {
              <option [value]="e.id">{{ e.firstName }} {{ e.lastName }}</option>
            }
          </select>
        }
        <select [(ngModel)]="leaveTypeId" name="type" required>
          <option value="">Leave type</option>
          @for (t of types(); track t.id) { <option [value]="t.id">{{ t.name }}</option> }
        </select>
        <input type="date" [(ngModel)]="fromDate" name="from" required />
        <input type="date" [(ngModel)]="toDate" name="to" required />
        <input [(ngModel)]="reason" name="reason" placeholder="Reason" />
        <button class="btn-primary" type="submit" [disabled]="saving()">Submit</button>
      </div>
      @if (notice()) { <p class="ok">{{ notice() }}</p> }
    </form>

    @if (canApprove || requests().length || !canApprove) {
      <div class="card">
        <strong>{{ canApprove ? 'Requests' : 'My requests' }}</strong>
        @if (!requests().length) { <p class="text-muted">No leave requests.</p> }
        @for (r of requests(); track r.id) {
          <div class="item">
            <div>
              <strong>{{ r.employee }}</strong>
              <small>{{ r.leaveType }} · {{ r.fromDate }} → {{ r.toDate }} · {{ r.status }}</small>
            </div>
            @if (canApprove && r.status === 'Pending') {
              <div class="actions">
                <button class="btn-primary" type="button" (click)="act(r.id, true)">Approve</button>
                <button type="button" class="ghost" (click)="act(r.id, false)">Reject</button>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 14px; }
    ul { margin: 8px 0 0; padding-left: 18px; font-size: 13px; }
    .item { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid var(--line); }
    .item small { display: block; color: var(--muted); font-size: 11px; }
    button { margin-left: 6px; }
    .ghost { background: var(--surface); color: var(--navy); border: 1px solid var(--line); }
    .row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    input, select { height: 36px; border: 1px solid var(--line); border-radius: 8px; padding: 0 10px; background: var(--surface); color: var(--ink); }
    .ok { color: #087d68; margin: 8px 0 0; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; margin-bottom: 12px; }
  `]
})
export class LeaveComponent implements OnInit {
  types = signal<any[]>([]);
  requests = signal<any[]>([]);
  error = signal<string | null>(null);
  notice = signal<string | null>(null);
  saving = signal(false);
  canApprove = false;
  employees = signal<any[]>([]);
  employeeId = '';
  leaveTypeId = '';
  fromDate = '';
  toDate = '';
  reason = '';

  constructor(private api: ApiService, public ctx: SchoolContextService, private auth: AuthService) {
    this.canApprove = this.auth.hasRole('SchoolAdmin') || this.auth.hasRole('PlatformSuperAdmin') || this.auth.hasRole('HRManager');
  }

  ngOnInit() {
    if (!this.ctx.schoolId) return;
    this.api.getLeaveTypes(this.ctx.schoolId).subscribe({
      next: t => this.types.set(t),
      error: () => this.error.set('Could not load leave types.')
    });
    if (this.canApprove) {
      this.api.getEmployees(this.ctx.schoolId, 1, 100).subscribe({
        next: page => this.employees.set(page.items ?? [])
      });
    }
    this.api.getLeaveRequests(this.ctx.schoolId).subscribe({
      next: r => this.requests.set(r),
      error: () => this.error.set('Could not load leave requests.')
    });
  }

  apply() {
    if (!this.leaveTypeId || !this.fromDate || !this.toDate) return;
    if (this.canApprove && !this.employeeId) {
      this.error.set('Select the staff member this leave is for.');
      return;
    }
    this.saving.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.applyLeave(this.ctx.schoolId, {
      employeeId: this.canApprove ? this.employeeId : null,
      leaveTypeId: this.leaveTypeId,
      fromDate: this.fromDate,
      toDate: this.toDate,
      reason: this.reason || null
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notice.set('Leave request submitted.');
        this.reason = '';
        this.reload();
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.error ?? 'Could not submit leave. Your staff record must be linked to this login.');
      }
    });
  }

  act(id: string, approve: boolean) {
    const call = approve
      ? this.api.approveLeave(this.ctx.schoolId, id)
      : this.api.rejectLeave(this.ctx.schoolId, id);
    call.subscribe({ next: () => this.reload(), error: (e) => this.error.set(e?.error?.error ?? 'Action failed.') });
  }

  private reload() {
    if (!this.ctx.schoolId) return;
    this.api.getLeaveRequests(this.ctx.schoolId).subscribe({
      next: r => this.requests.set(r),
      error: () => {}
    });
  }
}
