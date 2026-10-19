import { Injectable, OnDestroy, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class EnquiryAlertService implements OnDestroy {
  latest = signal<any>(null);
  private conn: HubConnection | null = null;

  constructor(private auth: AuthService) {}

  start() {
    const roles = this.auth.user()?.roles ?? [];
    const allowed = ['SchoolAdmin', 'PlatformSuperAdmin', 'AdmissionOfficer', 'FrontOffice'];
    if (!this.auth.token || !roles.some(r => allowed.includes(r))) return;
    if (this.conn) return;

    this.conn = new HubConnectionBuilder()
      .withUrl('/hubs/enquiries', { accessTokenFactory: () => this.auth.token || '' })
      .withAutomaticReconnect()
      .build();
    this.conn.on('enquiryReceived', (item) => this.announce(item));
    this.conn.on('enquiryUpdated', (item) => this.latest.set(item));
    this.conn.start().catch(() => {});
    this.requestDesktopPermission();
  }

  stop() {
    this.conn?.stop();
    this.conn = null;
  }

  ngOnDestroy() { this.stop(); }

  private announce(item: any) {
    this.latest.set(item);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('New school enquiry', {
        body: `${item.parentName} · ${item.kind} · ${item.phone}`,
      });
    }
  }

  private requestDesktopPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
