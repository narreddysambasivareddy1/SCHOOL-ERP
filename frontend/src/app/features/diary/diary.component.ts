import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, EditorModule, FileUploadModule, TableModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">CLASS WORK</div>
      <h1>Daily class diary & homework</h1>
      <p class="text-muted">Submit a digital card or a scanned diary. Deadline {{ deadline() || '16:30' }} (school time).</p>
    </div>
    @if (notice()) { <div class="ok">{{ notice() }}</div> }
    @if (error()) { <div class="alert">{{ error() }}</div> }

    <div class="toolbar">
      <input type="date" [(ngModel)]="date" (ngModelChange)="refresh()" />
      <select aria-label="Class" [(ngModel)]="form.classId" (ngModelChange)="onClass()">
        <option value="">Class</option>
        @for (cls of classOptions(); track cls.id) { <option [value]="cls.id">{{ cls.name }}</option> }
      </select>
      <select aria-label="Section" [(ngModel)]="form.sectionId" (ngModelChange)="onSection()">
        <option value="">Section</option>
        @for (section of sections(); track section.id) { <option [value]="section.id">{{ section.name }}</option> }
      </select>
      <select aria-label="Subject" [(ngModel)]="form.subjectId">
        <option value="">Subject</option>
        @for (subject of subjectOptions(); track subject.id) { <option [value]="subject.id">{{ subject.name }}</option> }
      </select>
      @if (admin) {
        <select aria-label="Teacher" [(ngModel)]="form.employeeId">
          <option value="">Teacher</option>
          @for (teacher of teachers(); track teacher.id) { <option [value]="teacher.id">{{ teacher.fullName }}</option> }
        </select>
      }
    </div>

    @if (canEdit) {
      <div class="split">
        <form class="card" (ngSubmit)="saveDigital()">
          <h3>Digital card</h3>
          <label>Class notes</label>
          <p-editor [(ngModel)]="form.notes" name="notes" [style]="{ height: '180px' }" />
          <label>Homework</label>
          <p-editor [(ngModel)]="form.homework" name="hw" [style]="{ height: '140px' }" />
          <p-button type="submit" label="Publish card" [disabled]="!form.classId || !form.sectionId || (admin && !form.employeeId)" />
        </form>
        <div class="card">
          <h3>Scan / PDF upload</h3>
          <p-fileUpload mode="basic" chooseLabel="Choose and upload scan" accept=".pdf,.png,.jpg,.jpeg,.webp"
            [maxFileSize]="8000000" [auto]="true" [customUpload]="true"
            (uploadHandler)="upload($event.files)" />
        </div>
      </div>
    }

    @if (admin) {
      <div class="card">
        <h3>Compliance · {{ compliance()?.submitted || 0 }} submitted · {{ compliance()?.pending || 0 }} pending</h3>
        <label>Daily deadline <input type="time" [(ngModel)]="deadlineValue" /></label>
        <p-button label="Save deadline" [outlined]="true" (onClick)="saveDeadline()" />
        <p-button label="Remind pending teachers" (onClick)="remind()" />
        <p-table [value]="compliance()?.rows || []" responsiveLayout="scroll">
          <ng-template pTemplate="header"><tr><th>Teacher</th><th>Section</th><th>Status</th></tr></ng-template>
          <ng-template pTemplate="body" let-r>
            <tr><td>{{ r.teacher }}</td><td>{{ r.className }} {{ r.sectionName }}</td><td>{{ r.status }}</td></tr>
          </ng-template>
        </p-table>
      </div>
    }

    <div class="cards">
      @for (d of diaries(); track d.id) {
        <article class="slide">
          <header>{{ d.className }} {{ d.sectionName }} · {{ d.subject || 'General' }}</header>
          <small>{{ d.teacher }} · {{ d.mode }}{{ d.isLate ? ' · late' : '' }}</small>
          @if (d.notes) { <div class="rich-text" [innerHTML]="d.notes"></div> }
          @if (d.homework) { <div class="hw"><strong>Homework</strong><div class="rich-text" [innerHTML]="d.homework"></div></div> }
          @if (d.url) { <p-button label="Download scan" [link]="true" (onClick)="downloadScan(d)" /> }
        </article>
      } @empty { <p class="text-muted">No diary cards for this date.</p> }
    </div>
  `,
  styles: [`
    .toolbar { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr)); gap: 12px; margin-bottom: 16px; align-items: end; }
    .toolbar select { width: 100%; min-width: 0; min-height: 40px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: white; color: var(--ink); font: inherit; }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .card, .slide { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 14px; }
    input { font: inherit; width: 100%; box-sizing: border-box; margin: 6px 0; padding: 8px; border-radius: 8px; border: 1px solid var(--line); }
    .cards { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 12px; margin-top: 16px; }
    .slide header { font-weight: 800; color: var(--navy); }
    .hw { background: #f8fafc; padding: 8px; border-radius: 8px; }
    .rich-text { overflow-wrap: anywhere; }
    .ok { background: #e5f8f1; color: #087d68; padding: 8px; border-radius: 8px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 8px; border-radius: 8px; }
    @media (max-width: 800px) { .split { grid-template-columns: 1fr; } }
  `]
})
export class DiaryComponent implements OnInit {
  admin = false;
  canEdit = false;
  date = new Date().toISOString().slice(0, 10);
  deadline = signal<string | null>(null);
  classes = signal<any[]>([]);
  sections = signal<any[]>([]);
  subjects = signal<any[]>([]);
  teachers = signal<any[]>([]);
  assignments = signal<any[]>([]);
  diaries = signal<any[]>([]);
  compliance = signal<any>(null);
  form = { classId: '', sectionId: '', subjectId: '', employeeId: '', notes: '', homework: '' };
  deadlineValue = '16:30';
  notice = signal<string | null>(null);
  error = signal<string | null>(null);

  constructor(private api: ApiService, public ctx: SchoolContextService, auth: AuthService) {
    this.admin = auth.hasRole('SchoolAdmin');
    this.canEdit = this.admin || auth.hasRole('Teacher');
  }

  ngOnInit() {
    if (!this.ctx.schoolId) return;
    this.api.getClasses(this.ctx.schoolId).subscribe({ next: c => this.classes.set(c) });
    this.api.getSubjects(this.ctx.schoolId).subscribe({ next: s => this.subjects.set(s) });
    if (!this.admin && this.canEdit) {
      this.api.getTeacherAssignments(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
        next: assignments => { this.assignments.set(assignments); if (this.form.classId) this.onClass(); },
        error: () => this.error.set('Could not load your teaching assignments.')
      });
    }
    if (this.admin) {
      this.api.getEmployees(this.ctx.schoolId, 1, 100).subscribe({
        next: r => this.teachers.set((r.items || []).map((e: any) => ({ ...e, fullName: `${e.firstName} ${e.lastName}` })))
      });
    }
    this.api.getTimetableSettings(this.ctx.schoolId).subscribe({
      next: s => { this.deadline.set(s.diaryDeadline); this.deadlineValue = s.diaryDeadline; },
      error: () => this.error.set('Could not load diary settings.')
    });
    this.refresh();
  }

  onClass() {
    const cls = this.classes().find(c => c.id === this.form.classId);
    const assignedSections = this.assignments().filter(a => a.classId === this.form.classId);
    this.sections.set(this.admin ? cls?.sections || [] :
      (cls?.sections || []).filter((s: any) => assignedSections.some(a => a.sectionId === s.id)));
    this.form.sectionId = this.sections()[0]?.id || '';
    this.form.subjectId = '';
    this.refresh();
  }

  onSection() {
    this.form.subjectId = '';
    this.refresh();
  }

  classOptions() {
    if (this.admin) return this.classes();
    const ids = new Set(this.assignments().map(a => a.classId));
    return this.classes().filter(c => ids.has(c.id));
  }

  subjectOptions() {
    if (this.admin) return this.subjects();
    const ids = new Set(this.assignments()
      .filter(a => a.sectionId === this.form.sectionId)
      .map(a => a.subjectId));
    return this.subjects().filter(s => ids.has(s.id));
  }

  refresh() {
    this.api.getDiaries(this.ctx.schoolId, this.date, this.form.sectionId || undefined).subscribe({ next: d => this.diaries.set(d) });
    if (this.admin) {
      this.api.getDiaryCompliance(this.ctx.schoolId, this.ctx.academicYearId, this.date).subscribe({ next: c => this.compliance.set(c) });
    }
  }

  saveDigital() {
    this.api.saveDiary(this.ctx.schoolId, {
      academicYearId: this.ctx.academicYearId, date: this.date,
      classId: this.form.classId, sectionId: this.form.sectionId, subjectId: this.form.subjectId || null,
      ...(this.admin ? { employeeId: this.form.employeeId } : {}),
      notes: this.form.notes, homework: this.form.homework
    }).subscribe({
      next: r => { this.notice.set(r.isLate ? 'Saved after the deadline.' : 'Diary card published.'); this.refresh(); },
      error: e => this.error.set(e?.error?.error || 'Could not save diary.')
    });
  }

  upload(files: File[]) {
    const file = files[0];
    if (!file) return;
    this.api.uploadDiaryScan(
      this.ctx.schoolId, this.ctx.academicYearId, this.date, this.form.classId, this.form.sectionId,
      this.form.subjectId || null, file, this.admin ? this.form.employeeId : undefined)
      .subscribe({
        next: () => { this.notice.set('Scan uploaded.'); this.refresh(); },
        error: e => this.error.set(e?.error?.error || 'Upload failed.')
      });
  }

  saveDeadline() {
    this.api.saveTimetableSettings(this.ctx.schoolId, this.deadlineValue).subscribe({
      next: () => { this.deadline.set(this.deadlineValue); this.notice.set('Diary deadline updated.'); },
      error: e => this.error.set(e?.error?.error || 'Could not save the deadline.')
    });
  }

  downloadScan(diary: any) {
    this.api.getDiaryScan(this.ctx.schoolId, diary.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = diary.fileName || 'class-diary-scan';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.error.set('Could not download the diary scan.')
    });
  }

  remind() {
    this.api.remindDiary(this.ctx.schoolId, this.ctx.academicYearId, this.date).subscribe({
      next: r => this.notice.set(`Reminder sent to ${r.reminded} teacher(s).`),
      error: () => this.error.set('Could not send reminders.')
    });
  }
}
