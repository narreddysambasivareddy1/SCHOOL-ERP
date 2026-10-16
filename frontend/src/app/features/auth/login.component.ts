import { Component } from '@angular/core';
import { PortalLoginComponent } from './portal-login.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [PortalLoginComponent],
  template: `<app-portal-login role="admin" />`
})
export class LoginComponent {}
