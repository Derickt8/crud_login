import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { LoginCredentials } from '../../../core/auth/auth.types';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _destroyRef = inject(DestroyRef);

  readonly isLoadingLogin = signal<boolean>(false);
  readonly errorMessageLogin = signal<string | null>(null);
  readonly isPasswordVisibleLogin = signal<boolean>(false);

  readonly loginForm: FormGroup = this._formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  togglePasswordVisibilityLogin(): void {
    this.isPasswordVisibleLogin.update((val) => !val);
  }

  onSubmitLogin(): void {
    if (this.loginForm.invalid || this.isLoadingLogin()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoadingLogin.set(true);
    this.errorMessageLogin.set(null);

    const credentials: LoginCredentials = this.loginForm.getRawValue();

    this._authService
      .login(credentials)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.isLoadingLogin.set(false);
          const returnUrl =
            this._route.snapshot.queryParams['returnUrl'] || '/products';
          this._router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.isLoadingLogin.set(false);
          const message =
            err.error?.message ||
            'Error al iniciar sesión. Verifica tus credenciales.';
          this.errorMessageLogin.set(message);
        },
      });
  }
}
