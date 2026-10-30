import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule],
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

    @if (canApprove) {
      <div class="card">
        <strong>Requests</strong>
        @if (!requests().length) { <p class="text-muted">No leave requests.</p> }
        @for (r of requests(); track r.id) {
          <div class="item">
            <div>
              <strong>{{ r.employee }}</strong>
              <small>{{ r.leaveType }} · {{ r.fromDate }} → {{ r.toDate }} · {{ r.status }}</small>
            </div>
            @if (r.status === 'Pending') {
              <div class="actions">
                <button type="button" (click)="act(r.id, true)">Approve</button>
                <button type="button" class="ghost" (click)="act(r.id, false)">Reject</button>
              </div>
            }
          </div>
        }
      </div>
    } @else {
      <div class="card">
        <p class="text-muted">Your own leave balance and requests will appear here once your employee record is linked. Admins approve from this same workspace.</p>
      </div>
    }
  `,
  styles: [`
    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 14px; }
    ul { margin: 8px 0 0; padding-left: 18px; font-size: 13px; }
    .item { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid var(--line); }
    .item small { display: block; color: var(--muted); font-size: 11px; }
    button { background: var(--primary); color: white; border: 0; border-radius: 8px; padding: 6px 10px; margin-left: 6px; cursor: pointer; }
    .ghost { background: var(--surface); color: var(--navy); border: 1px solid var(--line); }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; margin-bottom: 12px; }
  `]
})
export class LeaveComponent implements OnInit {
  types = signal<any[]>([]);
  requests = signal<any[]>([]);
  error = signal<string | null>(null);
  canApprove = false;

  constructor(private api: ApiService, public ctx: SchoolContextService, private auth: AuthService) {
    this.canApprove = this.auth.hasRole('SchoolAdmin') || this.auth.hasRole('HRManager');
  }

  ngOnInit() {
    if (!this.ctx.schoolId) return;
    this.api.getLeaveTypes(this.ctx.schoolId).subscribe({
      next: t => this.types.set(t),
      error: () => this.error.set('Could not load leave types.')
    });
    if (this.canApprove) {
      this.api.getLeaveRequests(this.ctx.schoolId).subscribe({
        next: r => this.requests.set(r),
        error: () => this.error.set('Could not load leave requests.')
      });
    }
  }

  act(id: string, approve: boolean) {
    const call = approve
      ? this.api.approveLeave(this.ctx.schoolId, id)
      : this.api.rejectLeave(this.ctx.schoolId, id);
    call.subscribe({ next: () => this.ngOnInit(), error: (e) => this.error.set(e?.error?.error ?? 'Action failed.') });
  }
}
