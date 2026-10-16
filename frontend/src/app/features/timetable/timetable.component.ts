import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">ACADEMICS</div>
      <h1>Timetable</h1>
      <p class="text-muted">Class and teacher allocations for {{ ctx.context()?.academicYearName }}. Period/room conflict checks belong here once periods are configured.</p>
    </div>

    @if (error()) { <div class="alert">{{ error() }}</div> }
    @if (loading()) { <p class="text-muted">Loading…</p> }
    @else if (!rows().length) {
      <div class="empty">No teacher–subject–section assignments yet. Admins map teachers under Academics first.</div>
    } @else {
      <table>
        <thead><tr><th>Class</th><th>Section</th><th>Subject</th><th>Teacher</th></tr></thead>
        <tbody>
          @for (r of rows(); track r.id) {
            <tr>
              <td>{{ r.className }}</td>
              <td>{{ r.sectionName }}</td>
              <td>{{ r.subject }}</td>
              <td>{{ r.teacher }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 12px; font-size: 13px; border-bottom: 1px solid var(--line); }
    th { font-size: 11px; text-transform: uppercase; color: var(--muted); background: #f8fafc; }
    .empty, .alert { padding: 16px; border-radius: 12px; }
    .empty { background: white; border: 1px dashed var(--line); color: var(--muted); text-align: center; }
    .alert { background: var(--warn-soft); color: var(--warn); }
  `]
})
export class TimetableComponent implements OnInit {
  rows = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private api: ApiService, public ctx: SchoolContextService) {}

  ngOnInit() {
    if (!this.ctx.schoolId || !this.ctx.academicYearId) { this.loading.set(false); return; }
    this.api.getTeacherAssignments(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
      next: d => { this.rows.set(d); this.loading.set(false); },
      error: () => { this.error.set('Could not load timetable allocations.'); this.loading.set(false); }
    });
  }
}
