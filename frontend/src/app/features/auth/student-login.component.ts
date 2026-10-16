import { Component } from '@angular/core';
import { PortalLoginComponent } from '../auth/portal-login.component';

@Component({ selector: 'app-student-login', standalone: true, imports: [PortalLoginComponent], template: `<app-portal-login role="student" />` })
export class StudentLoginComponent {}
