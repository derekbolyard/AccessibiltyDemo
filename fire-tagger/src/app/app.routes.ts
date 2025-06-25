import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Scan } from './scan/scan';
import { Inventory } from './inventory/inventory';
import { Inspection } from './inspection/inspection';
import { Report } from './report/report';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'scan', component: Scan },
  { path: 'inventory', component: Inventory },
  { path: 'inspection', component: Inspection },
  { path: 'report', component: Report }
];
