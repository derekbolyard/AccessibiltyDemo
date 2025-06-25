import { Injectable } from '@angular/core';

export interface LogEvent {
  user: string;
  action: string;
  timestamp: string;
  hash: string;
}

@Injectable({ providedIn: 'root' })
export class LogService {
  async record(user: string, action: string) {
    const timestamp = new Date().toISOString();
    const entry = { user, action, timestamp } as any;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(entry)));
    entry.hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
    const logs: LogEvent[] = JSON.parse(localStorage.getItem('eventLog') || '[]');
    logs.push(entry as LogEvent);
    localStorage.setItem('eventLog', JSON.stringify(logs));
  }
}
