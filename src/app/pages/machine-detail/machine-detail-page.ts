import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { getMachineOperations } from '../../core/live-data/machine-operations';
import { LiveDataService } from '../../core/live-data/live-data.service';
import type { MachineStatus } from '../../core/live-data/machine-status';

@Component({
  selector: 'app-machine-detail-page',
  imports: [DatePipe],
  templateUrl: './machine-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MachineDetailPage implements OnInit, OnDestroy {
  readonly machine = input.required<MachineStatus>();
  readonly lastUpdated = input<Date | null>(null);
  readonly back = output<void>();
  readonly refresh = output<void>();

  protected readonly reportResults = signal<readonly MachineStatus[]>([]);
  protected readonly reportError = signal<string | null>(null);
  protected readonly reportLoading = signal(false);
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly datePickerOpen = signal(false);
  protected readonly dateSelectionStep = signal<'start' | 'end'>('start');
  protected readonly pendingStartDate = signal<string | null>(null);
  protected readonly calendarMonth = signal(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  protected readonly calendarMonthLabel = computed(() =>
    new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
      this.calendarMonth(),
    ),
  );
  protected readonly calendarDays = computed(() => {
    const month = this.calendarMonth();
    const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const firstVisibleDay = new Date(
      month.getFullYear(),
      month.getMonth(),
      1 - firstOfMonth.getDay(),
    );
    return Array.from(
      { length: 42 },
      (_, index) =>
        new Date(
          firstVisibleDay.getFullYear(),
          firstVisibleDay.getMonth(),
          firstVisibleDay.getDate() + index,
        ),
    );
  });
  protected readonly weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  protected readonly refreshMode = signal<'auto' | 'manual'>('auto');
  protected readonly selectedShift = signal('all');
  protected readonly operations = computed(() => getMachineOperations(this.machine()));
  protected readonly reportColumnCount = computed(
    () => 6 + this.operations().reduce((count, operation) => count + (operation.statusOnly ? 1 : 4), 0),
  );
  protected readonly reportRows = computed(() => {
    const rows = this.reportResults();
    const selectedShift = this.selectedShift();
    if (selectedShift === 'current') {
      return rows.filter((row) => row.shift === this.machine().shift);
    }
    if (selectedShift === 'all') {
      return rows;
    }
    return rows.filter((row) => String(row.shift) === selectedShift);
  });

  private readonly liveDataService = inject(LiveDataService);
  private historyRequestPending = false;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.refreshData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  protected statusLabel(status: number | null): string {
    switch (status) {
      case 1:
        return 'OK';
      case 2:
        return 'NOT OK';
      default:
        return 'N/A';
    }
  }

  protected generatePartReport(partId: string): void {
    if (!partId.trim()) {
      this.reportError.set('Enter a part ID to generate the report.');
      return;
    }
    this.loadReport(
      this.liveDataService.getPartReport(this.machine().machineCode, partId.trim()),
      'Part report',
    );
  }

  protected generateDateRangeReport(startDate: string, endDate: string): void {
    if (!startDate || !endDate) {
      this.reportError.set('Select both dates to generate the report.');
      return;
    }
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      this.reportError.set('Enter valid dates using YYYY-MM-DD.');
      return;
    }
    if (startDate > endDate) {
      this.reportError.set('Start date must be on or before end date.');
      return;
    }
    this.loadReport(
      this.liveDataService.getDateRangeReport(this.machine().machineCode, startDate, endDate),
      'Date-range report',
    );
  }

  protected openDatePickerFor(field: 'start' | 'end'): void {
    if (field === 'start') {
      this.pendingStartDate.set(null);
      this.dateSelectionStep.set('start');
      this.calendarMonth.set(
        this.isValidDate(this.startDate()) ? this.parseLocalDate(this.startDate()) : new Date(),
      );
    } else {
      const startDate = this.isValidDate(this.startDate()) ? this.startDate() : null;
      this.pendingStartDate.set(startDate);
      this.dateSelectionStep.set('end');
      const selectedDate = this.isValidDate(this.endDate()) ? this.endDate() : startDate;
      this.calendarMonth.set(selectedDate ? this.parseLocalDate(selectedDate) : new Date());
    }
    this.datePickerOpen.set(true);
  }

  protected updateDateInput(event: Event, field: 'start' | 'end'): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    if (field === 'start') {
      this.startDate.set(event.target.value);
    } else {
      this.endDate.set(event.target.value);
    }
  }

  protected moveCalendarMonth(amount: number): void {
    const month = this.calendarMonth();
    this.calendarMonth.set(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  }

  protected selectCalendarDate(date: Date): void {
    const selectedDate = this.localDateString(date);
    if (this.dateSelectionStep() === 'start') {
      this.pendingStartDate.set(selectedDate);
      this.startDate.set(selectedDate);
      this.dateSelectionStep.set('end');
      return;
    }

    const pendingStart = this.pendingStartDate() ?? this.startDate();
    if (!this.isValidDate(pendingStart)) {
      this.pendingStartDate.set(selectedDate);
      this.startDate.set(selectedDate);
      return;
    }

    if (selectedDate < pendingStart) {
      this.startDate.set(selectedDate);
      this.endDate.set(pendingStart);
    } else {
      this.startDate.set(pendingStart);
      this.endDate.set(selectedDate);
    }
    this.closeDatePicker();
  }

  protected isInDisplayedMonth(date: Date): boolean {
    const month = this.calendarMonth();
    return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
  }

  protected isInSelectedRange(date: Date): boolean {
    const value = this.localDateString(date);
    const pendingStart = this.pendingStartDate();
    if (this.dateSelectionStep() === 'end' && pendingStart) {
      const rangeEnd = this.isValidDate(this.endDate()) ? this.endDate() : pendingStart;
      const rangeStart = pendingStart < rangeEnd ? pendingStart : rangeEnd;
      const rangeFinish = pendingStart > rangeEnd ? pendingStart : rangeEnd;
      return value >= rangeStart && value <= rangeFinish;
    }

    return (
      this.isValidDate(this.startDate()) &&
      this.isValidDate(this.endDate()) &&
      value >= this.startDate() &&
      value <= this.endDate()
    );
  }

  protected isRangeBoundary(date: Date): boolean {
    const value = this.localDateString(date);
    if (this.dateSelectionStep() === 'end' && this.pendingStartDate()) {
      return value === this.pendingStartDate() || value === this.endDate();
    }
    return value === this.startDate() || value === this.endDate();
  }

  protected closeDatePicker(): void {
    this.datePickerOpen.set(false);
    this.pendingStartDate.set(null);
    this.dateSelectionStep.set('start');
  }

  protected updateShift(event: Event): void {
    if (event.target instanceof HTMLSelectElement) {
      this.selectedShift.set(event.target.value);
    }
  }

  protected updateRefreshMode(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }
    const mode = event.target.value === 'manual' ? 'manual' : 'auto';
    this.refreshMode.set(mode);
    this.stopAutoRefresh();
    if (mode === 'auto') {
      this.refreshData();
      this.startAutoRefresh();
    }
  }

  protected refreshData(): void {
    this.refresh.emit();
    this.loadMachineHistory();
  }

  protected operationsFor(machine: MachineStatus) {
    return getMachineOperations(machine);
  }

  protected downloadReport(): void {
    const rows = this.reportRows();
    if (!rows.length) {
      this.reportError.set('There are no report rows to download.');
      return;
    }
    const machine = this.machine();
    const operations = this.operations();
    const csvRows: unknown[][] = [
      ['Date', 'Time', 'Component barcode', 'Machine name', 'Shift', 'Production status',
        ...operations.flatMap((operation) => operation.statusOnly
          ? [`${operation.name} status`]
          : [
              `${operation.name} min (${operation.unit})`,
              `${operation.name} actual (${operation.unit})`,
              `${operation.name} max (${operation.unit})`,
              `${operation.name} status`,
            ])],
      ...rows.map((row) => [
        row.cycleStartTime?.toString().slice(0, 10) ?? '',
        row.cycleStartTime?.toString().slice(11, 19) ?? '',
        row.barcode,
        row.entityName,
        row.shift,
        this.statusLabel(row.finalStatus),
        ...operations.flatMap((operation) => {
          const rowOperation = getMachineOperations(row).find((item) => item.name === operation.name);
          if (operation.statusOnly) {
            return [this.statusLabel(rowOperation?.status ?? null)];
          }
          return [
            rowOperation?.min,
            rowOperation?.actual,
            rowOperation?.max,
            this.statusLabel(rowOperation?.status ?? null),
          ];
        }),
      ]),
    ];
    const csv = csvRows
      .map((row) => row.map((value) => this.csvCell(value)).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${machine.machineCode.toLowerCase()}-report.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  private localDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseLocalDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private isValidDate(value: string): boolean {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  private loadReport(request: ReturnType<LiveDataService['getPartReport']>, label: string): void {
    this.reportLoading.set(true);
    this.reportError.set(null);
    request.subscribe({
      next: (rows) => {
        this.reportResults.set(rows);
        this.selectedShift.set('all');
        this.reportLoading.set(false);
        this.historyRequestPending = false;
      },
      error: (error: unknown) => {
        console.error(`${label} request failed.`, error);
        this.reportError.set(`${label} could not be generated. Please try again.`);
        this.reportLoading.set(false);
        this.historyRequestPending = false;
      },
    });
  }

  private loadMachineHistory(): void {
    if (this.historyRequestPending) {
      return;
    }
    this.historyRequestPending = true;
    this.reportLoading.set(true);
    this.reportError.set(null);
    this.liveDataService.getMachineHistory(this.machine().machineCode).subscribe({
      next: (rows) => {
        this.reportResults.set(rows);
        this.reportLoading.set(false);
        this.historyRequestPending = false;
      },
      error: (error: unknown) => {
        console.error('Failed to load machine history.', error);
        this.reportError.set('Machine history could not be loaded. Please try again.');
        this.reportLoading.set(false);
        this.historyRequestPending = false;
      },
    });
  }

  private startAutoRefresh(): void {
    if (this.refreshMode() === 'auto' && this.refreshTimer === null) {
      this.refreshTimer = setInterval(() => this.refreshData(), 5_000);
    }
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private csvCell(value: unknown): string {
    const text = value === null || value === undefined ? '' : String(value);
    const safeText = typeof value === 'string' && /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replaceAll('"', '""')}"`;
  }
}
