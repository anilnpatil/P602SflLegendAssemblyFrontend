import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import {
  ProductionSummaryRow,
  ProductionSummaryService,
} from './production-summary.service';

type DateFilter = 'RANGE' | 'MONTH' | 'YEAR';

interface ShiftProduction {
  total: number;
  ok: number;
  notOk: number;
}

interface ProductionDay {
  label: string;
  shifts: Partial<Record<number, ShiftProduction>>;
  total: number;
  ok: number;
  notOk: number;
}

@Component({
  selector: 'app-production-summary-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './production-summary-page.html',
  styleUrl: './production-summary-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductionSummaryPage {
  side: 'LH' | 'RH' = 'LH';
  dateFilter: DateFilter = 'RANGE';
  private readonly today = new Date();
  startDate = this.localDateString(this.daysBefore(this.today, 30));
  endDate = this.localDateString(this.today);
  month = this.endDate.slice(0, 7);
  year = this.today.getFullYear();
  days: ProductionDay[] = [];
  loading = false;
  errorMessage: string | null = null;

  private readonly service = inject(ProductionSummaryService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;

  constructor() {
    this.load();
  }

  load(): void {
    const dateRange = this.resolveDateRange();
    if (!dateRange) {
      return;
    }

    this.request?.unsubscribe();
    this.loading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.request = this.service
      .fetch(this.side, dateRange.startDate, dateRange.endDate)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (rows) => {
          this.days = this.groupRows(rows);
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          console.error('Production summary request failed:', error);
          this.days = [];
          this.errorMessage = 'Unable to load production summary. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  private resolveDateRange(): { startDate: string; endDate: string } | null {
    if (this.dateFilter === 'RANGE') {
      if (!this.startDate || !this.endDate || this.startDate > this.endDate) {
        this.errorMessage =
          'Select a valid date range; the start date must not be after the end date.';
        this.days = [];
        this.cdr.markForCheck();
        return null;
      }
      return { startDate: this.startDate, endDate: this.endDate };
    }

    if (this.dateFilter === 'MONTH') {
      const match = /^(\d{4})-(\d{2})$/.exec(this.month);
      if (!match) {
        this.errorMessage = 'Select a valid month.';
        this.days = [];
        this.cdr.markForCheck();
        return null;
      }
      const monthYear = Number(match[1]);
      const monthNumber = Number(match[2]);
      const lastDay = new Date(monthYear, monthNumber, 0).getDate();
      return {
        startDate: `${match[1]}-${match[2]}-01`,
        endDate: `${match[1]}-${match[2]}-${String(lastDay).padStart(2, '0')}`,
      };
    }

    if (!Number.isInteger(this.year) || this.year < 1 || this.year > 9999) {
      this.errorMessage = 'Enter a valid year.';
      this.days = [];
      this.cdr.markForCheck();
      return null;
    }

    return { startDate: `${this.year}-01-01`, endDate: `${this.year}-12-31` };
  }

  private groupRows(rows: ProductionSummaryRow[]): ProductionDay[] {
    const periods = new Map<string, ProductionDay>();
    for (const row of rows) {
      if (row.shift !== 1 && row.shift !== 2 && row.shift !== 3) {
        continue;
      }

      const periodLabel = this.getPeriodLabel(row.productionDate);
      let period = periods.get(periodLabel);
      if (!period) {
        period = { label: periodLabel, shifts: {}, total: 0, ok: 0, notOk: 0 };
        periods.set(periodLabel, period);
      }

      const shift = period.shifts[row.shift] ?? { total: 0, ok: 0, notOk: 0 };
      shift.total += row.totalPartCount ?? 0;
      shift.ok += row.okCount ?? 0;
      shift.notOk += row.notOkCount ?? 0;
      period.shifts[row.shift] = shift;
      period.total += row.totalPartCount ?? 0;
      period.ok += row.okCount ?? 0;
      period.notOk += row.notOkCount ?? 0;
    }

    return Array.from(periods.values()).sort((left, right) => right.label.localeCompare(left.label));
  }

  private getPeriodLabel(productionDate: string): string {
    if (this.dateFilter === 'RANGE') {
      return productionDate;
    }
    if (this.dateFilter === 'YEAR') {
      return productionDate.slice(0, 4);
    }

    const [year, month] = productionDate.split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
      new Date(year, month - 1, 1),
    );
  }

  private localDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private daysBefore(date: Date, count: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - count);
    return result;
  }
}
