import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppLayout } from './layout/app-layout/app-layout';

@Component({
  selector: 'app-root',
  imports: [AppLayout],
  template: '<app-layout />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
}
