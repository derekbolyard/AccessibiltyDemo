import { Component, EventEmitter, Output, Input, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'label-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './label-generator.html',
  styleUrl: './label-generator.sass'
})
export class LabelGenerator implements AfterViewInit {
  @Output() close = new EventEmitter<void>();
  @Input() tag = 'FT-001';
  @Input() type = 'ABC';
  
  // Label configuration
  companyName = 'Your Company Name';
  selectedSize = 'standard';
  printQuality = 'high';
  labelWidth = 50;
  labelHeight = 30;
  
  // Options
  includeInstructions = true;
  includeBranding = false;
  weatherproof = true;
  
  // Status
  isGenerating = false;
  lastInspection = '';
  nextInspection = '';

  ngAfterViewInit(): void {
    // Use a longer timeout to ensure DOM is fully rendered
    setTimeout(() => {
      this.generateCodes();
      this.loadInspectionData();
    }, 300);
  }

  generateCodes() {
    try {
      // Generate barcode
      const barcodeElement = document.getElementById('barcode');
      if (barcodeElement) {
        JsBarcode(barcodeElement, this.tag, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: false
        });
        console.log('Barcode generated successfully for tag:', this.tag);
      } else {
        console.warn('Barcode element not found');
      }
      
      // Generate QR code
      const qrCanvas = document.getElementById('qrcode') as HTMLCanvasElement;
      if (qrCanvas) {
        const qrData = JSON.stringify({
          tag: this.tag,
          type: this.type,
          company: this.companyName,
          inspectionUrl: `${window.location.origin}/inspection?tag=${this.tag}`
        });
        
        QRCode.toCanvas(qrCanvas, qrData, {
          width: 100,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }).then(() => {
          console.log('QR code generated successfully for tag:', this.tag);
        }).catch((err: any) => {
          console.error('Error generating QR code:', err);
        });
      } else {
        console.warn('QR code canvas element not found');
      }
    } catch (error) {
      console.error('Error generating codes:', error);
    }
  }

  loadInspectionData() {
    // Load inspection data from localStorage
    const inspections = JSON.parse(localStorage.getItem('inspections') || '[]');
    const tagInspections = inspections.filter((i: any) => i.tag === this.tag);
    
    if (tagInspections.length > 0) {
      const latest = tagInspections.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      
      this.lastInspection = latest.date;
      
      // Calculate next inspection (assuming annual)
      const nextDate = new Date(latest.date);
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      this.nextInspection = nextDate.toISOString().split('T')[0];
    }
  }

  updateLabelSize() {
    const sizes: { [key: string]: { width: number, height: number } } = {
      'small': { width: 40, height: 25 },
      'standard': { width: 50, height: 30 },
      'large': { width: 70, height: 40 }
    };
    
    const size = sizes[this.selectedSize];
    if (size) {
      this.labelWidth = size.width;
      this.labelHeight = size.height;
    }
    
    // Regenerate codes with new size
    setTimeout(() => this.generateCodes(), 100);
  }

  previewLabel() {
    // TODO: Implement preview functionality
    console.log('Preview label with options:', {
      tag: this.tag,
      companyName: this.companyName,
      size: this.selectedSize,
      quality: this.printQuality,
      options: {
        instructions: this.includeInstructions,
        branding: this.includeBranding,
        weatherproof: this.weatherproof
      }
    });
  }

  downloadPdf() {
    this.isGenerating = true;
    
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.text(this.companyName, 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Equipment Tag: ${this.tag}`, 20, 35);
      doc.text(`Type: ${this.type} Fire Extinguisher`, 20, 45);
      
      // Get the generated codes
      const qrCanvas = document.getElementById('qrcode') as HTMLCanvasElement;
      
      // Add QR code if available
      if (qrCanvas) {
        try {
          const qrImage = qrCanvas.toDataURL('image/png');
          doc.text('QR Code:', 20, 65);
          doc.addImage(qrImage, 'PNG', 20, 70, 30, 30);
        } catch (qrError) {
          console.warn('Could not add QR code to PDF:', qrError);
          doc.text('QR Code: Generation failed', 20, 65);
        }
      }
      
      // Add barcode info (text representation since SVG conversion is complex)
      doc.text('Barcode (CODE128):', 20, 110);
      doc.setFontSize(10);
      doc.text(`Tag: ${this.tag}`, 20, 120);
      
      // Additional information
      if (this.includeInstructions) {
        doc.setFontSize(10);
        doc.text('Usage Instructions:', 20, 135);
        doc.text('1. Check pressure gauge monthly', 25, 145);
        doc.text('2. Inspect for damage or corrosion', 25, 155);
        doc.text('3. Ensure access is not blocked', 25, 165);
        doc.text('4. Schedule annual professional inspection', 25, 175);
      }
      
      // Footer
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 280);
      if (this.lastInspection) {
        doc.text(`Last Inspection: ${this.lastInspection}`, 20, 285);
      }
      if (this.nextInspection) {
        doc.text(`Next Due: ${this.nextInspection}`, 20, 290);
      }
      
      doc.save(`${this.tag}-label.pdf`);
      console.log('PDF generated successfully for tag:', this.tag);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      this.isGenerating = false;
    }
  }
}
