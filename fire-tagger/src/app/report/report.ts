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
  
  // Report options
  includeInspections = true;
  includeInventory = true;
  includeStats = true;

  // Helper methods
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  hasDateRange(): boolean {
    return this.start !== '' && this.end !== '';
  }

  hasValidConfiguration(): boolean {
    return this.hasDateRange() && (this.includeInspections || this.includeInventory || this.includeStats);
  }

  getDateRangeDays(): number {
    if (!this.hasDateRange()) return 0;
    const startDate = new Date(this.start);
    const endDate = new Date(this.end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  getRecordCount(): number {
    let count = 0;
    if (this.includeInspections) count += this.getInspectionData().length;
    if (this.includeInventory) count += this.getInventoryData().length;
    return count;
  }

  getInspectionData(): InspectionRecord[] {
    const data: InspectionRecord[] = JSON.parse(localStorage.getItem('inspections') || '[]');
    return this.filterByDateRange(data);
  }

  getInventoryData(): any[] {
    const data = JSON.parse(localStorage.getItem('inventory') || '[]');
    return data;
  }

  getInspectionCount(): number {
    return this.getInspectionData().length;
  }

  getPassCount(): number {
    return this.getInspectionData().filter(r => r.status === 'pass').length;
  }

  getFailCount(): number {
    return this.getInspectionData().filter(r => r.status === 'fail').length;
  }

  getEquipmentCount(): number {
    return this.getInventoryData().length;
  }

  getActiveCount(): number {
    return this.getInventoryData().filter(item => item.status === 'active').length;
  }

  getExpiredCount(): number {
    return this.getInventoryData().filter(item => item.status === 'expired').length;
  }

  getComplianceRate(): number {
    const inspections = this.getInspectionData();
    if (inspections.length === 0) return 100;
    const passCount = this.getPassCount();
    return Math.round((passCount / inspections.length) * 100);
  }

  getTrendDirection(): string {
    // Simple trend calculation - could be enhanced with historical data
    const rate = this.getComplianceRate();
    return rate >= 90 ? 'Positive' : rate >= 70 ? 'Stable' : 'Needs attention';
  }

  filterByDateRange(data: InspectionRecord[]): InspectionRecord[] {
    return data.filter(r => {
      if (this.start && new Date(r.date) < new Date(this.start)) return false;
      if (this.end && new Date(r.date) > new Date(this.end)) return false;
      return true;
    });
  }

  preview() {
    // TODO: Implement preview functionality
    console.log('Preview report:', {
      dateRange: `${this.start} to ${this.end}`,
      options: {
        inspections: this.includeInspections,
        inventory: this.includeInventory,
        stats: this.includeStats
      }
    });
  }

  download() {
    const inspectionData = this.getInspectionData();
    const inventoryData = this.getInventoryData();
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Fire Safety Compliance Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Report Period: ${this.start} to ${this.end}`, 20, 45);
    
    let yPosition = 60;
    
    // Summary section
    if (this.includeStats) {
      doc.setFontSize(16);
      doc.text('Executive Summary', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.text(`Compliance Rate: ${this.getComplianceRate()}%`, 20, yPosition);
      yPosition += 10;
      doc.text(`Total Inspections: ${this.getInspectionCount()}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Equipment Items: ${this.getEquipmentCount()}`, 20, yPosition);
      yPosition += 20;
    }
    
    // Inspection details
    if (this.includeInspections && inspectionData.length > 0) {
      doc.setFontSize(16);
      doc.text('Inspection Records', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      inspectionData.forEach(record => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${record.date} - ${record.tag} - ${record.status}`, 20, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }
    
    // Inventory section
    if (this.includeInventory && inventoryData.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.text('Equipment Inventory', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      inventoryData.slice(0, 20).forEach(item => { // Limit for space
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${item.tag} - ${item.type} - ${item.status}`, 20, yPosition);
        yPosition += 8;
      });
    }
    
    doc.save(`compliance-report-${this.start}-to-${this.end}.pdf`);
  }
}
