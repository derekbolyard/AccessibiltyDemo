import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Scan } from './scan/scan';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'scan', component: Scan }
];
