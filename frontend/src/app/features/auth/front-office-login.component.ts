import { Component } from '@angular/core';
import { PortalLoginComponent } from './portal-login.component';

@Component({
  selector: 'app-front-office-login',
  standalone: true,
  imports: [PortalLoginComponent],
  template: `<app-portal-login role="frontOffice" />`
})
export class FrontOfficeLoginComponent {}
