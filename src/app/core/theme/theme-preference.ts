export type ThemePreference = 'light' | 'dark' | 'automatic';

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'automatic';
}
