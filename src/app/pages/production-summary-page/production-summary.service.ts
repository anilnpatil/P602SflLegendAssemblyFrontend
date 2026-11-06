import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProductionSummaryRow {
  productionDate: string;
  shift: number;
  okCount: number | null;
  notOkCount: number | null;
  totalPartCount: number | null;
}

@Injectable({ providedIn: 'root' })
export class ProductionSummaryService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/production-summary';

  fetch(side: 'LH' | 'RH', startDate: string, endDate: string): Observable<ProductionSummaryRow[]> {
    const params = new HttpParams()
      .set('side', side)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ProductionSummaryRow[]>(this.endpoint, { params });
  }
}
