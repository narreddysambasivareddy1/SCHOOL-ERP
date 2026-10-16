import { Component } from '@angular/core';
import { PortalLoginComponent } from '../auth/portal-login.component';

@Component({ selector: 'app-teacher-login', standalone: true, imports: [PortalLoginComponent], template: `<app-portal-login role="teacher" />` })
export class TeacherLoginComponent {}
