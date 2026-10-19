import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-admissions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="eyebrow">ADMISSIONS OFFICE</div>
      <h1>Admissions</h1>
      <p class="text-muted">Enquiry → application → admitted. New students are created on the SIS record; lifecycle stays on the permanent student identity.</p>
    </div>
    <div class="toolbar">
      <a routerLink="/enquiries" class="btn">Enquiry desk</a>
      <a routerLink="/registrations" class="btn">Walk-in registrations</a>
      <a routerLink="/students" class="btn">Open student records</a>
    </div>
    <div class="pipe">
      <div class="pipe-card"><span>Enquiry</span><strong>—</strong></div>
      <div class="pipe-card"><span>Admission pending</span><strong>—</strong></div>
      <div class="pipe-card"><span>Admitted / active</span><strong>{{ active() }}</strong></div>
      <div class="pipe-card"><span>Other statuses</span><strong>{{ other() }}</strong></div>
    </div>
    @if (error()) { <div class="alert">{{ error() }}</div> }
    @if (loading()) { <p class="text-muted">Loading enrolments…</p> }
    @else {
      <table>
        <thead><tr><th>Student</th><th>Code</th><th>Class</th><th>Status</th></tr></thead>
        <tbody>
          @for (s of students(); track s.id) {
            <tr>
              <td>{{ s.firstName }} {{ s.lastName }}</td>
              <td>{{ s.studentCode }}</td>
              <td>{{ s.className }} · {{ s.sectionName }}</td>
              <td>{{ s.status }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [`
    .toolbar { margin-bottom: 16px; }
    .btn { display: inline-block; background: var(--primary); color: white; text-decoration: none; padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; }
    .pipe { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
    .pipe-card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 14px; }
    .pipe-card span { display: block; font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; }
    .pipe-card strong { font-size: 22px; color: var(--navy); }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid var(--line); }
    th, td { text-align: left; padding: 10px 12px; font-size: 13px; border-bottom: 1px solid var(--line); }
    th { font-size: 11px; text-transform: uppercase; color: var(--muted); background: #f8fafc; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; }
    @media (max-width: 800px) { .pipe { grid-template-columns: 1fr 1fr; } }
  `]
})
export class AdmissionsComponent implements OnInit {
  students = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private api: ApiService, public ctx: SchoolContextService) {}

  active() { return this.students().filter(s => (s.status || '').toLowerCase() === 'active').length; }
  other() { return this.students().length - this.active(); }

  ngOnInit() {
    if (!this.ctx.schoolId || !this.ctx.academicYearId) { this.loading.set(false); return; }
    this.api.getStudents(this.ctx.schoolId, this.ctx.academicYearId, 1, 100).subscribe({
      next: d => { this.students.set(d.items ?? []); this.loading.set(false); },
      error: () => { this.error.set('Could not load admissions.'); this.loading.set(false); }
    });
  }
}
