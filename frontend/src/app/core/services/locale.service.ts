import { Injectable } from '@angular/core';
import { SchoolContextService } from './school-context.service';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  constructor(private school: SchoolContextService) {}

  formatMoney(amount: number | string | null | undefined): string {
    const value = Number(amount ?? 0);
    const currency = this.school.currency;
    const locale = this.school.locale;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: value % 1 === 0 ? 0 : 2,
      }).format(value);
    } catch {
      return `${currency} ${value.toLocaleString()}`;
    }
  }

  formatDate(value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    try {
      return new Intl.DateTimeFormat(this.school.locale, options ?? { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  }
}
