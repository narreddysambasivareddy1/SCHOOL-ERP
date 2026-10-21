import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule],
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
          <select [(ngModel)]="period.band" name="pband">
            @for (band of periodBands; track band) { <option [value]="band">{{ band }}</option> }
          </select>
        </label>
        <p-button type="submit" [label]="period.id ? 'Update period' : 'Add period'" />
        @if (period.id) { <p-button type="button" label="Cancel edit" [outlined]="true" (onClick)="resetPeriod()" /> }
      </form>
      <p-table [value]="periods()">
        <ng-template pTemplate="header"><tr><th>Period</th><th>Band</th><th>Time</th><th>Actions</th></tr></ng-template>
        <ng-template pTemplate="body" let-p>
          <tr>
            <td>{{ p.name }}</td><td>{{ p.band }}</td><td>{{ p.startTime }}–{{ p.endTime }}</td>
            <td>
              <button type="button" class="table-action" (click)="editPeriod(p)">Edit</button>
              <button type="button" class="table-action danger" (click)="deletePeriod(p)">Delete</button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    }

    @if (tab==='grid') {
      <div class="toolbar card">
        <label>Class
          <select aria-label="Class" [(ngModel)]="classId" (ngModelChange)="onClass()">
            <option value="">Select class</option>
            @for (cls of classes(); track cls.id) { <option [value]="cls.id">{{ cls.name }}</option> }
          </select>
        </label>
        <label>Section
          <select aria-label="Section" [(ngModel)]="sectionId" (ngModelChange)="loadGrid()">
            <option value="">Select section</option>
            @for (section of sections(); track section.id) { <option [value]="section.id">{{ section.name }}</option> }
          </select>
        </label>
      </div>
      @if (grid()) {
        <div class="grid-scroll">
          <p-table [value]="grid().days" styleClass="timetable-grid-table"
            [tableStyle]="{ 'min-width': (100 + grid().periods.length * 190) + 'px' }">
            <ng-template pTemplate="header">
              <tr>
                <th>Day</th>
                @for (p of grid().periods; track p.id) { <th>{{ p.name }}<small>{{ p.startTime }}</small></th> }
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-d>
              <tr>
                <th>{{ d.name }}</th>
                @for (cell of d.cells; track cell.periodId) {
                  <td [class.open]="cell.unassigned">
                    @if (admin) {
                      <div class="grid-cell-controls">
                        <select aria-label="Subject" [ngModel]="cell.subjectId || ''"
                          (ngModelChange)="pick(d.dayOfWeek, cell.periodId, 'subjectId', $event)">
                          <option value="">Subject</option>
                          @for (subject of subjects(); track subject.id) { <option [value]="subject.id">{{ subject.name }}</option> }
                        </select>
                        <select aria-label="Teacher" [ngModel]="cell.employeeId || ''"
                          (ngModelChange)="pick(d.dayOfWeek, cell.periodId, 'employeeId', $event)">
                          <option value="">Teacher</option>
                          @for (teacher of teachers(); track teacher.id) { <option [value]="teacher.id">{{ teacher.fullName }}</option> }
                        </select>
                        @if (cell.slotId) {
                          <button type="button" class="clear-slot" (click)="clearSlot(cell.slotId)">Clear period</button>
                        }
                      </div>
                    } @else {
                      <strong>{{ cell.subject || '—' }}</strong>
                      <small>{{ cell.unassigned ? 'Unassigned' : (cell.teacher || '') }}</small>
                    }
                  </td>
                }
              </tr>
            </ng-template>
          </p-table>
        </div>
        <div class="mobile-days">
          @for (d of grid().days; track d.dayOfWeek) {
            <section class="mobile-day-card">
              <h2>{{ d.name }}</h2>
              @for (cell of d.cells; track cell.periodId; let i = $index) {
                <article class="mobile-period" [class.open]="cell.unassigned">
                  <header>
                    <strong>{{ grid().periods[i]?.name || ('Period ' + (i + 1)) }}</strong>
                    <small>{{ grid().periods[i]?.startTime }}</small>
                  </header>
                  @if (admin) {
                    <div class="grid-cell-controls">
                      <label>Subject
                        <select aria-label="Subject" [ngModel]="cell.subjectId || ''"
                          (ngModelChange)="pick(d.dayOfWeek, cell.periodId, 'subjectId', $event)">
                          <option value="">Select subject</option>
                          @for (subject of subjects(); track subject.id) { <option [value]="subject.id">{{ subject.name }}</option> }
                        </select>
                      </label>
                      <label>Teacher
                        <select aria-label="Teacher" [ngModel]="cell.employeeId || ''"
                          (ngModelChange)="pick(d.dayOfWeek, cell.periodId, 'employeeId', $event)">
                          <option value="">Select teacher</option>
                          @for (teacher of teachers(); track teacher.id) { <option [value]="teacher.id">{{ teacher.fullName }}</option> }
                        </select>
                      </label>
                      @if (cell.slotId) {
                        <button type="button" class="clear-slot" (click)="clearSlot(cell.slotId)">Clear period</button>
                      }
                    </div>
                  } @else {
                    <strong>{{ cell.subject || 'No subject assigned' }}</strong>
                    <small>{{ cell.unassigned ? 'Unassigned' : (cell.teacher || '') }}</small>
                  }
                </article>
              }
            </section>
          }
        </div>
      }
    }
  `,
  styles: [`
    .tabs { display: flex; gap: 6px; margin: 12px 0 14px; padding: 4px; width: fit-content; border: 1px solid #d7e4ef; border-radius: 10px; background: #f4f9fd; }
    .tabs button { font: inherit; cursor: pointer; border: 1px solid transparent; background: transparent; border-radius: 7px; padding: 7px 12px; color: #60798f; font-size: 11px; font-weight: 650; }
    .tabs button.on { background: white; color: #2677ad; border-color: #dce8f2; box-shadow: 0 1px 4px rgba(42, 81, 113, .08); }
    .table-action, .clear-slot { border: 1px solid #d7e4ef; border-radius: 6px; background: white; color: #327fb2; padding: 5px 8px; margin: 2px; cursor: pointer; font: inherit; }
    .table-action:hover { background: #eff7fc; }
    .table-action.danger, .clear-slot { color: #a44d49; }
    .card, table { background: white; border: 1px solid #d8e5ef; border-radius: 12px; }
    .form { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 3px 12px rgba(49,83,112,.05); }
    .form label, .toolbar label, .grid-cell-controls label { display: grid; gap: 6px; min-width: 0; color: #5b7185; font-size: 10px; font-weight: 750; letter-spacing: .04em; text-transform: uppercase; }
    .form input, .form select, .toolbar select { width: 100%; min-width: 0; min-height: 38px; font: inherit; padding: 8px; border: 1px solid #d5e2ed; border-radius: 8px; background: white; color: var(--ink); }
    .toolbar { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; padding: 13px 15px; box-shadow: 0 3px 12px rgba(49,83,112,.05); }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e4edf4; padding: 8px; font-size: 11px; min-width: 120px; vertical-align: top; }
    th small { display: block; margin-top: 3px; font-weight: 500; color: #8095a8; }
    .grid-scroll { width: 100%; max-width: 100%; overflow-x: auto; border: 1px solid #d7e4ef; border-radius: 12px; background: white; box-shadow: 0 3px 12px rgba(49,83,112,.05); }
    :host ::ng-deep .timetable-grid-table .p-datatable-table { table-layout: fixed; border-collapse: separate; border-spacing: 0; }
    :host ::ng-deep .timetable-grid-table .p-datatable-thead > tr > th { background: #eaf3fa; color: #4d6b84; font-size: 10px; font-weight: 750; letter-spacing: .04em; text-transform: uppercase; border-color: #dce8f1; }
    :host ::ng-deep .timetable-grid-table .p-datatable-tbody > tr > th { background: #f4f8fb; color: #355872; font-size: 11px; font-weight: 750; }
    :host ::ng-deep .timetable-grid-table .p-datatable-tbody > tr > td { background: #fff; transition: background-color 120ms ease; }
    :host ::ng-deep .timetable-grid-table .p-datatable-tbody > tr:hover > td { background: #f7fbfe; }
    :host ::ng-deep .timetable-grid-table .p-datatable-thead > tr > th:first-child,
    :host ::ng-deep .timetable-grid-table .p-datatable-tbody > tr > th { width: 100px; min-width: 100px; }
    :host ::ng-deep .timetable-grid-table .p-datatable-thead > tr > th:not(:first-child),
    :host ::ng-deep .timetable-grid-table .p-datatable-tbody > tr > td { width: 190px; min-width: 190px; }
    :host ::ng-deep .timetable-grid-table .p-datatable-thead > tr > th,
    :host ::ng-deep .timetable-grid-table .p-datatable-tbody > tr > th,
    :host ::ng-deep .timetable-grid-table .p-datatable-tbody > tr > td { padding: 8px; vertical-align: top; }
    .grid-cell-controls { display: grid; gap: 6px; min-width: 0; }
    .grid-cell-controls select { display: block; width: 100%; min-width: 0; min-height: 34px; padding: 6px 8px; border: 1px solid #dce7f0; border-radius: 7px; background: #fbfdff; color: var(--ink); font: inherit; font-size: 10px; }
    .mobile-days { display: none; }
    .mobile-day-card { overflow: hidden; background: white; border: 1px solid #d8e5ef; border-radius: 12px; box-shadow: 0 3px 12px rgba(49,83,112,.05); }
    .mobile-day-card h2 { margin: 0; padding: 11px 14px; background: #eaf3fa; color: #355872; font-size: 13px; }
    .mobile-period { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 12px; padding: 11px 12px; border-top: 1px solid #e9f0f5; }
    .mobile-period > header { display: grid; align-content: start; gap: 3px; color: var(--navy); font-size: 12px; }
    .mobile-period > header small { color: var(--muted); }
    .mobile-period.open { background: #fff9ec; }
    td.open { background: #fff8e8 !important; }
    td strong, td small { display: block; }
    .ok { background: #e5f8f1; color: #087d68; padding: 8px; border-radius: 8px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 8px; border-radius: 8px; }
    @media (max-width: 700px) {
      .toolbar { grid-template-columns: minmax(0, 1fr); }
      .grid-scroll { display: none; }
      .mobile-days { display: grid; gap: 12px; }
      .mobile-period { grid-template-columns: 64px minmax(0, 1fr); }
    }
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
  periodBands = ['Morning', 'Evening'];
  period: { id?: string; name: string; sortOrder: number; startTime: string; endTime: string; band: string } =
    { name: 'M1', sortOrder: 1, startTime: '08:00', endTime: '08:45', band: 'Morning' };

  constructor(private api: ApiService, public ctx: SchoolContextService, auth: AuthService) {
    this.admin = auth.hasRole('SchoolAdmin');
  }

  ngOnInit() {
    if (!this.ctx.schoolId) return;
    this.api.getClasses(this.ctx.schoolId).subscribe({ next: c => this.classes.set(c) });
    this.api.getSubjects(this.ctx.schoolId).subscribe({ next: s => this.subjects.set(s) });
    this.api.getEmployees(this.ctx.schoolId, 1, 100).subscribe({
      next: r => this.teachers.set((r.items || []).map((t: any) => ({ ...t, fullName: `${t.firstName} ${t.lastName}` })))
    });
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
        this.notice.set(this.period.id ? 'Period updated.' : 'Period saved.');
        this.resetPeriod();
        this.loadPeriods();
      },
      error: e => this.error.set(e?.error?.error || 'Could not save period.')
    });
  }

  editPeriod(period: any) {
    this.period = {
      id: period.id, name: period.name, sortOrder: period.sortOrder,
      startTime: period.startTime, endTime: period.endTime, band: period.band
    };
    this.tab = 'periods';
  }

  resetPeriod() {
    this.period = { name: 'M1', sortOrder: 1, startTime: '08:00', endTime: '08:45', band: 'Morning' };
  }

  deletePeriod(period: any) {
    this.api.deletePeriod(this.ctx.schoolId, this.ctx.academicYearId, period.id).subscribe({
      next: () => {
        if (this.period.id === period.id) this.resetPeriod();
        this.notice.set('Period deleted.');
        this.loadPeriods();
      },
      error: e => this.error.set(e?.error?.error || 'Could not delete period.')
    });
  }

  private loadPeriods() {
    this.api.getPeriods(this.ctx.schoolId, this.ctx.academicYearId).subscribe({
      next: periods => this.periods.set(periods),
      error: () => this.error.set('Could not load periods.')
    });
  }

  clearSlot(slotId: string) {
    this.api.clearTimetableSlot(this.ctx.schoolId, slotId).subscribe({
      next: () => {
        this.notice.set('Timetable slot cleared.');
        this.loadGrid();
      },
      error: e => this.error.set(e?.error?.error || 'Could not clear timetable slot.')
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
      error: e => {
        this.error.set(e?.error?.error || 'Period clash — teacher already booked.');
        this.loadGrid();
      }
    });
  }
}
