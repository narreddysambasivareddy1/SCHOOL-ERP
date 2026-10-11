import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface SchoolContext {
  schoolId: string;
  schoolName: string;
  academicYearId: string;
  academicYearName: string;
}

@Injectable({ providedIn: 'root' })
export class SchoolContextService {
  private _context = signal<SchoolContext | null>(this.load());
  readonly context = this._context.asReadonly();

  constructor(private http: HttpClient) {}

  get schoolId(): string { return this._context()?.schoolId ?? ''; }
  get academicYearId(): string { return this._context()?.academicYearId ?? ''; }

  set(ctx: SchoolContext) {
    this._context.set(ctx);
    sessionStorage.setItem('erp_school_ctx', JSON.stringify(ctx));
  }

  private load(): SchoolContext | null {
    const raw = sessionStorage.getItem('erp_school_ctx');
    return raw ? JSON.parse(raw) : null;
  }
}
