import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-quality-page',
  templateUrl: './quality-page.html',
  styleUrl: './quality-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualityPage {}
