import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImportDialog } from '../import-dialog/import-dialog';
import { LabelGenerator } from '../label-generator/label-generator';

interface Location {
  company: string;
  site: string;
  area: string;
}

interface Extinguisher {
  tag: string;
  type: string;
  status: string;
  location: Location;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, ImportDialog, LabelGenerator],
  templateUrl: './inventory.html',
  styleUrl: './inventory.sass'
})
export class Inventory implements OnInit {
  items: Extinguisher[] = [];
  filtered: Extinguisher[] = [];

  searchTerm = '';
  filters = { location: '', type: '', status: '' };

  locations: string[] = [];
  types: string[] = [];
  statuses = ['Active', 'Inactive'];

  importing = false;
  labeling = false;

  ngOnInit() {
    const data = localStorage.getItem('inventory');
    if (data) {
      this.items = JSON.parse(data);
      this.items.forEach(item => {
        if (!this.locations.includes(`${item.location.company}/${item.location.site}/${item.location.area}`)) {
          this.locations.push(`${item.location.company}/${item.location.site}/${item.location.area}`);
        }
        if (!this.types.includes(item.type)) this.types.push(item.type);
      });
      this.filter();
    }
  }

  filter() {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.items.filter(item => {
      const matchesTerm = !term || item.tag.toLowerCase().includes(term);
      const matchesLocation = !this.filters.location || `${item.location.company}/${item.location.site}/${item.location.area}`.includes(this.filters.location);
      const matchesType = !this.filters.type || item.type === this.filters.type;
      const matchesStatus = !this.filters.status || item.status === this.filters.status;
      return matchesTerm && matchesLocation && matchesType && matchesStatus;
    });
  }

  openImport() { this.importing = true; }

  closeImport(data: Extinguisher[] | null) {
    this.importing = false;
    if (data) {
      data.forEach(d => this.addItem(d));
      this.filter();
    }
  }

  addItem(item: Extinguisher) {
    if (this.items.find(i => i.tag === item.tag)) return;
    this.items.push(item);
    if (!this.locations.includes(`${item.location.company}/${item.location.site}/${item.location.area}`)) {
      this.locations.push(`${item.location.company}/${item.location.site}/${item.location.area}`);
    }
    if (!this.types.includes(item.type)) this.types.push(item.type);
    localStorage.setItem('inventory', JSON.stringify(this.items));
  }

  openLabelGenerator() { this.labeling = true; }
}
