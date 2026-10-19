import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { NavigationItem } from '../../layout/navigation-item';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  readonly page = input.required<NavigationItem>();
  readonly navigation = input.required<readonly NavigationItem[]>();
  readonly pageSelected = output<NavigationItem>();
}
