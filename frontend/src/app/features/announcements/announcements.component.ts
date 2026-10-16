import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="eyebrow">COMMUNICATIONS</div>
      <h1>Announcements</h1>
      <p class="text-muted">School circulars published to parents, students and staff.</p>
    </div>
    @for (a of items(); track a.id) {
      <article class="card">
        <h3>{{ a.title }}</h3>
        <p>{{ a.body }}</p>
        <small>{{ a.audience }} · {{ a.channels }} · {{ a.publishedAt | date:'medium' }}</small>
      </article>
    } @empty {
      <div class="empty">No announcements yet this term.</div>
    }
    @if (auth.hasRole('SchoolAdmin') || auth.hasRole('Teacher')) {
      <p><a routerLink="/communications">Compose a message</a></p>
    }
  `,
  styles: [`
    .empty { padding: 32px; text-align: center; color: var(--muted); background: white; border: 1px dashed var(--line); border-radius: 12px; }
    a { font-size: 13px; color: var(--primary); }
    .card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin-bottom: 10px; }
    h3 { margin: 0 0 6px; font-size: 16px; }
    small { color: var(--muted); }
  `]
})
export class AnnouncementsComponent implements OnInit {
  items = signal<any[]>([]);
  constructor(public auth: AuthService, private api: ApiService, private ctx: SchoolContextService) {}
  ngOnInit() {
    if (!this.ctx.schoolId) return;
    this.api.getAnnouncements(this.ctx.schoolId).subscribe({ next: rows => this.items.set(rows) });
  }
}
