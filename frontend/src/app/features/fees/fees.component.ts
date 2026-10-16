import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { environment } from '../../../environments/environment';
import { SchoolContextService } from '../../core/services/school-context.service';
import { MoneyPipe } from '../../shared/money.pipe';

interface Payment { id: string; amount: number; status: string; method: string; receiptNumber: string; paidAt: string; }

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, CardModule, MoneyPipe],
  template: `
    <div class="eyebrow">FEES & PAYMENTS</div>
    <h1 style="color:var(--navy);margin:4px 0 20px">Fee Management</h1>

    <div class="toolbar">
      <input pInputText [(ngModel)]="studentId" placeholder="Enter Student ID to view payments..." style="width:320px" />
      <p-button label="Load" (onClick)="loadPayments()" [loading]="loading()" />
    </div>

    @if (payments().length > 0) {
      <p-table [value]="payments()" styleClass="p-datatable-sm mt-3">
        <ng-template pTemplate="header">
          <tr><th>Receipt</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
        </ng-template>
        <ng-template pTemplate="body" let-p>
          <tr>
            <td><strong>{{ p.receiptNumber }}</strong></td>
            <td>{{ p.amount | money }}</td>
            <td>{{ p.method }}</td>
            <td><p-tag [value]="p.status" [severity]="p.status === 'Successful' ? 'success' : 'warn'" /></td>
            <td>{{ p.paidAt | date:'dd MMM yyyy' }}</td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">No payments found.</td></tr>
        </ng-template>
      </p-table>
    } @else {
      <p-card styleClass="mt-3">
        <p class="text-muted">Fee structures, instalments, online payments, receipts and reconciliation. Enter a student ID above to view payment history.</p>
      </p-card>
    }
  `,
  styles: [`.toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 4px; }`]
})
export class FeesComponent {
  payments = signal<Payment[]>([]);
  loading = signal(false);
  studentId = '';

  constructor(private http: HttpClient, private ctx: SchoolContextService) {}

  loadPayments() {
    if (!this.studentId || !this.ctx.schoolId) return;
    this.loading.set(true);
    this.http.get<Payment[]>(`${environment.apiUrl}/schools/${this.ctx.schoolId}/fees/student/${this.studentId}`)
      .subscribe({ next: p => { this.payments.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
}
