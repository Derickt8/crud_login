import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Observable } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ProductsService } from '../../../core/products/products.service';
import {
  Product,
  ProductResponse,
  ProductRow,
  ProductStatusEnum,
} from '../../../core/products/products.types';
import { CreateProductModalComponent } from '../modals/create-product-modal/create-product-modal.component';
import { EditProductModalComponent } from '../modals/edit-product-modal/edit-product-modal.component';
import { ChangeStatusModalComponent } from '../modals/change-status-modal/change-status-modal.component';

@Component({
  selector: 'app-products-list',
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe, DatePipe],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListComponent implements OnInit {
  private readonly _authService = inject(AuthService);
  private readonly _productsService = inject(ProductsService);
  private readonly _matDialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  readonly currentUser = this._authService.currentUser;

  readonly isLoadingProduct = signal<boolean>(false);
  readonly isDeletingProduct = signal<boolean>(false);
  readonly errorMessageProduct = signal<string | null>(null);

  readonly products = signal<Product[]>([]);
  readonly pageIndexProduct = signal<number>(1);
  readonly pageSizeProduct = signal<number>(10);
  readonly totalRecordsProduct = signal<number>(0);
  readonly totalPagesProduct = signal<number>(1);
  readonly searchQueryProduct = signal<string>('');
  readonly selectedStatusProduct = signal<ProductStatusEnum | null>(null);

  readonly searchControl = new FormControl('');

  readonly productsRows = computed<ProductRow[]>(() => {
    const list = this.products();
    const startIndex = (this.pageIndexProduct() - 1) * this.pageSizeProduct();
    return list.map((item, index) => ({
      ...item,
      recordNumber: startIndex + index + 1,
    }));
  });

  readonly activeProductsCount = computed<number>(() => {
    return this.products().filter(
      (p) => p.status === ProductStatusEnum.ACTIVE,
    ).length;
  });

  readonly totalInventoryValue = computed<number>(() => {
    return this.products().reduce(
      (acc, p) => acc + Number(p.price) * p.stock,
      0,
    );
  });

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadInitialData();
  }

  private setupSearchSubscription(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((term) => {
        this.searchQueryProduct.set(term || '');
        this.pageIndexProduct.set(1);
        this.reloadProducts();
      });
  }

  loadInitialData(): void {
    this.pageIndexProduct.set(1);
    this.reloadProducts();
  }

  reloadProducts(): void {
    this.isLoadingProduct.set(true);
    this.errorMessageProduct.set(null);

    this.loadProducts$(
      this.pageIndexProduct(),
      this.pageSizeProduct(),
      this.searchQueryProduct(),
      this.selectedStatusProduct() || undefined,
    )
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (response) => {
          this.products.set(response.items);
          this.totalRecordsProduct.set(response.total);
          this.totalPagesProduct.set(response.totalPages);
          this.isLoadingProduct.set(false);
        },
        error: (err) => {
          this.isLoadingProduct.set(false);
          const message =
            err.error?.message || 'Error al cargar el catálogo de productos.';
          this.errorMessageProduct.set(message);
        },
      });
  }

  onFilterStatus(status: ProductStatusEnum | null): void {
    this.selectedStatusProduct.set(status);
    this.pageIndexProduct.set(1);
    this.reloadProducts();
  }

  onFilterStatusAll(): void {
    this.onFilterStatus(null);
  }

  onFilterStatusActive(): void {
    this.onFilterStatus(ProductStatusEnum.ACTIVE);
  }

  onFilterStatusInactive(): void {
    this.onFilterStatus(ProductStatusEnum.INACTIVE);
  }

  onPageChange(newPageIndex: number): void {
    if (newPageIndex < 1 || newPageIndex > this.totalPagesProduct()) {
      return;
    }
    this.pageIndexProduct.set(newPageIndex);
    this.reloadProducts();
  }

  openCreateProductModal(): void {
    const dialogRef = this._matDialog.open(CreateProductModalComponent, {
      width: '650px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: false,
      restoreFocus: true,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result) {
          this.reloadProducts();
        }
      });
  }

  openEditProductModal(product: Product): void {
    const dialogRef = this._matDialog.open(EditProductModalComponent, {
      width: '650px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: false,
      restoreFocus: true,
      data: { product },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result) {
          this.reloadProducts();
        }
      });
  }

  openChangeStatusModal(product: Product): void {
    const dialogRef = this._matDialog.open(ChangeStatusModalComponent, {
      width: '450px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: false,
      restoreFocus: true,
      data: { product },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result) {
          this.reloadProducts();
        }
      });
  }

  deleteProduct(product: Product): void {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente el producto "${product.name}" (${product.code})?`,
    );

    if (!confirmDelete) {
      return;
    }

    this.isDeletingProduct.set(true);

    this.deleteProduct$(product.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.isDeletingProduct.set(false);
          this.reloadProducts();
        },
        error: (err) => {
          this.isDeletingProduct.set(false);
          const message =
            err.error?.message || 'Error al eliminar el producto.';
          this.errorMessageProduct.set(message);
        },
      });
  }

  logout(): void {
    this._authService.logout();
  }

  private loadProducts$(page: number, limit: number, search?: string, status?: ProductStatusEnum): Observable<ProductResponse> {
    return this._productsService.findAll(page, limit, search, status);
  }

  private deleteProduct$(id: string): Observable<{ message: string; id: string }> {
    return this._productsService.delete(id);
  }
}
