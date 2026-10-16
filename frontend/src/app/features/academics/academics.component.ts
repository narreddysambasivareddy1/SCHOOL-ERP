import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

interface Assignment { id: string; teacher: string; employeeCode: string; subject: string; className: string; sectionName: string; canTakeAttendance: boolean; canSetHomework: boolean; canEnterMarks: boolean; }

@Component({
  selector: 'app-academics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">ACADEMIC OPERATIONS</div>
      <h1>Academics & Timetable</h1>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Teacher–Subject–Section Assignments</div>
          <div class="card-sub">Defines which teacher can take attendance, set homework and enter marks for each section.</div>
        </div>
        @if (!loading() && assignments().length) {
          <span class="count-badge">{{ assignments().length }} assignments</span>
        }
      </div>

      @if (loading()) {
        <div class="loading-row">Loading assignments…</div>
      } @else if (error()) {
        <div class="alert-error">{{ error() }}</div>
      } @else if (!assignments().length) {
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <p>No teacher assignments found for this academic year.</p>
        </div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Subject</th>
              <th>Class & Section</th>
              <th>Permissions</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (a of assignments(); track a.id) {
              <tr>
                <td>
                  <div class="person">
                    <div class="avatar">{{ a.teacher.split(' ')[0][0] }}{{ a.teacher.split(' ').length > 1 ? a.teacher.split(' ')[1][0] : '' }}</div>
                    <div>
                      <div class="person-name">{{ a.teacher }}</div>
                      <div class="person-code">{{ a.employeeCode }}</div>
                    </div>
                  </div>
                </td>
                <td class="subject-cell">{{ a.subject }}</td>
                <td>{{ a.className }} · {{ a.sectionName }}</td>
                <td>
                  <div class="perms">
                    @if (a.canTakeAttendance) { <span class="perm-tag">Attendance</span> }
                    @if (a.canSetHomework) { <span class="perm-tag">Homework</span> }
                    @if (a.canEnterMarks) { <span class="perm-tag">Marks</span> }
                  </div>
                </td>
                <td><span class="badge badge-success">Active</span></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    h1 { margin: 4px 0; font-size: 22px; font-weight: 800; color: var(--navy); }
    .card { background: white; border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
    .card-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--line); gap: 12px; flex-wrap: wrap; }
    .card-title { font-size: 14px; font-weight: 700; color: var(--navy); }
    .card-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .count-badge { background: #eaf3ff; color: #1c5cb7; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead th { background: #f8fafc; color: #8290a4; font-size: 11px; letter-spacing: 0.6px; text-transform: uppercase; padding: 10px 20px; text-align: left; border-bottom: 1px solid var(--line); }
    .data-table tbody tr:hover { background: #fafbfd; }
    .data-table td { padding: 12px 20px; font-size: 13px; border-bottom: 1px solid var(--line); vertical-align: middle; }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .person { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 34px; height: 34px; border-radius: 10px; background: #e3f8f3; color: #087d68; display: grid; place-items: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
    .person-name { font-size: 13px; font-weight: 600; color: var(--navy); }
    .person-code { font-size: 11px; color: var(--muted); }
    .subject-cell { font-weight: 600; color: var(--ink); }
    .perms { display: flex; gap: 4px; flex-wrap: wrap; }
    .perm-tag { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: #f0ebff; color: #6b3fa0; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
    .badge-success { background: #e5f8f1; color: #087d68; }
    .loading-row { padding: 40px; text-align: center; color: var(--muted); font-size: 13px; }
    .alert-error { margin: 16px 20px; background: #fff0f0; border: 1px solid #f5c6c6; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #c0392b; }
    .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
    .empty-icon { font-size: 36px; margin-bottom: 10px; }
    .empty-state p { font-size: 13px; margin: 0; }
  `]
})
export class AcademicsComponent implements OnInit {
  assignments = signal<Assignment[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private api: ApiService, public ctx: SchoolContextService) {}

  ngOnInit() {
    if (!this.ctx.schoolId || !this.ctx.academicYearId) { this.loading.set(false); return; }
    this.api.getTeacherAssignments(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
      next: (data) => { this.assignments.set(data); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load assignments.'); this.loading.set(false); }
    });
  }
}
