import { Injectable, signal } from '@angular/core';

export interface SchoolContext {
  tenantId: string;
  schoolId: string;
  schoolName: string;
  slug: string;
  academicYearId: string;
  academicYearName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  locale: string;
  currency: string;
  timeZone: string;
}

const STORAGE_KEY = 'erp_school_ctx';

@Injectable({ providedIn: 'root' })
export class SchoolContextService {
  private _context = signal<SchoolContext | null>(this.load());
  readonly context = this._context.asReadonly();

  constructor() {
    const ctx = this._context();
    if (ctx) this.applyTheme(ctx);
  }

  get schoolId(): string { return this._context()?.schoolId ?? ''; }
  get academicYearId(): string { return this._context()?.academicYearId ?? ''; }
  get locale(): string { return this._context()?.locale ?? 'en-IN'; }
  get currency(): string { return this._context()?.currency ?? 'INR'; }

  set(ctx: SchoolContext) {
    this._context.set(ctx);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
    this.applyTheme(ctx);
  }

  setAcademicYear(id: string, name: string) {
    const current = this._context();
    if (!current) return;
    this.set({ ...current, academicYearId: id, academicYearName: name });
  }

  clear() {
    this._context.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--navy');
  }

  private applyTheme(ctx: SchoolContext) {
    const root = document.documentElement;
    root.lang = (ctx.locale || 'en').split('-')[0];
    if (ctx.primaryColor) {
      root.style.setProperty('--primary', ctx.primaryColor);
      root.style.setProperty('--navy', ctx.primaryColor);
    }
  }

  private load(): SchoolContext | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return {
        tenantId: parsed.tenantId ?? '',
        schoolId: parsed.schoolId ?? '',
        schoolName: parsed.schoolName ?? '',
        slug: parsed.slug ?? '',
        academicYearId: parsed.academicYearId ?? '',
        academicYearName: parsed.academicYearName ?? '',
        logoUrl: parsed.logoUrl,
        primaryColor: parsed.primaryColor,
        locale: parsed.locale ?? 'en-IN',
        currency: parsed.currency ?? 'INR',
        timeZone: parsed.timeZone ?? 'UTC',
      };
    } catch {
      return null;
    }
  }
}
