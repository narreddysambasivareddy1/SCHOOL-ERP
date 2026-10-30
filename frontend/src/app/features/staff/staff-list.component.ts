import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { environment } from '../../../environments/environment';
import { SchoolContextService } from '../../core/services/school-context.service';
import { ApiService } from '../../core/services/api.service';

interface EmployeeListDto {
  id: string; employeeCode: string; firstName: string; lastName: string;
  department?: string; designation?: string; status: string;
  email?: string; phone?: string; joiningDate?: string; photoUrl?: string;
}

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, DialogModule],
  template: `
    <div class="page-header">
      <div>
        <div class="eyebrow">HUMAN RESOURCES</div>
        <h1>Staff & HR</h1>
        <p>Teachers and staff. Open a name to see the saved record and photo.</p>
      </div>
      <p-button label="+ Add staff" (onClick)="openCreate()" [disabled]="!ctx.schoolId" />
    </div>
    <div class="toolbar">
      <input pInputText [(ngModel)]="search" placeholder="Search employee or department..." (input)="load()" />
    </div>
    <p-table [value]="employees()" [loading]="loading()" [lazy]="true"
             (onLazyLoad)="onLazy($event)" [totalRecords]="total()"
             [rows]="25" [paginator]="true" styleClass="p-datatable-sm">
      <ng-template pTemplate="header">
        <tr><th>Employee</th><th>Department</th><th>Designation</th><th>Status</th><th></th></tr>
      </ng-template>
      <ng-template pTemplate="body" let-e>
        <tr>
          <td>
            <button type="button" class="person person-btn" (click)="openProfile(e)">
              @if (e.photoUrl) {
                <img class="avatar" [src]="e.photoUrl" alt="" />
              } @else {
                <div class="avatar">{{ e.firstName[0] }}{{ e.lastName[0] }}</div>
              }
              <div><strong>{{ e.firstName }} {{ e.lastName }}</strong><br><small>{{ e.employeeCode }}</small></div>
            </button>
          </td>
          <td>{{ e.department ?? '—' }}</td>
          <td>{{ e.designation ?? '—' }}</td>
          <td><p-tag [value]="e.status" [severity]="e.status === 'Active' ? 'success' : 'warn'" /></td>
          <td>
            <p-button [label]="e.status === 'Active' ? 'Set inactive' : 'Set active'" [outlined]="true"
              (onClick)="toggle(e)" />
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td colspan="5" style="text-align:center;color:var(--muted);padding:32px">No employees found.</td></tr>
      </ng-template>
    </p-table>
    @if (error()) { <p class="form-error">{{ error() }}</p> }

    <p-dialog header="Add staff" [(visible)]="showCreate" [modal]="true" appendTo="body" [style]="{width:'520px'}" [draggable]="false" (onHide)="stopCamera()">
      <form class="form-grid" (ngSubmit)="create()">
        <label>First name *<input [(ngModel)]="draft.firstName" name="firstName" required /></label>
        <label>Last name *<input [(ngModel)]="draft.lastName" name="lastName" required /></label>
        <label>Email<input [(ngModel)]="draft.email" name="email" type="email" /></label>
        <label>Phone<input [(ngModel)]="draft.phone" name="phone" /></label>
        <label>Department
          <select [(ngModel)]="draft.departmentId" name="departmentId">
            <option value="">None</option>
            @for (dept of departments(); track dept.id) { <option [value]="dept.id">{{ dept.name }}</option> }
          </select>
        </label>
        <label>Joining date *<input [(ngModel)]="draft.joiningDate" name="joiningDate" type="date" required /></label>
        <div class="photo-field">Photo
          <div class="photo-actions">
            <button type="button" (click)="startCamera()">Open camera</button>
            <button type="button" (click)="createFile.click()">Upload</button>
            <input #createFile type="file" accept="image/*" hidden (change)="onPhoto($event)" />
          </div>
          @if (cameraOn() && showCreate) {
            <div class="cam">
              <video #cam autoplay playsinline muted></video>
              <div class="photo-actions">
                <button type="button" (click)="capture()">Use this photo</button>
                <button type="button" (click)="stopCamera()">Close camera</button>
              </div>
            </div>
          }
          @if (draft.photoUrl) { <img class="preview" [src]="draft.photoUrl" alt="Selected staff photo" /> }
        </div>
        <div class="dialog-footer">
          <p-button label="Cancel" [outlined]="true" type="button" (onClick)="showCreate = false" />
          <p-button label="Create staff" type="submit" [loading]="saving()" [disabled]="!draft.firstName || !draft.lastName || !draft.joiningDate" />
        </div>
      </form>
    </p-dialog>

    <p-dialog header="Staff profile" [(visible)]="showProfile" [modal]="true" appendTo="body" [style]="{width:'min(560px, calc(100vw - 32px))'}" [draggable]="false" (onHide)="stopCamera()">
      @if (selected()) {
        <div class="profile">
          @if (selected()!.photoUrl) {
            <img class="portrait" [src]="selected()!.photoUrl" alt="" />
          } @else {
            <div class="portrait empty">{{ selected()!.firstName[0] }}{{ selected()!.lastName[0] }}</div>
          }
          <dl>
            <div><dt>Employee ID</dt><dd>{{ selected()!.employeeCode }}</dd></div>
            <div><dt>First name</dt><dd>{{ selected()!.firstName }}</dd></div>
            <div><dt>Last name</dt><dd>{{ selected()!.lastName }}</dd></div>
            <div><dt>Email</dt><dd>{{ selected()!.email || '—' }}</dd></div>
            <div><dt>Phone</dt><dd>{{ selected()!.phone || '—' }}</dd></div>
            <div><dt>Department</dt><dd>{{ selected()!.department || '—' }}</dd></div>
            <div><dt>Designation</dt><dd>{{ selected()!.designation || '—' }}</dd></div>
            <div><dt>Joining date</dt><dd>{{ selected()!.joiningDate || '—' }}</dd></div>
            <div><dt>Status</dt><dd>{{ selected()!.status }}</dd></div>
          </dl>
        </div>
        @if (!selected()!.photoUrl) {
          <div class="photo-actions">
            <button type="button" (click)="startCamera()">Open camera</button>
            <button type="button" (click)="profileFile.click()">Upload</button>
            <input #profileFile type="file" accept="image/*" hidden (change)="onProfilePhoto($event)" />
          </div>
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
      }
    </p-dialog>
  `,
  styles: [`
    h1 { font-size: 22px; }
    .toolbar { margin-bottom: 14px; }
    .toolbar input { width: min(320px, 100%); }
    .person { display: flex; align-items: center; gap: 10px; }
    .person-btn { border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; padding: 0; }
    .avatar { width: 40px; height: 40px; border-radius: 12px; background: var(--primary-soft); color: var(--primary); display: grid; place-items: center; font-size: 13px; font-weight: 800; flex-shrink: 0; object-fit: cover; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-grid label { display: grid; gap: 6px; color: var(--muted); font-size: 12px; font-weight: 700; }
    .photo-field { grid-column: 1 / -1; display: grid; gap: 6px; color: var(--muted); font-size: 12px; font-weight: 700; }
    .preview, .portrait { width: 96px; height: 96px; object-fit: cover; border-radius: 16px; border: 1px solid var(--line); }
    .portrait.empty { display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); }
    .profile { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 20px; }
    dl { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; margin: 0; }
    dl div { display: grid; gap: 2px; }
    dt { color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
    dd { margin: 0; color: var(--ink); font-size: 15px; }
    .dialog-footer { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 10px; }
    .photo-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .photo-actions button { font: inherit; cursor: pointer; border: 1px solid var(--line); background: var(--navy2); color: var(--ink); border-radius: 8px; padding: 7px 10px; font-size: 12px; font-weight: 700; }
    .cam { margin-top: 12px; }
    .cam video { width: 100%; max-height: 220px; background: #070d18; border-radius: 12px; object-fit: cover; }
    .form-error { color: var(--danger); }
    strong { font-size: 12px; }
    small { color: var(--muted); font-size: 10px; }
  `]
})
export class StaffListComponent implements OnInit, OnDestroy {
  employees = signal<EmployeeListDto[]>([]);
  total = signal(0);
  loading = signal(false);
  search = '';
  showCreate = false;
  showProfile = false;
  saving = signal(false);
  error = signal<string | null>(null);
  selected = signal<EmployeeListDto | null>(null);
  departments = signal<{ id: string; name: string }[]>([]);
  cameraOn = signal(false);
  photoSaving = signal(false);
  cam = viewChild<ElementRef<HTMLVideoElement>>('cam');
  private stream: MediaStream | null = null;
  draft = { firstName: '', lastName: '', email: '', phone: '', departmentId: '', joiningDate: '', photoUrl: '' };
  private page = 1;
  private pageSize = 25;

  constructor(private http: HttpClient, public ctx: SchoolContextService, private api: ApiService) {}

  ngOnDestroy() { this.stopCamera(); }

  ngOnInit() {
    this.load();
    if (this.ctx.schoolId) this.api.getDepartments(this.ctx.schoolId).subscribe(rows => this.departments.set(rows));
  }

  openCreate() {
    this.draft = { firstName: '', lastName: '', email: '', phone: '', departmentId: '', joiningDate: new Date().toISOString().slice(0, 10), photoUrl: '' };
    this.error.set(null);
    this.showCreate = true;
  }

  openProfile(row: EmployeeListDto) {
    this.stopCamera();
    this.selected.set(row);
    this.showProfile = true;
  }

  onProfilePhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.selected()) return;
    this.readPhoto(file, url => this.saveStaffPhoto(url));
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
      this.error.set('Camera is not available. Use Upload.');
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
    if (this.showProfile && this.selected()) this.saveStaffPhoto(url);
    else this.draft.photoUrl = url;
  }

  private saveStaffPhoto(url: string) {
    const person = this.selected();
    if (!person) return;
    this.photoSaving.set(true);
    this.error.set(null);
    this.api.setEmployeePhoto(this.ctx.schoolId, person.id, url).subscribe({
      next: () => {
        this.selected.set({ ...person, photoUrl: url });
        this.photoSaving.set(false);
        this.load();
      },
      error: () => { this.photoSaving.set(false); this.error.set('Could not save this photo.'); }
    });
  }

  private readPhoto(file: File, done: (url: string) => void) {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 240 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      done(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => { URL.revokeObjectURL(url); this.error.set('Could not read that image.'); };
    image.src = url;
  }

  onPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 240 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      this.draft.photoUrl = canvas.toDataURL('image/jpeg', 0.82);
    };
    image.src = url;
  }

  create() {
    if (!this.draft.firstName || !this.draft.lastName || !this.draft.joiningDate) return;
    this.saving.set(true);
    this.error.set(null);
    this.api.createEmployee(this.ctx.schoolId, {
      firstName: this.draft.firstName,
      lastName: this.draft.lastName,
      email: this.draft.email || null,
      phone: this.draft.phone || null,
      departmentId: this.draft.departmentId || null,
      designationId: null,
      joiningDate: this.draft.joiningDate,
      photoUrl: this.draft.photoUrl || null
    }).subscribe({
      next: () => { this.saving.set(false); this.showCreate = false; this.load(); },
      error: () => { this.saving.set(false); this.error.set('Could not create this staff record.'); }
    });
  }

  onLazy(event: TableLazyLoadEvent) {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.pageSize;
    this.page = Math.floor(first / rows) + 1;
    this.pageSize = rows;
    this.load();
  }

  toggle(e: EmployeeListDto) {
    const next = e.status === 'Active' ? 'Inactive' : 'Active';
    this.api.setEmployeeStatus(this.ctx.schoolId, e.id, next).subscribe({ next: () => this.load() });
  }

  load() {
    if (!this.ctx.schoolId) { this.employees.set([]); return; }
    this.loading.set(true);
    const params = new URLSearchParams({ page: String(this.page), pageSize: String(this.pageSize), ...(this.search ? { search: this.search } : {}) });
    this.http.get<{ items: EmployeeListDto[]; totalCount: number }>(`${environment.apiUrl}/schools/${this.ctx.schoolId}/employees?${params}`)
      .subscribe({ next: r => { this.employees.set(r.items); this.total.set(r.totalCount); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
}
