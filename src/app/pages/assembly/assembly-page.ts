import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, repeat } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LiveDataService } from '../../core/live-data/live-data.service';
import type { MachineStatus } from '../../core/live-data/machine-status';
import { MachineStatusCard } from '../../shared/machine-status-card/machine-status-card';

@Component({
  selector: 'app-assembly-page',
  imports: [DatePipe, MachineStatusCard],
  templateUrl: './assembly-page.html',
  styleUrl: './assembly-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssemblyPage implements OnInit {
  protected readonly machines = signal<readonly MachineStatus[]>([]);
  protected readonly lastUpdated = signal<Date | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly machineCards = computed(() => {
    const latestMachines = new Map(this.machines().map((machine) => [machine.machineCode, machine]));
    return [
      { machineCode: '30A-LH', entityName: 'Machine30ALh' },
      { machineCode: '30A-RH', entityName: 'Machine30ARh' },
      { machineCode: '30B', entityName: 'Machine30B' },
      { machineCode: '40A-LH', entityName: 'Machine40ALh' },
      { machineCode: '40A-RH', entityName: 'Machine40ARh' },
      { machineCode: '40B', entityName: 'Machine40B' },
      { machineCode: '50-LH', entityName: 'Machine50Lh' },
      { machineCode: '50-RH', entityName: 'Machine50Rh' },
    ].map(({ machineCode, entityName }) => ({
      ...this.emptyMachine(machineCode, entityName),
      ...latestMachines.get(machineCode),
    }));
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly liveDataService = inject(LiveDataService);

  ngOnInit(): void {
    this.liveDataService
      .getMachineStatuses()
      .pipe(
        tap((machines) => {
          this.machines.set(machines);
          this.lastUpdated.set(new Date());
          this.loadError.set(null);
        }),
        catchError((error: unknown) => {
          if (!this.loadError()) {
            console.error('Failed to load live machine statuses.', error);
          }
          this.loadError.set('Live machine data is unavailable. Retrying automatically.');
          return EMPTY;
        }),
        repeat({ delay: 5_000 }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private emptyMachine(machineCode: string, entityName: string): MachineStatus {
    return {
      machineCode,
      entityName,
      id: null,
      finalStatus: null,
      barcode: null,
      operatorName: null,
      shift: null,
      airGauge1Min: null,
      airGauge1Actual: null,
      airGauge1Max: null,
      airGauge1Status: null,
      airGauge2Min: null,
      airGauge2Actual: null,
      airGauge2Max: null,
      airGauge2Status: null,
      outerDiaMin: null,
      outerDiaActual: null,
      outerDiaMax: null,
      outerDiaStatus: null,
      innerDiaMin: null,
      innerDiaActual: null,
      innerDiaMax: null,
      innerDiaStatus: null,
      miniLoad: null,
      actualLoad: null,
      maxLoad: null,
      loadStatus: null,
      minDisplacement: null,
      actualDisplacement: null,
      maxDisplacement: null,
      displacementStatus: null,
      okCount: null,
      notOkCount: null,
      totalPartCount: null,
      cycleTime: null,
      cycleStartTime: null,
      cycleEndTime: null,
    };
  }
}
