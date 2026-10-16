import { Component } from '@angular/core';
import { PortalLoginComponent } from './portal-login.component';

@Component({
  selector: 'app-parent-login',
  standalone: true,
  imports: [PortalLoginComponent],
  template: `<app-portal-login role="parent" />`
})
export class ParentLoginComponent {}
