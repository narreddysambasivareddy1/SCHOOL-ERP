import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/auth/auth.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { ApiService } from '../../core/services/api.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <div class="login-logo">✦</div>
          <h1>School ERP</h1>
          <p class="text-muted">Sign in to your portal</p>
        </div>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label for="tenantId">School Tenant ID</label>
            <input pInputText id="tenantId" formControlName="tenantId" placeholder="Tenant UUID from setup" style="width:100%" />
          </div>
          <div class="field">
            <label for="schoolId">School ID</label>
            <input pInputText id="schoolId" formControlName="schoolId" placeholder="School UUID from setup" style="width:100%" />
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input pInputText id="email" formControlName="email" type="email" placeholder="admin@school.edu" style="width:100%" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <p-password id="password" formControlName="password" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" />
          </div>
          @if (error()) {
            <p-message severity="error" [text]="error()!" styleClass="w-full mb-3" />
          }
          <p-button type="submit" label="Sign in" styleClass="w-full mt-2" [loading]="loading()" />
        </form>
        <div class="demo-hint">
          <strong>Default credentials (after seed):</strong><br>
          Email: admin@school.edu &nbsp;·&nbsp; Password: Admin@1234<br>
          <small>Tenant ID and School ID are printed in API logs on first startup.</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: grid; place-items: center; background: var(--bg); padding: 16px; }
    .login-card { background: white; border: 1px solid var(--line); border-radius: 16px; padding: 36px; width: min(440px, 100%); box-shadow: var(--shadow); }
    .login-brand { text-align: center; margin-bottom: 28px; }
    .login-logo { width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(145deg,#1c5cb7,#0b9c9a); display: grid; place-items: center; color: white; font-size: 24px; margin: 0 auto 12px; }
    h1 { margin: 0 0 4px; color: var(--navy); font-size: 22px; }
    .field { margin-bottom: 14px; }
    .field label { display: block; font-size: 11px; font-weight: 700; margin-bottom: 5px; color: #506078; }
    .demo-hint { margin-top: 20px; padding: 12px; background: #f4f7fb; border-radius: 9px; font-size: 11px; color: var(--muted); line-height: 1.7; }
    .mt-2 { margin-top: 8px; }
    .mb-3 { margin-bottom: 12px; }
    :host ::ng-deep .p-password { width: 100%; }
    :host ::ng-deep .p-password input { width: 100%; }
  `]
})
export class LoginComponent {
  form = this.fb.group({
    tenantId: ['', Validators.required],
    schoolId: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private ctx: SchoolContextService,
    private api: ApiService,
    private router: Router
  ) {}

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { tenantId, schoolId, email, password } = this.form.value;

    this.auth.login(email!, password!, tenantId!).pipe(
      switchMap(() => this.api.getSchool(schoolId!)),
      switchMap(school => {
        return this.api.getAcademicYears(schoolId!).pipe(
          switchMap(years => {
            const current = years.find((y: any) => y.isCurrent) ?? years[0];
            this.ctx.set({
              schoolId: schoolId!,
              schoolName: school.name,
              academicYearId: current?.id ?? '',
              academicYearName: current?.name ?? ''
            });
            return [null];
          })
        );
      })
    ).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.error.set('Invalid credentials or school not found.');
        this.loading.set(false);
      }
    });
  }
}
