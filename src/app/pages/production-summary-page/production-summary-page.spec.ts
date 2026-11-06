import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProductionSummaryService } from './production-summary.service';
import { ProductionSummaryPage } from './production-summary-page';

describe('ProductionSummaryPage', () => {
  const rows = [
    {
      productionDate: '2026-11-04',
      shift: 1,
      okCount: 18,
      notOkCount: 2,
      totalPartCount: 20,
    },
    {
      productionDate: '2026-11-04',
      shift: 2,
      okCount: 15,
      notOkCount: 1,
      totalPartCount: 16,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductionSummaryPage],
      providers: [
        {
          provide: ProductionSummaryService,
          useValue: { fetch: () => of(rows) },
        },
      ],
    }).compileComponents();
  });

  it('loads and displays production counts with side and date filters', async () => {
    const fixture = TestBed.createComponent(ProductionSummaryPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Production summary');
    expect(compiled.querySelectorAll('.filter-field').length).toBe(4);
    expect(compiled.querySelector('.date-total.count-total')?.textContent).toContain('Total: 36');
    expect(compiled.querySelector('.date-total.count-ok')?.textContent).toContain('OK: 33');
    expect(compiled.querySelector('.date-total.count-reject')?.textContent).toContain('Not OK: 3');
  });

  it('shows validation when the start date is after the end date', async () => {
    const fixture = TestBed.createComponent(ProductionSummaryPage);
    await fixture.whenStable();
    fixture.componentInstance.startDate = '2026-11-05';
    fixture.componentInstance.endDate = '2026-11-01';

    fixture.componentInstance.load();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'the start date must not be after the end date',
    );
  });
});
