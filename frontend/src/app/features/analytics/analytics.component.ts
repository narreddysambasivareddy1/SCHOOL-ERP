import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  template: `
    <div class="eyebrow">INSIGHTS & GOVERNANCE</div>
    <h1 style="color:var(--navy);margin:4px 0 20px">Analytics & Reports</h1>
    <div class="reports-grid">
      @for (r of reports; track r.title) {
        <div class="report-card">
          <div class="report-icon">{{ r.icon }}</div>
          <h3>{{ r.title }}</h3>
          <p class="text-muted">{{ r.desc }}</p>
          <p-button [label]="'Open report'" size="small" [outlined]="true" />
        </div>
      }
    </div>
  `,
  styles: [`
    h1 { font-size: 22px; }
    .reports-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; }
    .report-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow); }
    .report-icon { font-size: 28px; margin-bottom: 10px; }
    h3 { margin: 0 0 6px; color: var(--navy); font-size: 14px; }
    p { margin: 0 0 14px; font-size: 12px; min-height: 36px; }
    @media (max-width: 900px) { .reports-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 500px) { .reports-grid { grid-template-columns: 1fr; } }
  `]
})
export class AnalyticsComponent {
  reports = [
    { icon: '🎓', title: 'Student strength', desc: 'By academic year, grade, section and enrolment status.' },
    { icon: '◷', title: 'Attendance trends', desc: 'Daily, monthly and class-level attendance with exceptions.' },
    { icon: '₹', title: 'Fee collection & dues', desc: 'Collections, ageing, payment status and reconciliation.' },
    { icon: '👩🏫', title: 'Staff & leave', desc: 'Headcount, staffing changes, leave and attendance summaries.' },
    { icon: '🚌', title: 'Route utilization', desc: 'Vehicle assignments, capacity, trips and transport fees.' },
    { icon: '⚙', title: 'Integration health', desc: 'Payment callbacks, device sync, notification delivery and job failures.' },
  ];
}
