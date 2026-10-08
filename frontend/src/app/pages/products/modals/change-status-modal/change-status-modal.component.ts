import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { firstValueFrom, Observable, timeout } from 'rxjs';
import { ProductsService } from '../../../../core/products/products.service';
import {
  Product,
  ProductStatusEnum,
} from '../../../../core/products/products.types';

@Component({
  selector: 'app-change-status-modal',
  templateUrl: './change-status-modal.component.html',
  styleUrl: './change-status-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusModalComponent {
  private readonly _dialogRef = inject(
    MatDialogRef<ChangeStatusModalComponent>,
  );
  readonly data: { product: Product } = inject(MAT_DIALOG_DATA);
  private readonly _productsService = inject(ProductsService);

  readonly isSubmittingStatus = signal<boolean>(false);
  readonly errorMessageStatus = signal<string | null>(null);

  readonly isCurrentlyActive: boolean =
    this.data.product.status === ProductStatusEnum.ACTIVE;
  readonly targetStatus: ProductStatusEnum = this.isCurrentlyActive
    ? ProductStatusEnum.INACTIVE
    : ProductStatusEnum.ACTIVE;

  closeModal(): void {
    this._dialogRef.close(false);
  }

  async confirmStatusChange(): Promise<void> {
    if (this.isSubmittingStatus()) {
      return;
    }

    this.isSubmittingStatus.set(true);
    this.errorMessageStatus.set(null);

    try {
      const updatedProduct = await firstValueFrom(
        this.changeStatus$(this.data.product.id, this.targetStatus).pipe(
          timeout(15000),
        ),
      );
      this.isSubmittingStatus.set(false);
      this._dialogRef.close(updatedProduct);
    } catch (err: any) {
      this.isSubmittingStatus.set(false);
      const message =
        err?.error?.message ||
        'Error al cambiar el estado del producto. Intenta nuevamente.';
      this.errorMessageStatus.set(message);
    }
  }

  private changeStatus$(id: string, status: ProductStatusEnum): Observable<Product> {
    return this._productsService.changeStatus(id, status);
  }
}
