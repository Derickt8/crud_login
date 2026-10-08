import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ProductsService } from '../../../../core/products/products.service';
import {
  Product,
  ProductStatusEnum,
} from '../../../../core/products/products.types';

@Component({
  selector: 'app-create-product-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './create-product-modal.component.html',
  styleUrl: './create-product-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProductModalComponent {
  private readonly _dialogRef = inject(
    MatDialogRef<CreateProductModalComponent>,
  );
  private readonly _productsService = inject(ProductsService);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _destroyRef = inject(DestroyRef);

  readonly isSubmittingProduct = signal<boolean>(false);
  readonly errorMessageProduct = signal<string | null>(null);

  readonly createProductForm: FormGroup = this._formBuilder.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    status: [ProductStatusEnum.ACTIVE, [Validators.required]],
  });

  closeModal(): void {
    this._dialogRef.close(false);
  }

  onSubmitProduct(): void {
    if (this.createProductForm.invalid || this.isSubmittingProduct()) {
      this.createProductForm.markAllAsTouched();
      return;
    }

    this.isSubmittingProduct.set(true);
    this.errorMessageProduct.set(null);

    const payload: Partial<Product> = this.createProductForm.getRawValue();

    this.createProduct$(payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (createdProduct) => {
          this.isSubmittingProduct.set(false);
          this._dialogRef.close(createdProduct);
        },
        error: (err) => {
          this.isSubmittingProduct.set(false);
          const message =
            err.error?.message ||
            'Error al crear el producto. Intenta nuevamente.';
          this.errorMessageProduct.set(message);
        },
      });
  }

  private createProduct$(payload: Partial<Product>): Observable<Product> {
    return this._productsService.create(payload);
  }
}
