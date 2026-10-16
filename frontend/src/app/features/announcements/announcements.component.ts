import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="eyebrow">COMMUNICATIONS</div>
      <h1>Announcements</h1>
      <p class="text-muted">School circulars, notices and published messages for your role.</p>
    </div>
    <div class="empty">No announcements yet this term.</div>
    @if (auth.hasRole('SchoolAdmin') || auth.hasRole('Teacher')) {
      <p><a routerLink="/communications">Compose a message</a></p>
    }
  `,
  styles: [`
    .empty { padding: 32px; text-align: center; color: var(--muted); background: white; border: 1px dashed var(--line); border-radius: 12px; }
    a { font-size: 13px; color: var(--primary); }
  `]
})
export class AnnouncementsComponent {
  constructor(public auth: AuthService) {}
}
