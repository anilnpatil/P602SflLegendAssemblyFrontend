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
  protected readonly refreshMode = signal<'auto' | 'manual'>('auto');
  protected readonly selectedShift = signal('all');
  protected readonly operations = computed(() => getMachineOperations(this.machine()));
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
    if (startDate > endDate) {
      this.reportError.set('Start date must be on or before end date.');
      return;
    }
    this.loadReport(
      this.liveDataService.getDateRangeReport(this.machine().machineCode, startDate, endDate),
      'Date-range report',
    );
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
        ...operations.flatMap((operation) => [
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
