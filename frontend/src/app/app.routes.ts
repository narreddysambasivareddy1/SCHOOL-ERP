import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public website
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent), pathMatch: 'full' },

  // Login portals
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'admin/login', loadComponent: () => import('./features/auth/admin-login.component').then(m => m.AdminLoginComponent) },
  { path: 'teacher/login', loadComponent: () => import('./features/auth/teacher-login.component').then(m => m.TeacherLoginComponent) },
  { path: 'student/login', loadComponent: () => import('./features/auth/student-login.component').then(m => m.StudentLoginComponent) },
  { path: 'parent/login', loadComponent: () => import('./features/auth/parent-login.component').then(m => m.ParentLoginComponent) },

  // Authenticated shell
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      // Admin dashboard
      { path: 'dashboard', canActivate: [roleGuard(['SchoolAdmin','PlatformSuperAdmin','Accountant','HRManager','AdmissionOfficer','TransportManager'])], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'teacher/dashboard', canActivate: [roleGuard(['Teacher','AttendanceOfficer'])], loadComponent: () => import('./features/teacher-dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent) },
      { path: 'student/dashboard', canActivate: [roleGuard(['Student'])], loadComponent: () => import('./features/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent) },
      { path: 'parent/dashboard', canActivate: [roleGuard(['Parent'])], loadComponent: () => import('./features/parent-dashboard/parent-dashboard.component').then(m => m.ParentDashboardComponent) },
      // Shared modules
      { path: 'admissions', loadComponent: () => import('./features/admissions/admissions.component').then(m => m.AdmissionsComponent) },
      { path: 'students', loadComponent: () => import('./features/students/student-list.component').then(m => m.StudentListComponent) },
      { path: 'staff', loadComponent: () => import('./features/staff/staff-list.component').then(m => m.StaffListComponent) },
      { path: 'academics', loadComponent: () => import('./features/academics/academics.component').then(m => m.AcademicsComponent) },
      { path: 'attendance', loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent) },
      { path: 'fees', loadComponent: () => import('./features/fees/fees.component').then(m => m.FeesComponent) },
      { path: 'transport', loadComponent: () => import('./features/transport/transport.component').then(m => m.TransportComponent) },
      { path: 'payroll', loadComponent: () => import('./features/payroll/payroll.component').then(m => m.PayrollComponent) },
      { path: 'communications', loadComponent: () => import('./features/communications/communications.component').then(m => m.CommunicationsComponent) },
      { path: 'analytics', loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent) },
      { path: 'homework', loadComponent: () => import('./features/homework/homework.component').then(m => m.HomeworkComponent) },
      { path: 'examinations', loadComponent: () => import('./features/examinations/examinations.component').then(m => m.ExaminationsComponent) },
      { path: 'leave', loadComponent: () => import('./features/leave/leave.component').then(m => m.LeaveComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
      { path: 'integrations', loadComponent: () => import('./features/integrations/integrations.component').then(m => m.IntegrationsComponent) },
      { path: 'timetable', loadComponent: () => import('./features/timetable/timetable.component').then(m => m.TimetableComponent) },
      { path: 'audit', loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent) },
      { path: 'calendar', loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent) },
      { path: 'announcements', loadComponent: () => import('./features/announcements/announcements.component').then(m => m.AnnouncementsComponent) },
    ]
  },

  { path: 'unauthorized', loadComponent: () => import('./features/auth/unauthorized.component').then(m => m.UnauthorizedComponent) },
  { path: '**', redirectTo: '' }
];
