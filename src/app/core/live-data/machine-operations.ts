import type { MachineStatus } from './machine-status';

export type MachineOperation = {
  name: string;
  unit: string;
  min: number | null;
  actual: number | null;
  max: number | null;
  status: number | null;
  statusOnly?: boolean;
};

export function getMachineOperations(machine: MachineStatus): MachineOperation[] {
  if (machine.machineCode === '50A-LH' || machine.machineCode === '50A-RH') {
    return [{
      name: 'HOLE',
      unit: '',
      min: null,
      actual: null,
      max: null,
      status: machine.holeStatus,
      statusOnly: true,
    }];
  }

  if (machine.machineCode === '50B-LH' || machine.machineCode === '50B-RH') {
    return [
      machine.hole1Status,
      machine.hole2Status,
      machine.hole3Status,
      machine.hole4Status,
      machine.hole5Status,
      machine.hole6Status,
      machine.hole7Status,
      machine.hole8Status,
    ].map((status, index) => ({
      name: `HOLE ${index + 1}`,
      unit: '',
      min: null,
      actual: null,
      max: null,
      status,
      statusOnly: true,
    }));
  }

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

  if (machine.machineCode === '30A-LH' || machine.machineCode === '30A-RH') {
    operations.push(
      {
        name: 'OUTER GUIDE',
        unit: '',
        min: null,
        actual: null,
        max: null,
        status: machine.outerGuideStatus,
        statusOnly: true,
      },
      {
        name: 'INNER GUIDE',
        unit: '',
        min: null,
        actual: null,
        max: null,
        status: machine.innerGuideStatus,
        statusOnly: true,
      },
    );
  }

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
