import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { MachineStatus } from '../../core/live-data/machine-status';

type MachineOperation = {
  name: string;
  minLabel: string;
  actualLabel: string;
  maxLabel: string;
  statusLabel: string;
  min: number | null;
  actual: number | null;
  max: number | null;
  status: number | null;
};

function createOperation(
  name: string,
  unit: string,
  min: number | null,
  actual: number | null,
  max: number | null,
  status: number | null,
  valueBeforeName = false,
): MachineOperation {
  const measurementLabel = (qualifier: string): string =>
    valueBeforeName
      ? `${qualifier} ${name} VALUE (${unit})`
      : `${name} ${qualifier} VALUE (${unit})`;

  return {
    name,
    minLabel: measurementLabel('MIN'),
    actualLabel: measurementLabel('ACTUAL'),
    maxLabel: measurementLabel('MAX'),
    statusLabel: `${name} STATUS`,
    min,
    actual,
    max,
    status,
  };
}

@Component({
  selector: 'app-machine-status-card',
  templateUrl: './machine-status-card.html',
  styleUrl: './machine-status-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MachineStatusCard {
  readonly machine = input.required<MachineStatus>();
  protected readonly operations = computed<MachineOperation[]>(() => {
    const machine = this.machine();
    if (machine.machineCode === '30B' || machine.machineCode === '40B') {
      return [
        createOperation(
          'LOAD',
          'KG',
          machine.miniLoad,
          machine.actualLoad,
          machine.maxLoad,
          machine.loadStatus,
          true,
        ),
        createOperation(
          'DISPLACEMENT',
          'MM',
          machine.minDisplacement,
          machine.actualDisplacement,
          machine.maxDisplacement,
          machine.displacementStatus,
          true,
        ),
      ];
    }

    const operations = [
      createOperation(
        'AIR GAUGE 1',
        'MM',
        machine.airGauge1Min,
        machine.airGauge1Actual,
        machine.airGauge1Max,
        machine.airGauge1Status,
      ),
      createOperation(
        'AIR GAUGE 2',
        'MM',
        machine.airGauge2Min,
        machine.airGauge2Actual,
        machine.airGauge2Max,
        machine.airGauge2Status,
      ),
    ];

    if (machine.machineCode === '40A-LH' || machine.machineCode === '40A-RH') {
      operations.push(
        createOperation(
          'OUTER DIA',
          'MM',
          machine.outerDiaMin,
          machine.outerDiaActual,
          machine.outerDiaMax,
          machine.outerDiaStatus,
        ),
        createOperation(
          'INNER DIA',
          'MM',
          machine.innerDiaMin,
          machine.innerDiaActual,
          machine.innerDiaMax,
          machine.innerDiaStatus,
        ),
      );
    }

    return operations;
  });
}
