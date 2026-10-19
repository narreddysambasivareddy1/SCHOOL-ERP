import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-lesson-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">ACADEMICS</div>
      <h1>Weekly lesson plans</h1>
      <p class="text-muted">Map Monday–Saturday topics by Friday evening. Families see the same week on this page.</p>
    </div>
    @if (notice()) { <div class="ok">{{ notice() }}</div> }
    @if (error()) { <div class="alert">{{ error() }}</div> }

    <div class="toolbar">
      <label>Week starting <input type="date" [(ngModel)]="weekStart" (ngModelChange)="load()" /></label>
      <select aria-label="Class" [(ngModel)]="form.classId" (ngModelChange)="onClass()">
        <option value="">Class</option>
        @for (cls of classOptions(); track cls.id) { <option [value]="cls.id">{{ cls.name }}</option> }
      </select>
      <select aria-label="Section" [(ngModel)]="form.sectionId" (ngModelChange)="onSection()">
        <option value="">Section</option>
        @for (section of sections(); track section.id) { <option [value]="section.id">{{ section.name }}</option> }
      </select>
    </div>

    @if (canEdit) {
      <form class="card form" (ngSubmit)="save()">
        <select aria-label="Subject" [(ngModel)]="form.subjectId" name="subjectId"
          (ngModelChange)="loadTopics()">
          <option value="">Subject</option>
          @for (subject of subjectOptions(); track subject.id) { <option [value]="subject.id">{{ subject.name }}</option> }
        </select>
        @if (isAdmin) {
          <select aria-label="Teacher" [(ngModel)]="form.employeeId" name="employeeId">
            <option value="">Teacher</option>
            @for (teacher of teachers(); track teacher.id) { <option [value]="teacher.id">{{ teacher.fullName }}</option> }
          </select>
        }
        @for (d of days; track d.n) {
          <label>{{ d.name }}<input [(ngModel)]="topics[d.n]" [name]="'t'+d.n" maxlength="2000" /></label>
        }
        <p-button type="submit" label="Save week plan" [disabled]="!form.classId || !form.sectionId || !form.subjectId || (isAdmin && !form.employeeId)" />
      </form>
    }

    <div class="plans-table-scroll">
      <p-table [value]="plans()" responsiveLayout="scroll" styleClass="weekly-plans-table"
        [tableStyle]="{ 'min-width': '980px' }">
        <ng-template pTemplate="header">
          <tr>
            <th>Subject / class</th>
            @for (d of days; track d.n) { <th>{{ d.name }}</th> }
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-plan>
          <tr>
            <td><strong>{{ plan.subject }}</strong><small>{{ plan.className }} {{ plan.sectionName }} · {{ plan.teacher }}</small></td>
            @for (d of days; track d.n) { <td>{{ topicFor(plan, d.n) || '—' }}</td> }
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="7">No topics published for this week yet.</td></tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .toolbar { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr)); gap: 12px; margin-bottom: 16px; align-items: end; }
    .toolbar label, .form label { display: grid; gap: 6px; min-width: 0; color: var(--muted); font-size: 12px; font-weight: 600; }
    .card { min-width: 0; background: white; border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
    .form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; align-items: start; }
    input, select { width: 100%; min-width: 0; min-height: 40px; font: inherit; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--line); background: white; color: var(--ink); }
    .plans-table-scroll { width: 100%; max-width: 100%; overflow-x: auto; background: white; border: 1px solid var(--line); border-radius: 12px; }
    :host ::ng-deep .weekly-plans-table .p-datatable-table { table-layout: fixed; }
    :host ::ng-deep .weekly-plans-table .p-datatable-thead > tr > th,
    :host ::ng-deep .weekly-plans-table .p-datatable-tbody > tr > td { width: 140px; white-space: normal; overflow-wrap: anywhere; vertical-align: top; }
    :host ::ng-deep .weekly-plans-table .p-datatable-thead > tr > th:first-child,
    :host ::ng-deep .weekly-plans-table .p-datatable-tbody > tr > td:first-child { width: 140px; }
    small { display: block; color: var(--muted); }
    .ok { background: #e5f8f1; color: #087d68; padding: 8px; border-radius: 8px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 8px; border-radius: 8px; }
    @media (max-width: 640px) { .form { grid-template-columns: minmax(0, 1fr); } }
  `]
})
export class LessonPlansComponent implements OnInit {
  names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  days = [
    { n: 1, name: 'Monday' }, { n: 2, name: 'Tuesday' }, { n: 3, name: 'Wednesday' },
    { n: 4, name: 'Thursday' }, { n: 5, name: 'Friday' }, { n: 6, name: 'Saturday' }
  ];
  canEdit = false;
  isAdmin = false;
  weekStart = '';
  classes = signal<any[]>([]);
  sections = signal<any[]>([]);
  subjects = signal<any[]>([]);
  assignments = signal<any[]>([]);
  teachers = signal<any[]>([]);
  plans = signal<any[]>([]);
  topics: Record<number, string> = { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' };
  form = { classId: '', sectionId: '', subjectId: '', employeeId: '' };
  notice = signal<string | null>(null);
  error = signal<string | null>(null);

  constructor(private api: ApiService, public ctx: SchoolContextService, auth: AuthService) {
    this.canEdit = auth.hasRole('SchoolAdmin') || auth.hasRole('Teacher');
    this.isAdmin = auth.hasRole('SchoolAdmin');
    const d = new Date();
    const iso = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - (iso - 1) + (auth.hasRole('Parent') || auth.hasRole('Student') ? 7 : 0));
    this.weekStart = d.toISOString().slice(0, 10);
  }

  ngOnInit() {
    if (!this.ctx.schoolId) return;
    this.api.getClasses(this.ctx.schoolId).subscribe({ next: c => this.classes.set(c) });
    this.api.getSubjects(this.ctx.schoolId).subscribe({ next: s => this.subjects.set(s) });
    if (!this.isAdmin && this.canEdit) {
      this.api.getTeacherAssignments(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
        next: assignments => { this.assignments.set(assignments); if (this.form.classId) this.onClass(); },
        error: () => this.error.set('Could not load your teaching assignments.')
      });
    }
    if (this.isAdmin) {
      this.api.getEmployees(this.ctx.schoolId, 1, 100).subscribe({
        next: r => this.teachers.set((r.items || []).map((e: any) => ({ ...e, fullName: `${e.firstName} ${e.lastName}` })))
      });
    }
    this.load();
  }

  onClass() {
    const cls = this.classes().find(c => c.id === this.form.classId);
    const assignedSections = this.assignments().filter(a => a.classId === this.form.classId);
    this.sections.set(this.isAdmin ? cls?.sections || [] :
      (cls?.sections || []).filter((s: any) => assignedSections.some(a => a.sectionId === s.id)));
    this.form.sectionId = this.sections()[0]?.id || '';
    this.form.subjectId = '';
    this.loadTopics();
    this.load();
  }

  onSection() {
    this.form.subjectId = '';
    this.loadTopics();
    this.load();
  }

  classOptions() {
    if (this.isAdmin) return this.classes();
    const ids = new Set(this.assignments().map(a => a.classId));
    return this.classes().filter(c => ids.has(c.id));
  }

  subjectOptions() {
    if (this.isAdmin) return this.subjects();
    const ids = new Set(this.assignments()
      .filter(a => a.sectionId === this.form.sectionId)
      .map(a => a.subjectId));
    return this.subjects().filter(s => ids.has(s.id));
  }

  loadTopics() {
    this.topics = { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' };
    const plan = this.plans().find(p => p.sectionId === this.form.sectionId && p.subjectId === this.form.subjectId);
    for (const day of plan?.days || []) this.topics[day.dayOfWeek] = day.topic;
  }

  load() {
    if (!this.ctx.schoolId || !this.weekStart) return;
    this.api.getLessonPlans(this.ctx.schoolId, this.weekStart, this.form.sectionId || undefined).subscribe({
      next: p => { this.plans.set(p); this.loadTopics(); },
      error: () => this.error.set('Could not load lesson plans.')
    });
  }

  save() {
    this.api.saveLessonPlan(this.ctx.schoolId, {
      academicYearId: this.ctx.academicYearId,
      weekStart: this.weekStart,
      classId: this.form.classId,
      sectionId: this.form.sectionId,
      subjectId: this.form.subjectId,
      ...(this.isAdmin ? { employeeId: this.form.employeeId } : {}),
      days: this.days.map(d => ({ dayOfWeek: d.n, topic: this.topics[d.n] || '' }))
    }).subscribe({
      next: () => { this.notice.set('Week plan saved.'); this.load(); },
      error: e => this.error.set(e?.error?.error || 'Could not save the plan.')
    });
  }

  topicFor(plan: any, dayOfWeek: number): string {
    return plan.days?.find((d: any) => d.dayOfWeek === dayOfWeek)?.topic ?? '';
  }
}
