import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">SCHOOL LIFE</div>
      <h1>Calendar & activities</h1>
      <p class="text-muted">Events, holidays, working days and consent-based activities as defined in the academic year.</p>
    </div>
    <div class="card">
      <strong>{{ ctx.context()?.academicYearName || 'Academic year' }}</strong>
      @if (year()) {
        <p>{{ year().startDate }} → {{ year().endDate }} {{ year().isCurrent ? '(current)' : '' }}</p>
      }
    </div>
    <div class="empty">No events published yet. When the calendar API is connected, trips, clubs and assemblies will appear here with eligibility and consent flags.</div>
  `,
  styles: [`
    .card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 14px; }
    .card p { color: var(--muted); font-size: 13px; margin: 6px 0 0; }
    .empty { padding: 24px; text-align: center; color: var(--muted); background: white; border: 1px dashed var(--line); border-radius: 12px; font-size: 13px; }
  `]
})
export class CalendarComponent implements OnInit {
  year = signal<any>(null);

  constructor(private api: ApiService, public ctx: SchoolContextService) {}

  ngOnInit() {
    if (!this.ctx.schoolId) return;
    this.api.getAcademicYears(this.ctx.schoolId).subscribe({
      next: list => {
        const id = this.ctx.academicYearId;
        this.year.set((list ?? []).find((y: any) => (y.id ?? y.Id) === id) ?? list?.[0] ?? null);
      }
    });
  }
}
