import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { environment } from '../../../environments/environment';

interface StudentListDto {
  id: string; studentCode: string; firstName: string; lastName: string;
  className: string; sectionName: string; status: string; photoUrl?: string;
}

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">STUDENT INFORMATION SYSTEM</div>
      <h1>Students</h1>
    </div>
    <div class="toolbar">
      <input pInputText [(ngModel)]="search" placeholder="Search name or ID..." (input)="load()" />
    </div>
    <p-table [value]="students()" [loading]="loading()" [lazy]="true"
             (onLazyLoad)="onLazy($event)" [totalRecords]="total()"
             [rows]="25" [paginator]="true" [rowsPerPageOptions]="[25,50,100]"
             styleClass="p-datatable-sm">
      <ng-template pTemplate="header">
        <tr>
          <th>Student</th><th>Class</th><th>Status</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-s>
        <tr>
          <td>
            <div class="person">
              <div class="avatar">{{ s.firstName[0] }}{{ s.lastName[0] }}</div>
              <div><strong>{{ s.firstName }} {{ s.lastName }}</strong><br><small>{{ s.studentCode }}</small></div>
            </div>
          </td>
          <td>{{ s.className }} · {{ s.sectionName }}</td>
          <td><p-tag [value]="s.status" [severity]="s.status === 'Active' ? 'success' : 'warn'" /></td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td colspan="3" style="text-align:center;color:var(--muted);padding:32px">No students found.</td></tr>
      </ng-template>
    </p-table>
  `,
  styles: [`
    .page-header { margin-bottom: 20px; }
    h1 { margin: 4px 0; font-size: 22px; color: var(--navy); }
    .toolbar { margin-bottom: 14px; }
    .toolbar input { width: min(320px, 100%); }
    .person { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 9px; background: #e7efff; color: #28569b; display: grid; place-items: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
    strong { font-size: 12px; }
    small { color: var(--muted); font-size: 10px; }
  `]
})
export class StudentListComponent implements OnInit {
  students = signal<StudentListDto[]>([]);
  total = signal(0);
  loading = signal(false);
  search = '';
  private page = 1;
  private pageSize = 25;

  // TODO: get schoolId and academicYearId from school context service
  private schoolId = '';
  private academicYearId = '';

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  onLazy(event: { first: number; rows: number }) {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.pageSize = event.rows;
    this.load();
  }

  load() {
    if (!this.schoolId || !this.academicYearId) {
      // No school context yet - show empty state
      this.students.set([]);
      return;
    }
    this.loading.set(true);
    const params = new URLSearchParams({
      academicYearId: this.academicYearId,
      page: String(this.page),
      pageSize: String(this.pageSize),
      ...(this.search ? { search: this.search } : {})
    });
    this.http.get<{ items: StudentListDto[]; totalCount: number }>(
      `${environment.apiUrl}/schools/${this.schoolId}/students?${params}`
    ).subscribe({
      next: r => { this.students.set(r.items); this.total.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
