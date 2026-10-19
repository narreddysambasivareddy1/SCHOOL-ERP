import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
      <select [(ngModel)]="form.classId" (ngModelChange)="onClass()">
        <option value="">Class</option>
        @for (c of classes(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
      </select>
      <select [(ngModel)]="form.sectionId" (ngModelChange)="refresh()">
        <option value="">Section</option>
        @for (s of sections(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
      </select>
      <select [(ngModel)]="form.subjectId">
        <option value="">Subject</option>
        @for (s of subjects(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
      </select>
    </div>

    @if (canEdit) {
      <div class="split">
        <form class="card" (ngSubmit)="saveDigital()">
          <h3>Digital card</h3>
          <label>Class notes</label>
          <textarea [(ngModel)]="form.notes" name="notes" rows="5"></textarea>
          <label>Homework</label>
          <textarea [(ngModel)]="form.homework" name="hw" rows="4"></textarea>
          <button type="submit">Publish card</button>
        </form>
        <div class="card">
          <h3>Scan / PDF upload</h3>
          <input type="file" accept="image/*,.pdf" (change)="upload($event)" />
        </div>
      </div>
    }

    @if (admin) {
      <div class="card">
        <h3>Compliance · {{ compliance()?.submitted || 0 }} submitted · {{ compliance()?.pending || 0 }} pending</h3>
        <button type="button" (click)="remind()">Remind pending teachers</button>
        @for (r of compliance()?.rows || []; track r.employeeId + r.sectionId) {
          <div class="row"><span>{{ r.teacher }} · {{ r.className }} {{ r.sectionName }}</span><strong>{{ r.status }}</strong></div>
        }
      </div>
    }

    <div class="cards">
      @for (d of diaries(); track d.id) {
        <article class="slide">
          <header>{{ d.className }} {{ d.sectionName }} · {{ d.subject || 'General' }}</header>
          <small>{{ d.teacher }} · {{ d.mode }}{{ d.isLate ? ' · late' : '' }}</small>
          @if (d.notes) { <p>{{ d.notes }}</p> }
          @if (d.homework) { <p class="hw"><strong>Homework</strong> {{ d.homework }}</p> }
          @if (d.url) { <a [href]="d.url" target="_blank">Open scan</a> }
        </article>
      } @empty { <p class="text-muted">No diary cards for this date.</p> }
    </div>
  `,
  styles: [`
    .toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .card, .slide { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 14px; }
    textarea, input, select, button { font: inherit; width: 100%; box-sizing: border-box; margin: 6px 0; padding: 8px; border-radius: 8px; border: 1px solid var(--line); }
    button { background: var(--primary); color: white; border: 0; cursor: pointer; width: auto; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 12px; margin-top: 16px; }
    .slide header { font-weight: 800; color: var(--navy); }
    .hw { background: #f8fafc; padding: 8px; border-radius: 8px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
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
  diaries = signal<any[]>([]);
  compliance = signal<any>(null);
  form = { classId: '', sectionId: '', subjectId: '', notes: '', homework: '' };
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
    this.api.getTimetableSettings(this.ctx.schoolId).subscribe({ next: s => this.deadline.set(s.diaryDeadline) });
    this.refresh();
  }

  onClass() {
    const cls = this.classes().find(c => c.id === this.form.classId);
    this.sections.set(cls?.sections || []);
    this.form.sectionId = this.sections()[0]?.id || '';
    this.refresh();
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
      notes: this.form.notes, homework: this.form.homework
    }).subscribe({
      next: r => { this.notice.set(r.isLate ? 'Saved after the deadline.' : 'Diary card published.'); this.refresh(); },
      error: e => this.error.set(e?.error?.error || 'Could not save diary.')
    });
  }

  upload(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.api.uploadDiaryScan(this.ctx.schoolId, this.ctx.academicYearId, this.date, this.form.classId, this.form.sectionId, this.form.subjectId || null, file)
      .subscribe({
        next: () => { this.notice.set('Scan uploaded.'); this.refresh(); },
        error: e => this.error.set(e?.error?.error || 'Upload failed.')
      });
  }

  remind() {
    this.api.remindDiary(this.ctx.schoolId, this.ctx.academicYearId, this.date).subscribe({
      next: r => this.notice.set(`Reminder sent to ${r.reminded} teacher(s).`),
      error: () => this.error.set('Could not send reminders.')
    });
  }
}
