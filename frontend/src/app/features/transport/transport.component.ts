import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';

interface Route { id: string; name: string; stops: { name: string; stopOrder: number; pickupTime: string }[]; }
interface ActiveTrip { id: string; route: string; vehicle: string; driver: string; startedAt: string; }

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [CommonModule, TableModule, CardModule, TagModule],
  template: `
    <div class="eyebrow">SCHOOL TRANSPORT</div>
    <h1 style="color:var(--navy);margin:4px 0 20px">Transport & GPS</h1>

    <div class="grid-2">
      <p-card header="Active Trips">
        @if (trips().length > 0) {
          <p-table [value]="trips()" styleClass="p-datatable-sm">
            <ng-template pTemplate="header"><tr><th>Route</th><th>Vehicle</th><th>Driver</th><th>Status</th></tr></ng-template>
            <ng-template pTemplate="body" let-t>
              <tr>
                <td>{{ t.route }}</td><td>{{ t.vehicle }}</td><td>{{ t.driver }}</td>
                <td><p-tag value="Active" severity="success" /></td>
              </tr>
            </ng-template>
          </p-table>
        } @else {
          <p class="text-muted">No active trips. GPS tracking requires configured devices or driver app.</p>
        }
      </p-card>

      <p-card header="Routes">
        @if (routes().length > 0) {
          @for (r of routes(); track r.id) {
            <div class="route-item">
              <strong>{{ r.name }}</strong>
              <span class="text-muted"> · {{ r.stops.length }} stops</span>
            </div>
          }
        } @else {
          <p class="text-muted">No routes configured. Connect to backend to load routes.</p>
        }
      </p-card>
    </div>

    <p-card header="Sandbox map (Google Maps placeholder)" styleClass="mt-3">
      <p class="text-muted">{{ map()?.message }}</p>
      @for (r of map()?.routes || []; track r.id) {
        <div class="route-item">
          <strong>{{ r.name }}</strong>
          @for (s of r.stops; track s.stopOrder) {
            <div class="text-muted">{{ s.stopOrder }}. {{ s.name }} · {{ s.latitude }}, {{ s.longitude }}</div>
          }
        </div>
      }
    </p-card>
  `,
  styles: [`
    h1 { font-size: 22px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .route-item { padding: 8px 0; border-bottom: 1px solid var(--line); }
    .route-item:last-child { border-bottom: none; }
    @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
  `]
})
export class TransportComponent implements OnInit {
  routes = signal<Route[]>([]);
  trips = signal<ActiveTrip[]>([]);
  map = signal<any>(null);

  constructor(private http: HttpClient, private api: ApiService, private ctx: SchoolContextService) {}

  ngOnInit() {
    if (!this.ctx.schoolId) return;
    this.http.get<Route[]>(`${environment.apiUrl}/schools/${this.ctx.schoolId}/transport/routes`)
      .subscribe({ next: r => this.routes.set(r), error: () => {} });
    this.http.get<ActiveTrip[]>(`${environment.apiUrl}/schools/${this.ctx.schoolId}/transport/trips/active`)
      .subscribe({ next: t => this.trips.set(t), error: () => {} });
    this.api.getTransportMap(this.ctx.schoolId).subscribe({ next: m => this.map.set(m), error: () => {} });
  }
}
