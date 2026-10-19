import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">FRONT OFFICE · ADMISSIONS</div>
      <h1>Walk-in registration</h1>
      <p class="text-muted">REG-YYYY-XXXX is issued first. Seat confirmation creates STU-YYYY-XXXX and a printable admission form.</p>
    </div>
    @if (notice()) { <div class="ok">{{ notice() }}</div> }
    @if (error()) { <div class="alert">{{ error() }}</div> }

    <div class="tabs">
      <button type="button" [class.on]="tab==='desk'" (click)="tab='desk'">Desk</button>
      <button type="button" [class.on]="tab==='new'" (click)="tab='new'">New registration</button>
      <button type="button" [class.on]="tab==='import'" (click)="tab='import'">Bulk import</button>
    </div>

    @if (tab==='new') {
      <form class="card form" (ngSubmit)="create()">
        <label>First name</label><input [(ngModel)]="form.firstName" name="firstName" required />
        <label>Last name</label><input [(ngModel)]="form.lastName" name="lastName" required />
        <label>Date of birth</label><input type="date" [(ngModel)]="form.dateOfBirth" name="dob" required />
        <label>Gender</label>
        <select [(ngModel)]="form.gender" name="gender"><option>Female</option><option>Male</option><option>Other</option></select>
        <label>Class</label>
        <select [(ngModel)]="form.preferredClassId" name="classId" (ngModelChange)="onClass()">
          <option value="">Select</option>
          @for (c of classes(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
        </select>
        <label>Section</label>
        <select [(ngModel)]="form.preferredSectionId" name="sectionId">
          <option value="">Select</option>
          @for (s of sections(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
        </select>
        <label>Guardian name</label><input [(ngModel)]="form.guardianName" name="gname" required />
        <label>Guardian phone</label><input [(ngModel)]="form.guardianPhone" name="gphone" required />
        <label>Guardian email</label><input type="email" [(ngModel)]="form.guardianEmail" name="gemail" />
        <label>Relationship</label><input [(ngModel)]="form.relationship" name="rel" />
        <label>Registration fee</label><input type="number" [(ngModel)]="form.registrationFeeAmount" name="fee" />
        <button type="submit" [disabled]="busy()">Issue registration number</button>
      </form>
    }

    @if (tab==='import') {
      <div class="card">
        <p>CSV columns: firstName, lastName, dateOfBirth (YYYY-MM-DD), className, sectionName, rollNumber.</p>
        <a [href]="templateUrl" download>Download sample template</a>
        <input type="file" accept=".csv,text/csv" (change)="onFile($event)" />
        @if (preview()) {
          <p>{{ preview().total }} rows · {{ preview().errors }} errors</p>
          <table>
            <tr><th>#</th><th>Valid</th><th>Issues</th></tr>
            @for (r of preview().rows; track $index; let i = $index) {
              <tr><td>{{ i+1 }}</td><td>{{ r.valid ? 'Yes' : 'No' }}</td><td>{{ r.issues.join(', ') }}</td></tr>
            }
          </table>
          <button type="button" [disabled]="preview().errors" (click)="commit()">Commit valid import (atomic)</button>
        }
      </div>
    }

    @if (tab==='desk') {
      <div class="split">
        <div class="card list">
          @for (r of rows(); track r.id) {
            <button type="button" class="lead" [class.on]="selected()?.id===r.id" (click)="select(r)">
              <strong>{{ r.registrationNumber }}</strong>
              <small>{{ r.firstName }} {{ r.lastName }} · {{ r.status }}</small>
            </button>
          } @empty { <p class="text-muted">No walk-in registrations yet.</p> }
        </div>
        @if (selected()) {
          <div class="card detail">
            <h3>{{ selected().firstName }} {{ selected().lastName }}</h3>
            <p>{{ selected().registrationNumber }} · {{ selected().status }}</p>
            @if (selected().admissionNumber) { <p>Admission {{ selected().admissionNumber }}</p> }
            @if (selected().bonafideNumber) { <p>Bonafide {{ selected().bonafideNumber }}</p> }
            <button type="button" (click)="pay()" [disabled]="selected().feePaid">Record registration fee</button>
            <button type="button" (click)="confirm()" [disabled]="selected().status==='Confirmed'">Confirm seat</button>
            <button type="button" (click)="bonafide()">Issue bonafide number</button>
            @if (selected().admissionNumber) {
              <button type="button" (click)="printForm()">Print / PDF admission form</button>
            }

            <h4>Photo & documents</h4>
            <div class="cam">
              <video #video autoplay playsinline muted></video>
              <canvas #canvas hidden></canvas>
              <button type="button" (click)="startCam()">Open camera</button>
              <button type="button" (click)="snap()">Capture photo</button>
              <button type="button" (click)="stopCam()">Close camera</button>
            </div>
            <label>Upload identity / TC / photo</label>
            <select [(ngModel)]="docKind" name="kind">
              <option>Photo</option><option>Identity</option><option>TransferCertificate</option>
            </select>
            <input type="file" accept="image/*,.pdf" (change)="upload($event)" />
            @for (d of docs(); track d.id) {
              <div class="doc">
                <a [href]="d.url" target="_blank">{{ d.kind }} · {{ d.fileName }}</a>
                @if (d.verified) { <span>Verified</span> }
                @else { <button type="button" (click)="verify(d.id)">Verify</button> }
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    h1 { font-size: 22px; margin: 4px 0 8px; color: var(--navy); }
    .tabs { display: flex; gap: 8px; margin: 12px 0; }
    .tabs button, .lead, .detail button, .form button { font: inherit; cursor: pointer; }
    .tabs button { border: 1px solid var(--line); background: white; border-radius: 8px; padding: 6px 10px; }
    .tabs button.on { background: var(--primary); color: white; border-color: transparent; }
    .card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
    .split { display: grid; grid-template-columns: minmax(0,280px) minmax(0,1fr); gap: 12px; }
    .lead { display: block; width: 100%; text-align: left; border: 1px solid var(--line); background: white; border-radius: 8px; padding: 8px; margin-bottom: 8px; }
    .lead.on { border-color: var(--primary); }
    .lead small { display: block; color: var(--muted); }
    .form label { display: block; font-size: 11px; font-weight: 700; margin: 8px 0 4px; }
    .form input, .form select, .detail select, .detail input, .detail button, .form button { width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 8px; border-radius: 8px; border: 1px solid var(--line); }
    .form button, .detail button { background: var(--primary); color: white; border: 0; }
    .ok { background: #e5f8f1; color: #087d68; padding: 8px; border-radius: 8px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 8px; border-radius: 8px; }
    video { width: 100%; max-height: 180px; background: #111; border-radius: 8px; }
    .doc { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; padding: 6px 0; border-bottom: 1px solid var(--line); }
    table { width: 100%; font-size: 12px; margin-top: 12px; }
    @media (max-width: 800px) { .split { grid-template-columns: 1fr; } }
  `]
})
export class RegistrationsComponent implements OnInit {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  tab: 'desk' | 'new' | 'import' = 'desk';
  rows = signal<any[]>([]);
  selected = signal<any>(null);
  docs = signal<any[]>([]);
  classes = signal<any[]>([]);
  sections = signal<any[]>([]);
  preview = signal<any>(null);
  notice = signal<string | null>(null);
  error = signal<string | null>(null);
  busy = signal(false);
  docKind = 'Photo';
  importFile: File | null = null;
  stream: MediaStream | null = null;
  form: any = {
    firstName: '', lastName: '', dateOfBirth: '', gender: 'Female',
    preferredClassId: '', preferredSectionId: '',
    guardianName: '', guardianPhone: '', guardianEmail: '', relationship: 'Parent',
    registrationFeeAmount: 2500, academicYearId: ''
  };

  constructor(private api: ApiService, public ctx: SchoolContextService) {}

  get templateUrl() {
    return `/api/schools/${this.ctx.schoolId}/registrations/import/template`;
  }

  ngOnInit() {
    this.reload();
    if (this.ctx.schoolId) {
      this.api.getClasses(this.ctx.schoolId).subscribe({ next: c => this.classes.set(c) });
    }
  }

  printForm() {
    if (!this.selected()) return;
    this.api.getAdmissionForm(this.ctx.schoolId, this.selected().id).subscribe({
      next: html => {
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(html);
        w.document.close();
      },
      error: () => this.error.set('Could not open the admission form.')
    });
  }

  onClass() {
    const cls = this.classes().find(c => c.id === this.form.preferredClassId);
    this.sections.set(cls?.sections || []);
    this.form.preferredSectionId = '';
  }

  reload() {
    if (!this.ctx.schoolId) return;
    this.api.getRegistrations(this.ctx.schoolId).subscribe({
      next: rows => this.rows.set(rows),
      error: () => this.error.set('Could not load registrations.')
    });
  }

  create() {
    this.busy.set(true);
    this.error.set(null);
    this.api.createRegistration(this.ctx.schoolId, {
      ...this.form,
      academicYearId: this.ctx.academicYearId
    }).subscribe({
      next: r => {
        this.notice.set(`Issued ${r.registrationNumber}`);
        this.busy.set(false);
        this.tab = 'desk';
        this.reload();
      },
      error: e => { this.error.set(e?.error?.error || 'Could not register.'); this.busy.set(false); }
    });
  }

  select(r: any) {
    this.selected.set(r);
    this.api.registrationDocuments(this.ctx.schoolId, r.id).subscribe({ next: d => this.docs.set(d) });
  }

  pay() {
    this.api.payRegistrationFee(this.ctx.schoolId, this.selected().id, this.form.registrationFeeAmount).subscribe({
      next: r => { this.notice.set(`Fee receipt ${r.feeReceiptNumber}`); this.reload(); this.selected.set({ ...this.selected(), ...r, feePaid: true }); },
      error: e => this.error.set(e?.error?.error || 'Fee failed.')
    });
  }

  confirm() {
    this.api.confirmRegistration(this.ctx.schoolId, this.selected().id).subscribe({
      next: r => { this.notice.set(`Admission ${r.admissionNumber}`); this.reload(); },
      error: e => this.error.set(e?.error?.error || 'Confirmation failed.')
    });
  }

  bonafide() {
    this.api.issueBonafide(this.ctx.schoolId, this.selected().id).subscribe({
      next: r => this.notice.set(`Bonafide ${r.bonafideNumber}`),
      error: e => this.error.set(e?.error?.error || 'Verify identity/TC first.')
    });
  }

  async startCam() {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    if (this.video) this.video.nativeElement.srcObject = this.stream;
  }
  stopCam() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }
  snap() {
    const video = this.video?.nativeElement;
    const canvas = this.canvas?.nativeElement;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob || !this.selected()) return;
      const file = new File([blob], 'live-photo.jpg', { type: 'image/jpeg' });
      this.sendFile(file, 'Photo');
    }, 'image/jpeg', 0.9);
  }

  upload(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (file) this.sendFile(file, this.docKind);
  }

  sendFile(file: File, kind: string) {
    this.api.uploadRegistrationDocument(this.ctx.schoolId, this.selected().id, file, kind).subscribe({
      next: () => this.select(this.selected()),
      error: e => this.error.set(e?.error?.error || 'Upload failed.')
    });
  }

  verify(id: string) {
    this.api.verifyRegistrationDocument(this.ctx.schoolId, id).subscribe({ next: () => this.select(this.selected()) });
  }

  onFile(ev: Event) {
    this.importFile = (ev.target as HTMLInputElement).files?.[0] || null;
    if (!this.importFile) return;
    this.api.previewStudentImport(this.ctx.schoolId, this.ctx.academicYearId, this.importFile).subscribe({
      next: p => this.preview.set(p),
      error: () => this.error.set('Could not preview import.')
    });
  }

  commit() {
    if (!this.importFile) return;
    this.api.commitStudentImport(this.ctx.schoolId, this.ctx.academicYearId, this.importFile).subscribe({
      next: r => this.notice.set(`Imported ${r.imported} students.`),
      error: e => this.error.set(e?.error?.error || 'Import rolled back.')
    });
  }
}
