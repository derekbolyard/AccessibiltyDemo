import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  lastScanned?: string;
  nextService?: string;
  manufacture?: string;
  capacity?: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  statuses = ['Active', 'Inactive', 'Needs Service', 'Expired'];

  importing = false;
  labeling = false;
  selectedItems: Extinguisher[] = [];

  constructor(public router: Router) {}

  ngOnInit() {
    this.loadInventory();
  }

  private loadInventory() {
    const data = localStorage.getItem('inventory');
    if (data) {
      this.items = JSON.parse(data);
      this.extractFilterOptions();
      this.filter();
    } else {
      // Load sample data if no inventory exists
      this.loadSampleData();
    }
  }

  private loadSampleData() {
    const sampleData: Extinguisher[] = [
      {
        tag: 'FT-001',
        type: 'ABC Dry Chemical',
        status: 'Active',
        location: { company: 'Demo Corp', site: 'Main Building', area: 'Lobby' },
        lastScanned: '2024-12-15',
        nextService: '2025-12-15',
        manufacture: '2023-01-15',
        capacity: '5 lbs'
      },
      {
        tag: 'FT-002',
        type: 'CO2',
        status: 'Active',
        location: { company: 'Demo Corp', site: 'Main Building', area: 'Server Room' },
        lastScanned: '2024-12-10',
        nextService: '2025-12-10',
        manufacture: '2023-02-20',
        capacity: '10 lbs'
      },
      {
        tag: 'FT-003',
        type: 'Water',
        status: 'Needs Service',
        location: { company: 'Demo Corp', site: 'Warehouse', area: 'Loading Dock' },
        lastScanned: '2024-11-01',
        nextService: '2024-11-01',
        manufacture: '2022-08-10',
        capacity: '2.5 Gallons'
      },
      {
        tag: 'FT-004',
        type: 'Foam',
        status: 'Active',
        location: { company: 'Demo Corp', site: 'Factory', area: 'Production Floor' },
        lastScanned: '2024-12-20',
        nextService: '2025-12-20',
        manufacture: '2023-03-15',
        capacity: '6 lbs'
      }
    ];
    
    this.items = sampleData;
    localStorage.setItem('inventory', JSON.stringify(sampleData));
    this.extractFilterOptions();
    this.filter();
  }

  private extractFilterOptions() {
    this.locations = [...new Set(this.items.map(item => this.formatLocation(item.location)))];
    this.types = [...new Set(this.items.map(item => item.type))];
  }

  filter() {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.items.filter(item => {
      const matchesTerm = !term || 
        item.tag.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        this.formatLocation(item.location).toLowerCase().includes(term);
        
      const matchesLocation = !this.filters.location || 
        this.formatLocation(item.location).includes(this.filters.location);
        
      const matchesType = !this.filters.type || item.type === this.filters.type;
      const matchesStatus = !this.filters.status || item.status === this.filters.status;
      
      return matchesTerm && matchesLocation && matchesType && matchesStatus;
    });
  }

  // Statistics methods
  getActiveCount(): number {
    return this.items.filter(item => item.status === 'Active').length;
  }

  getServiceCount(): number {
    return this.items.filter(item => this.needsService(item)).length;
  }

  getExpiredCount(): number {
    return this.items.filter(item => this.isExpired(item)).length;
  }

  // Selection methods
  isSelected(item: Extinguisher): boolean {
    return this.selectedItems.some(selected => selected.tag === item.tag);
  }

  toggleSelection(item: Extinguisher) {
    if (this.isSelected(item)) {
      this.selectedItems = this.selectedItems.filter(selected => selected.tag !== item.tag);
    } else {
      this.selectedItems.push(item);
    }
  }

  selectAll() {
    this.selectedItems = [...this.filtered];
  }

  deselectAll() {
    this.selectedItems = [];
  }

  // Service and status methods
  needsService(item: Extinguisher): boolean {
    return item.status === 'Needs Service' || this.isExpired(item);
  }

  isOverdue(dateString: string | undefined): boolean {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  }

  // Action methods
  generateLabels() {
    if (this.selectedItems.length === 0) return;
    this.labeling = true;
  }

  viewHistory(item: Extinguisher) {
    // TODO: Implement history view
    console.log('View history for:', item.tag);
  }

  // Filter management
  clearSearch() {
    this.searchTerm = '';
    this.filter();
  }

  clearFilters() {
    this.filters = { location: '', type: '', status: '' };
    this.filter();
  }

  clearAllFilters() {
    this.searchTerm = '';
    this.clearFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.location || this.filters.type || this.filters.status);
  }

  // Utility methods
  trackByTag(index: number, item: Extinguisher): string {
    return item.tag;
  }

  formatLocation(location: Location): string {
    return `${location.company} / ${location.site} / ${location.area}`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  isExpired(item: Extinguisher): boolean {
    if (!item.nextService) return false;
    return new Date(item.nextService) < new Date();
  }

  needsAttention(item: Extinguisher): boolean {
    if (!item.nextService) return false;
    const nextService = new Date(item.nextService);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return nextService <= thirtyDaysFromNow;
  }

  getStatusClass(item: Extinguisher): string {
    if (this.isExpired(item)) return 'status-expired';
    if (this.needsAttention(item)) return 'status-warning';
    if (item.status === 'Active') return 'status-active';
    return 'status-inactive';
  }

  // Item management
  editItem(item: Extinguisher) {
    // TODO: Implement edit functionality
    console.log('Edit item:', item);
  }

  deleteItem(item: Extinguisher) {
    if (confirm(`Are you sure you want to delete ${item.tag}?`)) {
      this.items = this.items.filter(i => i.tag !== item.tag);
      localStorage.setItem('inventory', JSON.stringify(this.items));
      this.extractFilterOptions();
      this.filter();
    }
  }

  quickInspect(item: Extinguisher) {
    this.router.navigate(['/inspection'], { 
      queryParams: { tag: item.tag } 
    });
  }

  generateQR(item: Extinguisher) {
    // TODO: Implement QR generation for single item
    console.log('Generate QR for:', item);
  }

  exportData() {
    const dataStr = JSON.stringify(this.filtered, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `inventory-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  // Import/Export
  openImport() { 
    this.importing = true; 
  }

  closeImport(data: Extinguisher[] | null) {
    this.importing = false;
    if (data) {
      data.forEach(d => this.addItem(d));
      this.filter();
    }
  }

  openLabelGenerator() { 
    // If no items are filtered, use all items, otherwise use first filtered item
    if (this.filtered.length > 0) {
      this.selectedItems = [this.filtered[0]]; // Take first item for label generation
    } else if (this.items.length > 0) {
      this.selectedItems = [this.items[0]]; // Fallback to first item
    } else {
      return; // No items to generate labels for
    }
    this.labeling = true; 
  }

  addItem(item: Extinguisher) {
    const existingIndex = this.items.findIndex(i => i.tag === item.tag);
    
    if (existingIndex >= 0) {
      // Update existing item
      this.items[existingIndex] = { ...this.items[existingIndex], ...item };
    } else {
      // Add new item
      this.items.push(item);
    }
    
    localStorage.setItem('inventory', JSON.stringify(this.items));
  }
}
