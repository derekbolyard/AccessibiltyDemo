import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createWorker } from 'tesseract.js';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scan.html',
  styleUrl: './scan.sass'
})
export class Scan {
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  result = '';
  scanning = false;

  async openCamera() {
    this.scanning = true;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.video.nativeElement.srcObject = stream;
    await this.video.nativeElement.play();
  }

  async capture() {
    const canvasEl = this.canvas.nativeElement;
    const videoEl = this.video.nativeElement;
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    canvasEl.getContext('2d')?.drawImage(videoEl, 0, 0);
    const worker = await createWorker();
    await (worker as any).loadLanguage('eng');
    await (worker as any).initialize('eng');
    const { data } = await (worker as any).recognize(canvasEl);
    this.result = data.text.trim();
    await (worker as any).terminate();
  }
}
