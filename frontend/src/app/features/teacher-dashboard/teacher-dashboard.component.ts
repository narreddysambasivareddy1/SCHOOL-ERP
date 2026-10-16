import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="eyebrow">TEACHER</div>
      <h1>Good {{ greeting }}, {{ auth.user()?.firstName }}</h1>
      <p class="sub">Only your assigned classes, subjects and sections — attendance, homework and marks.</p>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon" style="background:#e3f8f3;color:#087d68"><i class="pi pi-book"></i></div>
        <div><div class="stat-label">My groups</div><div class="stat-value">{{ loading() ? '—' : assignments().length }}</div><div class="stat-sub">Active sections</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#eaf3ff;color:#1c5cb7"><i class="pi pi-check-square"></i></div>
        <div><div class="stat-label">Can take attendance</div><div class="stat-value">{{ loading() ? '—' : attendanceGroups }}</div><div class="stat-sub">Teaching groups</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fff4db;color:#9a6900"><i class="pi pi-bookmark"></i></div>
        <div><div class="stat-label">Subjects</div><div class="stat-value">{{ loading() ? '—' : uniqueSubjects }}</div><div class="stat-sub">This year</div></div>
      </div>
    </div>

    <div class="mod-section">Teaching tools</div>
    <div class="mod-grid">
      <a class="mod-card" routerLink="/attendance"><i class="pi pi-check-square"></i><strong>Mark attendance</strong><small>Present, absent, late, excused for assigned groups</small></a>
      <a class="mod-card" routerLink="/homework"><i class="pi pi-book"></i><strong>Homework & worksheets</strong><small>Create, publish and review submissions</small></a>
      <a class="mod-card" routerLink="/examinations"><i class="pi pi-file"></i><strong>Enter marks</strong><small>Draft marks for assigned subjects; admin publishes</small></a>
      <a class="mod-card" routerLink="/timetable"><i class="pi pi-table"></i><strong>My timetable</strong><small>Class, subject and section allocations</small></a>
      <a class="mod-card" routerLink="/students"><i class="pi pi-users"></i><strong>Class roster</strong><small>Students in groups you are assigned to</small></a>
      <a class="mod-card" routerLink="/communications"><i class="pi pi-send"></i><strong>Message parents</strong><small>School-approved channels only</small></a>
    </div>

    <div class="mod-section">My HR</div>
    <div class="mod-grid">
      <a class="mod-card" routerLink="/leave"><i class="pi pi-calendar-plus"></i><strong>Leave</strong><small>Balance, apply and request status</small></a>
      <a class="mod-card" routerLink="/calendar"><i class="pi pi-calendar"></i><strong>School calendar</strong><small>Events, holidays and activities</small></a>
      <a class="mod-card" routerLink="/announcements"><i class="pi pi-megaphone"></i><strong>Announcements</strong><small>School notices for staff</small></a>
    </div>

    <div class="mod-section">My class assignments</div>
    @if (loading()) { <div class="empty">Loading your assignments…</div> }
    @else if (!assignments().length) { <div class="empty">No assignments for this academic year. Ask the academic coordinator to map your subjects.</div> }
    @else {
      <div class="assignments-grid">
        @for (a of assignments(); track a.id) {
          <div class="assignment-card">
            <div class="ac-subject">{{ a.subject }}</div>
            <div class="ac-class">{{ a.className }} · {{ a.sectionName }}</div>
            <div class="ac-perms">
              @if (a.canTakeAttendance) { <span class="perm">Attendance</span> }
              @if (a.canSetHomework) { <span class="perm">Homework</span> }
              @if (a.canEnterMarks) { <span class="perm">Marks</span> }
            </div>
            <div class="ac-actions">
              <a routerLink="/attendance" class="ac-btn primary">Attendance</a>
              <a routerLink="/homework" class="ac-btn ghost">Homework</a>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .sub { margin: 0; color: var(--muted); font-size: 13px; }
    .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
    .stat-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 18px; display: flex; gap: 14px; box-shadow: var(--shadow); }
    .stat-icon { width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; }
    .stat-label { font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: 800; color: var(--navy); }
    .stat-sub { font-size: 11px; color: var(--teal); }
    .assignments-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14px; }
    .assignment-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .ac-subject { font-size: 15px; font-weight: 800; color: var(--navy); }
    .ac-class { font-size: 12px; color: var(--muted); }
    .ac-perms { display: flex; gap: 5px; flex-wrap: wrap; }
    .perm { font-size: 10px; font-weight: 700; background: #f0ebff; color: #6b3fa0; padding: 2px 8px; border-radius: 4px; }
    .ac-actions { display: flex; gap: 8px; margin-top: auto; }
    .ac-btn { flex: 1; text-align: center; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none; }
    .ac-btn.primary { background: var(--primary); color: white; }
    .ac-btn.ghost { background: white; border: 1px solid var(--line); color: var(--navy); }
    .empty { padding: 28px; text-align: center; color: var(--muted); background: white; border: 1px dashed var(--line); border-radius: 12px; }
    @media (max-width: 900px) { .stats-row, .assignments-grid { grid-template-columns: 1fr; } }
  `]
})
export class TeacherDashboardComponent implements OnInit {
  assignments = signal<any[]>([]);
  loading = signal(true);
  greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

  get uniqueSubjects(): number { return [...new Set(this.assignments().map((a: any) => a.subject))].length; }
  get attendanceGroups(): number { return this.assignments().filter((a: any) => a.canTakeAttendance).length; }

  constructor(public auth: AuthService, public ctx: SchoolContextService, private api: ApiService) {}

  ngOnInit() {
    if (!this.ctx.schoolId || !this.ctx.academicYearId) { this.loading.set(false); return; }
    this.api.getTeacherAssignments(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
      next: (data) => { this.assignments.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
