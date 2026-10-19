import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-substitutions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">ACADEMIC OPERATIONS</div>
      <h1>Substitutions</h1>
      <p class="text-muted">Approved leave flags those periods as unassigned. Assign a teacher who is free in the same slot.</p>
    </div>
    @if (notice()) { <div class="ok">{{ notice() }}</div> }
    @if (error()) { <div class="alert">{{ error() }}</div> }
    <label>Date <input type="date" [(ngModel)]="date" (ngModelChange)="load()" /></label>
    @for (n of rows(); track n.id) {
      <div class="card">
        <div>
          <strong>{{ n.period }} · {{ n.className }} {{ n.sectionName }}</strong>
          <small>{{ n.subject }} · {{ n.original }} · {{ n.status }}</small>
        </div>
        @if (n.status === 'Open') {
          <div class="row">
            <select [(ngModel)]="pick[n.id]">
              <option value="">Available teachers</option>
              @for (t of free()[n.periodId] || []; track t.id) {
                <option [value]="t.id">{{ t.name }}</option>
              }
            </select>
            <button type="button" (click)="assign(n)">Assign</button>
            <button type="button" class="ghost" (click)="loadFree(n)">Refresh free list</button>
          </div>
        } @else {
          <span>Covered by {{ n.substitute }}</span>
        }
      </div>
    } @empty { <p class="text-muted">No impacted periods on this date.</p> }
  `,
  styles: [`
    .card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 12px; margin: 10px 0; }
    small { display: block; color: var(--muted); }
    .row { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    select, button, input { font: inherit; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--line); }
    button { background: var(--primary); color: white; border: 0; cursor: pointer; }
    .ghost { background: white; color: var(--navy); border: 1px solid var(--line); }
    .ok { background: #e5f8f1; color: #087d68; padding: 8px; border-radius: 8px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 8px; border-radius: 8px; }
  `]
})
export class SubstitutionsComponent implements OnInit {
  date = new Date().toISOString().slice(0, 10);
  rows = signal<any[]>([]);
  free = signal<Record<string, any[]>>({});
  pick: Record<string, string> = {};
  notice = signal<string | null>(null);
  error = signal<string | null>(null);

  constructor(private api: ApiService, public ctx: SchoolContextService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.getSubstitutions(this.ctx.schoolId, this.date).subscribe({
      next: rows => {
        this.rows.set(rows);
        rows.filter((r: any) => r.status === 'Open').forEach((r: any) => this.loadFree(r));
      },
      error: () => this.error.set('Could not load substitutions.')
    });
  }

  loadFree(n: any) {
    this.api.getAvailableSubstitutes(this.ctx.schoolId, this.ctx.academicYearId, this.date, n.periodId).subscribe({
      next: list => this.free.set({ ...this.free(), [n.periodId]: list })
    });
  }

  assign(n: any) {
    const id = this.pick[n.id];
    if (!id) return;
    this.api.assignSubstitute(this.ctx.schoolId, n.id, id).subscribe({
      next: () => { this.notice.set('Substitute assigned.'); this.load(); },
      error: e => this.error.set(e?.error?.error || 'Could not assign.')
    });
  }
}
