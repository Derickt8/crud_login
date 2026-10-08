import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { ProductStatusEnum } from './enums/product-status.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(filterDto: FilterProductDto) {
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.productRepository.createQueryBuilder('product');

    if (filterDto.search && filterDto.search.trim() !== '') {
      const term = `%${filterDto.search.trim()}%`;
      query.andWhere(
        '(product.code ILIKE :term OR product.name ILIKE :term OR product.description ILIKE :term)',
        { term },
      );
    }

    if (filterDto.status) {
      query.andWhere('product.status = :status', { status: filterDto.status });
    }

    query.orderBy('product.createdAt', 'DESC');
    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id: id as any },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const existing = await this.productRepository.findOne({
      where: { code: createProductDto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un producto con el código ${createProductDto.code}`,
      );
    }

    const newProduct = this.productRepository.create({
      ...createProductDto,
      status: createProductDto.status || ProductStatusEnum.ACTIVE,
    });

    return this.productRepository.save(newProduct);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (updateProductDto.code && updateProductDto.code !== product.code) {
      const existing = await this.productRepository.findOne({
        where: { code: updateProductDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Ya existe un producto con el código ${updateProductDto.code}`,
        );
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async changeStatus(id: string, status: ProductStatusEnum) {
    const product = await this.findOne(id);
    product.status = status;
    return this.productRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    return { message: 'Producto eliminado exitosamente', id };
  }
}
