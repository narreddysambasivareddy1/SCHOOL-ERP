import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, CardModule, MessageModule],
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
            <label for="tenantId">School ID</label>
            <input pInputText id="tenantId" formControlName="tenantId" placeholder="Your school tenant ID" />
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input pInputText id="email" formControlName="email" type="email" placeholder="you@school.edu" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <p-password id="password" formControlName="password" [feedback]="false" [toggleMask]="true" styleClass="w-full" />
          </div>
          @if (error()) {
            <p-message severity="error" [text]="error()!" styleClass="w-full mb-3" />
          }
          <p-button type="submit" label="Sign in" styleClass="w-full" [loading]="loading()" />
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: grid; place-items: center; background: var(--bg); padding: 16px; }
    .login-card { background: white; border: 1px solid var(--line); border-radius: 16px; padding: 36px; width: min(420px, 100%); box-shadow: var(--shadow); }
    .login-brand { text-align: center; margin-bottom: 28px; }
    .login-logo { width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(145deg, #1c5cb7, #0b9c9a); display: grid; place-items: center; color: white; font-size: 24px; margin: 0 auto 12px; }
    h1 { margin: 0 0 4px; color: var(--navy); font-size: 22px; }
    .field { margin-bottom: 16px; }
    .field label { display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px; color: #506078; }
    :host ::ng-deep .p-inputtext, :host ::ng-deep .p-password { width: 100%; }
  `]
})
export class LoginComponent {
  form = this.fb.group({
    tenantId: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { tenantId, email, password } = this.form.value;
    this.auth.login(email!, password!, tenantId!).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => { this.error.set('Invalid credentials. Please try again.'); this.loading.set(false); }
    });
  }
}
