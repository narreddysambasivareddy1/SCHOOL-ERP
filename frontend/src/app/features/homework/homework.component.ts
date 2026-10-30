import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-homework',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">ACADEMICS</div>
      <h1>Homework & worksheets</h1>
      <p class="text-muted">Assign by class/section, publish for students and parents, and track submissions.</p>
    </div>

    @if (canCreate) {
      <form class="card form" (ngSubmit)="create()">
        <strong>New assignment</strong>
        <div class="row">
          <label>Teaching group
            <select [(ngModel)]="assignmentId" name="assignmentId" required>
              <option value="">Select assignment</option>
              @for (a of assignments(); track a.id) {
                <option [value]="a.id">{{ a.subject }} · {{ a.className }} {{ a.sectionName }}</option>
              }
            </select>
          </label>
          <label>Title
            <input [(ngModel)]="title" name="title" required placeholder="e.g. Algebra practice" />
          </label>
        </div>
        <label>Instructions
          <input [(ngModel)]="instructions" name="instructions" placeholder="Optional instructions" />
        </label>
        <div class="row">
          <label>Issue date <input type="date" [(ngModel)]="issueDate" name="issueDate" required /></label>
          <label>Due date <input type="date" [(ngModel)]="dueDate" name="dueDate" required /></label>
        </div>
        @if (formError()) { <div class="alert">{{ formError() }}</div> }
        <button type="submit" [disabled]="saving()">{{ saving() ? 'Publishing…' : 'Publish homework' }}</button>
      </form>
    }

    @if (error()) { <div class="alert">{{ error() }}</div> }
    @if (loading()) { <p class="text-muted">Loading…</p> }
    @else if (!items().length) { <div class="empty">No published homework yet.</div> }
    @else {
      <div class="list">
        @for (h of items(); track h.id) {
          <div class="item">
            <div>
              <strong>{{ h.title }}</strong>
              <small>Due {{ h.dueDate }} · {{ h.submissionCount }} submission(s)</small>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .sub, p { margin: 0 0 16px; }
    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 18px; display: flex; flex-direction: column; gap: 10px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 700; color: var(--muted); }
    input, select { height: 36px; border: 1px solid var(--line); border-radius: 8px; padding: 0 10px; font-size: 13px; }
    button { align-self: flex-start; background: var(--primary); color: white; border: 0; border-radius: 8px; padding: 9px 14px; font-weight: 700; cursor: pointer; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .item { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; }
    .item small { display: block; color: var(--muted); font-size: 11px; margin-top: 4px; }
    .empty, .alert { padding: 14px; border-radius: 10px; font-size: 13px; }
    .empty { background: var(--surface); border: 1px dashed var(--line); color: var(--muted); text-align: center; }
    .alert { background: var(--warn-soft); color: var(--warn); }
    @media (max-width: 700px) { .row { grid-template-columns: 1fr; } }
  `]
})
export class HomeworkComponent implements OnInit {
  items = signal<any[]>([]);
  assignments = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  formError = signal<string | null>(null);
  assignmentId = '';
  title = '';
  instructions = '';
  issueDate = new Date().toISOString().slice(0, 10);
  dueDate = new Date().toISOString().slice(0, 10);
  canCreate = false;

  constructor(private api: ApiService, public ctx: SchoolContextService, private auth: AuthService) {
    this.canCreate = this.auth.hasRole('SchoolAdmin') || this.auth.hasRole('Teacher');
  }

  ngOnInit() {
    if (!this.ctx.schoolId) { this.loading.set(false); return; }
    this.api.getHomework(this.ctx.schoolId).subscribe({
      next: d => { this.items.set(d); this.loading.set(false); },
      error: () => { this.error.set('Could not load homework.'); this.loading.set(false); }
    });
    if (this.canCreate && this.ctx.academicYearId) {
      this.api.getTeacherAssignments(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
        next: a => this.assignments.set(a.filter((x: any) => x.canSetHomework !== false))
      });
    }
  }

  create() {
    this.formError.set(null);
    if (!this.assignmentId || !this.title) { this.formError.set('Assignment and title are required.'); return; }
    this.saving.set(true);
    this.api.createHomework(this.ctx.schoolId, {
      teacherAssignmentId: this.assignmentId,
      title: this.title,
      instructions: this.instructions || null,
      issueDate: this.issueDate,
      dueDate: this.dueDate
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.title = '';
        this.ngOnInit();
      },
      error: (e) => {
        this.formError.set(e?.error?.error ?? 'Could not publish. Teachers can only assign their own groups.');
        this.saving.set(false);
      }
    });
  }
}
