import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

interface Assignment {
  id: string; teacher: string; employeeCode: string; subject: string;
  className: string; sectionName: string; periodSlot?: string; electiveGroup?: string;
  canTakeAttendance: boolean; canSetHomework: boolean; canEnterMarks: boolean;
}

@Component({
  selector: 'app-academics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">ACADEMIC OPERATIONS</div>
      <h1>Academics & Timetable</h1>
    </div>

    <div class="card map-card">
      <div class="card-header">
        <div>
          <div class="card-title">Map teacher to class / section / subject</div>
          <div class="card-sub">Teachers may teach multiple classes or an elective group. The same period slot cannot be assigned twice in a year.</div>
        </div>
      </div>
      @if (notice()) { <div class="ok">{{ notice() }}</div> }
      @if (mapError()) { <div class="alert-error">{{ mapError() }}</div> }
      <form class="map-form" (ngSubmit)="create()">
        <label>Teacher
          <select [(ngModel)]="form.employeeId" name="employeeId" required>
            <option value="">Select</option>
            @for (e of employees(); track e.id) {
              <option [value]="e.id">{{ e.firstName }} {{ e.lastName }} ({{ e.employeeCode }})</option>
            }
          </select>
        </label>
        <label>Subject
          <select [(ngModel)]="form.subjectId" name="subjectId" required>
            <option value="">Select</option>
            @for (s of subjects(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
          </select>
        </label>
        <label>Class
          <select [(ngModel)]="form.classId" name="classId" (ngModelChange)="onClass()" required>
            <option value="">Select</option>
            @for (c of classes(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
          </select>
        </label>
        <label>Section
          <select [(ngModel)]="form.sectionId" name="sectionId" required>
            <option value="">Select</option>
            @for (s of sections(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
          </select>
        </label>
        <label>Period slot
          <input [(ngModel)]="form.periodSlot" name="periodSlot" placeholder="e.g. Mon-P2" />
        </label>
        <label>Elective group
          <input [(ngModel)]="form.electiveGroup" name="electiveGroup" placeholder="optional" />
        </label>
        <button type="submit" [disabled]="busy()">Save mapping</button>
      </form>
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
              <th>Period / Group</th>
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
                <td>{{ a.periodSlot || '—' }}{{ a.electiveGroup ? ' · ' + a.electiveGroup : '' }}</td>
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
    .card { background: white; border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; margin-bottom: 16px; }
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
    .ok { margin: 12px 20px 0; background: #e5f8f1; color: #087d68; padding: 8px 12px; border-radius: 8px; font-size: 12px; }
    .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
    .empty-icon { font-size: 36px; margin-bottom: 10px; }
    .empty-state p { font-size: 13px; margin: 0; }
    .map-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; padding: 16px 20px 20px; }
    .map-form label { font-size: 11px; font-weight: 700; color: var(--muted); display: flex; flex-direction: column; gap: 6px; }
    .map-form select, .map-form input, .map-form button { font: inherit; padding: 8px; border-radius: 8px; border: 1px solid var(--line); }
    .map-form button { background: var(--primary); color: white; border: 0; align-self: end; cursor: pointer; font-weight: 700; }
  `]
})
export class AcademicsComponent implements OnInit {
  assignments = signal<Assignment[]>([]);
  employees = signal<any[]>([]);
  subjects = signal<any[]>([]);
  classes = signal<any[]>([]);
  sections = signal<any[]>([]);
  loading = signal(true);
  busy = signal(false);
  error = signal<string | null>(null);
  mapError = signal<string | null>(null);
  notice = signal<string | null>(null);
  form = { employeeId: '', subjectId: '', classId: '', sectionId: '', periodSlot: '', electiveGroup: '' };

  constructor(private api: ApiService, public ctx: SchoolContextService) {}

  ngOnInit() {
    if (!this.ctx.schoolId || !this.ctx.academicYearId) { this.loading.set(false); return; }
    this.load();
    this.api.getEmployees(this.ctx.schoolId, 1, 100).subscribe({ next: r => this.employees.set(r.items || []) });
    this.api.getSubjects(this.ctx.schoolId).subscribe({ next: s => this.subjects.set(s) });
    this.api.getClasses(this.ctx.schoolId).subscribe({ next: c => this.classes.set(c) });
  }

  onClass() {
    const cls = this.classes().find(c => c.id === this.form.classId);
    this.sections.set(cls?.sections || []);
    this.form.sectionId = '';
  }

  load() {
    this.loading.set(true);
    this.api.getTeacherAssignments(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
      next: (data) => { this.assignments.set(data); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load assignments.'); this.loading.set(false); }
    });
  }

  create() {
    this.mapError.set(null);
    this.notice.set(null);
    this.busy.set(true);
    this.api.createTeacherAssignment(this.ctx.schoolId, {
      academicYearId: this.ctx.academicYearId,
      employeeId: this.form.employeeId,
      subjectId: this.form.subjectId,
      classId: this.form.classId,
      sectionId: this.form.sectionId,
      periodSlot: this.form.periodSlot || null,
      electiveGroup: this.form.electiveGroup || null
    }).subscribe({
      next: () => {
        this.busy.set(false);
        this.notice.set('Teacher mapping saved.');
        this.load();
      },
      error: e => {
        this.busy.set(false);
        this.mapError.set(e?.error?.error || 'Could not save mapping (period clash or duplicate).');
      }
    });
  }
}
