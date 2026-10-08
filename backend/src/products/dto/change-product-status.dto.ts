import { IsEnum, IsNotEmpty } from 'class-validator';
import { ProductStatusEnum } from '../enums/product-status.enum';

export class ChangeProductStatusDto {
  @IsEnum(ProductStatusEnum)
  @IsNotEmpty()
  status: ProductStatusEnum;
}
