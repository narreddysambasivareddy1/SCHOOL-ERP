import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="eyebrow">ADMINISTRATION</div>
      <h1>School settings</h1>
      <p class="text-muted">Branding, locale, currency, academic year and campus identity — from the school record.</p>
    </div>

    @if (error()) { <div class="alert">{{ error() }}</div> }
    @if (loading()) { <p class="text-muted">Loading…</p> }
    @else if (school()) {
      <div class="grid">
        <div class="card"><label>School name</label><strong>{{ school().name }}</strong></div>
        <div class="card"><label>Locale</label><strong>{{ school().locale }}</strong></div>
        <div class="card"><label>Currency</label><strong>{{ school().currency }}</strong></div>
        <div class="card"><label>Time zone</label><strong>{{ school().timeZone }}</strong></div>
        <div class="card"><label>Language</label><strong>{{ school().defaultLanguage }}</strong></div>
        <div class="card"><label>Primary colour</label><strong>{{ school().primaryColor || '—' }}</strong></div>
      </div>
      <p class="text-muted">Email, SMS, WhatsApp, Google and payment keys live under Integrations. Dummy values are already seeded; swap them when the school provides live credentials.</p>
      <p><a routerLink="/integrations">Open integrations</a></p>
    }
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 14px; }
    label { display: block; font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; }
    a { color: var(--primary); font-size: 13px; }
  `]
})
export class SettingsComponent implements OnInit {
  school = signal<any>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private api: ApiService, public ctx: SchoolContextService) {}

  ngOnInit() {
    if (!this.ctx.schoolId) { this.loading.set(false); return; }
    this.api.getSchool(this.ctx.schoolId).subscribe({
      next: s => { this.school.set(s); this.loading.set(false); },
      error: () => { this.error.set('Could not load school profile.'); this.loading.set(false); }
    });
  }
}
