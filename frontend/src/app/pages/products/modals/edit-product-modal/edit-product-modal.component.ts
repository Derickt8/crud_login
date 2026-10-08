import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ProductsService } from '../../../../core/products/products.service';
import {
  Product,
  ProductStatusEnum,
} from '../../../../core/products/products.types';

@Component({
  selector: 'app-edit-product-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-product-modal.component.html',
  styleUrl: './edit-product-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProductModalComponent implements OnInit {
  private readonly _dialogRef = inject(
    MatDialogRef<EditProductModalComponent>,
  );
  readonly data: { product: Product } = inject(MAT_DIALOG_DATA);
  private readonly _productsService = inject(ProductsService);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _destroyRef = inject(DestroyRef);

  readonly isSubmittingProduct = signal<boolean>(false);
  readonly errorMessageProduct = signal<string | null>(null);

  readonly editProductForm: FormGroup = this._formBuilder.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    status: [ProductStatusEnum.ACTIVE, [Validators.required]],
  });

  ngOnInit(): void {
    if (this.data?.product) {
      this.editProductForm.patchValue({
        code: this.data.product.code,
        name: this.data.product.name,
        description: this.data.product.description || '',
        price: Number(this.data.product.price),
        stock: this.data.product.stock,
        status: this.data.product.status,
      });
    }
  }

  closeModal(): void {
    this._dialogRef.close(false);
  }

  onSubmitProduct(): void {
    if (this.editProductForm.invalid || this.isSubmittingProduct()) {
      this.editProductForm.markAllAsTouched();
      return;
    }

    this.isSubmittingProduct.set(true);
    this.errorMessageProduct.set(null);

    const payload: Partial<Product> = this.editProductForm.getRawValue();

    this.updateProduct$(this.data.product.id, payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (updatedProduct) => {
          this.isSubmittingProduct.set(false);
          this._dialogRef.close(updatedProduct);
        },
        error: (err) => {
          this.isSubmittingProduct.set(false);
          const message =
            err.error?.message ||
            'Error al actualizar el producto. Intenta nuevamente.';
          this.errorMessageProduct.set(message);
        },
      });
  }

  private updateProduct$(id: string, payload: Partial<Product>): Observable<Product> {
    return this._productsService.update(id, payload);
  }
}
