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
      <h1>Examinations & results</h1>
      <p class="text-muted">Enter marks before publishing. Students and parents only see published results for their own record.</p>
    </div>

    @if (canCreate) {
      <form class="card" (ngSubmit)="create()">
        <strong>Create examination</strong>
        <div class="row">
          <input [(ngModel)]="name" name="name" placeholder="Name e.g. Term 1" required />
          <input [(ngModel)]="term" name="term" placeholder="Term / assessment type" />
          <button class="btn-primary" type="submit" [disabled]="saving()">Create</button>
        </div>
      </form>
    }

    @if (error()) { <div class="alert">{{ error() }}</div> }
    @if (notice()) { <div class="ok">{{ notice() }}</div> }
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
            <div class="actions">
              @if (canEnter && !e.isPublished) {
                <button class="btn-primary" type="button" (click)="startMarks(e)">Enter marks</button>
              }
              @if (e.isPublished || canEnter) {
                <button class="btn-primary" type="button" (click)="startResult(e)">View result</button>
              }
              @if (canPublish && !e.isPublished) {
                <button class="btn-primary" type="button" (click)="publish(e.id)">Publish</button>
              }
            </div>
          </div>
        }
      </div>
    }

    @if (marksExam()) {
      <form class="card" (ngSubmit)="saveMarks()">
        <strong>Marks · {{ marksExam().name }}</strong>
        <div class="row">
          <select [(ngModel)]="markStudentId" name="markStudent" required>
            <option value="">Student</option>
            @for (s of students(); track s.id) {
              <option [value]="s.id">{{ s.firstName }} {{ s.lastName }} · {{ s.studentCode }}</option>
            }
          </select>
          <select [(ngModel)]="subjectId" name="subject" required>
            <option value="">Subject</option>
            @for (s of subjects(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
          </select>
          <input type="number" min="0" step="0.5" [(ngModel)]="marksObtained" name="marks" [disabled]="absent" placeholder="Marks" />
          <input type="number" min="1" step="0.5" [(ngModel)]="maxMarks" name="max" placeholder="Max" required />
          <label class="chk"><input type="checkbox" [(ngModel)]="absent" name="absent" /> Absent</label>
          <button class="btn-primary" type="submit" [disabled]="saving()">Save marks</button>
        </div>
      </form>
    }

    @if (resultExam()) {
      <form class="card" (ngSubmit)="loadResult()">
        <strong>Result · {{ resultExam().name }}</strong>
        <div class="row">
          @if (canEnter) {
            <select [(ngModel)]="resultStudentId" name="resultStudent" required>
              <option value="">Student</option>
              @for (s of students(); track s.id) {
                <option [value]="s.id">{{ s.firstName }} {{ s.lastName }} · {{ s.studentCode }}</option>
              }
            </select>
          } @else if (children().length) {
            <select [(ngModel)]="resultStudentId" name="resultChild" required>
              @for (c of children(); track c.studentId) {
                <option [value]="c.studentId">{{ c.firstName }} {{ c.lastName }}</option>
              }
            </select>
          } @else {
            <span class="text-muted">{{ selfName || 'Your record' }}</span>
          }
          <button class="btn-primary" type="submit">Load result</button>
        </div>
      </form>
    }

    @if (result()) {
      <div class="card">
        <strong>Marksheet</strong>
        <p class="text-muted">{{ result().percentage }}% · {{ result().total }} / {{ result().maxTotal }}</p>
        @for (m of result().marks; track m.subject) {
          <div>{{ m.subject }} — {{ m.isAbsent ? 'Absent' : m.marksObtained + ' / ' + m.maxMarks }}</div>
        }
        @if (!result().marks?.length) { <p class="text-muted">No marks have been entered for this student.</p> }
      </div>
    }
  `,
  styles: [`
    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; align-items: center; }
    input, select { height: 36px; border: 1px solid var(--line); border-radius: 8px; padding: 0 10px; min-width: 140px; background: var(--surface); color: var(--ink); }
    .chk { font-size: 13px; display: flex; gap: 6px; align-items: center; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .item { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .item small { display: block; color: var(--muted); font-size: 11px; margin-top: 4px; }
    .empty { padding: 24px; text-align: center; color: var(--muted); background: var(--surface); border: 1px dashed var(--line); border-radius: 12px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px 12px; border-radius: 8px; }
    .ok { background: #e5f8f1; color: #087d68; padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; }
  `]
})
export class ExaminationsComponent implements OnInit {
  exams = signal<any[]>([]);
  students = signal<any[]>([]);
  subjects = signal<any[]>([]);
  children = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  notice = signal<string | null>(null);
  name = '';
  term = '';
  result = signal<any>(null);
  marksExam = signal<any>(null);
  resultExam = signal<any>(null);
  markStudentId = '';
  resultStudentId = '';
  subjectId = '';
  marksObtained: number | null = null;
  maxMarks = 100;
  absent = false;
  selfName = '';
  canCreate = false;
  canEnter = false;
  canPublish = false;

  constructor(private api: ApiService, public ctx: SchoolContextService, private auth: AuthService) {
    this.canCreate = auth.hasRole('SchoolAdmin') || auth.hasRole('PlatformSuperAdmin') || auth.hasRole('Teacher');
    this.canEnter = this.canCreate;
    this.canPublish = auth.hasRole('SchoolAdmin') || auth.hasRole('PlatformSuperAdmin');
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
    if (this.canEnter) {
      this.api.getStudents(this.ctx.schoolId, this.ctx.academicYearId, 1, 100).subscribe({
        next: page => this.students.set(page.items ?? [])
      });
      this.api.getSubjects(this.ctx.schoolId).subscribe({ next: rows => this.subjects.set(rows ?? []) });
    } else if (this.auth.hasRole('Student')) {
      this.api.getMyStudent(this.ctx.schoolId).subscribe({
        next: me => {
          this.resultStudentId = me.id;
          this.selfName = `${me.firstName} ${me.lastName}`;
        }
      });
    } else if (this.auth.hasRole('Parent')) {
      this.api.getParentChildren().subscribe({
        next: rows => {
          this.children.set(rows ?? []);
          this.resultStudentId = rows?.[0]?.studentId ?? '';
        }
      });
    }
  }

  create() {
    if (!this.name) return;
    this.saving.set(true);
    this.api.createExamination(this.ctx.schoolId, {
      name: this.name, term: this.term || null, academicYearId: this.ctx.academicYearId
    }).subscribe({
      next: () => { this.saving.set(false); this.name = ''; this.notice.set('Examination created.'); this.ngOnInit(); },
      error: () => { this.error.set('Could not create examination.'); this.saving.set(false); }
    });
  }

  publish(id: string) {
    this.api.publishExam(this.ctx.schoolId, id).subscribe({
      next: () => { this.notice.set('Results published.'); this.ngOnInit(); },
      error: (e) => this.error.set(e?.error?.error ?? 'Publish failed.')
    });
  }

  startMarks(exam: any) {
    this.marksExam.set(exam);
    this.resultExam.set(null);
    this.result.set(null);
  }

  startResult(exam: any) {
    this.resultExam.set(exam);
    this.marksExam.set(null);
    this.result.set(null);
  }

  saveMarks() {
    const exam = this.marksExam();
    if (!exam || !this.markStudentId || !this.subjectId || this.maxMarks <= 0) return;
    this.saving.set(true);
    this.error.set(null);
    this.api.enterMarks(this.ctx.schoolId, exam.id, [{
      studentId: this.markStudentId,
      subjectId: this.subjectId,
      marksObtained: this.absent ? null : Number(this.marksObtained),
      maxMarks: Number(this.maxMarks),
      isAbsent: this.absent,
      remarks: null
    }]).subscribe({
      next: () => { this.saving.set(false); this.notice.set('Marks saved.'); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.error ?? 'Could not save marks.'); }
    });
  }

  loadResult() {
    const exam = this.resultExam();
    if (!exam || !this.resultStudentId) {
      this.error.set('Choose the student whose result you want to see.');
      return;
    }
    this.api.getStudentResults(this.ctx.schoolId, exam.id, this.resultStudentId).subscribe({
      next: r => this.result.set(r),
      error: () => this.error.set('Could not load the result.')
    });
  }
}
