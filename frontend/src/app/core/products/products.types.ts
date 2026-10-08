import { PaginationResponse } from '../common/pagination.types';

export enum ProductStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  status: ProductStatusEnum;
  createdAt: string;
  updatedAt: string;
}

export type ProductRow = Product & {
  recordNumber: number;
};

export type ProductResponse = PaginationResponse<Product>;
