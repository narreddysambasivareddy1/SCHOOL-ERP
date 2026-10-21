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
      <p class="text-muted">Map Monday–Saturday topics by Friday at {{ weeklyDeadline() || '18:00' }}. Families see the same week on this page.</p>
    </div>
    @if (notice()) { <div class="ok">{{ notice() }}</div> }
    @if (error()) { <div class="alert">{{ error() }}</div> }

    @if (isAdmin) {
      <div class="deadline-card">
        <label>Weekly plan deadline (Friday, school local time)
          <input type="time" [(ngModel)]="weeklyDeadlineValue" />
        </label>
        <p-button label="Save deadline" [outlined]="true" [disabled]="!settingsLoaded()" (onClick)="saveDeadline()" />
      </div>
    }

    <div class="filters card">
      <label>Academic week
        <input type="date" [(ngModel)]="weekStart" (ngModelChange)="load()" />
      </label>
      <label>Class
        <select aria-label="Class" [(ngModel)]="form.classId" (ngModelChange)="onClass()">
        <option value="">Select class</option>
        @for (cls of classOptions(); track cls.id) { <option [value]="cls.id">{{ cls.name }}</option> }
        </select>
      </label>
      <label>Section
        <select aria-label="Section" [(ngModel)]="form.sectionId" (ngModelChange)="onSection()">
        <option value="">Select section</option>
        @for (section of sections(); track section.id) { <option [value]="section.id">{{ section.name }}</option> }
        </select>
      </label>
    </div>

    @if (canEdit) {
      <form class="card form" (ngSubmit)="save()">
        <header class="form-heading">
          <div>
            <h2>Plan the week</h2>
            <p>Add one topic per day. Changes are shared with families.</p>
          </div>
          <span class="week-chip">{{ weekStart || 'Choose a week' }}</span>
        </header>
        <div class="plan-fields">
          <label>Subject
            <select aria-label="Subject" [(ngModel)]="form.subjectId" name="subjectId"
              (ngModelChange)="loadTopics()">
              <option value="">Select subject</option>
              @for (subject of subjectOptions(); track subject.id) { <option [value]="subject.id">{{ subject.name }}</option> }
            </select>
          </label>
        @if (isAdmin) {
          <label>Teacher
            <select aria-label="Teacher" [(ngModel)]="form.employeeId" name="employeeId">
              <option value="">Select teacher</option>
              @for (teacher of teachers(); track teacher.id) { <option [value]="teacher.id">{{ teacher.fullName }}</option> }
            </select>
          </label>
        }
        </div>
        <div class="topic-grid">
        @for (d of days; track d.n) {
          <label class="topic-field">
            <span>{{ d.name }}</span>
            <input [(ngModel)]="topics[d.n]" [name]="'t'+d.n" maxlength="2000" [placeholder]="'Topic for ' + d.name" />
          </label>
        }
        </div>
        <div class="form-footer">
          <span>Saved for the selected academic week.</span>
          <p-button type="submit" label="Save weekly plan" icon="pi pi-check"
            [disabled]="!weekStart || !form.classId || !form.sectionId || !form.subjectId || (isAdmin && !form.employeeId)" />
        </div>
      </form>
    }

    <section class="published-plans">
      <div class="section-heading">
        <div><h2>Published topics</h2><p>Topics scheduled for the selected week.</p></div>
        <span class="plan-count">{{ plans().length }} {{ plans().length === 1 ? 'subject' : 'subjects' }}</span>
      </div>
      <div class="plans-mobile">
        @for (plan of plans(); track plan.id) {
          <article class="plan-card">
            <header><strong>{{ plan.subject }}</strong><small>{{ plan.className }} · {{ plan.sectionName }} · {{ plan.teacher }}</small></header>
            <div class="mobile-topic-list">
              @for (d of days; track d.n) {
                <div class="mobile-topic"><span>{{ d.name }}</span><p>{{ topicFor(plan, d.n) || 'No topic planned' }}</p></div>
              }
            </div>
          </article>
        } @empty {
          <div class="empty-state"><i class="pi pi-calendar"></i><strong>No topics published yet</strong><span>Choose a week, class, and section to get started.</span></div>
        }
      </div>
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
    </section>
  `,
  styles: [`
    .filters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
    .deadline-card { display: flex; align-items: end; gap: 12px; margin-bottom: 16px; padding: 14px 18px; background: white; border: 1px solid var(--line); border-radius: 12px; }
    .deadline-card label { display: grid; gap: 7px; color: #475569; font-size: 12px; font-weight: 700; }
    .deadline-card input { min-height: 40px; font: inherit; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; }
    .filters label, .plan-fields label { display: grid; gap: 7px; min-width: 0; color: #475569; font-size: 12px; font-weight: 700; }
    .card { min-width: 0; background: white; border: 1px solid var(--line); border-radius: 14px; padding: 18px; box-shadow: 0 2px 8px rgba(15,39,68,.03); }
    .form { display: grid; gap: 18px; margin-bottom: 28px; }
    input, select { width: 100%; min-width: 0; min-height: 42px; font: inherit; padding: 9px 12px; border-radius: 9px; border: 1px solid #d8e0eb; background: white; color: var(--ink); }
    input:focus, select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(36,99,235,.12); }
    .form-heading, .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    .form-heading h2, .section-heading h2 { margin: 0; color: var(--navy); font-size: 16px; font-weight: 750; }
    .form-heading p, .section-heading p { margin: 4px 0 0; color: var(--muted); font-size: 12px; }
    .week-chip, .plan-count { flex: none; padding: 6px 10px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: 11px; font-weight: 700; }
    .plan-fields, .topic-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .topic-field { display: grid; gap: 7px; min-width: 0; color: #475569; font-size: 12px; font-weight: 700; }
    .form-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 4px; }
    .form-footer > span { color: var(--muted); font-size: 11px; }
    .published-plans { margin-top: 26px; }
    .section-heading { margin-bottom: 12px; }
    .plans-mobile { display: none; }
    .plans-table-scroll { width: 100%; max-width: 100%; overflow-x: auto; background: white; border: 1px solid var(--line); border-radius: 12px; }
    :host ::ng-deep .weekly-plans-table .p-datatable-table { table-layout: fixed; }
    :host ::ng-deep .weekly-plans-table .p-datatable-thead > tr > th,
    :host ::ng-deep .weekly-plans-table .p-datatable-tbody > tr > td { width: 140px; white-space: normal; overflow-wrap: anywhere; vertical-align: top; }
    :host ::ng-deep .weekly-plans-table .p-datatable-thead > tr > th:first-child,
    :host ::ng-deep .weekly-plans-table .p-datatable-tbody > tr > td:first-child { width: 140px; }
    :host ::ng-deep .weekly-plans-table .p-datatable-thead > tr > th { padding: 12px; }
    :host ::ng-deep .weekly-plans-table .p-datatable-tbody > tr > td { padding: 12px; line-height: 1.5; }
    small { display: block; margin-top: 4px; color: var(--muted); }
    .plan-card { overflow: hidden; background: white; border: 1px solid var(--line); border-radius: 12px; }
    .plan-card header { padding: 14px 16px; background: #f8fafc; border-bottom: 1px solid var(--line); }
    .plan-card header strong { color: var(--navy); }
    .mobile-topic-list { padding: 4px 16px; }
    .mobile-topic { display: grid; grid-template-columns: 82px minmax(0, 1fr); gap: 10px; padding: 10px 0; border-bottom: 1px solid #edf1f6; }
    .mobile-topic:last-child { border-bottom: 0; }
    .mobile-topic span { color: var(--muted); font-size: 11px; font-weight: 700; }
    .mobile-topic p { margin: 0; overflow-wrap: anywhere; }
    .empty-state { display: grid; justify-items: center; gap: 7px; padding: 32px 16px; background: white; border: 1px dashed #cbd5e1; border-radius: 12px; color: var(--muted); text-align: center; }
    .empty-state i { color: var(--primary); font-size: 20px; }
    .empty-state strong { color: var(--navy); font-size: 13px; }
    .ok, .alert { margin-bottom: 12px; padding: 10px 12px; border-radius: 9px; }
    .ok { background: #e5f8f1; color: #087d68; }
    .alert { background: var(--warn-soft); color: var(--warn); }
    @media (max-width: 700px) {
      .filters, .plan-fields, .topic-grid { grid-template-columns: minmax(0, 1fr); }
      .deadline-card { align-items: stretch; flex-direction: column; }
      .form-heading { align-items: flex-start; flex-direction: column; }
      .form-footer { align-items: stretch; flex-direction: column; }
      .plans-mobile { display: grid; gap: 10px; }
      .plans-table-scroll { display: none; }
    }
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
  weeklyDeadline = signal<string | null>(null);
  settingsLoaded = signal(false);
  weeklyDeadlineValue = '18:00';
  diaryDeadlineValue = '16:30';
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
      this.api.getTimetableSettings(this.ctx.schoolId).subscribe({
        next: settings => {
          this.weeklyDeadline.set(settings.weeklyPlanDeadline);
          this.weeklyDeadlineValue = settings.weeklyPlanDeadline;
          this.diaryDeadlineValue = settings.diaryDeadline;
          this.settingsLoaded.set(true);
        },
        error: () => this.error.set('Could not load lesson-plan deadline settings.')
      });
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

  saveDeadline() {
    this.api.saveTimetableSettings(this.ctx.schoolId, this.diaryDeadlineValue, this.weeklyDeadlineValue).subscribe({
      next: settings => {
        this.weeklyDeadline.set(settings.weeklyPlanDeadline);
        this.weeklyDeadlineValue = settings.weeklyPlanDeadline;
        this.notice.set('Weekly lesson-plan deadline updated.');
      },
      error: e => this.error.set(e?.error?.error || 'Could not save lesson-plan deadline.')
    });
  }

  topicFor(plan: any, dayOfWeek: number): string {
    return plan.days?.find((d: any) => d.dayOfWeek === dayOfWeek)?.topic ?? '';
  }
}
