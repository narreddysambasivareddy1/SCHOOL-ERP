import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
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
          <th>Student</th><th>Class / Section</th><th>Status</th><th></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-s>
        <tr class="student-row" (click)="openStudent(s)">
          <td>
            <button type="button" class="person person-btn" (click)="openStudent(s)">
              @if (s.photoUrl) {
                <img class="avatar" [src]="s.photoUrl" alt="" />
              } @else {
                <div class="avatar">{{ s.firstName[0] }}{{ s.lastName[0] }}</div>
              }
              <div><strong>{{ s.firstName }} {{ s.lastName }}</strong><br><small>{{ s.studentCode }}</small></div>
            </button>
          </td>
          <td>{{ s.className }} · {{ s.sectionName }}</td>
          <td><p-tag [value]="s.status" [severity]="s.status === 'Active' ? 'success' : 'warn'" /></td>
          <td (click)="$event.stopPropagation()">
            <p-button [label]="s.status === 'Active' ? 'Set inactive' : 'Set active'" [outlined]="true" size="small"
              (onClick)="toggle(s)" />
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td colspan="4" style="text-align:center;color:var(--muted);padding:32px">
          {{ ctx.schoolId ? 'No students found.' : 'School context not loaded. Please log in again.' }}
        </td></tr>
      </ng-template>
    </p-table>

    <!-- Create Student Dialog -->
    <p-dialog header="Add student" [(visible)]="showDialog" [modal]="true" appendTo="body" [style]="{width:'520px'}" [draggable]="false" (onHide)="stopCamera()">
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
          <div class="field photo-field">
            <label>Photo</label>
            <div class="photo-actions">
              <button type="button" (click)="startCamera()">Open camera</button>
              <button type="button" (click)="createFile.click()">Upload</button>
              <input #createFile type="file" accept="image/*" hidden (change)="onPhoto($event)" />
            </div>
            @if (cameraOn() && showDialog) {
              <div class="cam">
                <video #cam autoplay playsinline muted></video>
                <div class="photo-actions">
                  <button type="button" (click)="capture()">Use this photo</button>
                  <button type="button" (click)="stopCamera()">Close camera</button>
                </div>
              </div>
            }
            @if (photo()) { <img class="preview" [src]="photo()" alt="Selected student photo" /> }
          </div>
        </div>
        <div class="dialog-footer">
          <p-button label="Cancel" [outlined]="true" (onClick)="showDialog = false" type="button" />
          <p-button label="Create student" type="submit" [loading]="saving()" [disabled]="form.invalid" />
        </div>
      </form>
    </p-dialog>

    <p-dialog header="Student profile" [(visible)]="showProfile" [modal]="true" appendTo="body" [style]="{width:'min(560px, calc(100vw - 32px))'}" [draggable]="false" (onHide)="stopCamera()">
      @if (profileLoading()) {
        <p>Loading student…</p>
      } @else if (profile()) {
        <div class="profile">
          @if (profile().photoUrl) {
            <img class="portrait" [src]="profile().photoUrl" alt="" />
          } @else {
            <div class="portrait empty">{{ profile().firstName[0] }}{{ profile().lastName[0] }}</div>
          }
          <dl>
            <div><dt>Student ID</dt><dd>{{ profile().studentCode }}</dd></div>
            <div><dt>First name</dt><dd>{{ profile().firstName }}</dd></div>
            <div><dt>Last name</dt><dd>{{ profile().lastName }}</dd></div>
            <div><dt>Date of birth</dt><dd>{{ profile().dateOfBirth }}</dd></div>
            <div><dt>Status</dt><dd>{{ profile().status }}</dd></div>
            <div><dt>Class</dt><dd>{{ enrollment(profile())?.className || '—' }}</dd></div>
            <div><dt>Section</dt><dd>{{ enrollment(profile())?.sectionName || '—' }}</dd></div>
            <div><dt>Roll number</dt><dd>{{ enrollment(profile())?.rollNumber || '—' }}</dd></div>
          </dl>
        </div>
        @if (!profile().photoUrl) {
          <div class="photo-actions">
            <button type="button" (click)="startCamera()">Open camera</button>
            <button type="button" (click)="profileFile.click()">Upload</button>
            <input #profileFile type="file" accept="image/*" hidden (change)="onProfilePhoto($event)" />
          </div>
        }
      }
      @if (cameraOn() && showProfile) {
        <div class="cam">
          <video #cam autoplay playsinline muted></video>
          <div class="photo-actions">
            <button type="button" (click)="capture()" [disabled]="photoSaving()">Use this photo</button>
            <button type="button" (click)="stopCamera()">Close camera</button>
          </div>
        </div>
      }
    </p-dialog>
  `,
  styles: [`
    :host { display:block; }
    .page-header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin:0 0 22px; padding:0 0 18px; border-bottom:1px solid var(--line); }
    .page-header .eyebrow { color:#766de0; font-size:9px; font-weight:850; letter-spacing:.13em; }
    h1 { margin:5px 0 0; color:#252b45; font-size:29px; font-weight:790; letter-spacing:-.045em; }
    .toolbar { display:flex; align-items:center; gap:12px; margin:0 0 14px; padding:12px; border:1px solid #e9eaf2; border-radius:12px; background:#fff; }
    .toolbar input { width:min(360px,100%); min-height:39px; padding:0 12px; border:1px solid #e7e8f0; border-radius:8px; background:#fafaff; color:#303650; font-size:12px; }
    .toolbar input:focus { border-color:#aaa4f3; background:#fff; outline:0; box-shadow:0 0 0 3px rgba(98,88,223,.10); }
    :host ::ng-deep .p-datatable { overflow:hidden; border:1px solid #e9eaf2; border-radius:13px; background:#fff; box-shadow:0 2px 9px rgba(35,38,75,.025); }
    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th { padding:13px 16px; border-color:#eff0f5; background:#f8f8fc; color:#969bb0; font-size:9px; font-weight:850; letter-spacing:.09em; text-transform:uppercase; }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td { padding:13px 16px; border-color:#f0f1f6; color:#4d536b; font-size:12px; }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr { transition:background .14s ease; }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover { background:#fafaff; }
    :host ::ng-deep .p-paginator { padding:9px 12px; border:0; border-top:1px solid #eff0f5; background:#fff; }
    .person { display:flex; align-items:center; gap:11px; }
    .student-row { cursor:pointer; }
    .person-btn { display:flex; align-items:center; gap:11px; padding:0; border:0; background:transparent; color:inherit; cursor:pointer; text-align:left; }
    .person-btn strong { color:#303650; font-size:12px; font-weight:750; }
    .avatar { display:grid; width:39px; height:39px; flex:none; place-items:center; border-radius:11px; background:#f0efff; color:#6258df; font-size:11px; font-weight:800; object-fit:cover; }
    .photo-field { grid-column:1/-1; }
    .preview,.portrait { width:96px; height:96px; border:1px solid var(--line); border-radius:14px; object-fit:cover; }
    .portrait.empty { display:grid; place-items:center; background:#f0efff; color:#6258df; font-weight:800; }
    .photo-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:13px; }
    .photo-actions button,.cam button { padding:8px 11px; border:1px solid #e5e5f0; border-radius:8px; background:#f7f7fc; color:#555d78; cursor:pointer; font-size:11px; font-weight:700; }
    .photo-actions button:hover,.cam button:hover { border-color:#c9c4fb; background:#f0efff; color:#5146c8; }
    .cam { margin-top:12px; }
    .cam video { width:100%; max-height:220px; border-radius:12px; background:#171a2b; object-fit:cover; }
    .profile { display:grid; grid-template-columns:96px minmax(0,1fr); gap:20px; align-items:start; }
    dl { display:grid; grid-template-columns:1fr 1fr; gap:14px 16px; margin:0; }
    dl div { display:grid; gap:4px; padding-bottom:9px; border-bottom:1px solid #f0f0f6; }
    dt { color:#9297aa; font-size:9px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
    dd { margin:0; color:#343a55; font-size:12px; font-weight:650; }
    small { color:#969bad; font-size:10px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:15px; }
    .field label { display:block; margin-bottom:6px; color:#737991; font-size:10px; font-weight:800; letter-spacing:.055em; text-transform:uppercase; }
    .field :where(input) { width:100%; min-height:39px; padding:8px 10px; border:1px solid #e5e7f0; border-radius:8px; background:#fff; color:#343a55; font-size:12px; }
    .dialog-footer { display:flex; justify-content:flex-end; gap:9px; margin-top:22px; padding-top:15px; border-top:1px solid #eff0f5; }
    :host ::ng-deep .p-dialog { overflow:hidden; border:1px solid #e9eaf2; border-radius:15px; box-shadow:0 24px 70px rgba(25,29,60,.18); }
    :host ::ng-deep .p-dialog .p-dialog-header { padding:18px 20px; border-bottom:1px solid #eff0f5; background:#fff; color:#2c324d; font-size:15px; font-weight:760; }
    :host ::ng-deep .p-dialog .p-dialog-content { padding:20px; background:#fff; }
    :host ::ng-deep .p-calendar { width:100%; }
    @media(max-width:650px) {
      .page-header { align-items:flex-start; flex-direction:column; }
      h1 { font-size:25px; }
      .toolbar input { width:100%; }
      .form-grid { grid-template-columns:1fr; }
      .profile { grid-template-columns:1fr; }
      dl { grid-template-columns:1fr 1fr; }
    }
  `]
  `]
})
export class StudentListComponent implements OnInit, OnDestroy {
  students = signal<any[]>([]);
  total = signal(0);
  loading = signal(false);
  saving = signal(false);
  classes = signal<any[]>([]);
  sections = signal<any[]>([]);
  showDialog = false;
  showProfile = false;
  profile = signal<any>(null);
  profileLoading = signal(false);
  photo = signal<string | null>(null);
  cameraOn = signal(false);
  photoSaving = signal(false);
  cam = viewChild<ElementRef<HTMLVideoElement>>('cam');
  private stream: MediaStream | null = null;
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

  ngOnDestroy() { this.stopCamera(); }

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
    this.photo.set(null);
    this.showDialog = true;
  }

  onPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.resizePhoto(file).then(url => this.photo.set(url)).catch(() =>
      this.msg.add({ severity: 'error', summary: 'Photo', detail: 'Could not read that image.' }));
  }

  onProfilePhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.profile()) return;
    this.resizePhoto(file).then(url => this.saveStudentPhoto(url)).catch(() =>
      this.msg.add({ severity: 'error', summary: 'Photo', detail: 'Could not read that image.' }));
  }

  async startCamera() {
    this.stopCamera();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      this.cameraOn.set(true);
      setTimeout(() => {
        const video = this.cam()?.nativeElement;
        if (video && this.stream) video.srcObject = this.stream;
      }, 50);
    } catch {
      this.msg.add({ severity: 'error', summary: 'Camera', detail: 'Camera is not available. Use Upload.' });
    }
  }

  stopCamera() {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.cameraOn.set(false);
  }

  capture() {
    const video = this.cam()?.nativeElement;
    if (!video) return;
    const sourceW = video.videoWidth || 640;
    const sourceH = video.videoHeight || 480;
    const scale = Math.min(1, 240 / Math.max(sourceW, sourceH));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceW * scale));
    canvas.height = Math.max(1, Math.round(sourceH * scale));
    canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL('image/jpeg', 0.82);
    this.stopCamera();
    if (this.showProfile && this.profile()) this.saveStudentPhoto(url);
    else this.photo.set(url);
  }

  private saveStudentPhoto(url: string) {
    const student = this.profile();
    if (!student) return;
    this.photoSaving.set(true);
    this.api.setStudentPhoto(this.ctx.schoolId, student.id, url).subscribe({
      next: () => {
        this.profile.set({ ...student, photoUrl: url });
        this.photoSaving.set(false);
        this.load();
        this.msg.add({ severity: 'success', summary: 'Photo saved', detail: 'Student photo updated.' });
      },
      error: () => {
        this.photoSaving.set(false);
        this.msg.add({ severity: 'error', summary: 'Photo', detail: 'Could not save this photo.' });
      }
    });
  }

  openStudent(row: any) {
    this.stopCamera();
    this.showProfile = true;
    this.profile.set(null);
    this.profileLoading.set(true);
    this.api.getStudent(this.ctx.schoolId, row.id).subscribe({
      next: student => { this.profile.set(student); this.profileLoading.set(false); },
      error: () => { this.profileLoading.set(false); this.msg.add({ severity: 'error', summary: 'Student', detail: 'Could not open this student.' }); }
    });
  }

  enrollment(student: any) {
    const rows = student?.enrollments || [];
    const year = this.ctx.context()?.academicYearName;
    return rows.find((row: any) => row.academicYear === year) || rows[0];
  }

  onClassChange(classId: string) {
    const cls = this.classes().find(c => c.id === classId);
    this.sections.set(cls?.sections ?? []);
    this.form.patchValue({ sectionId: '' });
  }

  toggle(s: any) {
    const next = s.status === 'Active' ? 'Inactive' : 'Active';
    this.api.setStudentStatus(this.ctx.schoolId, s.id, next).subscribe({
      next: () => this.load(),
      error: () => this.msg.add({ severity: 'error', summary: 'Status', detail: 'Could not update student status.' })
    });
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
      rollNumber: v.rollNumber || null,
      photoUrl: this.photo()
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

  private resizePhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        const scale = Math.min(1, 240 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(); };
      image.src = url;
    });
  }
}
