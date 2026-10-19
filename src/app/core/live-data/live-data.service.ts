import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { MachineStatus } from './machine-status';

@Injectable({ providedIn: 'root' })
export class LiveDataService {
  private readonly http = inject(HttpClient);

  getMachineStatuses(): Observable<MachineStatus[]> {
    return this.http.get<MachineStatus[]>('/api/live-data/machines');
  }
}
