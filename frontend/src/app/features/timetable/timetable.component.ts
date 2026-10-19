import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">ACADEMICS</div>
      <h1>Timetable master</h1>
      <p class="text-muted">Morning and evening periods, then a weekly grid of teachers and subjects (including P.T., Craft and Karate).</p>
    </div>
    @if (notice()) { <div class="ok">{{ notice() }}</div> }
    @if (error()) { <div class="alert">{{ error() }}</div> }

    <div class="tabs">
      <button type="button" [class.on]="tab==='grid'" (click)="tab='grid'">Weekly grid</button>
      @if (admin) { <button type="button" [class.on]="tab==='periods'" (click)="tab='periods'">Period setup</button> }
    </div>

    @if (tab==='periods') {
      <form class="card form" (ngSubmit)="savePeriod()">
        <label>Name<input [(ngModel)]="period.name" name="pname" required placeholder="M1" /></label>
        <label>Order<input type="number" [(ngModel)]="period.sortOrder" name="porder" /></label>
        <label>Start<input type="time" [(ngModel)]="period.startTime" name="pstart" /></label>
        <label>End<input type="time" [(ngModel)]="period.endTime" name="pend" /></label>
        <label>Band
          <select [(ngModel)]="period.band" name="pband"><option>Morning</option><option>Evening</option></select>
        </label>
        <button type="submit">Save period</button>
      </form>
      <table class="card">
        <tr><th>Period</th><th>Band</th><th>Time</th></tr>
        @for (p of periods(); track p.id) {
          <tr><td>{{ p.name }}</td><td>{{ p.band }}</td><td>{{ p.startTime }}–{{ p.endTime }}</td></tr>
        }
      </table>
    }

    @if (tab==='grid') {
      <div class="toolbar">
        <select [(ngModel)]="classId" (ngModelChange)="onClass()">
          <option value="">Class</option>
          @for (c of classes(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
        </select>
        <select [(ngModel)]="sectionId" (ngModelChange)="loadGrid()">
          <option value="">Section</option>
          @for (s of sections(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
        </select>
      </div>
      @if (grid()) {
        <div class="wrap">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                @for (p of grid().periods; track p.id) { <th>{{ p.name }}<small>{{ p.startTime }}</small></th> }
              </tr>
            </thead>
            <tbody>
              @for (d of grid().days; track d.dayOfWeek) {
                <tr>
                  <th>{{ d.name }}</th>
                  @for (cell of d.cells; track cell.periodId) {
                    <td [class.open]="cell.unassigned">
                      @if (admin) {
                        <select [ngModel]="cell.subjectId || ''" (ngModelChange)="pick(d.dayOfWeek, cell.periodId, 'subjectId', $event)">
                          <option value="">Subject</option>
                          @for (s of subjects(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
                        </select>
                        <select [ngModel]="cell.employeeId || ''" (ngModelChange)="pick(d.dayOfWeek, cell.periodId, 'employeeId', $event)">
                          <option value="">Teacher</option>
                          @for (e of teachers(); track e.id) { <option [value]="e.id">{{ e.firstName }} {{ e.lastName }}</option> }
                        </select>
                      } @else {
                        <strong>{{ cell.subject || '—' }}</strong>
                        <small>{{ cell.unassigned ? 'Unassigned' : (cell.teacher || '') }}</small>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }
  `,
  styles: [`
    .tabs { display: flex; gap: 8px; margin: 12px 0; }
    .tabs button, .form button { font: inherit; cursor: pointer; border: 1px solid var(--line); background: white; border-radius: 8px; padding: 6px 10px; }
    .tabs button.on { background: var(--primary); color: white; border-color: transparent; }
    .card, table { background: white; border: 1px solid var(--line); border-radius: 12px; }
    .form { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: 8px; padding: 12px; margin-bottom: 12px; }
    .form label { font-size: 11px; font-weight: 700; }
    .form input, .form select, .toolbar select, td select { width: 100%; padding: 6px; border-radius: 8px; border: 1px solid var(--line); font: inherit; }
    .form button { background: var(--primary); color: white; border: 0; align-self: end; }
    .toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
    .wrap { overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid var(--line); padding: 8px; font-size: 12px; min-width: 120px; vertical-align: top; }
    th small { display: block; font-weight: 400; color: var(--muted); }
    td.open { background: #fff4db; }
    td strong, td small { display: block; }
    .ok { background: #e5f8f1; color: #087d68; padding: 8px; border-radius: 8px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 8px; border-radius: 8px; }
  `]
})
export class TimetableComponent implements OnInit {
  tab: 'grid' | 'periods' = 'grid';
  admin = false;
  classes = signal<any[]>([]);
  sections = signal<any[]>([]);
  subjects = signal<any[]>([]);
  teachers = signal<any[]>([]);
  periods = signal<any[]>([]);
  grid = signal<any>(null);
  notice = signal<string | null>(null);
  error = signal<string | null>(null);
  classId = '';
  sectionId = '';
  period = { name: 'M1', sortOrder: 1, startTime: '08:00', endTime: '08:45', band: 'Morning' };

  constructor(private api: ApiService, public ctx: SchoolContextService, auth: AuthService) {
    this.admin = auth.hasRole('SchoolAdmin') || auth.hasRole('PlatformSuperAdmin');
  }

  ngOnInit() {
    if (!this.ctx.schoolId) return;
    this.api.getClasses(this.ctx.schoolId).subscribe({ next: c => this.classes.set(c) });
    this.api.getSubjects(this.ctx.schoolId).subscribe({ next: s => this.subjects.set(s) });
    this.api.getEmployees(this.ctx.schoolId, 1, 100).subscribe({ next: r => this.teachers.set(r.items || []) });
    this.api.getPeriods(this.ctx.schoolId, this.ctx.academicYearId).subscribe({ next: p => this.periods.set(p) });
  }

  onClass() {
    const cls = this.classes().find(c => c.id === this.classId);
    this.sections.set(cls?.sections || []);
    this.sectionId = this.sections()[0]?.id || '';
    this.loadGrid();
  }

  loadGrid() {
    if (!this.sectionId) return;
    this.api.getTimetableGrid(this.ctx.schoolId, this.ctx.academicYearId, this.sectionId).subscribe({
      next: g => this.grid.set(g),
      error: () => this.error.set('Could not load the weekly grid.')
    });
  }

  savePeriod() {
    this.api.savePeriod(this.ctx.schoolId, { ...this.period, academicYearId: this.ctx.academicYearId }).subscribe({
      next: () => {
        this.notice.set('Period saved.');
        this.api.getPeriods(this.ctx.schoolId, this.ctx.academicYearId).subscribe({ next: p => this.periods.set(p) });
      },
      error: e => this.error.set(e?.error?.error || 'Could not save period.')
    });
  }

  pick(dayOfWeek: number, periodId: string, field: 'subjectId' | 'employeeId', value: string) {
    const day = this.grid().days.find((d: any) => d.dayOfWeek === dayOfWeek);
    const cell = day.cells.find((c: any) => c.periodId === periodId);
    cell[field] = value;
    if (!cell.subjectId || !cell.employeeId) return;
    this.api.saveTimetableSlot(this.ctx.schoolId, {
      academicYearId: this.ctx.academicYearId, classId: this.classId, sectionId: this.sectionId,
      dayOfWeek, periodId, subjectId: cell.subjectId, employeeId: cell.employeeId
    }).subscribe({
      next: () => this.notice.set('Slot saved.'),
      error: e => this.error.set(e?.error?.error || 'Period clash — teacher already booked.')
    });
  }
}
