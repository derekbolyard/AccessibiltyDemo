import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogService } from '../log.service';

interface InspectionRecord {
  tag: string;
  status: 'Pass' | 'Fail' | 'Serviced';
  photo?: string;
  reason?: string;
  action?: string;
  retest?: string;
  date: string;
}

@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inspection.html',
  styleUrl: './inspection.sass'
})
export class Inspection implements OnInit {
  items: any[] = [];
  records: InspectionRecord[] = [];
  bulkDate = '';

  constructor(private log: LogService) {}

  ngOnInit() {
    const inv = localStorage.getItem('inventory');
    if (inv) this.items = JSON.parse(inv);
  }

  getRecord(tag: string): InspectionRecord {
    let rec = this.records.find(r => r.tag === tag);
    if (!rec) {
      rec = { tag, status: 'Pass', date: new Date().toISOString() } as InspectionRecord;
      this.records.push(rec);
    }
    return rec;
  }

  // Safe method that doesn't modify state - used for template bindings
  findRecord(tag: string): InspectionRecord | undefined {
    return this.records.find(r => r.tag === tag);
  }

  mark(tag: string, status: 'Pass' | 'Fail' | 'Serviced') {
    const rec = this.getRecord(tag);
    rec.status = status;
  }

  isFail(tag: string): boolean {
    const rec = this.records.find(r => r.tag === tag);
    return rec?.status === 'Fail';
  }

  setPhoto(tag: string, event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rec = this.getRecord(tag);
      rec.photo = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  save() {
    const existing = JSON.parse(localStorage.getItem('inspections') || '[]');
    localStorage.setItem('inspections', JSON.stringify([...existing, ...this.records]));
    this.records = [];
    this.log.record('system', 'inspections saved');
    alert('Inspections saved');
  }

  bulkService() {
    if (!this.bulkDate) return;
    this.items.forEach(i => {
      this.records.push({ tag: i.tag, status: 'Serviced', date: this.bulkDate } as InspectionRecord);
    });
    this.save();
    this.log.record('system', 'bulk service');
    this.bulkDate = '';
  }

  // New methods for enhanced functionality
  getCompletedCount(): number {
    return this.records.filter(r => r.status !== undefined).length;
  }

  getFailedCount(): number {
    return this.records.filter(r => r.status === 'Fail').length;
  }

  isCompleted(tag: string): boolean {
    const rec = this.records.find(r => r.tag === tag);
    return rec?.status !== undefined;
  }

  getInspectionStatusClass(tag: string): string {
    const rec = this.records.find(r => r.tag === tag);
    if (!rec || !rec.status) return 'status-pending';
    
    switch (rec.status) {
      case 'Pass': return 'status-pass';
      case 'Fail': return 'status-fail';
      case 'Serviced': return 'status-serviced';
      default: return 'status-pending';
    }
  }

  getInspectionStatus(tag: string): string {
    const rec = this.records.find(r => r.tag === tag);
    if (!rec || !rec.status) return 'Pending';
    return rec.status;
  }

  formatLocation(location: any): string {
    return `${location.company} / ${location.site} / ${location.area}`;
  }

  // Update methods for fail details
  updateReason(tag: string, value: string) {
    const rec = this.getRecord(tag);
    rec.reason = value;
  }

  updateAction(tag: string, value: string) {
    const rec = this.getRecord(tag);
    rec.action = value;
  }

  updateRetest(tag: string, value: string) {
    const rec = this.getRecord(tag);
    rec.retest = value;
  }

  // Getter methods for two-way binding
  getReason(tag: string): string {
    return this.findRecord(tag)?.reason || '';
  }

  getAction(tag: string): string {
    return this.findRecord(tag)?.action || '';
  }

  getRetest(tag: string): string {
    return this.findRecord(tag)?.retest || '';
  }
}
