import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, TableModule, CardModule, TagModule, MessageModule],
  template: `
    <div class="eyebrow">CONFIDENTIAL · PAYROLL</div>
    <h1 style="color:var(--navy);margin:4px 0 20px">Payroll & Payslips</h1>
    <p-message severity="warn" text="Payroll data is restricted to authorized HR and Payroll roles. Verify statutory calculations before production use." styleClass="w-full mb-4" />
    <p-card header="Payroll runs">
      <p-table [value]="runs" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr><th>Period</th><th>Employees</th><th>Gross pay</th><th>Net pay</th><th>Status</th></tr>
        </ng-template>
        <ng-template pTemplate="body" let-r>
          <tr>
            <td>{{ r.period }}</td>
            <td>{{ r.employees }}</td>
            <td>{{ r.gross }}</td>
            <td>{{ r.net }}</td>
            <td><p-tag [value]="r.status" [severity]="r.status === 'Finalized' ? 'success' : 'warn'" /></td>
          </tr>
        </ng-template>
      </p-table>
      <p class="text-muted mt-3" style="font-size:11px">Finalized payroll cannot be silently edited. Use audited adjustment or reversal workflows.</p>
    </p-card>
  `,
  styles: [`h1 { font-size: 22px; } .mt-3 { margin-top: 12px; }`]
})
export class PayrollComponent {
  runs = [
    { period: 'September 2026', employees: 128, gross: '₹46,20,000', net: '₹42,80,000', status: 'Finalized' },
    { period: 'October 2026', employees: 128, gross: '—', net: '—', status: 'Draft' },
  ];
}
