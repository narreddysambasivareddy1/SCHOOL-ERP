import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
    InputTextModule, TagModule, DialogModule, DropdownModule, CalendarModule, MessageModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-header">
      <div>
        <div class="eyebrow">STUDENT INFORMATION SYSTEM</div>
        <h1>Students</h1>
      </div>
      <p-button label="+ Add student" (onClick)="openDialog()" [disabled]="!ctx.schoolId" />
    </div>

    <div class="toolbar">
      <input pInputText [(ngModel)]="search" placeholder="Search name or student ID..." (input)="onSearch()" style="width:min(320px,100%)" />
    </div>

    <p-table [value]="students()" [loading]="loading()" [lazy]="true"
             (onLazyLoad)="onLazy($event)" [totalRecords]="total()"
             [rows]="25" [paginator]="true" [rowsPerPageOptions]="[25,50,100]"
             styleClass="p-datatable-sm" [rowHover]="true">
      <ng-template pTemplate="header">
        <tr>
          <th>Student</th><th>Class / Section</th><th>Status</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-s>
        <tr>
          <td>
            <div class="person">
              <div class="avatar">{{ s.firstName[0] }}{{ s.lastName[0] }}</div>
              <div><strong>{{ s.firstName }} {{ s.lastName }}</strong><br><small>{{ s.studentCode }}</small></div>
            </div>
          </td>
          <td>{{ s.className }} · {{ s.sectionName }}</td>
          <td><p-tag [value]="s.status" [severity]="s.status === 'Active' ? 'success' : 'warn'" /></td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td colspan="3" style="text-align:center;color:var(--muted);padding:32px">
          {{ ctx.schoolId ? 'No students found.' : 'School context not loaded. Please log in again.' }}
        </td></tr>
      </ng-template>
    </p-table>

    <!-- Create Student Dialog -->
    <p-dialog header="Add student" [(visible)]="showDialog" [modal]="true" [style]="{width:'520px'}" [draggable]="false">
      <form [formGroup]="form" (ngSubmit)="createStudent()">
        <div class="form-grid">
          <div class="field">
            <label>First name *</label>
            <input pInputText formControlName="firstName" style="width:100%" />
          </div>
          <div class="field">
            <label>Last name *</label>
            <input pInputText formControlName="lastName" style="width:100%" />
          </div>
          <div class="field">
            <label>Date of birth *</label>
            <p-calendar formControlName="dateOfBirth" [showIcon]="true" dateFormat="dd/mm/yy" styleClass="w-full" />
          </div>
          <div class="field">
            <label>Roll number</label>
            <input pInputText formControlName="rollNumber" style="width:100%" />
          </div>
          <div class="field">
            <label>Class *</label>
            <p-dropdown [options]="classes()" optionLabel="name" optionValue="id"
              formControlName="classId" (onChange)="onClassChange($event.value)" styleClass="w-full" placeholder="Select class" />
          </div>
          <div class="field">
            <label>Section *</label>
            <p-dropdown [options]="sections()" optionLabel="name" optionValue="id"
              formControlName="sectionId" styleClass="w-full" placeholder="Select section" />
          </div>
        </div>
        <div class="dialog-footer">
          <p-button label="Cancel" [outlined]="true" (onClick)="showDialog = false" type="button" />
          <p-button label="Create student" type="submit" [loading]="saving()" [disabled]="form.invalid" />
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    h1 { margin: 4px 0; font-size: 22px; color: var(--navy); }
    .toolbar { margin-bottom: 14px; }
    .person { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 9px; background: #e7efff; color: #28569b; display: grid; place-items: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
    strong { font-size: 12px; }
    small { color: var(--muted); font-size: 10px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .field label { display: block; font-size: 11px; font-weight: 700; margin-bottom: 5px; color: #506078; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    :host ::ng-deep .p-calendar { width: 100%; }
  `]
})
export class StudentListComponent implements OnInit {
  students = signal<any[]>([]);
  total = signal(0);
  loading = signal(false);
  saving = signal(false);
  classes = signal<any[]>([]);
  sections = signal<any[]>([]);
  showDialog = false;
  search = '';
  private page = 1;
  private pageSize = 25;
  private searchTimer: any;

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dateOfBirth: [null as Date | null, Validators.required],
    rollNumber: [''],
    classId: ['', Validators.required],
    sectionId: ['', Validators.required],
  });

  constructor(
    private api: ApiService,
    public ctx: SchoolContextService,
    private fb: FormBuilder,
    private msg: MessageService
  ) {}

  ngOnInit() {
    this.load();
    if (this.ctx.schoolId) {
      this.api.getClasses(this.ctx.schoolId).subscribe(c => this.classes.set(c));
    }
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page = 1; this.load(); }, 400);
  }

  onLazy(event: TableLazyLoadEvent) {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.pageSize;
    this.page = Math.floor(first / rows) + 1;
    this.pageSize = rows;
    this.load();
  }

  load() {
    if (!this.ctx.schoolId || !this.ctx.academicYearId) { this.students.set([]); return; }
    this.loading.set(true);
    this.api.getStudents(this.ctx.schoolId, this.ctx.academicYearId, this.page, this.pageSize, this.search)
      .subscribe({
        next: r => { this.students.set(r.items); this.total.set(r.totalCount); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  openDialog() {
    this.form.reset();
    this.showDialog = true;
  }

  onClassChange(classId: string) {
    const cls = this.classes().find(c => c.id === classId);
    this.sections.set(cls?.sections ?? []);
    this.form.patchValue({ sectionId: '' });
  }

  createStudent() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value;
    const dob = v.dateOfBirth as Date;
    const body = {
      firstName: v.firstName,
      lastName: v.lastName,
      dateOfBirth: `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`,
      academicYearId: this.ctx.academicYearId,
      classId: v.classId,
      sectionId: v.sectionId,
      rollNumber: v.rollNumber || null
    };
    this.api.createStudent(this.ctx.schoolId, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.showDialog = false;
        this.msg.add({ severity: 'success', summary: 'Student created', detail: `${v.firstName} ${v.lastName} added successfully.` });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to create student.' });
      }
    });
  }
}
