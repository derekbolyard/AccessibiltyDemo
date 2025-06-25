import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';

interface InspectionRecord {
  tag: string;
  status: string;
  date: string;
  reason?: string;
  action?: string;
  retest?: string;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report.html',
  styleUrl: './report.sass'
})
export class Report {
  start = '';
  end = '';
  location = '';

  download() {
    const data: InspectionRecord[] = JSON.parse(localStorage.getItem('inspections') || '[]');
    const doc = new jsPDF();
    doc.text('Inspection Logbook', 10, 10);
    const filtered = data.filter(r => {
      if (this.start && new Date(r.date) < new Date(this.start)) return false;
      if (this.end && new Date(r.date) > new Date(this.end)) return false;
      return true;
    });
    let y = 20;
    filtered.forEach(r => {
      doc.text(`${r.date} - ${r.tag} - ${r.status}`, 10, y);
      y += 10;
    });
    doc.save('logbook.pdf');
  }
}
