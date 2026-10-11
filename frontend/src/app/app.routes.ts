import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'students', loadComponent: () => import('./features/students/student-list.component').then(m => m.StudentListComponent) },
      { path: 'staff', loadComponent: () => import('./features/staff/staff-list.component').then(m => m.StaffListComponent) },
      { path: 'academics', loadComponent: () => import('./features/academics/academics.component').then(m => m.AcademicsComponent) },
      { path: 'attendance', loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent) },
      { path: 'fees', loadComponent: () => import('./features/fees/fees.component').then(m => m.FeesComponent) },
      { path: 'transport', loadComponent: () => import('./features/transport/transport.component').then(m => m.TransportComponent) },
      { path: 'payroll', loadComponent: () => import('./features/payroll/payroll.component').then(m => m.PayrollComponent) },
      { path: 'communications', loadComponent: () => import('./features/communications/communications.component').then(m => m.CommunicationsComponent) },
      { path: 'analytics', loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent) },
    ]
  },
  { path: 'unauthorized', loadComponent: () => import('./features/auth/unauthorized.component').then(m => m.UnauthorizedComponent) },
  { path: '**', redirectTo: '' }
];
