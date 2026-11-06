import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { LiveDataService } from './core/live-data/live-data.service';
import type { MachineStatus } from './core/live-data/machine-status';
import { ProductionSummaryService } from './pages/production-summary-page/production-summary.service';

const machineStatuses: MachineStatus[] = [
  {
    machineCode: '30A-LH',
    entityName: 'Machine30ALh',
    id: 1,
    finalStatus: 1,
    barcode: 'BARCODE-OK',
    operatorName: 'Operator A',
    shift: 1,
    airGauge1Min: null,
    airGauge1Actual: null,
    airGauge1Max: null,
    airGauge1Status: 1,
    airGauge2Min: null,
    airGauge2Actual: null,
    airGauge2Max: null,
    airGauge2Status: 2,
    outerDiaMin: null,
    outerDiaActual: null,
    outerDiaMax: null,
    outerDiaStatus: null,
    innerDiaMin: null,
    innerDiaActual: null,
    innerDiaMax: null,
    innerDiaStatus: null,
    miniLoad: null,
    actualLoad: null,
    maxLoad: null,
    loadStatus: null,
    minDisplacement: null,
    actualDisplacement: null,
    maxDisplacement: null,
    displacementStatus: null,
    okCount: 15,
    notOkCount: 0,
    totalPartCount: 15,
    cycleTime: 22,
    cycleStartTime: null,
    cycleEndTime: null,
  },
  {
    machineCode: '30A-RH',
    entityName: 'Machine30ARh',
    id: 2,
    finalStatus: 2,
    barcode: 'BARCODE-NOK',
    operatorName: 'Operator B',
    shift: 2,
    airGauge1Min: null,
    airGauge1Actual: null,
    airGauge1Max: null,
    airGauge1Status: null,
    airGauge2Min: null,
    airGauge2Actual: null,
    airGauge2Max: null,
    airGauge2Status: null,
    outerDiaMin: null,
    outerDiaActual: null,
    outerDiaMax: null,
    outerDiaStatus: null,
    innerDiaMin: null,
    innerDiaActual: null,
    innerDiaMax: null,
    innerDiaStatus: null,
    miniLoad: null,
    actualLoad: null,
    maxLoad: null,
    loadStatus: null,
    minDisplacement: null,
    actualDisplacement: null,
    maxDisplacement: null,
    displacementStatus: null,
    okCount: 14,
    notOkCount: 1,
    totalPartCount: 15,
    cycleTime: 24,
    cycleStartTime: null,
    cycleEndTime: null,
  },
  {
    machineCode: '30B',
    entityName: 'Machine30B',
    id: 3,
    finalStatus: null,
    barcode: null,
    operatorName: null,
    shift: null,
    airGauge1Min: null,
    airGauge1Actual: null,
    airGauge1Max: null,
    airGauge1Status: null,
    airGauge2Min: null,
    airGauge2Actual: null,
    airGauge2Max: null,
    airGauge2Status: null,
    outerDiaMin: null,
    outerDiaActual: null,
    outerDiaMax: null,
    outerDiaStatus: null,
    innerDiaMin: null,
    innerDiaActual: null,
    innerDiaMax: null,
    innerDiaStatus: null,
    miniLoad: null,
    actualLoad: null,
    maxLoad: null,
    loadStatus: null,
    minDisplacement: null,
    actualDisplacement: null,
    maxDisplacement: null,
    displacementStatus: null,
    okCount: null,
    notOkCount: null,
    totalPartCount: null,
    cycleTime: null,
    cycleStartTime: null,
    cycleEndTime: null,
  },
];

describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('p602-active-page');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: LiveDataService,
          useValue: {
            getMachineStatuses: () => of(machineStatuses),
            getOverallReport: () => of([]),
          },
        },
        {
          provide: ProductionSummaryService,
          useValue: { fetch: () => of([]) },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the dashboard with links to each workspace', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.welcome-panel h1')?.textContent).toContain('Dashboard');
    expect(compiled.querySelector('.topbar__title')?.textContent).toContain('SFL LEGEND ASSEMBLY');
    expect(compiled.querySelector('.brand__logo')?.getAttribute('alt')).toBe('TVS');
    expect(compiled.querySelector('.sidebar')?.classList.contains('sidebar--collapsed')).toBe(true);
    expect(compiled.querySelectorAll('.workspace-link').length).toBe(5);
    expect(compiled.querySelector('.machine-card')).toBeNull();
  });

  it('should show live machine cards in the Assembly workspace', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const assemblyLink = fixture.nativeElement.querySelector(
      '.nav-link[aria-label="Assembly"]',
    ) as HTMLButtonElement;

    assemblyLink.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.assembly-heading h1')?.textContent).toContain('Assembly');
    expect(compiled.querySelectorAll('.machine-card').length).toBe(8);
    expect(
      Array.from(compiled.querySelectorAll('.machine-card h2')).map((heading) =>
        heading.textContent?.trim(),
      ),
    ).toEqual([
      'Machine30ALh',
      'Machine30ARh',
      'Machine30B',
      'Machine40ALh',
      'Machine40ARh',
      'Machine40B',
      'Machine50Lh',
      'Machine50Rh',
    ]);
    expect(compiled.querySelector('.machine-card h2')?.textContent).toContain('Machine30ALh');
    expect(compiled.querySelector('.machine-status--ok')?.textContent).toContain('OK');
    expect(compiled.querySelector('.machine-status--not-ok')?.textContent).toContain('FAIL');
    expect(compiled.querySelector('.machine-card__barcode-label')?.textContent).toContain(
      'QR Code NO',
    );
    const waitingMachineCard = Array.from(compiled.querySelectorAll('.machine-card')).find(
      (card) => card.querySelector('h2')?.textContent?.includes('Machine30B'),
    );
    expect(waitingMachineCard?.querySelector('.barcode-chip--waiting')?.textContent).toContain(
      'Waiting for barcode',
    );
    expect(waitingMachineCard?.querySelectorAll('.machine-measurement strong').length).toBe(6);
    expect(
      waitingMachineCard?.querySelector('.machine-card__operations--stacked'),
    ).toBeTruthy();
    const machine40aCard = Array.from(compiled.querySelectorAll('.machine-card')).find(
      (card) => card.querySelector('h2')?.textContent?.includes('Machine40ALh'),
    );
    expect(machine40aCard?.querySelectorAll('.machine-measurement strong').length).toBe(12);
    expect(machine40aCard?.textContent).toContain('OUTER DIA ACTUAL VALUE (MM)');
    expect(machine40aCard?.querySelectorAll('.machine-operation').length).toBe(4);
    expect(compiled.querySelector('.operation-status--pass')).toBeTruthy();
    expect(compiled.querySelector('.operation-status--fail')).toBeTruthy();
  });

  it('should show separate workspaces for Production, Quality, and Reports', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    for (const page of ['Production', 'Quality', 'Reports']) {
      const pageLink = fixture.nativeElement.querySelector(
        `.nav-link[aria-label="${page}"]`,
      ) as HTMLButtonElement;
      pageLink.click();
      fixture.detectChanges();

      if (page === 'Production') {
        expect(
          fixture.nativeElement.querySelector('.production-summary h1')?.textContent,
        ).toContain('Production summary');
        expect(fixture.nativeElement.querySelectorAll('.filter-field').length).toBeGreaterThan(0);
      } else {
        expect(fixture.nativeElement.querySelector('.section-page h1')?.textContent).toContain(page);
      }
      expect(fixture.nativeElement.querySelector('.machine-card')).toBeNull();
    }
  });

  it('should update the workspace heading when a navigation item is selected', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const assemblyLink = fixture.nativeElement.querySelector(
      '.nav-link[aria-label="Assembly"]',
    ) as HTMLButtonElement;

    assemblyLink.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.assembly-heading h1')?.textContent).toContain('Assembly');
    expect(assemblyLink.getAttribute('aria-current')).toBe('page');
  });

  it('should restore the last selected workspace after reload', async () => {
    localStorage.setItem('p602-active-page', 'Production');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.production-summary h1')?.textContent,
    ).toContain('Production summary');
    expect(
      fixture.nativeElement
        .querySelector('.nav-link[aria-label="Production"]')
        ?.getAttribute('aria-current'),
    ).toBe('page');
  });

  it('should persist the workspace after selecting it', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const reportsLink = fixture.nativeElement.querySelector(
      '.nav-link[aria-label="Reports"]',
    ) as HTMLButtonElement;

    reportsLink.click();
    fixture.detectChanges();

    expect(localStorage.getItem('p602-active-page')).toBe('Reports');
  });

  it('should toggle the sidebar from the header menu button', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const menuButton = fixture.nativeElement.querySelector('.menu-toggle') as HTMLButtonElement;

    menuButton.click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.sidebar').classList.contains('sidebar--collapsed'),
    ).toBe(false);
  });

  it('should let the user choose and persist a theme from Settings', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const settingsLink = fixture.nativeElement.querySelector(
      '.nav-link[aria-label="Settings"]',
    ) as HTMLButtonElement;

    settingsLink.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.settings-heading h1')?.textContent).toContain('Settings');
    expect(fixture.nativeElement.querySelectorAll('input[name="theme"]').length).toBe(3);

    const darkOption = fixture.nativeElement.querySelector(
      'input[name="theme"][value="dark"]',
    ) as HTMLInputElement;
    darkOption.click();
    fixture.detectChanges();

    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('p602-theme-preference')).toBe('dark');

    const automaticOption = fixture.nativeElement.querySelector(
      'input[name="theme"][value="automatic"]',
    ) as HTMLInputElement;
    automaticOption.click();
    fixture.detectChanges();
  });
});
