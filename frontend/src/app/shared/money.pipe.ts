import { Pipe, PipeTransform } from '@angular/core';
import { LocaleService } from '../core/services/locale.service';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  constructor(private locale: LocaleService) {}

  transform(value: number | string | null | undefined): string {
    return this.locale.formatMoney(value);
  }
}
