import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LiveDataService } from '../../core/live-data/live-data.service';
import { ReportsPage } from './reports-page';

describe('ReportsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsPage],
      providers: [
        {
          provide: LiveDataService,
          useValue: { getOverallReport: () => of([]) },
        },
      ],
    }).compileComponents();
  });

  it('keeps the filter controls without the redundant report title', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.report-title')).toBeNull();
    expect(compiled.querySelector('.report-results h2')).toBeNull();
    expect(compiled.querySelector('.report-results .filter-eyebrow')).toBeNull();
    expect(compiled.querySelector('.filter-field--side')).toBeTruthy();
    expect(compiled.querySelector('.completion-note')).toBeTruthy();
  });

  it('selects a date range in two steps using one calendar', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const fromInput = compiled.querySelector<HTMLInputElement>('[aria-label="From date"]');
    const toInput = compiled.querySelector<HTMLInputElement>('[aria-label="To date"]');
    expect(fromInput).toBeTruthy();
    expect(toInput).toBeTruthy();
    const initialToDate = toInput?.value;

    compiled.querySelector<HTMLButtonElement>('.date-range-trigger')?.click();
    fixture.detectChanges();

    const days = [...compiled.querySelectorAll<HTMLButtonElement>(
      '.calendar-day:not(.calendar-day--outside)',
    )];
    days.find((day) => day.textContent?.trim() === '1')?.click();
    fixture.detectChanges();

    expect(fromInput?.value).toContain('-01');
    expect(toInput?.value).toBe(initialToDate);
    expect(compiled.querySelector('.date-range-instruction')?.textContent).toContain(
      'Select an end date',
    );

    const todayDay = Number(initialToDate?.slice(-2));
    const endDay = [...compiled.querySelectorAll<HTMLButtonElement>('.calendar-day--boundary')]
      .find((day) => day.textContent?.trim() === String(todayDay));
    endDay?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.date-range-popover')).toBeNull();
    expect(fromInput?.value).toContain('-01');
    expect(toInput?.value).toBe(initialToDate);
  });

  it('allows manually entering the From and To dates', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const fromInput = compiled.querySelector<HTMLInputElement>('[aria-label="From date"]');
    const toInput = compiled.querySelector<HTMLInputElement>('[aria-label="To date"]');
    if (!fromInput || !toInput) {
      throw new Error('Date range inputs are missing.');
    }

    fromInput.value = '2026-03-10';
    fromInput.dispatchEvent(new Event('change'));
    toInput.value = '2026-03-18';
    toInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fromInput.value).toBe('2026-03-10');
    expect(toInput.value).toBe('2026-03-18');
  });
});
