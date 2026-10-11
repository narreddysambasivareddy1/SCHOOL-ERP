import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/auth/auth.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">OVERVIEW</div>
      <h1>Good {{ greeting }}, {{ user()?.firstName }} 👋</h1>
      <p class="text-muted">Here's an overview of what's happening across your school today.</p>
    </div>
    <div class="stats-grid">
      @for (stat of stats; track stat.label) {
        <div class="stat-card">
          <div class="stat-icon" [style.background]="stat.iconBg">{{ stat.icon }}</div>
          <div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-trend">{{ stat.trend }}</div>
          </div>
        </div>
      }
    </div>
    <div class="section-header"><h2>Quick actions</h2></div>
    <div class="quick-grid">
      @for (q of quickLinks; track q.label) {
        <a [routerLink]="q.route" class="quick-card">
          <span class="quick-icon">{{ q.icon }}</span>
          <strong>{{ q.label }}</strong>
          <small>{{ q.desc }}</small>
        </a>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    h1 { margin: 4px 0 4px; font-size: 24px; color: var(--navy); }
    h2 { font-size: 15px; color: var(--navy); margin: 0; }
    .section-header { margin: 20px 0 12px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; margin-bottom: 8px; }
    .stat-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 18px; display: flex; gap: 14px; align-items: flex-start; box-shadow: var(--shadow); }
    .stat-icon { width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; font-size: 20px; flex-shrink: 0; }
    .stat-label { font-size: 11px; color: var(--muted); font-weight: 650; }
    .stat-value { font-size: 26px; font-weight: 800; color: var(--navy); letter-spacing: -0.5px; margin: 4px 0 2px; }
    .stat-trend { font-size: 11px; color: var(--teal); }
    .quick-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; }
    .quick-card { display: flex; flex-direction: column; gap: 4px; padding: 14px; border: 1px solid var(--line); border-radius: 11px; background: white; text-decoration: none; color: var(--ink); transition: border-color 0.15s; }
    .quick-card:hover { border-color: #9dbcf5; background: #f9fbff; }
    .quick-icon { font-size: 20px; }
    .quick-card strong { font-size: 12px; }
    .quick-card small { font-size: 10px; color: var(--muted); }
    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2,1fr); } .quick-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 500px) { .stats-grid { grid-template-columns: 1fr; } .quick-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  user = this.auth.user;
  greeting = this.getGreeting();

  stats = [
    { label: 'Total students', value: '—', trend: 'Loading...', icon: '🎓', iconBg: '#eaf3ff' },
    { label: 'Teaching staff', value: '—', trend: 'Loading...', icon: '👩🏫', iconBg: '#e3f8f3' },
    { label: "Today's attendance", value: '—', trend: 'Loading...', icon: '◷', iconBg: '#fff4db' },
    { label: 'Fee collection', value: '—', trend: 'Loading...', icon: '₹', iconBg: '#f0ebff' },
  ];

  quickLinks = [
    { icon: '🎓', label: 'Add student', desc: 'New admission', route: '/students' },
    { icon: '👩🏫', label: 'Add employee', desc: 'Teacher or staff', route: '/staff' },
    { icon: '◷', label: 'Attendance', desc: 'View and correct', route: '/attendance' },
    { icon: '₹', label: 'Collect fee', desc: 'Payment & receipt', route: '/fees' },
    { icon: '🚌', label: 'Transport', desc: 'Routes and trips', route: '/transport' },
    { icon: '◫', label: 'Analytics', desc: 'Reports', route: '/analytics' },
  ];

  constructor(private auth: AuthService, private ctx: SchoolContextService, private http: HttpClient) {}

  ngOnInit() {
    // Stats will be populated once school context and analytics API are connected
  }

  private getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }
}
