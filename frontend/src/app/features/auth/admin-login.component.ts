import { Component } from '@angular/core';
import { PortalLoginComponent } from '../auth/portal-login.component';

@Component({ selector: 'app-admin-login', standalone: true, imports: [PortalLoginComponent], template: `<app-portal-login role="admin" />` })
export class AdminLoginComponent {}
