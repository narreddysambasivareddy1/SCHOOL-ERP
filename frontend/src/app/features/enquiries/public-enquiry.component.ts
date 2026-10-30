import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-public-enquiry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="box" (ngSubmit)="step === 1 ? request() : verify()">
      <h3>{{ title }}</h3>
      <p class="text-muted">Mobile OTP is required. Unverified submissions are not stored as leads.</p>
      @if (error()) { <div class="alert">{{ error() }}</div> }
      @if (ok()) { <div class="ok">{{ ok() }}</div> }
      @if (step === 1) {
        <label>Enquiry type</label>
        <select [(ngModel)]="kind" name="kind">
          <option>Admission</option><option>Fees</option><option>General</option>
        </select>
        <label>Parent name</label>
        <input [(ngModel)]="parentName" name="parentName" required />
        <label>Mobile</label>
        <input [(ngModel)]="phone" name="phone" required inputmode="numeric" placeholder="10-digit mobile" />
        <label>Email</label>
        <input [(ngModel)]="email" name="email" type="email" required placeholder="name@example.com" />
        <label>Student / grade</label>
        <input [(ngModel)]="grade" name="grade" placeholder="e.g. Grade 5" />
        <label>Message</label>
        <textarea [(ngModel)]="message" name="message" rows="3" required></textarea>
        <button type="submit" [disabled]="busy()">Send OTP</button>
      } @else {
        <p>OTP sent to {{ phone }}. Valid for 5 minutes. Max 3 requests / 15 minutes.</p>
        @if (sandboxOtp()) { <p class="ok">Sandbox OTP: {{ sandboxOtp() }}</p> }
        <input [(ngModel)]="otp" name="otp" maxlength="6" placeholder="6-digit OTP" required />
        <button type="submit" [disabled]="busy()">Verify & submit enquiry</button>
        <button type="button" class="ghost" (click)="step = 1">Change details</button>
      }
    </form>
  `,
  styles: [`
    .box { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 20px; }
    label { display: block; font-size: 11px; font-weight: 700; margin: 10px 0 4px; }
    input, select, textarea { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 8px; box-sizing: border-box; }
    button { margin-top: 12px; margin-right: 8px; background: var(--primary); color: white; border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; }
    .ghost { background: var(--surface); color: var(--ink); border: 1px solid var(--line); }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 8px; border-radius: 8px; }
    .ok { background: #e5f8f1; color: #087d68; padding: 8px; border-radius: 8px; }
  `]
})
export class PublicEnquiryComponent {
  @Input() schoolCode = 'bright-future';
  @Input() title = 'Admission / fee enquiry';
  kind = 'Admission';
  parentName = '';
  phone = '';
  email = '';
  grade = '';
  message = '';
  otp = '';
  step = 1;
  challengeId = '';
  busy = signal(false);
  error = signal<string | null>(null);
  ok = signal<string | null>(null);
  sandboxOtp = signal<string | null>(null);

  constructor(private api: ApiService) {}

  request() {
    this.error.set(null);
    this.ok.set(null);
    if (!this.validEmail(this.email)) {
      this.error.set('Enter a valid email address (for example name@school.com).');
      return;
    }
    this.busy.set(true);
    this.api.requestEnquiryOtp(this.schoolCode, {
      kind: this.kind, parentName: this.parentName, phone: this.phone, email: this.email.trim(),
      studentName: null, gradeInterested: this.grade, message: this.message
    }).subscribe({
      next: r => {
        this.challengeId = r.challengeId;
        this.sandboxOtp.set(r.sandboxOtp || null);
        this.step = 2;
        this.busy.set(false);
      },
      error: e => { this.error.set(e?.error?.error || 'Could not send OTP.'); this.busy.set(false); }
    });
  }

  verify() {
    this.busy.set(true);
    this.error.set(null);
    this.api.verifyEnquiryOtp(this.schoolCode, { challengeId: this.challengeId, otp: this.otp }).subscribe({
      next: r => {
        this.ok.set(r.message || 'Enquiry verified. Front office has been notified.');
        this.resetForm();
        this.busy.set(false);
      },
      error: e => { this.error.set(e?.error?.error || 'Verification failed.'); this.busy.set(false); }
    });
  }

  private resetForm() {
    this.kind = 'Admission';
    this.parentName = '';
    this.phone = '';
    this.email = '';
    this.grade = '';
    this.message = '';
    this.otp = '';
    this.step = 1;
    this.challengeId = '';
    this.sandboxOtp.set(null);
  }

  private validEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
  }
}
