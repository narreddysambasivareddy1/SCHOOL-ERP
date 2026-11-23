import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    @if (error()) { <div class="alert">{{ error() }}</div> }
    @if (saved()) { <div class="ok">Event saved.</div> }
    @if (canPublish) {
      <form class="card" (ngSubmit)="save()">
        <label>Title <input [(ngModel)]="draft.title" name="title" required /></label>
        <label>Date <input type="date" [(ngModel)]="draft.eventDate" name="eventDate" required /></label>
        <label>Kind
          <select [(ngModel)]="draft.kind" name="kind">
            <option>Event</option><option>Holiday</option><option>Activity</option>
          </select>
        </label>
        <label>Notes <input [(ngModel)]="draft.description" name="description" /></label>
        <label class="check"><input type="checkbox" [(ngModel)]="draft.requiresConsent" name="consent" /> Requires consent</label>
        <button type="submit" [disabled]="saving()">Save event</button>
      </form>
    }
    @if (loading()) { <p class="text-muted">Loading events…</p> }
    @else if (events().length === 0) {
      <div class="empty">No events published for this school yet.</div>
    } @else {
      @for (event of events(); track event.id) {
        <div class="card">
          <strong>{{ event.title }}</strong>
          <p>{{ event.eventDate }} · {{ event.kind }}{{ event.requiresConsent ? ' · consent required' : '' }}</p>
          @if (event.description) { <p>{{ event.description }}</p> }
        </div>
      }
    }
  `,
  styles: [`
    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 14px; }
    .card p { color: var(--muted); font-size: 13px; margin: 6px 0 0; }
    .empty { padding: 24px; text-align: center; color: var(--muted); background: var(--surface); border: 1px dashed var(--line); border-radius: 12px; font-size: 13px; }
    label { display: block; margin-bottom: 8px; font-size: 13px; }
    input, select { display: block; width: 100%; margin-top: 4px; font: inherit; padding: 8px; border: 1px solid var(--line); border-radius: 8px; }
    .check input { width: auto; display: inline-block; margin-right: 6px; }
    button { min-height: 40px; padding: 0 14px; border: 0; border-radius: 8px; background: var(--primary); color: white; font-weight: 700; cursor: pointer; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; margin-bottom: 10px; }
    .ok { background: var(--primary-soft); padding: 10px; border-radius: 8px; margin-bottom: 10px; }
  `]
})
export class CalendarComponent implements OnInit {
  year = signal<any>(null);
  events = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  saved = signal(false);
  canPublish = false;
  draft = { title: '', description: '', eventDate: '', kind: 'Event', requiresConsent: false };

  constructor(private api: ApiService, public ctx: SchoolContextService, private auth: AuthService) {}

  ngOnInit() {
    this.canPublish = this.auth.hasRole('SchoolAdmin') || this.auth.hasRole('PlatformSuperAdmin') || this.auth.hasRole('Teacher');
    if (!this.ctx.schoolId) { this.loading.set(false); return; }
    this.api.getAcademicYears(this.ctx.schoolId).subscribe({
      next: list => {
        const id = this.ctx.academicYearId;
        this.year.set((list ?? []).find((y: any) => (y.id ?? y.Id) === id) ?? list?.[0] ?? null);
      }
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.getCalendar(this.ctx.schoolId).subscribe({
      next: items => { this.events.set(items ?? []); this.loading.set(false); },
      error: () => { this.error.set('Could not load the calendar.'); this.loading.set(false); }
    });
  }

  save() {
    if (!this.draft.title || !this.draft.eventDate) return;
    this.saving.set(true);
    this.error.set(null);
    this.saved.set(false);
    this.api.saveCalendarEvent(this.ctx.schoolId, this.draft).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        this.draft = { title: '', description: '', eventDate: '', kind: 'Event', requiresConsent: false };
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.error || 'Could not save the event.');
      }
    });
  }
}
