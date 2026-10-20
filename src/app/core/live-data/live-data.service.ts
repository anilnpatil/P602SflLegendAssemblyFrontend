import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { MachineStatus } from './machine-status';

export type OverallReportSide = 'LH' | 'RH' | 'BOTH';

export type OverallReportRow = {
  barcode: string;
  componentSide: 'LH' | 'RH';
  shift: number | null;
  completionTime: string | null;
  finalStatus: number | null;
  machines: MachineStatus[];
};

@Injectable({ providedIn: 'root' })
export class LiveDataService {
  private readonly http = inject(HttpClient);

  getMachineStatuses(): Observable<MachineStatus[]> {
    return this.http.get<MachineStatus[]>('/api/live-data/machines');
  }

  getMachineHistory(machineCode: string): Observable<MachineStatus[]> {
    return this.http.get<MachineStatus[]>('/api/reports/history', {
      params: { machineCode },
    });
  }

  getPartReport(machineCode: string, partId: string): Observable<MachineStatus[]> {
    return this.http.get<MachineStatus[]>('/api/reports/part', {
      params: { machineCode, partId },
    });
  }

  getDateRangeReport(
    machineCode: string,
    startDate: string,
    endDate: string,
  ): Observable<MachineStatus[]> {
    return this.http.get<MachineStatus[]>('/api/reports/date-range', {
      params: { machineCode, startDate, endDate },
    });
  }

  getOverallReport(
    side: OverallReportSide,
    startDate: string,
    endDate: string,
    barcode: string,
    shift: string,
  ): Observable<OverallReportRow[]> {
    return this.http.get<OverallReportRow[]>('/api/overall-reports', {
      params: { side, startDate, endDate, barcode, shift },
    });
  }
}
