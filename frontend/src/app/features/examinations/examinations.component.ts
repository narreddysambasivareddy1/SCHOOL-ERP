import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-examinations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">ACADEMICS</div>
      <h1>Examinations & marksheets</h1>
      <p class="text-muted">Draft, approve and publish results. Students only see published marksheets.</p>
    </div>

    @if (canCreate) {
      <form class="card" (ngSubmit)="create()">
        <strong>Create examination</strong>
        <div class="row">
          <input [(ngModel)]="name" name="name" placeholder="Name e.g. Term 1" required />
          <input [(ngModel)]="term" name="term" placeholder="Term / assessment type" />
          <button type="submit" [disabled]="saving()">Create</button>
        </div>
      </form>
    }

    @if (error()) { <div class="alert">{{ error() }}</div> }
    @if (loading()) { <p class="text-muted">Loading…</p> }
    @else if (!exams().length) { <div class="empty">No examinations for this academic year.</div> }
    @else {
      <div class="list">
        @for (e of visibleExams(); track e.id) {
          <div class="item">
            <div>
              <strong>{{ e.name }}</strong>
              <small>{{ e.term || '—' }} · {{ e.isPublished ? 'Published' : 'Draft' }}</small>
            </div>
            @if (canPublish && !e.isPublished) {
              <button type="button" (click)="publish(e.id)">Publish</button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    input { height: 36px; border: 1px solid var(--line); border-radius: 8px; padding: 0 10px; min-width: 160px; }
    button { background: var(--primary); color: white; border: 0; border-radius: 8px; padding: 8px 12px; font-weight: 700; cursor: pointer; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .item { background: white; border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
    .item small { display: block; color: var(--muted); font-size: 11px; margin-top: 4px; }
    .empty { padding: 24px; text-align: center; color: var(--muted); background: white; border: 1px dashed var(--line); border-radius: 12px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px 12px; border-radius: 8px; }
  `]
})
export class ExaminationsComponent implements OnInit {
  exams = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  name = '';
  term = '';
  canCreate = false;
  canPublish = false;

  constructor(private api: ApiService, public ctx: SchoolContextService, private auth: AuthService) {
    this.canCreate = this.auth.hasRole('SchoolAdmin') || this.auth.hasRole('Teacher');
    this.canPublish = this.auth.hasRole('SchoolAdmin');
  }

  visibleExams() {
    const all = this.exams();
    if (this.auth.hasRole('Student') || this.auth.hasRole('Parent')) return all.filter(e => e.isPublished);
    return all;
  }

  ngOnInit() {
    if (!this.ctx.schoolId || !this.ctx.academicYearId) { this.loading.set(false); return; }
    this.api.getExaminations(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
      next: d => { this.exams.set(d); this.loading.set(false); },
      error: () => { this.error.set('Could not load examinations.'); this.loading.set(false); }
    });
  }

  create() {
    if (!this.name) return;
    this.saving.set(true);
    this.api.createExamination(this.ctx.schoolId, {
      name: this.name, term: this.term || null, academicYearId: this.ctx.academicYearId
    }).subscribe({
      next: () => { this.saving.set(false); this.name = ''; this.ngOnInit(); },
      error: () => { this.error.set('Could not create examination.'); this.saving.set(false); }
    });
  }

  publish(id: string) {
    this.api.publishExam(this.ctx.schoolId, id).subscribe({
      next: () => this.ngOnInit(),
      error: (e) => this.error.set(e?.error?.error ?? 'Publish failed.')
    });
  }
}
