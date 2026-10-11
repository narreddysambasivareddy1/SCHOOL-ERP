import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px">
      <div>
        <div style="font-size:48px">🔒</div>
        <h2 style="color:var(--navy)">Access denied</h2>
        <p class="text-muted">You don't have permission to view this page.</p>
        <a routerLink="/" style="color:#2463eb">← Back to dashboard</a>
      </div>
    </div>
  `
})
export class UnauthorizedComponent {}
