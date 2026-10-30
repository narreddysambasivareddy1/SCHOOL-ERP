import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { ThemeService } from '../../core/services/theme.service';

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
        <div class="card"><label>School colour</label><strong>{{ school().primaryColor || 'Default campus blue' }}</strong></div>
      </div>
      <div class="theme-panel">
        <h2>Appearance</h2>
        <p>Light uses navy, teal and gold. Dark keeps the same accent. The colour you pick is saved in this browser.</p>
        <div class="mode-switch" role="group" aria-label="Appearance">
          <button type="button" [class.on]="theme.mode() === 'light'" (click)="theme.setMode('light')">Light</button>
          <button type="button" [class.on]="theme.mode() === 'dark'" (click)="theme.setMode('dark')">Dark</button>
        </div>
        <div class="swatches">
          @for (preset of theme.presets; track preset.id) {
            <button type="button" class="swatch" [class.on]="theme.active() === preset.hex" [style.background]="preset.hex"
              [attr.aria-label]="preset.name" (click)="theme.choose(preset.hex)">{{ preset.name }}</button>
          }
        </div>
        <label class="custom">Custom hex
          <input type="color" [value]="theme.active()" aria-label="Custom workspace colour" (input)="theme.choose(colorValue($event))" />
        </label>
        <button type="button" class="reset" (click)="theme.resetToSchool(school().primaryColor)">Use school colour</button>
      </div>
      <p class="text-muted">Email, SMS, WhatsApp, Google and payment keys live under Integrations. Dummy values are already seeded; swap them when the school provides live credentials.</p>
      <p><a routerLink="/integrations">Open integrations</a></p>
    }
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 14px; }
    .mode-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-width: 280px; margin-bottom: 14px; }
    .mode-switch button { height: 40px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--ink); cursor: pointer; font-weight: 650; }
    .mode-switch button.on { background: var(--primary); border-color: var(--primary); color: white; }
    label { display: block; font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; }
    a { color: var(--primary); font-size: 13px; }
    .theme-panel { margin: 8px 0 18px; padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }
    .theme-panel h2 { margin: 0 0 6px; color: var(--navy); font-size: 18px; }
    .theme-panel p { margin: 0 0 12px; color: var(--muted); }
    .swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .swatch { min-height: 44px; padding: 0 14px; border: 2px solid transparent; border-radius: 10px; color: white; font-weight: 700; cursor: pointer; }
    .swatch.on { border-color: var(--ink); }
    .custom { display: flex; align-items: center; gap: 10px; margin-top: 12px; font-size: 13px; font-weight: 650; color: var(--ink); }
    .custom input { width: 48px; height: 36px; border: 0; background: transparent; cursor: pointer; }
    .reset { margin-top: 12px; min-height: 40px; padding: 0 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--primary-soft); color: var(--navy); cursor: pointer; font-weight: 700; }
  `]
})
export class SettingsComponent implements OnInit {
  school = signal<any>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private api: ApiService, public ctx: SchoolContextService, public theme: ThemeService) {}

  colorValue(event: Event) {
    return (event.target as HTMLInputElement).value;
  }

  ngOnInit() {
    if (!this.ctx.schoolId) { this.loading.set(false); return; }
    this.api.getSchool(this.ctx.schoolId).subscribe({
      next: s => { this.school.set(s); this.loading.set(false); },
      error: () => { this.error.set('Could not load school profile.'); this.loading.set(false); }
    });
  }
}
