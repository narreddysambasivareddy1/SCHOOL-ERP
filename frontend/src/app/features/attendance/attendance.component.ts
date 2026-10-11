import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { environment } from '../../../environments/environment';
import { SchoolContextService } from '../../core/services/school-context.service';

interface AttendanceRecord { studentId: string; studentName: string; code: string; remarks?: string; }

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule, TagModule, MessageModule],
  template: `
    <div class="eyebrow">ATTENDANCE & BIOMETRICS</div>
    <h1 style="color:var(--navy);margin:4px 0 20px">Attendance Centre</h1>

    @if (session()) {
      <div class="session-info">
        <strong>Session: {{ session()!.date }}</strong> &nbsp;·&nbsp; {{ session()!.records.length }} records
        <p-tag [value]="'Marked'" severity="success" styleClass="ml-2" />
      </div>
      <p-table [value]="session()!.records" styleClass="p-datatable-sm mt-3">
        <ng-template pTemplate="header">
          <tr><th>Student</th><th>Status</th></tr>
        </ng-template>
        <ng-template pTemplate="body" let-r>
          <tr>
            <td>{{ r.studentName }}</td>
            <td><p-tag [value]="r.code" [severity]="r.code === 'Present' ? 'success' : r.code === 'Late' ? 'warn' : 'danger'" /></td>
          </tr>
        </ng-template>
      </p-table>
    } @else {
      <div class="info-card">
        <p class="text-muted">Select a class and date to view or mark attendance. Connect to the backend API with a valid school context.</p>
        <p-message severity="info" text="Attendance marking requires Teacher or Admin role and a valid teacher-subject-section assignment." />
      </div>
    }
  `,
  styles: [`
    h1 { font-size: 22px; }
    .session-info { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 18px; }
    .info-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; }
  `]
})
export class AttendanceComponent implements OnInit {
  session = signal<{ date: string; records: AttendanceRecord[] } | null>(null);

  constructor(private http: HttpClient, private ctx: SchoolContextService) {}

  ngOnInit() {
    // Load today's attendance if school context is available
    if (this.ctx.schoolId) this.loadToday();
  }

  private loadToday() {
    const today = new Date().toISOString().split('T')[0];
    // Placeholder: real implementation would pass classId/sectionId from selection
  }
}
