import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { RegisterPayload } from '../../../core/auth/auth.types';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _destroyRef = inject(DestroyRef);

  readonly isLoadingRegister = signal<boolean>(false);
  readonly errorMessageRegister = signal<string | null>(null);
  readonly isPasswordVisibleRegister = signal<boolean>(false);

  readonly registerForm: FormGroup = this._formBuilder.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordsMatchValidator },
  );

  private passwordsMatchValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibilityRegister(): void {
    this.isPasswordVisibleRegister.update((val) => !val);
  }

  onSubmitRegister(): void {
    if (this.registerForm.invalid || this.isLoadingRegister()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoadingRegister.set(true);
    this.errorMessageRegister.set(null);

    const formVal = this.registerForm.getRawValue();
    const payload: RegisterPayload = {
      name: formVal.name,
      email: formVal.email,
      password: formVal.password,
    };

    this._authService
      .register(payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.isLoadingRegister.set(false);
          this._router.navigate(['/products']);
        },
        error: (err) => {
          this.isLoadingRegister.set(false);
          const message =
            err.error?.message ||
            'Error al registrar la cuenta. Intenta nuevamente.';
          this.errorMessageRegister.set(message);
        },
      });
  }
}
