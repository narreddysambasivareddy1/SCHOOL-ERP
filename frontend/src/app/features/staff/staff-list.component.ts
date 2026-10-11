import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { environment } from '../../../environments/environment';
import { SchoolContextService } from '../../core/services/school-context.service';

interface EmployeeListDto { id: string; employeeCode: string; firstName: string; lastName: string; department?: string; designation?: string; status: string; }

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule],
  template: `
    <div class="eyebrow">HUMAN RESOURCES</div>
    <h1 style="color:var(--navy);margin:4px 0 20px">Staff & HRMS</h1>
    <div class="toolbar">
      <input pInputText [(ngModel)]="search" placeholder="Search employee or department..." (input)="load()" />
    </div>
    <p-table [value]="employees()" [loading]="loading()" [lazy]="true"
             (onLazyLoad)="onLazy($event)" [totalRecords]="total()"
             [rows]="25" [paginator]="true" styleClass="p-datatable-sm">
      <ng-template pTemplate="header">
        <tr><th>Employee</th><th>Department</th><th>Designation</th><th>Status</th></tr>
      </ng-template>
      <ng-template pTemplate="body" let-e>
        <tr>
          <td>
            <div class="person">
              <div class="avatar">{{ e.firstName[0] }}{{ e.lastName[0] }}</div>
              <div><strong>{{ e.firstName }} {{ e.lastName }}</strong><br><small>{{ e.employeeCode }}</small></div>
            </div>
          </td>
          <td>{{ e.department ?? '—' }}</td>
          <td>{{ e.designation ?? '—' }}</td>
          <td><p-tag [value]="e.status" [severity]="e.status === 'Active' ? 'success' : 'warn'" /></td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td colspan="4" style="text-align:center;color:var(--muted);padding:32px">No employees found.</td></tr>
      </ng-template>
    </p-table>
  `,
  styles: [`
    h1 { font-size: 22px; }
    .toolbar { margin-bottom: 14px; }
    .toolbar input { width: min(320px, 100%); }
    .person { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 9px; background: #e3f8f3; color: #087d68; display: grid; place-items: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
    strong { font-size: 12px; }
    small { color: var(--muted); font-size: 10px; }
  `]
})
export class StaffListComponent implements OnInit {
  employees = signal<EmployeeListDto[]>([]);
  total = signal(0);
  loading = signal(false);
  search = '';
  private page = 1;
  private pageSize = 25;

  constructor(private http: HttpClient, private ctx: SchoolContextService) {}

  ngOnInit() { this.load(); }

  onLazy(event: { first: number; rows: number }) {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.pageSize = event.rows;
    this.load();
  }

  load() {
    if (!this.ctx.schoolId) { this.employees.set([]); return; }
    this.loading.set(true);
    const params = new URLSearchParams({ page: String(this.page), pageSize: String(this.pageSize), ...(this.search ? { search: this.search } : {}) });
    this.http.get<{ items: EmployeeListDto[]; totalCount: number }>(`${environment.apiUrl}/schools/${this.ctx.schoolId}/employees?${params}`)
      .subscribe({ next: r => { this.employees.set(r.items); this.total.set(r.totalCount); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
}
