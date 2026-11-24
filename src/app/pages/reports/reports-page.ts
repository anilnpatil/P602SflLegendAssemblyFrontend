import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  LiveDataService,
  type OverallReportRow,
  type OverallReportSide,
} from '../../core/live-data/live-data.service';
import { getMachineOperations } from '../../core/live-data/machine-operations';
import type { MachineOperation } from '../../core/live-data/machine-operations';
import type { MachineStatus } from '../../core/live-data/machine-status';

type ReportOperation = Pick<MachineOperation, 'name' | 'unit' | 'statusOnly'>;
type ReportMachineGroup = {
  machineCode: string;
  label: string;
  operations: readonly ReportOperation[];
};

const AIR_GAUGES: readonly ReportOperation[] = [
  { name: 'AIR GAUGE 1', unit: 'MM' },
  { name: 'AIR GAUGE 2', unit: 'MM' },
];
const GUIDE_STATUSES: readonly ReportOperation[] = [
  { name: 'OUTER GUIDE', unit: '', statusOnly: true },
  { name: 'INNER GUIDE', unit: '', statusOnly: true },
];
const DIAMETER_CHECKS: readonly ReportOperation[] = [
  ...AIR_GAUGES,
  { name: 'OUTER DIA', unit: 'MM' },
  { name: 'INNER DIA', unit: 'MM' },
];
const LOAD_CHECKS: readonly ReportOperation[] = [
  { name: 'LOAD', unit: 'KG' },
  { name: 'DISPLACEMENT', unit: 'MM' },
];
const HOLE_STATUSES: readonly ReportOperation[] = Array.from({ length: 8 }, (_, index) => ({
  name: `HOLE ${index + 1}`,
  unit: '',
  statusOnly: true,
}));
const SINGLE_HOLE_STATUS: readonly ReportOperation[] = [
  { name: 'HOLE', unit: '', statusOnly: true },
];
const ALL_MACHINE_GROUPS: readonly ReportMachineGroup[] = [
  { machineCode: '30A-LH', label: 'Machine 30A · LH', operations: [...AIR_GAUGES, ...GUIDE_STATUSES] },
  { machineCode: '30A-RH', label: 'Machine 30A · RH', operations: [...AIR_GAUGES, ...GUIDE_STATUSES] },
  { machineCode: '30B', label: 'Machine 30B · Common', operations: LOAD_CHECKS },
  { machineCode: '40A-LH', label: 'Machine 40A · LH', operations: DIAMETER_CHECKS },
  { machineCode: '40A-RH', label: 'Machine 40A · RH', operations: DIAMETER_CHECKS },
  { machineCode: '40B', label: 'Machine 40B · Common', operations: LOAD_CHECKS },
  { machineCode: '50A-LH', label: 'Machine 50A · LH', operations: SINGLE_HOLE_STATUS },
  { machineCode: '50A-RH', label: 'Machine 50A · RH', operations: SINGLE_HOLE_STATUS },
  { machineCode: '50B-LH', label: 'Machine 50B · LH', operations: HOLE_STATUSES },
  { machineCode: '50B-RH', label: 'Machine 50B · RH', operations: HOLE_STATUSES },
];

@Component({
  selector: 'app-reports-page',
  imports: [DatePipe],
  templateUrl: './reports-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit {
  private readonly liveDataService = inject(LiveDataService);

  protected readonly side = signal<OverallReportSide>('BOTH');
  protected readonly shift = signal('ALL');
  protected readonly startDate = signal(this.localDateString(new Date()));
  protected readonly endDate = signal(this.localDateString(new Date()));
  protected readonly dateRangeText = signal('');
  protected readonly datePickerOpen = signal(false);
  protected readonly calendarMonth = signal(new Date());
  protected readonly dateSelectionStep = signal<'start' | 'end'>('start');
  protected readonly pendingStartDate = signal<string | null>(null);
  protected readonly weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  protected readonly calendarMonthLabel = computed(() =>
    new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(this.calendarMonth()),
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
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly rows = signal<readonly OverallReportRow[]>([]);
  protected readonly machineGroups = computed(() => {
    const side = this.side();
    return ALL_MACHINE_GROUPS.filter((group) => {
      if (side === 'BOTH') {
        return true;
      }
      return group.machineCode.endsWith(`-${side}`)
        || group.machineCode === '30B'
        || group.machineCode === '40B';
    });
  });
  protected readonly tableColumnCount = computed(() =>
    5 + this.machineGroups().reduce(
      (total, group) => total + group.operations.reduce(
        (operationTotal, operation) => operationTotal + this.operationColumnCount(operation),
        0,
      ),
      0,
    ),
  );

  ngOnInit(): void {
    this.loadReport(this.side(), this.startDate(), this.endDate(), '', this.shift());
  }

  protected updateSide(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }
    const side = event.target.value;
    if (side === 'LH' || side === 'RH' || side === 'BOTH') {
      this.side.set(side);
    }
  }

  protected updateShift(event: Event): void {
    if (event.target instanceof HTMLSelectElement) {
      this.shift.set(event.target.value);
    }
  }

  protected updateDateRange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const value = event.target.value;
    this.dateRangeText.set(value);
    const range = this.parseDateRangeText(value);
    if (range) {
      this.startDate.set(range[0]);
      this.endDate.set(range[1]);
      this.pendingStartDate.set(null);
      this.dateSelectionStep.set('start');
    }
  }

  protected toggleDatePicker(): void {
    if (this.datePickerOpen()) {
      this.closeDatePicker();
      return;
    }
    this.pendingStartDate.set(null);
    this.dateSelectionStep.set('start');
    this.openDatePicker();
  }

  protected openDatePicker(): void {
    const selectedDate = this.startDate();
    this.calendarMonth.set(
      this.isValidDate(selectedDate) ? this.parseLocalDate(selectedDate) : new Date(),
    );
    this.datePickerOpen.set(true);
  }

  protected closeDatePicker(): void {
    this.datePickerOpen.set(false);
    this.pendingStartDate.set(null);
    this.dateSelectionStep.set('start');
  }

  protected moveCalendarMonth(amount: number): void {
    const month = this.calendarMonth();
    this.calendarMonth.set(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  }

  protected selectCalendarDate(date: Date): void {
    const selectedDate = this.localDateString(date);
    if (this.dateSelectionStep() === 'start') {
      const today = this.localDateString(new Date());
      this.pendingStartDate.set(selectedDate);
      this.startDate.set(selectedDate);
      this.endDate.set(today);
      this.dateRangeText.set(`${selectedDate} to ${today}`);
      this.dateSelectionStep.set('end');
      this.calendarMonth.set(new Date());
      return;
    }

    const pendingStart = this.pendingStartDate() ?? this.startDate();
    if (!this.isValidDate(pendingStart)) {
      const today = this.localDateString(new Date());
      this.pendingStartDate.set(selectedDate);
      this.startDate.set(selectedDate);
      this.endDate.set(today);
      this.dateRangeText.set(`${selectedDate} to ${today}`);
      this.dateSelectionStep.set('end');
      this.calendarMonth.set(new Date());
      return;
    }

    let startDate = pendingStart;
    let endDate = selectedDate;
    if (selectedDate < pendingStart) {
      startDate = selectedDate;
      endDate = pendingStart;
    }
    this.startDate.set(startDate);
    this.endDate.set(endDate);
    this.dateRangeText.set(`${startDate} to ${endDate}`);
    this.closeDatePicker();
  }

  protected isInDisplayedMonth(date: Date): boolean {
    const month = this.calendarMonth();
    return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
  }

  protected isInSelectedRange(date: Date): boolean {
    const value = this.localDateString(date);
    const pendingStart = this.pendingStartDate();
    if (this.dateSelectionStep() === 'end' && pendingStart !== null) {
      const currentEnd = this.isValidDate(this.endDate()) ? this.endDate() : pendingStart;
      const rangeStart = pendingStart < currentEnd ? pendingStart : currentEnd;
      const rangeEnd = pendingStart > currentEnd ? pendingStart : currentEnd;
      return value >= rangeStart && value <= rangeEnd;
    }
    return value >= this.startDate() && value <= this.endDate();
  }

  protected isRangeBoundary(date: Date): boolean {
    const value = this.localDateString(date);
    if (this.dateSelectionStep() === 'end' && this.pendingStartDate()) {
      return value === this.pendingStartDate() || value === this.endDate();
    }
    return value === this.startDate() || value === this.endDate();
  }

  protected generateReport(barcode: string, dateRange: string): void {
    const range = this.parseDateRangeText(dateRange);
    if (!range) {
      this.error.set('Enter both dates as YYYY-MM-DD to YYYY-MM-DD.');
      return;
    }
    const [startDate, endDate] = range;
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      this.error.set('Enter valid dates using YYYY-MM-DD.');
      return;
    }
    if (startDate > endDate) {
      this.error.set('Start date must be on or before end date.');
      return;
    }
    this.closeDatePicker();
    this.startDate.set(startDate);
    this.endDate.set(endDate);
    this.dateRangeText.set(`${startDate} to ${endDate}`);
    this.loadReport(this.side(), startDate, endDate, barcode.trim(), this.shift());
  }

  protected machineFor(row: OverallReportRow, machineCode: string): MachineStatus | undefined {
    return row.machines.find((machine) => machine.machineCode === machineCode);
  }

  protected operationFor(
    machine: MachineStatus | undefined,
    operationName: string,
  ): MachineOperation | undefined {
    return machine
      ? getMachineOperations(machine).find((operation) => operation.name === operationName)
      : undefined;
  }

  protected operationColumnCount(operation: ReportOperation): number {
    return operation.statusOnly ? 1 : 4;
  }

  protected groupColumnCount(group: ReportMachineGroup): number {
    return group.operations.reduce(
      (total, operation) => total + this.operationColumnCount(operation),
      0,
    );
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

  protected downloadReport(): void {
    const rows = this.rows();
    if (rows.length === 0) {
      this.error.set('There are no report rows to download.');
      return;
    }
    const groups = this.machineGroups();
    const headers = [
      'Date',
      'Time',
      'Component Barcode',
      'Side',
      'Shift',
      'Production Status',
      ...groups.flatMap((group) => group.operations.flatMap((operation) =>
        operation.statusOnly
          ? [`${group.label} · ${operation.name} Status`]
          : [
              `${group.label} · ${operation.name} Min (${operation.unit})`,
              `${group.label} · ${operation.name} Actual (${operation.unit})`,
              `${group.label} · ${operation.name} Max (${operation.unit})`,
              `${group.label} · ${operation.name} Status`,
            ],
      )),
    ];
    const data = rows.map((row) => [
      row.completionTime?.slice(0, 10) ?? '',
      row.completionTime?.slice(11, 19) ?? '',
      row.barcode,
      row.componentSide,
      row.shift ?? '',
      this.statusLabel(row.finalStatus),
      ...groups.flatMap((group) => {
        const machine = this.machineFor(row, group.machineCode);
        return group.operations.flatMap((operationName) => {
          const operation = this.operationFor(machine, operationName.name);
          if (operationName.statusOnly) {
            return [operation ? this.statusLabel(operation.status) : ''];
          }
          return [
            operation?.min ?? '',
            operation?.actual ?? '',
            operation?.max ?? '',
            operation ? this.statusLabel(operation.status) : '',
          ];
        });
      }),
    ]);
    const csv = [headers, ...data]
      .map((row) => row.map((value) => this.csvCell(value)).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `overall-${this.side().toLowerCase()}-report.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  private loadReport(
    side: OverallReportSide,
    startDate: string,
    endDate: string,
    barcode: string,
    shift: string,
  ): void {
    this.loading.set(true);
    this.error.set(null);
    this.liveDataService.getOverallReport(side, startDate, endDate, barcode, shift).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Overall report request failed.', error);
        this.error.set('The overall report could not be loaded. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private localDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseLocalDate(value: string): Date {
    if (!value) {
      return new Date();
    }
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

  private parseDateRangeText(value: string): [string, string] | null {
    const match = /^\s*(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})\s*$/i.exec(value);
    if (!match || !this.isValidDate(match[1]) || !this.isValidDate(match[2])) {
      return null;
    }
    return [match[1], match[2]];
  }

  private csvCell(value: unknown): string {
    const text = value === null || value === undefined ? '' : String(value);
    const safeText = typeof value === 'string' && /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replaceAll('"', '""')}"`;
  }
}
