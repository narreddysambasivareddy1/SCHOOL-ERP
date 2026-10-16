import { Component, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService } from '../../core/services/api.service';

export type PortalRole = 'admin' | 'teacher' | 'student' | 'parent';

interface PortalConfig {
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  accentBg: string;
  roleHint: string;
  dashboardRoute: string;
}

const PORTAL_CONFIG: Record<PortalRole, PortalConfig> = {
  admin: {
    title: 'Admin Portal',
    subtitle: 'School operations, finance and people',
    icon: 'pi pi-building',
    accentColor: '#2463eb',
    accentBg: 'linear-gradient(135deg,#1c5cb7,#2463eb)',
    roleHint: 'SchoolAdmin · Finance · HR',
    dashboardRoute: '/dashboard',
  },
  teacher: {
    title: 'Teacher Portal',
    subtitle: 'Attendance, homework and gradebook',
    icon: 'pi pi-book',
    accentColor: '#0F8B8D',
    accentBg: 'linear-gradient(135deg,#087d68,#0F8B8D)',
    roleHint: 'Teacher · Attendance officer',
    dashboardRoute: '/teacher/dashboard',
  },
  student: {
    title: 'Student Portal',
    subtitle: 'Timetable, homework, fees and results',
    icon: 'pi pi-user',
    accentColor: '#4338ca',
    accentBg: 'linear-gradient(135deg,#3730a3,#4f46e5)',
    roleHint: 'Student',
    dashboardRoute: '/student/dashboard',
  },
  parent: {
    title: 'Parent Portal',
    subtitle: 'Your children, attendance, fees and transport',
    icon: 'pi pi-home',
    accentColor: '#b45309',
    accentBg: 'linear-gradient(135deg,#92400e,#d97706)',
    roleHint: 'Parent · Guardian',
    dashboardRoute: '/parent/dashboard',
  },
};

@Component({
  selector: 'app-portal-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-page" [style.--accent]="cfg.accentColor">
      <div class="login-left" [style.background]="cfg.accentBg">
        <a routerLink="/" class="back-home"><i class="pi pi-arrow-left"></i> Back to website</a>
        <div class="left-content">
          <div class="left-icon"><i [class]="cfg.icon"></i></div>
          <h2>{{ schoolName() || cfg.title }}</h2>
          <p>{{ cfg.subtitle }}</p>
          <div class="role-hint">{{ cfg.roleHint }}</div>
        </div>
        <div class="left-brand">EduCampus</div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="card-header">
            <div class="card-icon" [style.background]="cfg.accentBg"><i [class]="cfg.icon"></i></div>
            <div>
              <h1>Sign in</h1>
              <p class="card-sub">{{ cfg.title }}</p>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>School code</label>
              <input formControlName="schoolCode" placeholder="e.g. bright-future" (blur)="previewSchool()"
                [class.invalid]="touched && form.get('schoolCode')?.invalid" />
              @if (schoolName()) {
                <div class="school-chip"><i class="pi pi-building"></i> {{ schoolName() }}</div>
              }
            </div>
            <div class="field">
              <label>Email address</label>
              <input formControlName="email" type="email" placeholder="you@school.edu"
                [class.invalid]="touched && form.get('email')?.invalid" />
            </div>
            <div class="field">
              <label>Password</label>
              <div class="pw-wrap">
                <input formControlName="password" [type]="showPw ? 'text' : 'password'" placeholder="••••••••"
                  [class.invalid]="touched && form.get('password')?.invalid" />
                <button type="button" class="pw-toggle" (click)="showPw = !showPw" [attr.aria-label]="showPw ? 'Hide password' : 'Show password'">
                  <i [class]="showPw ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                </button>
              </div>
            </div>

            @if (error()) {
              <div class="error-banner">{{ error() }}</div>
            }

            <button type="submit" class="submit-btn" [style.background]="cfg.accentBg" [disabled]="loading()">
              {{ loading() ? 'Signing in…' : 'Continue' }}
            </button>
          </form>

          <div class="demo-hint">Demo school code <strong>bright-future</strong></div>

          <div class="portal-links">
            @if (role !== 'admin') { <a routerLink="/admin/login">Admin</a> }
            @if (role !== 'teacher') { <a routerLink="/teacher/login">Teacher</a> }
            @if (role !== 'student') { <a routerLink="/student/login">Student</a> }
            @if (role !== 'parent') { <a routerLink="/parent/login">Parent</a> }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: grid; grid-template-columns: 420px 1fr; }
    .login-left { display: flex; flex-direction: column; padding: 32px; }
    .back-home { color: rgba(255,255,255,0.7); font-size: 12px; text-decoration: none; display: flex; align-items: center; gap: 6px; }
    .back-home:hover { color: white; }
    .left-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0; }
    .left-icon { font-size: 36px; color: white; margin-bottom: 20px; }
    .left-content h2 { font-size: 28px; font-weight: 800; color: white; margin: 0 0 10px; letter-spacing: -0.4px; }
    .left-content p { color: rgba(255,255,255,0.75); font-size: 14px; margin: 0 0 20px; line-height: 1.6; }
    .role-hint { display: inline-block; background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; }
    .left-brand { color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 700; }
    .login-right { background: var(--bg); display: grid; place-items: center; padding: 32px; }
    .login-card { background: white; border: 1px solid var(--line); border-radius: 16px; padding: 40px; width: min(440px, 100%); box-shadow: var(--shadow); }
    .card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
    .card-icon { width: 48px; height: 48px; border-radius: 13px; display: grid; place-items: center; color: white; font-size: 18px; flex-shrink: 0; }
    h1 { margin: 0; font-size: 20px; font-weight: 800; color: var(--navy); }
    .card-sub { margin: 2px 0 0; font-size: 12px; color: var(--muted); }
    .field { margin-bottom: 16px; }
    .field label { display: block; font-size: 11px; font-weight: 700; color: #506078; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
    .field input { width: 100%; height: 40px; border: 1px solid var(--line); border-radius: 8px; padding: 0 12px; font-size: 13px; color: var(--ink); outline: none; }
    .field input:focus { border-color: var(--accent); }
    .field input.invalid { border-color: var(--red); }
    .school-chip { margin-top: 6px; font-size: 12px; color: var(--teal); display: flex; align-items: center; gap: 6px; }
    .pw-wrap { position: relative; }
    .pw-wrap input { padding-right: 40px; }
    .pw-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--muted); }
    .error-banner { background: #fff0f0; border: 1px solid #f5c6c6; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #c0392b; margin-bottom: 16px; }
    .submit-btn { width: 100%; height: 44px; border: none; border-radius: 10px; color: white; font-size: 14px; font-weight: 700; cursor: pointer; }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .demo-hint { margin-top: 14px; font-size: 11px; color: var(--muted); text-align: center; }
    .portal-links { display: flex; gap: 16px; justify-content: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line); flex-wrap: wrap; }
    .portal-links a { font-size: 12px; color: var(--muted); text-decoration: none; }
    .portal-links a:hover { color: var(--navy); }
    @media (max-width: 768px) {
      .login-page { grid-template-columns: 1fr; }
      .login-left { display: none; }
    }
  `]
})
export class PortalLoginComponent implements OnInit {
  @Input() role: PortalRole = 'admin';
  cfg!: PortalConfig;
  form = this.fb.group({
    schoolCode: ['bright-future', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = signal(false);
  error = signal<string | null>(null);
  schoolName = signal<string | null>(null);
  showPw = false;
  touched = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.cfg = PORTAL_CONFIG[this.role];
    const fromQuery = this.route.snapshot.queryParamMap.get('school');
    if (fromQuery) this.form.patchValue({ schoolCode: fromQuery });
    if (this.auth.isLoggedIn) this.router.navigate([this.cfg.dashboardRoute]);
    this.previewSchool();
  }

  previewSchool() {
    const code = this.form.value.schoolCode?.trim();
    if (!code) return;
    this.api.resolveSchool(code).subscribe({
      next: (t) => this.schoolName.set(t.school?.name ?? t.tenantName),
      error: () => this.schoolName.set(null)
    });
  }

  submit() {
    this.touched = true;
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { schoolCode, email, password } = this.form.value;

    this.auth.login(email!, password!, schoolCode!.trim().toLowerCase(), this.role).subscribe({
      next: () => this.router.navigate([this.destination()]),
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Invalid school code or credentials.');
        this.loading.set(false);
      }
    });
  }

  private destination(): string {
    const roles = this.auth.user()?.roles ?? [];
    const expected: Record<PortalRole, string[]> = {
      admin: ['SchoolAdmin','PlatformSuperAdmin','Accountant','HRManager','AdmissionOfficer','TransportManager'],
      teacher: ['Teacher','AttendanceOfficer'],
      student: ['Student'],
      parent: ['Parent'],
    };
    if (expected[this.role].some(r => roles.includes(r))) return this.cfg.dashboardRoute;
    return this.auth.dashboardRoute();
  }
}
