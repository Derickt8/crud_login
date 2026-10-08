import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/auth/auth.guard';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { ProductsListComponent } from './pages/products/products-list/products-list.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'products',
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [publicGuard],
  },
  {
    path: 'products',
    component: ProductsListComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'products',
  },
];
