import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-lesson-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
      <select [(ngModel)]="form.classId" (ngModelChange)="onClass()">
        <option value="">Class</option>
        @for (c of classes(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
      </select>
      <select [(ngModel)]="form.sectionId" (ngModelChange)="load()">
        <option value="">Section</option>
        @for (s of sections(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
      </select>
    </div>

    @if (canEdit) {
      <form class="card form" (ngSubmit)="save()">
        <select [(ngModel)]="form.subjectId" name="subjectId" required>
          <option value="">Subject</option>
          @for (s of subjects(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
        </select>
        @for (d of days; track d.n) {
          <label>{{ d.name }}<input [(ngModel)]="topics[d.n]" [name]="'t'+d.n" /></label>
        }
        <button type="submit">Save week plan</button>
      </form>
    }

    <div class="grid">
      @for (p of plans(); track p.id) {
        <div class="card">
          <strong>{{ p.subject }}</strong>
          <small>{{ p.className }} {{ p.sectionName }} · {{ p.teacher }}</small>
          <ol>
            @for (d of p.days; track d.dayOfWeek) { <li>{{ names[d.dayOfWeek] }} — {{ d.topic }}</li> }
          </ol>
        </div>
      } @empty { <p class="text-muted">No topics published for this week yet.</p> }
    </div>
  `,
  styles: [`
    .toolbar, .form { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
    .form { flex-direction: column; }
    input, select, button { font: inherit; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--line); }
    button { background: var(--primary); color: white; border: 0; cursor: pointer; width: fit-content; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    small { display: block; color: var(--muted); }
    .ok { background: #e5f8f1; color: #087d68; padding: 8px; border-radius: 8px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 8px; border-radius: 8px; }
  `]
})
export class LessonPlansComponent implements OnInit {
  names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  days = [
    { n: 1, name: 'Monday' }, { n: 2, name: 'Tuesday' }, { n: 3, name: 'Wednesday' },
    { n: 4, name: 'Thursday' }, { n: 5, name: 'Friday' }, { n: 6, name: 'Saturday' }
  ];
  canEdit = false;
  weekStart = '';
  classes = signal<any[]>([]);
  sections = signal<any[]>([]);
  subjects = signal<any[]>([]);
  plans = signal<any[]>([]);
  topics: Record<number, string> = { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' };
  form = { classId: '', sectionId: '', subjectId: '' };
  notice = signal<string | null>(null);
  error = signal<string | null>(null);

  constructor(private api: ApiService, public ctx: SchoolContextService, auth: AuthService) {
    this.canEdit = auth.hasRole('SchoolAdmin') || auth.hasRole('Teacher');
    const d = new Date();
    const iso = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - (iso - 1));
    this.weekStart = d.toISOString().slice(0, 10);
  }

  ngOnInit() {
    if (!this.ctx.schoolId) return;
    this.api.getClasses(this.ctx.schoolId).subscribe({ next: c => this.classes.set(c) });
    this.api.getSubjects(this.ctx.schoolId).subscribe({ next: s => this.subjects.set(s) });
    this.load();
  }

  onClass() {
    const cls = this.classes().find(c => c.id === this.form.classId);
    this.sections.set(cls?.sections || []);
    this.form.sectionId = this.sections()[0]?.id || '';
    this.load();
  }

  load() {
    this.api.getLessonPlans(this.ctx.schoolId, this.weekStart, this.form.sectionId || undefined).subscribe({
      next: p => this.plans.set(p),
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
      days: this.days.map(d => ({ dayOfWeek: d.n, topic: this.topics[d.n] || '' }))
    }).subscribe({
      next: () => { this.notice.set('Week plan saved.'); this.load(); },
      error: e => this.error.set(e?.error?.error || 'Could not save the plan.')
    });
  }
}
