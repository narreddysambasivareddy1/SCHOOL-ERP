import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-substitutions',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
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
            <select aria-label="Available substitute teacher" [(ngModel)]="pick[n.id]">
              <option value="">Available teachers</option>
              @for (teacher of free()[n.periodId] || []; track teacher.id) { <option [value]="teacher.id">{{ teacher.name }}</option> }
            </select>
            <p-button label="Assign" (onClick)="assign(n)" [disabled]="!pick[n.id]" />
            <p-button label="Refresh free list" [outlined]="true" (onClick)="loadFree(n)" />
          </div>
        } @else {
          <span>Covered by {{ n.substitute }}</span>
        }
      </div>
    } @empty { <p class="text-muted">No impacted periods on this date.</p> }
  `,
  styles: [`
    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 12px; margin: 10px 0; }
    small { display: block; color: var(--muted); }
    .row { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .row select { flex: 1 1 240px; min-width: min(100%, 240px); min-height: 40px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); font: inherit; }
    input { font: inherit; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--line); }
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
