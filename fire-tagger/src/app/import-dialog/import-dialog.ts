import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Papa from 'papaparse';

@Component({
  selector: 'import-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-dialog.html',
  styleUrl: './import-dialog.sass'
})
export class ImportDialog {
  @Output() done = new EventEmitter<any[]>();
  
  selectedFile: File | null = null;
  isDragOver = false;
  isProcessing = false;

  fileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  removeFile() {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  processFile() {
    if (!this.selectedFile) return;
    
    this.isProcessing = true;
    
    Papa.parse(this.selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        this.isProcessing = false;
        
        // Validate and clean the data
        const validData = results.data.filter((row: any) => 
          row.tag && row.type && row.status
        );
        
        this.done.emit(validData);
      },
      error: (error: any) => {
        this.isProcessing = false;
        console.error('File parsing error:', error);
        // TODO: Show error message to user
        this.done.emit([]);
      }
    });
  }
}
