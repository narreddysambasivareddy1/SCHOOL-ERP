import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';

interface AttendanceRow { studentId: string; studentName: string; code: string; remarks: string; }

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">ATTENDANCE CENTRE</div>
      <h1>Attendance</h1>
      @if (isViewer) {
        <p class="text-muted">View-only for your role. Marking is limited to assigned teachers and attendance officers.</p>
      }
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Class</label>
        <select [(ngModel)]="selectedClassId" (ngModelChange)="onClassChange($event)">
          <option value="">Select class</option>
          @for (c of classes(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
      </div>
      <div class="filter-group">
        <label>Section</label>
        <select [(ngModel)]="selectedSectionId" [disabled]="!selectedClassId">
          <option value="">Select section</option>
          @for (s of sections(); track s.id) {
            <option [value]="s.id">{{ s.name }}</option>
          }
        </select>
      </div>
      <div class="filter-group">
        <label>Date</label>
        <input type="date" [(ngModel)]="selectedDate" [max]="todayStr" />
      </div>
      <button class="btn-primary" (click)="loadAttendance()" [disabled]="!canLoad || loadingSession()">
        {{ loadingSession() ? 'Loading…' : 'View' }}
      </button>
    </div>

    @if (apiError()) {
      <div class="alert-error">{{ apiError() }}</div>
    }

    <!-- Session already marked -->
    @if (session() && !markingMode()) {
      <div class="session-card">
        <div class="session-header">
          <div>
            <div class="session-title">{{ sessionClass }} · {{ sessionSection }}</div>
            <div class="session-meta">{{ session()!.date | date:'EEEE, d MMMM yyyy' }} · Marked by {{ session()!.markedBy }}</div>
          </div>
          <span class="badge badge-success">Marked</span>
        </div>
        <table class="att-table">
          <thead><tr><th>Student</th><th>Status</th><th>Remarks</th></tr></thead>
          <tbody>
            @for (r of session()!.records; track r.studentId) {
              <tr>
                <td>{{ r.studentName }}</td>
                <td><span class="badge" [class]="badgeClass(r.code)">{{ r.code }}</span></td>
                <td class="muted">{{ r.remarks || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Not yet marked — load students to mark -->
    @if (notMarked() && !markingMode()) {
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>Attendance not yet marked for this session.</p>
        @if (canMark) {
          <button class="btn-primary" (click)="startMarking()">Mark attendance</button>
        } @else {
          <p class="muted-sm">You need Teacher, AttendanceOfficer or SchoolAdmin role to mark attendance.</p>
        }
      </div>
    }

    <!-- Marking mode -->
    @if (markingMode()) {
      <div class="session-card">
        <div class="session-header">
          <div>
            <div class="session-title">Mark attendance — {{ sessionClass }} · {{ sessionSection }}</div>
            <div class="session-meta">{{ selectedDate | date:'EEEE, d MMMM yyyy' }}</div>
          </div>
          <div class="header-actions">
            <button class="btn-ghost" (click)="markAll('Present')">All present</button>
            <button class="btn-ghost" (click)="markAll('Absent')">All absent</button>
          </div>
        </div>

        @if (loadingStudents()) {
          <div class="loading-row">Loading students…</div>
        } @else {
          <table class="att-table">
            <thead><tr><th>Student</th><th>Status</th><th>Remarks</th></tr></thead>
            <tbody>
              @for (r of markRows(); track r.studentId) {
                <tr>
                  <td>{{ r.studentName }}</td>
                  <td>
                    <div class="status-pills">
                      @for (code of codes; track code) {
                        <button class="pill" [class.active]="r.code === code" [class]="'pill-' + code.toLowerCase()" (click)="r.code = code">{{ code }}</button>
                      }
                    </div>
                  </td>
                  <td><input class="remarks-input" [(ngModel)]="r.remarks" placeholder="Optional" /></td>
                </tr>
              }
            </tbody>
          </table>
          <div class="mark-footer">
            <span class="muted-sm">{{ presentCount }} present · {{ absentCount }} absent · {{ markRows().length }} total</span>
            <div class="footer-actions">
              <button class="btn-ghost" (click)="markingMode.set(false)">Cancel</button>
              <button class="btn-primary" (click)="submitAttendance()" [disabled]="saving()">
                {{ saving() ? 'Saving…' : 'Submit attendance' }}
              </button>
            </div>
          </div>
        }
      </div>
    }

    @if (!session() && !notMarked() && !markingMode() && !loadingSession()) {
      <div class="empty-state">
        <div class="empty-icon">🏫</div>
        <p>Select a class, section and date to view or mark attendance.</p>
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    h1 { margin: 4px 0; font-size: 22px; font-weight: 800; color: var(--navy); }
    .filter-bar { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 16px 20px; margin-bottom: 20px; box-shadow: var(--shadow); }
    .filter-group { display: flex; flex-direction: column; gap: 5px; }
    .filter-group label { font-size: 11px; font-weight: 700; color: #506078; text-transform: uppercase; letter-spacing: 0.4px; }
    select, input[type=date] { height: 36px; border: 1px solid var(--line); border-radius: 8px; padding: 0 10px; font-size: 13px; color: var(--ink); background: white; outline: none; min-width: 140px; }
    select:focus, input[type=date]:focus { border-color: #2463eb; }
    select:disabled { background: #f4f7fb; color: var(--muted); }
    .btn-primary { height: 36px; padding: 0 18px; background: #2463eb; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost { height: 34px; padding: 0 14px; background: white; color: var(--navy); border: 1px solid var(--line); border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-ghost:hover { background: #f4f7fb; }
    .alert-error { background: #fff0f0; border: 1px solid #f5c6c6; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #c0392b; margin-bottom: 16px; }
    .session-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
    .session-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--line); flex-wrap: wrap; gap: 10px; }
    .session-title { font-size: 14px; font-weight: 700; color: var(--navy); }
    .session-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .header-actions { display: flex; gap: 8px; }
    .att-table { width: 100%; border-collapse: collapse; }
    .att-table thead th { background: #f8fafc; color: #8290a4; font-size: 11px; letter-spacing: 0.6px; text-transform: uppercase; padding: 10px 20px; text-align: left; border-bottom: 1px solid var(--line); }
    .att-table tbody tr:hover { background: #fafbfd; }
    .att-table td { padding: 10px 20px; font-size: 13px; border-bottom: 1px solid var(--line); vertical-align: middle; }
    .att-table tbody tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
    .badge-success { background: #e5f8f1; color: #087d68; }
    .badge-present { background: #e5f8f1; color: #087d68; }
    .badge-absent { background: #fdecea; color: #c0392b; }
    .badge-late { background: #fff4db; color: #9a6900; }
    .badge-excused { background: #eaf3ff; color: #1c5cb7; }
    .muted { color: var(--muted); font-size: 12px; }
    .muted-sm { font-size: 12px; color: var(--muted); }
    .status-pills { display: flex; gap: 4px; flex-wrap: wrap; }
    .pill { padding: 4px 10px; border-radius: 20px; border: 1px solid var(--line); background: white; font-size: 11px; font-weight: 600; cursor: pointer; color: var(--muted); }
    .pill.active.pill-present { background: #e5f8f1; color: #087d68; border-color: #087d68; }
    .pill.active.pill-absent { background: #fdecea; color: #c0392b; border-color: #c0392b; }
    .pill.active.pill-late { background: #fff4db; color: #9a6900; border-color: #f5c97a; }
    .pill.active.pill-excused { background: #eaf3ff; color: #1c5cb7; border-color: #1c5cb7; }
    .remarks-input { border: 1px solid var(--line); border-radius: 6px; padding: 5px 8px; font-size: 12px; width: 100%; max-width: 200px; outline: none; }
    .remarks-input:focus { border-color: #2463eb; }
    .mark-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid var(--line); flex-wrap: wrap; gap: 10px; }
    .footer-actions { display: flex; gap: 8px; }
    .loading-row { padding: 32px; text-align: center; color: var(--muted); font-size: 13px; }
    .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
    .empty-icon { font-size: 40px; margin-bottom: 12px; }
    .empty-state p { font-size: 13px; margin: 0 0 16px; }
  `]
})
export class AttendanceComponent implements OnInit {
  classes = signal<any[]>([]);
  sections = signal<any[]>([]);
  session = signal<any>(null);
  notMarked = signal(false);
  markingMode = signal(false);
  markRows = signal<AttendanceRow[]>([]);
  loadingSession = signal(false);
  loadingStudents = signal(false);
  saving = signal(false);
  apiError = signal<string | null>(null);

  selectedClassId = '';
  selectedSectionId = '';
  selectedDate = new Date().toISOString().split('T')[0];
  todayStr = new Date().toISOString().split('T')[0];
  sessionClass = '';
  sessionSection = '';

  codes = ['Present', 'Absent', 'Late', 'Excused'];

  get canLoad() { return this.selectedClassId && this.selectedSectionId && this.selectedDate; }
  get canMark() { return this.auth.hasRole('SchoolAdmin') || this.auth.hasRole('Teacher') || this.auth.hasRole('AttendanceOfficer'); }
  get isViewer() { return this.auth.hasRole('Student') || this.auth.hasRole('Parent'); }
  get presentCount() { return this.markRows().filter(r => r.code === 'Present').length; }
  get absentCount() { return this.markRows().filter(r => r.code === 'Absent').length; }

  constructor(private api: ApiService, public ctx: SchoolContextService, private auth: AuthService) {}

  ngOnInit() {
    if (this.ctx.schoolId) {
      this.api.getClasses(this.ctx.schoolId).subscribe(c => this.classes.set(c));
    }
  }

  onClassChange(classId: string) {
    const cls = this.classes().find(c => c.id === classId);
    this.sections.set(cls?.sections ?? []);
    this.selectedSectionId = '';
    this.session.set(null);
    this.notMarked.set(false);
  }

  loadAttendance() {
    if (!this.canLoad) return;
    this.loadingSession.set(true);
    this.session.set(null);
    this.notMarked.set(false);
    this.markingMode.set(false);
    this.apiError.set(null);

    const cls = this.classes().find(c => c.id === this.selectedClassId);
    const sec = this.sections().find(s => s.id === this.selectedSectionId);
    this.sessionClass = cls?.name ?? '';
    this.sessionSection = sec?.name ?? '';

    this.api.getAttendance(this.ctx.schoolId, this.selectedClassId, this.selectedSectionId, this.selectedDate)
      .subscribe({
        next: (s) => { this.session.set(s); this.loadingSession.set(false); },
        error: (e) => {
          this.loadingSession.set(false);
          if (e.status === 404) { this.notMarked.set(true); }
          else { this.apiError.set(e?.error?.error ?? 'Failed to load attendance.'); }
        }
      });
  }

  startMarking() {
    this.loadingStudents.set(true);
    this.api.getStudents(this.ctx.schoolId, this.ctx.academicYearId, 1, 100)
      .subscribe({
        next: (r) => {
          this.markRows.set(r.items
            .filter((s: any) => s.sectionId === this.selectedSectionId || !s.sectionId)
            .map((s: any) => ({ studentId: s.id, studentName: `${s.firstName} ${s.lastName}`, code: 'Present', remarks: '' }))
          );
          this.loadingStudents.set(false);
          this.markingMode.set(true);
        },
        error: () => { this.loadingStudents.set(false); this.apiError.set('Failed to load students.'); }
      });
  }

  markAll(code: string) {
    this.markRows.update(rows => rows.map(r => ({ ...r, code })));
  }

  submitAttendance() {
    this.saving.set(true);
    this.apiError.set(null);
    const body = {
      academicYearId: this.ctx.academicYearId,
      classId: this.selectedClassId,
      sectionId: this.selectedSectionId,
      date: this.selectedDate,
      entries: this.markRows().map(r => ({ studentId: r.studentId, code: r.code, remarks: r.remarks || null }))
    };
    this.api.markAttendance(this.ctx.schoolId, body).subscribe({
      next: () => { this.saving.set(false); this.markingMode.set(false); this.loadAttendance(); },
      error: (e) => { this.saving.set(false); this.apiError.set(e?.error?.error ?? 'Failed to save attendance.'); }
    });
  }

  badgeClass(code: string) {
    const map: Record<string, string> = { Present: 'badge-present', Absent: 'badge-absent', Late: 'badge-late', Excused: 'badge-excused' };
    return map[code] ?? '';
  }
}
