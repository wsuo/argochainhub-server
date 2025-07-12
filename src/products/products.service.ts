import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from '../entities/product.entity';
import { CompanyStatus } from '../entities/company.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { SearchProductsDto } from './dto/search-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async searchProducts(
    searchDto: SearchProductsDto,
  ): Promise<PaginatedResult<Product>> {
    const { search, category, page = 1, limit = 20 } = searchDto;
    
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('supplier.status = :supplierStatus', { supplierStatus: CompanyStatus.ACTIVE });

    if (search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.activeIngredient LIKE :search OR product.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    const [products, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: products,
      meta: {
        totalItems: total,
        itemCount: products.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getProductDetail(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: {
        id,
        status: ProductStatus.ACTIVE,
      },
      relations: ['supplier'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}