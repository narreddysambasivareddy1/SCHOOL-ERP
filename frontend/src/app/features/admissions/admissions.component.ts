import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-admissions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="desk">
      <header class="hero">
        <div>
          <div class="crumbs">Admissions <span>/</span> Office</div>
          <div class="eyebrow">ADMISSIONS</div>
          <h1>Admissions office</h1>
          <p>Walk-in registration, document review, fee collection, and seat confirmation live on the admissions desk. Figures below are this school's records.</p>
        </div>
        <a routerLink="/registrations" [queryParams]="{ section: 'register' }" class="primary">New walk-in registration</a>
      </header>
      <nav class="links">
        <a routerLink="/enquiries">Enquiry desk</a>
        <a routerLink="/registrations">Open the admissions desk</a>
        <a routerLink="/students">Student records</a>
      </nav>
      @if (loading()) {
        <div class="metrics">@for (n of [1,2,3,4,5,6]; track n) { <div class="skeleton"></div> }</div>
      } @else {
        <div class="metrics">
          <a class="metric" routerLink="/registrations" [queryParams]="{ section: 'list' }"><span>Total registrations</span><strong>{{ summary().total ?? 0 }}</strong></a>
          <a class="metric" routerLink="/registrations" [queryParams]="{ section: 'list' }"><span>New today</span><strong>{{ summary().newToday ?? 0 }}</strong></a>
          <a class="metric" routerLink="/registrations" [queryParams]="{ section: 'documents' }"><span>Pending documents</span><strong>{{ summary().pendingDocuments ?? 0 }}</strong></a>
          <a class="metric" routerLink="/registrations" [queryParams]="{ section: 'fees' }"><span>Fee pending</span><strong>{{ summary().feePending ?? 0 }}</strong></a>
          <a class="metric" routerLink="/registrations" [queryParams]="{ section: 'confirm' }"><span>Confirmed admissions</span><strong>{{ summary().confirmed ?? 0 }}</strong></a>
          <a class="metric" routerLink="/registrations"><span>Open enquiries</span><strong>{{ enquiries() }}</strong></a>
        </div>
      }
      @if (error()) { <div class="alert">{{ error() }}</div> }
      <div class="panel">
        <h2>Recent student records</h2>
        @if (!students().length) { <div class="empty">No student records are stored for the selected year.</div> }
        @else {
          <table>
            <thead><tr><th>Student</th><th>Code</th><th>Class</th><th>Status</th></tr></thead>
            <tbody>
              @for (s of students(); track s.id) {
                <tr>
                  <td>{{ s.firstName }} {{ s.lastName }}</td>
                  <td>{{ s.studentCode }}</td>
                  <td>{{ s.className }} · {{ s.sectionName }}</td>
                  <td>{{ s.status }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </section>
  `,
  styles: [`
    .desk { display: flex; flex-direction: column; gap: 14px; }
    .hero { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; padding: 22px 24px; border-radius: 20px; border: 1px solid var(--line); background: linear-gradient(135deg, #fff, #eef1ff); }
    h1 { margin: 4px 0; color: var(--navy); letter-spacing: -.04em; }
    h2 { color: var(--navy); }
    .crumbs, .empty { color: var(--muted); }
    .crumbs span { margin: 0 6px; }
    .primary, .links a { display: inline-flex; background: var(--primary); color: white; text-decoration: none; border-radius: 12px; padding: 10px 14px; font-weight: 700; }
    .links { display: flex; gap: 8px; flex-wrap: wrap; }
    .links a { background: white; color: var(--navy); border: 1px solid var(--line); }
    .metrics { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; }
    .metric, .skeleton { border: 1px solid var(--line); border-radius: 16px; padding: 14px; background: rgba(255,255,255,.84); text-decoration: none; color: inherit; }
    .metric span { display: block; color: var(--muted); font-size: 12px; }
    .metric strong { font-size: 22px; color: var(--navy); }
    .skeleton { min-height: 74px; background: linear-gradient(90deg, #eef3f8, #f8fafc, #eef3f8); background-size: 200% 100%; animation: shine 1.2s infinite; }
    @keyframes shine { to { background-position: -100% 0; } }
    .panel { background: white; border: 1px solid var(--line); border-radius: 16px; padding: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--line); font-size: 13px; }
    .alert { background: var(--danger-soft); color: var(--danger); padding: 10px; border-radius: 8px; }
    .empty { padding: 16px; text-align: center; }
    @media (max-width: 1000px) { .metrics { grid-template-columns: 1fr 1fr; } .hero { flex-direction: column; align-items: flex-start; } }
  `]
})
export class AdmissionsComponent implements OnInit {
  students = signal<any[]>([]);
  summary = signal<any>({});
  enquiries = signal<number | string>('—');
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private api: ApiService, public ctx: SchoolContextService) {}

  ngOnInit() {
    if (!this.ctx.schoolId) { this.loading.set(false); return; }
    this.api.getRegistrationSummary(this.ctx.schoolId).subscribe({
      next: data => this.summary.set(data ?? {}),
      error: () => this.error.set('Could not load the admissions summary.')
    });
    this.api.getEnquiries(this.ctx.schoolId).subscribe({
      next: rows => this.enquiries.set((rows ?? []).filter((e: any) => e.status !== 'Converted' && e.status !== 'Rejected').length)
    });
    if (!this.ctx.academicYearId) { this.loading.set(false); return; }
    this.api.getStudents(this.ctx.schoolId, this.ctx.academicYearId, 1, 8).subscribe({
      next: data => { this.students.set(data.items ?? []); this.loading.set(false); },
      error: () => { this.error.set('Could not load student records.'); this.loading.set(false); }
    });
  }
}
