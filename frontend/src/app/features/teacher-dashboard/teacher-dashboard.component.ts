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
    <section class="welcome">
      <div>
        <div class="eyebrow">TEACHER WORKSPACE</div>
        <h1>Good {{ greeting }}, {{ auth.user()?.firstName }}</h1>
        <p>Your teaching day, assignments and classroom tools in one place.</p>
      </div>
      <a routerLink="/attendance" class="primary-action"><i class="pi pi-check-square"></i> Take attendance</a>
    </section>

    @if (error()) {
      <div class="alert-banner" role="alert"><i class="pi pi-exclamation-circle"></i> {{ error() }}</div>
    }

    <section class="stats-row" aria-label="Teaching overview">
      <article class="stat-card">
        <span class="stat-icon teal"><i class="pi pi-users"></i></span>
        <span><small>Teaching groups</small><strong>{{ loading() ? '—' : assignments().length }}</strong><em>Assigned classes and sections</em></span>
      </article>
      <article class="stat-card">
        <span class="stat-icon blue"><i class="pi pi-check-square"></i></span>
        <span><small>Attendance groups</small><strong>{{ loading() ? '—' : attendanceGroups }}</strong><em>Groups you can mark</em></span>
      </article>
      <article class="stat-card">
        <span class="stat-icon violet"><i class="pi pi-bookmark"></i></span>
        <span><small>Subjects</small><strong>{{ loading() ? '—' : uniqueSubjects }}</strong><em>Across your assignments</em></span>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel assignments-panel">
        <div class="panel-heading">
          <div><span class="eyebrow">YOUR CLASSES</span><h2>Teaching assignments</h2><p>Your mapped subjects and classroom permissions.</p></div>
          <a routerLink="/timetable" class="text-link">View timetable <i class="pi pi-arrow-up-right"></i></a>
        </div>
        @if (loading()) {
          <div class="empty">Loading your assignments…</div>
        } @else if (!assignments().length) {
          <div class="empty"><i class="pi pi-inbox"></i><strong>No assignments yet</strong><span>Ask the academic coordinator to map your subjects for this year.</span></div>
        } @else {
          <div class="assignments-grid">
            @for (a of assignments(); track a.id) {
              <article class="assignment-card">
                <div class="assignment-top"><span class="subject-icon"><i class="pi pi-book"></i></span><span class="assignment-label">SUBJECT</span></div>
                <strong class="ac-subject">{{ a.subject }}</strong>
                <span class="ac-class">{{ a.className }} <span>·</span> {{ a.sectionName }}</span>
                <div class="ac-perms">
                  @if (a.canTakeAttendance) { <span class="perm">Attendance</span> }
                  @if (a.canSetHomework) { <span class="perm">Homework</span> }
                  @if (a.canEnterMarks) { <span class="perm">Marks</span> }
                </div>
                <div class="ac-actions">
                  @if (a.canTakeAttendance) { <a routerLink="/attendance">Attendance <i class="pi pi-arrow-right"></i></a> }
                  @if (a.canSetHomework) { <a routerLink="/homework">Homework <i class="pi pi-arrow-right"></i></a> }
                </div>
              </article>
            }
          </div>
        }
      </article>

      <aside class="panel actions-panel">
        <div class="panel-heading"><div><span class="eyebrow">GET STARTED</span><h2>Classroom tools</h2><p>Pick up where your students need you.</p></div></div>
        <a class="action-row" routerLink="/diary"><span class="action-icon blue"><i class="pi pi-book"></i></span><span><strong>Class diary</strong><small>Share today's notes and homework</small></span><i class="pi pi-chevron-right"></i></a>
        <a class="action-row" routerLink="/lesson-plans"><span class="action-icon violet"><i class="pi pi-calendar"></i></span><span><strong>Weekly lesson plan</strong><small>Plan topics for the week</small></span><i class="pi pi-chevron-right"></i></a>
        <a class="action-row" routerLink="/examinations"><span class="action-icon amber"><i class="pi pi-file-edit"></i></span><span><strong>Enter marks</strong><small>Update assessment results</small></span><i class="pi pi-chevron-right"></i></a>
        <a class="action-row" routerLink="/leave"><span class="action-icon teal"><i class="pi pi-calendar-plus"></i></span><span><strong>Leave requests</strong><small>Apply and check request status</small></span><i class="pi pi-chevron-right"></i></a>
        <a class="action-row" routerLink="/announcements"><span class="action-icon blue"><i class="pi pi-megaphone"></i></span><span><strong>School notices</strong><small>Events and staff announcements</small></span><i class="pi pi-chevron-right"></i></a>
      </aside>
    </section>
  `,
  styles: [`
    .welcome { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 24px; padding: 28px 32px; border: 1px solid #dce8f6; border-radius: 18px; background: linear-gradient(115deg,#fff 20%,#f1f7ff 100%); }
    .welcome h1 { margin: 5px 0 6px; color: var(--navy); font-size: clamp(24px,3vw,34px); letter-spacing: -.04em; }
    .welcome p { margin: 0; color: var(--muted); }
    .alert-banner { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 11px 14px; border: 1px solid #f5c97a; border-radius: 10px; background: #fff4e5; color: #7a4f00; font-size: 12px; }
    .primary-action { display: inline-flex; align-items: center; gap: 9px; padding: 12px 16px; border-radius: 10px; background: var(--primary); color: white; text-decoration: none; font-weight: 700; box-shadow: 0 6px 16px rgba(36,99,235,.2); white-space: nowrap; }
    .stats-row { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; margin-bottom: 20px; }
    .stat-card { display: flex; align-items: center; gap: 14px; padding: 18px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); box-shadow: var(--shadow-sm); }
    .stat-card > span:last-child { display: grid; gap: 2px; }
    .stat-card small { color: var(--muted); font-size: 11px; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; }
    .stat-card strong { color: var(--navy); font-size: 25px; line-height: 1.2; }
    .stat-card em { color: var(--muted); font-size: 11px; font-style: normal; }
    .stat-icon,.action-icon,.subject-icon { display: grid; flex: 0 0 auto; width: 42px; height: 42px; place-items: center; border-radius: 12px; }
    .teal { background: #e3f8f3; color: #087d68; } .blue { background: #eaf3ff; color: #1c5cb7; } .violet { background: #f0ebff; color: #6b3fa0; } .amber { background: #fff4db; color: #9a6900; }
    .dashboard-grid { display: grid; grid-template-columns: minmax(0,1.65fr) minmax(280px,.85fr); gap: 18px; align-items: start; }
    .panel { min-width: 0; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); box-shadow: var(--shadow-sm); }
    .panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 22px; border-bottom: 1px solid var(--line); }
    .panel-heading h2 { margin: 3px 0 3px; color: var(--navy); font-size: 17px; letter-spacing: -.02em; }
    .panel-heading p { margin: 0; color: var(--muted); font-size: 12px; }
    .text-link { color: var(--primary); font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap; }
    .assignments-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; padding: 16px; }
    .assignment-card { display: flex; min-width: 0; flex-direction: column; gap: 8px; padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
    .assignment-top { display: flex; align-items: center; justify-content: space-between; }
    .subject-icon { width: 34px; height: 34px; background: #eaf3ff; color: #1c5cb7; }
    .assignment-label { color: #8794a6; font-size: 9px; font-weight: 800; letter-spacing: .1em; }
    .ac-subject { overflow: hidden; color: var(--navy); font-size: 15px; text-overflow: ellipsis; }
    .ac-class { color: var(--muted); font-size: 12px; } .ac-class span { color: #a2afbd; }
    .ac-perms { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
    .perm { padding: 3px 8px; border-radius: 20px; background: #f0ebff; color: #6b3fa0; font-size: 10px; font-weight: 700; }
    .ac-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 5px; }
    .ac-actions a { color: var(--primary); font-size: 11px; font-weight: 700; text-decoration: none; }
    .ac-actions i { margin-left: 3px; font-size: 9px; }
    .empty { display: grid; justify-items: center; gap: 8px; padding: 36px 20px; color: var(--muted); text-align: center; }
    .empty i { color: var(--primary); font-size: 23px; } .empty strong { color: var(--navy); font-size: 14px; }
    .action-row { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid #eff2f6; color: inherit; text-decoration: none; transition: background .15s ease; }
    .action-row:last-child { border-bottom: 0; } .action-row:hover { background: #f8faff; }
    .action-icon { width: 36px; height: 36px; border-radius: 10px; }
    .action-row > span:nth-child(2) { display: grid; min-width: 0; gap: 2px; flex: 1; }
    .action-row strong { color: var(--navy); font-size: 12px; } .action-row small { color: var(--muted); font-size: 10px; }
    .action-row > i { color: #9aa8b8; font-size: 11px; }
    @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }
    @media (max-width: 650px) { .welcome { align-items: flex-start; flex-direction: column; padding: 22px; } .stats-row { grid-template-columns: 1fr; gap: 10px; } .assignments-grid { grid-template-columns: 1fr; } .panel-heading { align-items: flex-start; flex-direction: column; } }
    @media (prefers-reduced-motion: reduce) { .action-row { transition: none; } }
  `]
})
export class TeacherDashboardComponent implements OnInit {
  assignments = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

  get uniqueSubjects(): number { return [...new Set(this.assignments().map((a: any) => a.subject))].length; }
  get attendanceGroups(): number { return this.assignments().filter((a: any) => a.canTakeAttendance).length; }

  constructor(public auth: AuthService, public ctx: SchoolContextService, private api: ApiService) {}

  ngOnInit() {
    if (!this.ctx.schoolId || !this.ctx.academicYearId) { this.loading.set(false); return; }
    this.api.getTeacherAssignments(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
      next: (data) => { this.assignments.set(data); this.loading.set(false); },
      error: () => { this.error.set('Could not load your teaching assignments. Please try again later.'); this.loading.set(false); }
    });
  }
}
