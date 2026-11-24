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

  it('includes the 30A guide statuses in the report columns', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const headings = fixture.nativeElement.querySelector('.overall-report-table thead')?.textContent;
    expect(headings).toContain('OUTER GUIDE');
    expect(headings).toContain('INNER GUIDE');
  });

  it('includes Machine 50B hole statuses in the report columns', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const headings = fixture.nativeElement.querySelector('.overall-report-table thead')?.textContent;
    expect(headings).toContain('Machine 50B');
    expect(headings).toContain('HOLE 1');
    expect(headings).toContain('HOLE 8');
  });

  it('stacks status-only operation names and Status in one header cell', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const headers = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLTableCellElement>(
        '.overall-report-table thead th.parameter-subgroup--status-only',
      ),
    ];
    const guideHeader = headers.find((header) => header.textContent?.includes('OUTER GUIDE'));
    const guideLines = [...(guideHeader?.querySelectorAll('span') ?? [])].map((line) =>
      line.textContent?.trim(),
    );

    expect(guideHeader?.rowSpan).toBe(2);
    expect(guideLines).toEqual(['OUTER GUIDE', 'Status']);
    expect(headers.some((header) => header.textContent?.includes('HOLE 8'))).toBe(true);
  });

  it('displays the completion date and time header on separate lines', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const lines = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLSpanElement>(
        '.overall-report-table thead .table-sticky-column--first span',
      ),
    ].map((line) => line.textContent?.trim());

    expect(lines).toEqual(['Completion Date', 'Time']);
  });

  it('displays Production and Status on separate header lines', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const lines = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLSpanElement>(
        '.overall-report-table thead tr:first-child th:nth-child(5) span',
      ),
    ].map((line) => line.textContent?.trim());

    expect(lines).toEqual(['Production', 'Status']);
  });

  it('places the CSV download button beside Generate report', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelector('.report-action-buttons');
    expect(actions?.querySelector('.generate-button')).toBeTruthy();
    expect(actions?.querySelector('.download-button')?.textContent).toContain('Download CSV');
  });

  it('labels the date range filter', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('label[for="reportDateRange"]')?.textContent,
    ).toContain('Date range');
  });

  it('shows both selected dates in one field after selecting a range', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dateRangeInput = compiled.querySelector<HTMLInputElement>(
      '[aria-label="Report date range"]',
    );
    expect(dateRangeInput).toBeTruthy();

    compiled.querySelector<HTMLButtonElement>('.date-range-trigger')?.click();
    fixture.detectChanges();

    const currentMonthLabel = new Intl.DateTimeFormat(undefined, {
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    const today = new Date();
    const todayText = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    compiled.querySelector<HTMLButtonElement>('[aria-label="Previous month"]')?.click();
    fixture.detectChanges();

    const days = [...compiled.querySelectorAll<HTMLButtonElement>(
      '.calendar-day:not(.calendar-day--outside)',
    )];
    days.find((day) => day.textContent?.trim() === '1')?.click();
    fixture.detectChanges();

    expect(dateRangeInput?.value).toMatch(new RegExp(`^\\d{4}-\\d{2}-01 to ${todayText}$`));
    expect(compiled.querySelector('.calendar-heading strong')?.textContent).toBe(
      currentMonthLabel,
    );
    expect(
      [...compiled.querySelectorAll<HTMLButtonElement>(
        '.calendar-day--boundary:not(.calendar-day--outside)',
      )].some((day) => day.textContent?.trim() === String(today.getDate())),
    ).toBe(true);
    expect(compiled.querySelector('.date-range-instruction')?.textContent).toContain(
      'Select an end date',
    );

    [...compiled.querySelectorAll<HTMLButtonElement>(
      '.calendar-day:not(.calendar-day--outside)',
    )].find((day) => day.textContent?.trim() === '2')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.date-range-popover')).toBeNull();
    expect(dateRangeInput?.value).toMatch(/^\d{4}-\d{2}-01 to \d{4}-\d{2}-02$/);
  });

  it('allows manually entering both dates in the range field', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dateRangeInput = compiled.querySelector<HTMLInputElement>(
      '[aria-label="Report date range"]',
    );
    if (!dateRangeInput) {
      throw new Error('Date range input is missing.');
    }

    dateRangeInput.value = '2026-03-10 to 2026-03-18';
    dateRangeInput.dispatchEvent(new Event('input'));
    dateRangeInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(dateRangeInput.value).toBe('2026-03-10 to 2026-03-18');
  });

  it('opens the shared calendar from the editable range field', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dateRangeInput = compiled.querySelector<HTMLInputElement>(
      '[aria-label="Report date range"]',
    );
    if (!dateRangeInput) {
      throw new Error('Date range input is missing.');
    }

    expect(dateRangeInput.type).toBe('text');
    expect(compiled.querySelector('.date-input-field')).toBeNull();

    dateRangeInput.focus();
    fixture.detectChanges();
    expect(compiled.querySelector('.date-range-popover')).toBeTruthy();

    dateRangeInput.value = '2026-03-10 to 2026-03-18';
    dateRangeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(compiled.querySelector('.date-range-popover')).toBeTruthy();
  });
});
