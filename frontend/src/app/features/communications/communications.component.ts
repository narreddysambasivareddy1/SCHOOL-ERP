import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-communications',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DropdownModule, CardModule, MessageModule],
  template: `
    <div class="eyebrow">SCHOOL COMMUNICATIONS</div>
    <h1 style="color:var(--navy);margin:4px 0 20px">Messages & Notifications</h1>
    <div class="grid-2">
      <p-card header="Compose announcement">
        <div class="field">
          <label>Title</label>
          <input pInputText [(ngModel)]="title" placeholder="e.g. Parent-teacher meeting" style="width:100%" />
        </div>
        <div class="field">
          <label>Audience</label>
          <p-dropdown [options]="audiences" [(ngModel)]="audience" styleClass="w-full" />
        </div>
        <div class="field">
          <label>Channel</label>
          <p-dropdown [options]="channels" [(ngModel)]="channel" styleClass="w-full" />
        </div>
        <div class="field">
          <label>Message</label>
          <input pInputText [(ngModel)]="body" placeholder="Write a clear school-approved message" style="width:100%" />
        </div>
        @if (preview()) {
          <p-message severity="info" [text]="preview()!" styleClass="w-full mb-3" />
        }
        <p-button label="Preview message" (onClick)="previewMsg()" styleClass="mt-2" />
      </p-card>

      <p-card header="Provider status">
        @for (p of providers; track p.name) {
          <div class="provider-row">
            <span class="provider-icon">{{ p.icon }}</span>
            <div>
              <strong>{{ p.name }}</strong>
              <div class="text-muted" style="font-size:11px">{{ p.desc }}</div>
            </div>
            <span class="status-badge" [class]="p.status">{{ p.label }}</span>
          </div>
        }
      </p-card>
    </div>
  `,
  styles: [`
    h1 { font-size: 22px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { margin-bottom: 14px; }
    .field label { display: block; font-size: 11px; font-weight: 700; margin-bottom: 5px; color: #506078; }
    .provider-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); }
    .provider-row:last-child { border-bottom: none; }
    .provider-icon { font-size: 20px; width: 28px; }
    .status-badge { margin-left: auto; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 20px; }
    .status-badge.ok { background: #e5f8f1; color: #087d68; }
    .status-badge.warn { background: #fff2d7; color: #9a6900; }
    @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
  `]
})
export class CommunicationsComponent {
  title = '';
  body = '';
  audience = 'All parents';
  channel = 'In-app + Email';
  preview = signal<string | null>(null);

  audiences = ['All parents', 'Grade 6 parents', 'Teaching staff', 'All students', 'Transport route 3'];
  channels = ['In-app + Email', 'SMS', 'WhatsApp Business', 'Web Push'];

  providers = [
    { icon: '✉', name: 'Email provider', desc: 'Transactional email', status: 'ok', label: 'Configured' },
    { icon: '▣', name: 'SMS provider', desc: 'Sender approval required', status: 'warn', label: 'Setup required' },
    { icon: '◉', name: 'WhatsApp Business', desc: 'Approved templates required', status: 'warn', label: 'Setup required' },
    { icon: '♧', name: 'Web Push', desc: 'Browser permission required', status: 'ok', label: 'PWA ready' },
  ];

  previewMsg() {
    if (!this.title.trim()) return;
    this.preview.set(`Preview: "${this.title}" → ${this.audience} via ${this.channel}. No message sent in demo.`);
  }
}
