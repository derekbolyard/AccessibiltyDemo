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

  fileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        this.done.emit(results.data);
      }
    });
  }
}
