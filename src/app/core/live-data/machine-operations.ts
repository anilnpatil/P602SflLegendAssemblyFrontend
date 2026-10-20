import type { MachineStatus } from './machine-status';

export type MachineOperation = {
  name: string;
  unit: string;
  min: number | null;
  actual: number | null;
  max: number | null;
  status: number | null;
};

export function getMachineOperations(machine: MachineStatus): MachineOperation[] {
  if (machine.machineCode === '30B' || machine.machineCode === '40B') {
    return [
      {
        name: 'LOAD',
        unit: 'KG',
        min: machine.miniLoad,
        actual: machine.actualLoad,
        max: machine.maxLoad,
        status: machine.loadStatus,
      },
      {
        name: 'DISPLACEMENT',
        unit: 'MM',
        min: machine.minDisplacement,
        actual: machine.actualDisplacement,
        max: machine.maxDisplacement,
        status: machine.displacementStatus,
      },
    ];
  }

  const operations: MachineOperation[] = [
    {
      name: 'AIR GAUGE 1',
      unit: 'MM',
      min: machine.airGauge1Min,
      actual: machine.airGauge1Actual,
      max: machine.airGauge1Max,
      status: machine.airGauge1Status,
    },
    {
      name: 'AIR GAUGE 2',
      unit: 'MM',
      min: machine.airGauge2Min,
      actual: machine.airGauge2Actual,
      max: machine.airGauge2Max,
      status: machine.airGauge2Status,
    },
  ];

  if (machine.machineCode === '40A-LH' || machine.machineCode === '40A-RH') {
    operations.push(
      {
        name: 'OUTER DIA',
        unit: 'MM',
        min: machine.outerDiaMin,
        actual: machine.outerDiaActual,
        max: machine.outerDiaMax,
        status: machine.outerDiaStatus,
      },
      {
        name: 'INNER DIA',
        unit: 'MM',
        min: machine.innerDiaMin,
        actual: machine.innerDiaActual,
        max: machine.innerDiaMax,
        status: machine.innerDiaStatus,
      },
    );
  }

  return operations;
}
