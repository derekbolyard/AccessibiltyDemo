import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { createWorker } from 'tesseract.js';

interface ParsedData {
  label: string;
  value: string;
}

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scan.html',
  styleUrl: './scan.sass'
})
export class Scan implements OnDestroy {
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  
  result = '';
  error = '';
  scanning = false;
  processing = false;
  parsedData: ParsedData[] = [];
  
  private stream: MediaStream | null = null;

  constructor(private router: Router) {}

  async openCamera() {
    try {
      this.error = '';
      this.scanning = true;
      
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      this.video.nativeElement.srcObject = this.stream;
      await this.video.nativeElement.play();
    } catch (err) {
      this.error = 'Unable to access camera. Please check permissions.';
      this.scanning = false;
      console.error('Camera error:', err);
    }
  }

  closeCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.scanning = false;
  }

  async capture() {
    if (!this.video?.nativeElement || !this.canvas?.nativeElement) return;
    
    try {
      this.processing = true;
      this.error = '';
      
      const canvasEl = this.canvas.nativeElement;
      const videoEl = this.video.nativeElement;
      
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      
      const ctx = canvasEl.getContext('2d');
      if (!ctx) throw new Error('Unable to get canvas context');
      
      ctx.drawImage(videoEl, 0, 0);
      
      // Enhance image for better OCR
      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      this.enhanceImage(imageData);
      ctx.putImageData(imageData, 0, 0);
      
      const worker = await createWorker();
      await (worker as any).loadLanguage('eng');
      await (worker as any).initialize('eng');
      
      const { data } = await (worker as any).recognize(canvasEl, {
        logger: (m: any) => console.log(m)
      });
      
      this.result = data.text.trim();
      this.parseExtractedText(this.result);
      
      await (worker as any).terminate();
      
    } catch (err) {
      this.error = 'Failed to process image. Please try again.';
      console.error('OCR error:', err);
    } finally {
      this.processing = false;
    }
  }

  private enhanceImage(imageData: ImageData) {
    const data = imageData.data;
    
    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      // Increase contrast
      const contrast = 1.5;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const enhanced = Math.min(255, Math.max(0, Math.round(factor * (gray - 128) + 128)));
      
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
    }
  }

  private parseExtractedText(text: string) {
    this.parsedData = [];
    
    if (!text) return;
    
    const lines = text.split('\n').filter(line => line.trim());
    
    // Common patterns for fire extinguisher data
    const patterns = [
      { label: 'Serial Number', regex: /(?:serial|s\/n|sn)[\s:]*([\w\d-]+)/i },
      { label: 'Manufacture Date', regex: /(?:mfg|manuf|date)[\s:]*([\d\/\-]+)/i },
      { label: 'Service Date', regex: /(?:service|inspected|last)[\s:]*([\d\/\-]+)/i },
      { label: 'Next Service', regex: /(?:next|due)[\s:]*([\d\/\-]+)/i },
      { label: 'Type', regex: /(?:type|class)[\s:]*([\w\d]+)/i },
      { label: 'Capacity', regex: /([\d.]+)\s*(?:lb|kg|lbs)/i },
      { label: 'Location', regex: /(?:location|zone)[\s:]*([\w\s\d-]+)/i }
    ];
    
    patterns.forEach(pattern => {
      const match = text.match(pattern.regex);
      if (match && match[1]) {
        this.parsedData.push({
          label: pattern.label,
          value: match[1].trim()
        });
      }
    });
    
    // If no patterns matched, try to extract dates and numbers
    if (this.parsedData.length === 0) {
      const dateMatches = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g);
      if (dateMatches) {
        dateMatches.forEach((date, index) => {
          this.parsedData.push({
            label: `Date ${index + 1}`,
            value: date
          });
        });
      }
      
      const numberMatches = text.match(/\b\d{4,}\b/g);
      if (numberMatches) {
        numberMatches.slice(0, 3).forEach((num, index) => {
          this.parsedData.push({
            label: `Number ${index + 1}`,
            value: num
          });
        });
      }
    }
  }

  get canSave(): boolean {
    return this.result.length > 0 && !this.processing;
  }

  saveToInventory() {
    if (!this.canSave) return;
    
    // Create inventory item from parsed data
    const inventoryItem = {
      tag: this.findParsedValue('Serial Number') || `SCAN-${Date.now()}`,
      type: this.findParsedValue('Type') || 'Unknown',
      status: 'Active',
      lastScanned: new Date().toISOString(),
      rawData: this.result,
      parsedData: this.parsedData,
      location: {
        company: 'Scanned Location',
        site: this.findParsedValue('Location') || 'Unknown',
        area: 'Unknown'
      }
    };
    
    // Get existing inventory
    const existing = JSON.parse(localStorage.getItem('inventory') || '[]');
    
    // Check if item already exists
    const existingIndex = existing.findIndex((item: any) => item.tag === inventoryItem.tag);
    
    if (existingIndex >= 0) {
      // Update existing item
      existing[existingIndex] = { ...existing[existingIndex], ...inventoryItem };
    } else {
      // Add new item
      existing.push(inventoryItem);
    }
    
    localStorage.setItem('inventory', JSON.stringify(existing));
    
    // Navigate to inventory
    this.router.navigate(['/inventory']);
  }

  private findParsedValue(label: string): string | null {
    const item = this.parsedData.find(d => d.label === label);
    return item ? item.value : null;
  }

  clearResults() {
    this.result = '';
    this.parsedData = [];
    this.error = '';
  }

  clearError() {
    this.error = '';
  }

  ngOnDestroy() {
    this.closeCamera();
  }
}
