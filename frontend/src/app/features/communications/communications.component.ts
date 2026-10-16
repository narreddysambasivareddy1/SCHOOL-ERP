import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

@Component({
  selector: 'app-communications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="eyebrow">SCHOOL COMMUNICATIONS</div>
    <h1>Messages & Notifications</h1>
    @if (error()) { <div class="alert">{{ error() }}</div> }
    @if (notice()) { <div class="ok">{{ notice() }}</div> }

    <div class="grid-2">
      <div class="card">
        <h3>Compose announcement</h3>
        <label>Title</label>
        <input [(ngModel)]="title" placeholder="e.g. Parent-teacher meeting" />
        <label>Audience</label>
        <select [(ngModel)]="audience">
          @for (a of audiences; track a) { <option [value]="a">{{ a }}</option> }
        </select>
        <label>Channels</label>
        <div class="ch">
          @for (c of channelOptions; track c.value) {
            <label><input type="checkbox" [checked]="channels.includes(c.value)" (change)="toggle(c.value)" /> {{ c.label }}</label>
          }
        </div>
        <label>Message</label>
        <textarea [(ngModel)]="body" rows="4"></textarea>
        <button type="button" (click)="send()" [disabled]="sending()">{{ sending() ? 'Sending…' : 'Send via sandbox providers' }}</button>
      </div>

      <div class="card">
        <h3>Outbox</h3>
        <p class="text-muted">Sandbox deliveries are stored here until live keys are added.</p>
        @for (n of outbox(); track n.id) {
          <div class="row">
            <strong>{{ n.title }}</strong>
            <span>{{ n.channel }} · {{ n.status }}</span>
          </div>
        } @empty {
          <p class="text-muted">No messages yet.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    h1 { color: var(--navy); margin: 4px 0 20px; font-size: 22px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
    label { display: block; font-size: 11px; font-weight: 700; margin: 10px 0 5px; color: #506078; }
    input, select, textarea { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 8px; }
    .ch { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; }
    button { margin-top: 12px; border: 0; background: var(--primary); color: white; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
    button:disabled { opacity: .6; }
    .row { display: flex; justify-content: space-between; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 12px; }
    .alert { background: var(--warn-soft); color: var(--warn); padding: 10px; border-radius: 8px; margin-bottom: 12px; }
    .ok { background: #e5f8f1; color: #087d68; padding: 10px; border-radius: 8px; margin-bottom: 12px; }
    @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
  `]
})
export class CommunicationsComponent implements OnInit {
  title = '';
  body = '';
  audience = 'All parents';
  channels = ['InApp', 'Email'];
  audiences = ['All parents', 'Teaching staff', 'All students'];
  channelOptions = [
    { value: 'InApp', label: 'In-app' },
    { value: 'Email', label: 'Email' },
    { value: 'Sms', label: 'SMS' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'WebPush', label: 'Web push' },
  ];
  outbox = signal<any[]>([]);
  sending = signal(false);
  error = signal<string | null>(null);
  notice = signal<string | null>(null);

  constructor(private api: ApiService, private ctx: SchoolContextService) {}

  ngOnInit() { this.loadOutbox(); }

  toggle(value: string) {
    this.channels = this.channels.includes(value)
      ? this.channels.filter(c => c !== value)
      : [...this.channels, value];
  }

  loadOutbox() {
    if (!this.ctx.schoolId) return;
    this.api.getNotificationOutbox(this.ctx.schoolId).subscribe({
      next: rows => this.outbox.set(rows),
      error: () => {}
    });
  }

  send() {
    if (!this.title.trim() || !this.body.trim() || !this.ctx.schoolId) return;
    this.sending.set(true);
    this.error.set(null);
    this.api.sendAnnouncement(this.ctx.schoolId, {
      title: this.title, body: this.body, audience: this.audience, channels: this.channels
    }).subscribe({
      next: r => {
        this.notice.set(`Queued to ${r.recipients} recipients (${r.dispatched} sandbox messages).`);
        this.title = ''; this.body = '';
        this.sending.set(false);
        this.loadOutbox();
      },
      error: () => { this.error.set('Could not send announcement.'); this.sending.set(false); }
    });
  }
}
