import { Component, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { EnquiryAlertService } from '../../core/services/enquiry-alert.service';

@Component({
  selector: 'app-enquiry-desk',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, TagModule],
  template: `
    <div class="page-header">
      <div class="eyebrow">FRONT OFFICE</div>
      <h1>Enquiry management desk</h1>
      <p class="text-muted">OTP-verified website leads only. Unverified forms never reach this list.</p>
    </div>
    @if (alerts.latest()) {
      <div class="flash">New lead: {{ alerts.latest().parentName }} · {{ alerts.latest().kind }} · {{ alerts.latest().phone }}</div>
    }
    @if (error()) { <div class="alert">{{ error() }}</div> }

    <div class="kpis">
      <div><span>New</span><strong>{{ count('Verified/New') }}</strong></div>
      <div><span>Contacted</span><strong>{{ count('Contacted') }}</strong></div>
      <div><span>Site visit</span><strong>{{ count('SiteVisit') }}</strong></div>
      <div><span>Converted</span><strong>{{ count('Converted') }}</strong></div>
    </div>

    <div class="toolbar">
      <select [(ngModel)]="status" (ngModelChange)="reload()">
        <option value="">All statuses</option>
        @for (s of statusOptions; track s) { <option [value]="s">{{ s }}</option> }
      </select>
      <select [(ngModel)]="kind" (ngModelChange)="reload()">
        <option value="">All types</option>
        @for (k of kindOptions; track k) { <option [value]="k">{{ k }}</option> }
      </select>
    </div>

    <div class="list-pane">
      <p-table [value]="rows()" styleClass="p-datatable-sm p-datatable-striped" [rowHover]="true">
        <ng-template pTemplate="header">
          <tr>
            <th>Parent</th><th>Type</th><th>Status</th><th>Phone</th><th>Owner</th><th>Follow-up</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-e>
          <tr class="click-row" (click)="open(e.id)">
            <td><strong>{{ e.parentName }}</strong></td>
            <td>{{ e.kind }}</td>
            <td><p-tag [value]="e.status" [severity]="severity(e.status)" /></td>
            <td>{{ e.phone }}</td>
            <td>{{ e.assignedToName || 'Unassigned' }}</td>
            <td>{{ e.followUpOn || '—' }}</td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="6" class="text-muted" style="padding:24px;text-align:center">No verified enquiries yet.</td></tr>
        </ng-template>
      </p-table>
    </div>

    @if (detail()) {
      <div class="modal-root" (click)="close()">
        <div class="modal-card" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-head">
            <div>
              <h3>{{ detail().enquiry.parentName }}</h3>
              <p class="meta">{{ detail().enquiry.kind }} · {{ detail().enquiry.status }}</p>
            </div>
            <button type="button" class="close" (click)="close()" aria-label="Close">×</button>
          </div>
          <div class="modal-body">
            <p>{{ detail().enquiry.message }}</p>
            <p class="text-muted">{{ detail().enquiry.email }} · Grade {{ detail().enquiry.gradeInterested || '—' }}</p>

            <label for="enq-counsellor">Assign counsellor</label>
            <select id="enq-counsellor" [(ngModel)]="assignee" (ngModelChange)="assign()">
              <option value="">Select counsellor</option>
              @for (s of staff(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
            </select>

            <label for="enq-status">Status</label>
            <select id="enq-status" [(ngModel)]="nextStatus">
              @for (s of workflow; track s) { <option [value]="s">{{ s }}</option> }
            </select>

            <label for="enq-follow">Follow-up date</label>
            <input id="enq-follow" type="date" [(ngModel)]="followUp" />
            <button type="button" class="btn" (click)="saveStatus()">Update pipeline</button>

            <label for="enq-note">Call / visit note</label>
            <textarea id="enq-note" [(ngModel)]="note" rows="3"></textarea>
            <button type="button" class="btn ghost" (click)="saveNote()">Log call note</button>

            <h4>Audit</h4>
            @for (a of detail().activities; track a.id) {
              <div class="act"><strong>{{ a.action }}</strong> · {{ a.actorName }} · {{ a.createdAt | date:'short' }}
                <div>{{ a.note }} {{ a.oldStatus && a.newStatus ? (a.oldStatus + ' → ' + a.newStatus) : '' }}</div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    h1 { font-size: 22px; margin: 4px 0 8px; color: var(--navy); }
    .flash { background: #e5f8f1; color: #087d68; padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; font-weight: 700; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; }
    .toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .toolbar select { min-width: 160px; }
    .kpis { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 8px; margin-bottom: 14px; }
    .kpis div { background: white; border: 1px solid var(--line); border-radius: 10px; padding: 10px; }
    .kpis span { display: block; font-size: 11px; color: var(--muted); font-weight: 700; }
    .list-pane { min-width: 0; overflow-x: auto; background: white; border: 1px solid var(--line); border-radius: 12px; }
    .click-row { cursor: pointer; }
    .modal-root {
      position: fixed; inset: 0; z-index: 4000;
      background: rgba(15, 39, 68, 0.45);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    }
    .modal-card {
      width: min(480px, 100%);
      max-height: min(86vh, 720px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 24px 80px rgba(15, 39, 68, 0.28);
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .modal-head {
      display: flex; justify-content: space-between; gap: 12px; align-items: flex-start;
      padding: 16px 18px 10px; border-bottom: 1px solid var(--line);
    }
    .modal-head h3 { margin: 0 0 4px; font-size: 18px; color: var(--navy); }
    .modal-body { padding: 12px 18px 18px; overflow: auto; }
    .meta { margin: 0; color: var(--muted); font-size: 12px; }
    .close { border: 0; background: #eef2f7; width: 32px; height: 32px; border-radius: 8px; font-size: 22px; cursor: pointer; line-height: 1; flex-shrink: 0; }
    label { display: block; font-size: 11px; font-weight: 700; margin: 12px 0 4px; }
    select, textarea, input[type=date] {
      width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px;
      font: inherit; background: white; box-sizing: border-box;
    }
    .btn { margin-top: 10px; width: 100%; background: var(--primary); color: white; border: 0; border-radius: 8px; padding: 9px 12px; cursor: pointer; font: inherit; }
    .btn.ghost { background: white; color: var(--ink); border: 1px solid var(--line); }
    .act { font-size: 12px; border-bottom: 1px solid var(--line); padding: 8px 0; }
    @media (max-width: 800px) { .kpis { grid-template-columns: 1fr 1fr; } }
  `]
})
export class EnquiryDeskComponent implements OnInit {
  rows = signal<any[]>([]);
  detail = signal<any>(null);
  selected = signal<any>(null);
  staff = signal<any[]>([]);
  error = signal<string | null>(null);
  status = '';
  kind = '';
  assignee = '';
  nextStatus = 'Contacted';
  followUp = '';
  note = '';
  statusOptions = ['Verified/New', 'Contacted', 'SiteVisit', 'Converted', 'Rejected'];
  kindOptions = ['Admission', 'Fees', 'General'];
  workflow = ['New', 'Contacted', 'SiteVisit', 'Converted', 'Rejected'];

  constructor(private api: ApiService, private ctx: SchoolContextService, public alerts: EnquiryAlertService) {
    effect(() => {
      if (this.alerts.latest()) this.reload();
    });
  }

  ngOnInit() {
    this.alerts.start();
    this.reload();
    if (this.ctx.schoolId) this.api.getEnquiryStaff(this.ctx.schoolId).subscribe({ next: s => this.staff.set(s) });
  }

  count(status: string) { return this.rows().filter(r => r.status === status).length; }

  severity(status: string) {
    if (status === 'Converted') return 'success';
    if (status === 'Rejected') return 'danger';
    if (status === 'Contacted' || status === 'SiteVisit') return 'info';
    return 'warn';
  }

  reload() {
    if (!this.ctx.schoolId) return;
    const st = this.status === 'Verified/New' ? 'New' : (this.status || undefined);
    this.api.getEnquiries(this.ctx.schoolId, st, this.kind || undefined).subscribe({
      next: rows => this.rows.set(rows),
      error: () => this.error.set('Could not load enquiries.')
    });
  }

  open(id: string) {
    this.api.getEnquiry(this.ctx.schoolId, id).subscribe({
      next: d => {
        this.detail.set(d);
        this.selected.set(d.enquiry);
        this.assignee = d.enquiry.assignedToUserId || '';
        this.nextStatus = (d.enquiry.status === 'Verified/New' ? 'New' : d.enquiry.status);
        this.followUp = d.enquiry.followUpOn || '';
      }
    });
  }

  close() {
    this.detail.set(null);
    this.selected.set(null);
  }

  assign() {
    if (!this.assignee || !this.selected()) return;
    this.api.assignEnquiry(this.ctx.schoolId, this.selected().id, this.assignee).subscribe({ next: () => this.open(this.selected().id) });
  }

  saveStatus() {
    if (!this.selected()) return;
    this.api.updateEnquiryStatus(this.ctx.schoolId, this.selected().id, this.nextStatus, this.followUp || undefined)
      .subscribe({ next: () => { this.reload(); this.open(this.selected().id); } });
  }

  saveNote() {
    if (!this.note.trim() || !this.selected()) return;
    this.api.addEnquiryNote(this.ctx.schoolId, this.selected().id, this.note).subscribe({
      next: () => { this.note = ''; this.open(this.selected().id); }
    });
  }
}
