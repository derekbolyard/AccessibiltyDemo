import { Component, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'label-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './label-generator.html',
  styleUrl: './label-generator.sass'
})
export class LabelGenerator implements AfterViewInit {
  @Output() close = new EventEmitter<void>();

  ngAfterViewInit(): void {
    JsBarcode('#barcode', 'FT-001');
    QRCode.toCanvas(document.getElementById('qrcode') as HTMLCanvasElement, 'FT-001');
  }

  downloadPdf() {
    const doc = new jsPDF();
    const svg = document.getElementById('barcode') as any;
    const canvas = document.getElementById('qrcode') as HTMLCanvasElement;
    const barcode = new XMLSerializer().serializeToString(svg as Node);
    const img = canvas.toDataURL('image/png');
    doc.text('FireTagger Label', 10, 10);
    doc.addImage(barcode, 'SVG', 10, 20, 80, 20);
    doc.addImage(img, 'PNG', 10, 50, 40, 40);
    doc.save('label.pdf');
  }
}
