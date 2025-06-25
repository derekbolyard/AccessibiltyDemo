import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
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

  mark(tag: string, status: 'Pass' | 'Fail') {
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
}
