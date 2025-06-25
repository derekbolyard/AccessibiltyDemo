import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Scan } from './scan/scan';
import { Inventory } from './inventory/inventory';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'scan', component: Scan },
  { path: 'inventory', component: Inventory }
];
