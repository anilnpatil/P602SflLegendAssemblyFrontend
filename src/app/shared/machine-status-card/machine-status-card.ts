import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { getMachineOperations } from '../../core/live-data/machine-operations';
import type { MachineOperation } from '../../core/live-data/machine-operations';
import type { MachineStatus } from '../../core/live-data/machine-status';

@Component({
  selector: 'app-machine-status-card',
  templateUrl: './machine-status-card.html',
  styleUrl: './machine-status-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MachineStatusCard {
  readonly machine = input.required<MachineStatus>();
  readonly machineSelected = output<MachineStatus>();
  protected readonly operations = computed(() => getMachineOperations(this.machine()));

  protected measurementLabel(operation: MachineOperation, qualifier: string): string {
    const valueBeforeName =
      this.machine().machineCode === '30B' || this.machine().machineCode === '40B';
    const label = valueBeforeName
      ? `${qualifier} ${operation.name} VALUE`
      : `${operation.name} ${qualifier} VALUE`;

    return `${label} (${operation.unit})`;
  }
}
