import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">GOVERNANCE</div>
      <h1>School integrations</h1>
      <p class="text-muted">Dummy credentials are pre-filled. Keep sandbox on until the school provides live SMTP, SMS, WhatsApp, Google and payment keys.</p>
    </div>

    @if (error()) { <div class="alert">{{ error() }}</div> }
    @if (notice()) { <div class="ok">{{ notice() }}</div> }
    @if (loading()) { <p class="text-muted">Loading…</p> }

    <div class="grid">
      @for (item of items(); track item.providerKey) {
        <article class="card">
          <header>
            <strong>{{ item.providerName }}</strong>
            <span class="pill" [class.on]="item.isSandbox">{{ item.isSandbox ? 'Sandbox' : 'Live' }}</span>
          </header>
          <p class="key">{{ item.providerKey }}</p>
          <label class="chk"><input type="checkbox" [(ngModel)]="item.isEnabled" /> Enabled</label>
          <label class="chk"><input type="checkbox" [(ngModel)]="item.isSandbox" /> Sandbox (no live provider calls)</label>
          <pre>{{ item.config | json }}</pre>
          <textarea [(ngModel)]="drafts[item.providerKey]" rows="7" spellcheck="false"></textarea>
          <div class="row">
            <button type="button" (click)="save(item)">Save dummy / school keys</button>
            <button type="button" class="ghost" (click)="test(item)">Send test</button>
          </div>
        </article>
      }
    </div>
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
    .card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
    header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .key { font-size: 11px; color: var(--muted); margin: 0; }
    .pill { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: #fff2d7; color: #9a6900; }
    .pill.on { background: #e5f8f1; color: #087d68; }
    pre { background: var(--bg); border-radius: 8px; padding: 8px; font-size: 11px; overflow: auto; max-height: 120px; }
    textarea { width: 100%; font-family: ui-monospace, monospace; font-size: 11px; border: 1px solid var(--line); border-radius: 8px; padding: 8px; }
    .chk { font-size: 12px; display: flex; gap: 6px; align-items: center; }
    .row { display: flex; gap: 8px; }
    button { border: 0; background: var(--primary); color: white; border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 12px; }
    .ghost { background: white; color: var(--ink); border: 1px solid var(--line); }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; margin-bottom: 12px; }
    .ok { background: #e5f8f1; color: #087d68; padding: 10px; border-radius: 8px; margin-bottom: 12px; }
  `]
})
export class IntegrationsComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  notice = signal<string | null>(null);
  drafts: Record<string, string> = {};

  constructor(private api: ApiService, private ctx: SchoolContextService) {}

  ngOnInit() { this.reload(); }

  reload() {
    if (!this.ctx.schoolId) { this.loading.set(false); return; }
    this.api.getIntegrations(this.ctx.schoolId).subscribe({
      next: rows => {
        this.items.set(rows);
        for (const r of rows) this.drafts[r.providerKey] = JSON.stringify(r.config, null, 2);
        this.loading.set(false);
      },
      error: () => { this.error.set('Could not load integrations.'); this.loading.set(false); }
    });
  }

  save(item: any) {
    this.notice.set(null);
    this.error.set(null);
    let json = this.drafts[item.providerKey];
    try { JSON.parse(json); } catch { this.error.set('Config must be valid JSON.'); return; }
    this.api.updateIntegration(this.ctx.schoolId, item.providerKey, {
      isEnabled: item.isEnabled,
      isSandbox: item.isSandbox,
      configJson: json
    }).subscribe({
      next: () => { this.notice.set(`${item.providerName} saved. Secrets stay on the server.`); this.reload(); },
      error: () => this.error.set('Save failed.')
    });
  }

  test(item: any) {
    this.notice.set(null);
    this.api.testIntegration(this.ctx.schoolId, item.providerKey).subscribe({
      next: r => this.notice.set(r.message || 'Test logged to the notification outbox.'),
      error: () => this.error.set('Test failed.')
    });
  }
}
