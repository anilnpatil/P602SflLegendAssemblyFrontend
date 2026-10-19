import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ThemePreference } from '../../core/theme/theme-preference';

type ThemeOption = {
  value: ThemePreference;
  label: string;
  description: string;
  icon: string;
};

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  readonly theme = input.required<ThemePreference>();
  readonly themeChange = output<ThemePreference>();

  protected readonly themeOptions: readonly ThemeOption[] = [
    {
      value: 'light',
      label: 'Light',
      description: 'Use the light appearance.',
      icon: 'M12 3v2m0 14v2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M3 12h2m14 0h2M5.64 18.36l1.42-1.42m9.88-9.88 1.42-1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Use the dark appearance.',
      icon: 'M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z',
    },
    {
      value: 'automatic',
      label: 'Automatic',
      description: 'Follow your device appearance.',
      icon: 'M3 4h18v13H3zM8 21h8m-4-4v4',
    },
  ];
}
