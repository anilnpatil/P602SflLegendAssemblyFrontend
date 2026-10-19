import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { isThemePreference } from './theme-preference';
import type { ThemePreference } from './theme-preference';

const THEME_STORAGE_KEY = 'p602-theme-preference';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly currentPreference = signal(this.readPreference());
  readonly preference = this.currentPreference.asReadonly();

  constructor() {
    this.applyPreference(this.preference());
  }

  setPreference(preference: ThemePreference): void {
    this.currentPreference.set(preference);
    this.applyPreference(preference);
  }

  private readPreference(): ThemePreference {
    const savedPreference =
      this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY) ?? null;

    return isThemePreference(savedPreference) ? savedPreference : 'automatic';
  }

  private applyPreference(preference: ThemePreference): void {
    const root = this.document.documentElement;
    root.dataset['theme'] = preference;
    root.style.colorScheme = preference === 'automatic' ? 'light dark' : preference;
    this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, preference);
  }
}
