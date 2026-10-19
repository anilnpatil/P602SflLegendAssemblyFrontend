import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-reports-page',
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage {}
