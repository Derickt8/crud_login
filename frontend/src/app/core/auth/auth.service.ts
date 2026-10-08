import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  LoginCredentials,
  RegisterPayload,
} from './auth.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _httpClient = inject(HttpClient);
  private readonly _router = inject(Router);
  private readonly _apiUrl = `${environment.apiUrl}/auth`;

  private readonly _currentUserSignal = signal<AuthUser | null>(
    this.getStoredUser(),
  );

  readonly currentUser = this._currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUserSignal());

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this._httpClient
      .post<AuthResponse>(`${this._apiUrl}/register`, payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this._httpClient
      .post<AuthResponse>(`${this._apiUrl}/login`, credentials)
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    this.clearSession();
    this._router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem('access_token', authResponse.accessToken);
    localStorage.setItem('auth_user', JSON.stringify(authResponse.user));
    this._currentUserSignal.set(authResponse.user);
  }

  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    this._currentUserSignal.set(null);
  }

  private getStoredUser(): AuthUser | null {
    const rawUser = localStorage.getItem('auth_user');
    if (!rawUser) {
      return null;
    }
    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      return null;
    }
  }
}
