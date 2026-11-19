import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { SchoolContextService } from '../../core/services/school-context.service';
import { MoneyPipe } from '../../shared/money.pipe';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';

interface Payment { id: string; amount: number; status: string; method: string; receiptNumber: string; paidAt: string; }
interface StudentOption { id: string; firstName: string; lastName: string; studentCode: string; }

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, CardModule, MoneyPipe],
  template: `
    <div class="page-header">
      <div>
        <div class="eyebrow">FEES & PAYMENTS</div>
        <h1>Fee collection</h1>
        <p>Receipts come from recorded payments. Fee structures are not yet allocated to individual students, so this page does not show an outstanding balance.</p>
      </div>
    </div>

    @if (canCollect) {
      <form class="toolbar" (ngSubmit)="record()">
        <input pInputText [(ngModel)]="search" name="search" placeholder="Search student name or code" (input)="findStudents()" />
        <select [(ngModel)]="studentId" name="studentId" (ngModelChange)="loadPayments()" required>
          <option value="">Select student</option>
          @for (s of students(); track s.id) {
            <option [value]="s.id">{{ s.firstName }} {{ s.lastName }} · {{ s.studentCode }}</option>
          }
        </select>
        <input pInputText type="number" min="0.01" step="0.01" [(ngModel)]="amount" name="amount" placeholder="Amount" required />
        <select [(ngModel)]="method" name="method">
          <option>Cash</option>
          <option>UPI</option>
          <option>Card</option>
          <option>Bank transfer</option>
        </select>
        <input pInputText [(ngModel)]="reference" name="reference" placeholder="Reference (optional)" />
        <button class="btn-primary" type="submit" [disabled]="saving() || !studentId || amount <= 0">{{ saving() ? 'Recording…' : 'Record payment' }}</button>
      </form>
    } @else if (children().length) {
      <div class="toolbar">
        <select [ngModel]="studentId" (ngModelChange)="chooseChild($event)">
          @for (c of children(); track c.studentId) {
            <option [value]="c.studentId">{{ c.firstName }} {{ c.lastName }}</option>
          }
        </select>
      </div>
    }

    @if (schedule()) {
      <div class="schedule">
        <strong>Class fee schedule</strong>
        @if (!schedule()!.items.length) {
          <p>No class fee amounts are saved for this academic year.</p>
        } @else {
          @for (row of schedule()!.items; track row.category) {
            <div class="line"><span>{{ row.category }}</span><span>{{ row.amount | money }}</span></div>
          }
          <p>Scheduled {{ schedule()!.total | money }}. Recorded receipts {{ recorded() | money }}.</p>
        }
      </div>
    }

    @if (notice()) { <p class="ok">{{ notice() }}</p> }
    @if (error()) { <p class="alert">{{ error() }}</p> }

    @if (payments().length) {
      <p class="total">Recorded {{ recorded() | money }} · {{ payments().length }} receipt(s)</p>
      <p-table [value]="payments()" styleClass="p-datatable-sm mt-3">
        <ng-template pTemplate="header">
          <tr><th>Receipt</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
        </ng-template>
        <ng-template pTemplate="body" let-p>
          <tr>
            <td><strong>{{ p.receiptNumber || 'Pending' }}</strong></td>
            <td>{{ p.amount | money }}</td>
            <td>{{ p.method }}</td>
            <td><p-tag [value]="p.status" [severity]="p.status === 'Successful' ? 'success' : 'warn'" /></td>
            <td>{{ p.paidAt | date:'dd MMM yyyy' }}</td>
          </tr>
        </ng-template>
      </p-table>
    } @else if (studentId && !loading()) {
      <p-card styleClass="mt-3">
        <p class="text-muted">No payments recorded for this student yet.</p>
      </p-card>
    }
  `,
  styles: [`
    .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; align-items: center; }
    select, input { height: 38px; border: 1px solid var(--line); border-radius: 8px; padding: 0 10px; background: var(--surface); color: var(--ink); }
    .total { font-weight: 700; color: var(--navy); }
    .schedule { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin-bottom: 12px; }
    .line { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--line); }
    .ok { background: #e5f8f1; color: #087d68; padding: 10px; border-radius: 8px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; }
  `]
})
export class FeesComponent implements OnInit {
  payments = signal<Payment[]>([]);
  students = signal<StudentOption[]>([]);
  children = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  studentId = '';
  search = '';
  amount = 0;
  method = 'Cash';
  reference = '';
  notice = signal<string | null>(null);
  schedule = signal<{ items: { category: string; amount: number }[]; total: number } | null>(null);
  error = signal<string | null>(null);
  canCollect = false;
  recorded = computed(() => this.payments()
    .filter(p => p.status === 'Successful')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0));

  constructor(private api: ApiService, private ctx: SchoolContextService, auth: AuthService) {
    this.canCollect = auth.hasRole('SchoolAdmin') || auth.hasRole('PlatformSuperAdmin') || auth.hasRole('Accountant');
    this.family = auth.hasRole('Parent');
    this.self = auth.hasRole('Student') && !this.canCollect;
  }

  private family = false;
  private self = false;

  ngOnInit() {
    if (!this.ctx.schoolId) return;
    if (this.canCollect) {
      this.findStudents();
      return;
    }
    if (this.self) {
      this.api.getMyStudent(this.ctx.schoolId).subscribe({
        next: me => { this.studentId = me.id; this.loadPayments(); },
        error: () => this.error.set('Your student record is not linked to this login.')
      });
      return;
    }
    if (this.family) {
      this.api.getParentChildren().subscribe({
        next: rows => {
          this.children.set(rows ?? []);
          if (rows?.[0]) this.chooseChild(rows[0].studentId);
        },
        error: () => this.error.set('Could not load linked students.')
      });
    }
  }

  findStudents() {
    if (!this.canCollect) return;
    this.api.getStudents(this.ctx.schoolId, this.ctx.academicYearId, 1, 50, this.search).subscribe({
      next: page => this.students.set(page.items ?? [])
    });
  }

  chooseChild(id: string) {
    this.studentId = id;
    this.loadPayments();
  }

  loadPayments() {
    if (!this.studentId || !this.ctx.schoolId) return;
    this.loading.set(true);
    this.schedule.set(null);
    this.api.getStudentPayments(this.ctx.schoolId, this.studentId).subscribe({
      next: p => { this.payments.set(p); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('Could not load receipts.'); }
    });
    if (this.ctx.academicYearId) {
      this.api.getFeeSchedule(this.ctx.schoolId, this.studentId, this.ctx.academicYearId).subscribe({
        next: s => this.schedule.set(s)
      });
    }
  }

  record() {
    if (!this.studentId || this.amount <= 0) return;
    this.saving.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.recordPayment(this.ctx.schoolId, {
      studentId: this.studentId,
      amount: Number(this.amount),
      method: this.method,
      reference: this.reference || null
    }).subscribe({
      next: r => {
        this.saving.set(false);
        this.notice.set(`Receipt ${r.receiptNumber} recorded for ${r.amount}.`);
        this.amount = 0;
        this.reference = '';
        this.loadPayments();
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.error ?? 'Could not record the payment.');
      }
    });
  }
}
