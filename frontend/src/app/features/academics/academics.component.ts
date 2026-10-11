import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-academics',
  standalone: true,
  imports: [CommonModule, TableModule, CardModule, TagModule, MessageModule],
  template: `
    <div class="eyebrow">ACADEMIC OPERATIONS</div>
    <h1 style="color:var(--navy);margin:4px 0 20px">Academics & Timetable</h1>
    <p-card header="Teacher–Subject–Section mapping" styleClass="mb-4">
      <p-table [value]="assignments" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr><th>Teacher</th><th>Subject</th><th>Sections</th><th>Permissions</th><th>Status</th></tr>
        </ng-template>
        <ng-template pTemplate="body" let-a>
          <tr>
            <td><strong>{{ a.teacher }}</strong><br><small style="color:var(--muted)">{{ a.code }}</small></td>
            <td>{{ a.subject }}</td>
            <td>{{ a.sections }}</td>
            <td style="font-size:11px;color:var(--muted)">{{ a.perms }}</td>
            <td><p-tag value="Active" severity="success" /></td>
          </tr>
        </ng-template>
      </p-table>
      <p-message severity="info" text="Each teacher is assigned to specific sections only. Backend enforces these boundaries on attendance, homework and marks." styleClass="w-full mt-3" />
    </p-card>
  `,
  styles: [`h1 { font-size: 22px; } .mt-3 { margin-top: 12px; }`]
})
export class AcademicsComponent {
  assignments = [
    { teacher: 'S. Lakshmi', code: 'EMP-0102', subject: 'Telugu', sections: '6A, 6B, 6C, 7A, 7B', perms: 'Attendance · Homework · Marks' },
    { teacher: 'R. Mahesh', code: 'EMP-0087', subject: 'Mathematics', sections: '6A, 7A only', perms: 'Attendance · Homework · Marks' },
    { teacher: 'A. Priya', code: 'EMP-0114', subject: 'Science', sections: '6B, 7B, 8A', perms: 'Attendance · Homework · Marks' },
    { teacher: 'D. Kumar', code: 'EMP-0069', subject: 'English', sections: '5A, 5B, 6A, 6B', perms: 'Attendance · Homework · Marks' },
  ];
}
