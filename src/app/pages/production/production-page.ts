import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-production-page',
  templateUrl: './production-page.html',
  styleUrl: './production-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductionPage {}
