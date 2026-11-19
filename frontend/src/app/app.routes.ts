import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { Roles } from './core/auth/roles';

export const routes: Routes = [
  // Public website
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent), pathMatch: 'full' },

  // Login portals
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'admin/login', loadComponent: () => import('./features/auth/admin-login.component').then(m => m.AdminLoginComponent) },
  { path: 'teacher/login', loadComponent: () => import('./features/auth/teacher-login.component').then(m => m.TeacherLoginComponent) },
  { path: 'student/login', loadComponent: () => import('./features/auth/student-login.component').then(m => m.StudentLoginComponent) },
  { path: 'parent/login', loadComponent: () => import('./features/auth/parent-login.component').then(m => m.ParentLoginComponent) },
  { path: 'front-office/login', loadComponent: () => import('./features/auth/front-office-login.component').then(m => m.FrontOfficeLoginComponent) },

  // Authenticated shell
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      // Admin dashboard
      { path: 'dashboard', canActivate: [roleGuard(Roles.officeDashboard)], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'teacher/dashboard', canActivate: [roleGuard(Roles.teach)], loadComponent: () => import('./features/teacher-dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent) },
      { path: 'student/dashboard', canActivate: [roleGuard(['Student'])], loadComponent: () => import('./features/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent) },
      { path: 'parent/dashboard', canActivate: [roleGuard(['Parent'])], loadComponent: () => import('./features/parent-dashboard/parent-dashboard.component').then(m => m.ParentDashboardComponent) },
      { path: 'admissions', canActivate: [roleGuard(Roles.admissions)], loadComponent: () => import('./features/admissions/admissions.component').then(m => m.AdmissionsComponent) },
      { path: 'enquiries', canActivate: [roleGuard(Roles.admissions)], loadComponent: () => import('./features/enquiries/enquiry-desk.component').then(m => m.EnquiryDeskComponent) },
      { path: 'registrations', canActivate: [roleGuard(Roles.admissions)], loadComponent: () => import('./features/registrations/registrations.component').then(m => m.RegistrationsComponent) },
      { path: 'students', canActivate: [roleGuard(Roles.students)], loadComponent: () => import('./features/students/student-list.component').then(m => m.StudentListComponent) },
      { path: 'staff', canActivate: [roleGuard(Roles.staff)], loadComponent: () => import('./features/staff/staff-list.component').then(m => m.StaffListComponent) },
      { path: 'academics', canActivate: [roleGuard(Roles.academics)], loadComponent: () => import('./features/academics/academics.component').then(m => m.AcademicsComponent) },
      { path: 'attendance', canActivate: [roleGuard(Roles.academics)], loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent) },
      { path: 'fees', canActivate: [roleGuard(Roles.fees)], loadComponent: () => import('./features/fees/fees.component').then(m => m.FeesComponent) },
      { path: 'transport', canActivate: [roleGuard(Roles.transport)], loadComponent: () => import('./features/transport/transport.component').then(m => m.TransportComponent) },
      { path: 'payroll', canActivate: [roleGuard(Roles.payroll)], loadComponent: () => import('./features/payroll/payroll.component').then(m => m.PayrollComponent) },
      { path: 'communications', canActivate: [roleGuard(Roles.messages)], loadComponent: () => import('./features/communications/communications.component').then(m => m.CommunicationsComponent) },
      { path: 'analytics', canActivate: [roleGuard(Roles.leadership)], loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent) },
      { path: 'homework', canActivate: [roleGuard(Roles.academics)], loadComponent: () => import('./features/homework/homework.component').then(m => m.HomeworkComponent) },
      { path: 'examinations', canActivate: [roleGuard(Roles.academics)], loadComponent: () => import('./features/examinations/examinations.component').then(m => m.ExaminationsComponent) },
      { path: 'leave', canActivate: [roleGuard(Roles.leave)], loadComponent: () => import('./features/leave/leave.component').then(m => m.LeaveComponent) },
      { path: 'settings', canActivate: [roleGuard(Roles.leadership)], loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
      { path: 'integrations', canActivate: [roleGuard(Roles.leadership)], loadComponent: () => import('./features/integrations/integrations.component').then(m => m.IntegrationsComponent) },
      { path: 'timetable', canActivate: [roleGuard(Roles.academics)], loadComponent: () => import('./features/timetable/timetable.component').then(m => m.TimetableComponent) },
      { path: 'substitutions', canActivate: [roleGuard(Roles.substitutions)], loadComponent: () => import('./features/substitutions/substitutions.component').then(m => m.SubstitutionsComponent) },
      { path: 'lesson-plans', canActivate: [roleGuard(Roles.academics)], loadComponent: () => import('./features/lesson-plans/lesson-plans.component').then(m => m.LessonPlansComponent) },
      { path: 'diary', canActivate: [roleGuard(Roles.academics)], loadComponent: () => import('./features/diary/diary.component').then(m => m.DiaryComponent) },
      { path: 'audit', canActivate: [roleGuard(Roles.leadership)], loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent) },
      { path: 'calendar', canActivate: [roleGuard(Roles.academics)], loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent) },
      { path: 'announcements', canActivate: [roleGuard(Roles.announcements)], loadComponent: () => import('./features/announcements/announcements.component').then(m => m.AnnouncementsComponent) },
    ]
  },

  { path: 'unauthorized', loadComponent: () => import('./features/auth/unauthorized.component').then(m => m.UnauthorizedComponent) },
  { path: '**', redirectTo: '' }
];
