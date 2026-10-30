import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">GOVERNANCE</div>
      <h1>Audit trail</h1>
      <p class="text-muted">Sensitive changes are logged. Exports and corrections should remain attributable.</p>
    </div>
    @if (error()) { <div class="alert">{{ error() }}</div> }
    @if (loading()) { <p class="text-muted">Loading…</p> }
    @else if (!items().length) { <div class="empty">No audit events yet.</div> }
    @else {
      <table>
        <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
        <tbody>
          @for (e of items(); track e.id) {
            <tr>
              <td>{{ e.occurredAt | date:'short' }}</td>
              <td>{{ e.actor }}</td>
              <td>{{ e.action }}</td>
              <td>{{ e.entityType }} {{ e.entityId }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--line); }
    th, td { text-align: left; padding: 10px 12px; font-size: 12px; border-bottom: 1px solid var(--line); }
    th { font-size: 11px; text-transform: uppercase; color: var(--muted); background: #f8fafc; }
    .empty { padding: 24px; text-align: center; color: var(--muted); background: var(--surface); border: 1px dashed var(--line); border-radius: 12px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; }
  `]
})
export class AuditComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getAuditLog(1, 50).subscribe({
      next: d => { this.items.set(d.items ?? d); this.loading.set(false); },
      error: () => { this.error.set('Could not load audit log.'); this.loading.set(false); }
    });
  }
}
