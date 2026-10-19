import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { NavigationItem } from '../navigation-item';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly navigation = input.required<readonly NavigationItem[]>();
  readonly activePage = input.required<NavigationItem>();
  readonly collapsed = input(false);
  readonly mobileOpen = input(false);
  readonly pageSelected = output<NavigationItem>();
}
