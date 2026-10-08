import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Product,
  ProductResponse,
  ProductStatusEnum,
} from './products.types';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly _httpClient = inject(HttpClient);
  private readonly _apiUrl = `${environment.apiUrl}/products`;

  findAll(page: number = 1, limit: number = 10, search?: string, status?: ProductStatusEnum): Observable<ProductResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    if (status) {
      params = params.set('status', status);
    }

    return this._httpClient.get<ProductResponse>(this._apiUrl, { params });
  }

  findById(id: string): Observable<Product> {
    return this._httpClient.get<Product>(`${this._apiUrl}/${id}`);
  }

  create(payload: Partial<Product>): Observable<Product> {
    return this._httpClient.post<Product>(this._apiUrl, payload);
  }

  update(id: string, payload: Partial<Product>): Observable<Product> {
    return this._httpClient.put<Product>(`${this._apiUrl}/${id}`, payload);
  }

  changeStatus(id: string, status: ProductStatusEnum): Observable<Product> {
    return this._httpClient.patch<Product>(`${this._apiUrl}/${id}/status`, { status });
  }

  delete(id: string): Observable<{ message: string; id: string }> {
    return this._httpClient.delete<{ message: string; id: string }>(`${this._apiUrl}/${id}`);
  }
}
