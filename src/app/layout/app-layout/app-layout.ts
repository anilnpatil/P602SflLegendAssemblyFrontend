import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { ThemePreference } from '../../core/theme/theme-preference';
import { ThemeService } from '../../core/theme/theme.service';
import { AssemblyPage } from '../../pages/assembly/assembly-page';
import { DashboardPage } from '../../pages/dashboard/dashboard-page';
import { ProductionSummaryPage } from '../../pages/production-summary-page/production-summary-page';
import { QualityPage } from '../../pages/quality/quality-page';
import { ReportsPage } from '../../pages/reports/reports-page';
import { SettingsPage } from '../../pages/settings/settings-page';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import type { NavigationItem } from '../navigation-item';
import { Sidebar } from '../sidebar/sidebar';

const ACTIVE_PAGE_STORAGE_KEY = 'p602-active-page';

@Component({
  selector: 'app-layout',
  imports: [
    Header,
    Sidebar,
    DashboardPage,
    AssemblyPage,
    ProductionSummaryPage,
    QualityPage,
    ReportsPage,
    SettingsPage,
    Footer,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayout {
  protected readonly themeService = inject(ThemeService);
  private readonly document = inject(DOCUMENT);
  protected readonly navigation: readonly NavigationItem[] = [
    {
      label: 'Dashboard',
      description: 'A clear view of your Legend Assembly production workspace.',
      icon: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
    },
    {
      label: 'Assembly',
      description: 'Manage assembly work and keep every operation moving.',
      icon: 'M12 3 3.5 7.5 12 12l8.5-4.5L12 3Zm-8.5 9L12 16.5l8.5-4.5M3.5 16.5 12 21l8.5-4.5',
    },
    {
      label: 'Production',
      description: 'Coordinate production activity across the plant.',
      icon: 'M4 20V10l4 2V7l4 2V4h8v16H4Zm4-4h.01M12 16h.01M16 16h.01',
    },
    {
      label: 'Quality',
      description: 'Keep quality checks and standards close at hand.',
      icon: 'M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Zm-3.5 9 2.3 2.3 4.8-5',
    },
    {
      label: 'Reports',
      description: 'Review production insights and operational reporting.',
      icon: 'M4 19V5m0 14h16M8 15v-4m4 4V7m4 8v-6',
    },
    {
      label: 'Settings',
      description: 'Manage your workspace preferences and configuration.',
      icon: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0-5v2m0 13v2m9-8h-2m-14 0H3m15.36-6.36-1.42 1.42M7.06 16.94l-1.42 1.42m12.72 0-1.42-1.42M7.06 7.06 5.64 5.64',
    },
  ];

  protected readonly activePage = signal(this.getInitialPage());
  protected readonly isSidebarCollapsed = signal(true);
  protected readonly isMobileNavOpen = signal(false);

  protected toggleNavigation(): void {
    if (window.innerWidth <= 760) {
      this.isMobileNavOpen.update((isOpen) => !isOpen);
      return;
    }

    this.isSidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected selectPage(item: NavigationItem): void {
    this.activePage.set(item);
    this.document.defaultView?.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, item.label);
    this.isMobileNavOpen.set(false);
  }

  protected selectTheme(preference: ThemePreference): void {
    this.themeService.setPreference(preference);
  }

  protected closeMobileNav(): void {
    this.isMobileNavOpen.set(false);
  }

  private getInitialPage(): NavigationItem {
    const savedLabel = this.document.defaultView?.localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
    return this.navigation.find((item) => item.label === savedLabel) ?? this.navigation[0];
  }
}
