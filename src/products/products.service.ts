import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Product, ProductStatus } from '../entities/product.entity';
import { CompanyStatus, CompanyType } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { MyProductsDto } from './dto/my-products.dto';
import { MultiLangQueryUtil } from '../utils/multilang-query.util';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async searchProducts(
    searchDto: SearchProductsDto,
  ): Promise<PaginatedResult<Product>> {
    const { search, category, language, page = 1, limit = 20 } = searchDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.isListed = :isListed', { isListed: true })
      .andWhere('supplier.status = :supplierStatus', {
        supplierStatus: CompanyStatus.ACTIVE,
      });

    if (search) {
      // 直接使用JSON_EXTRACT进行多语言搜索，参考企业搜索的实现
      queryBuilder.andWhere(
        `(JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."zh-CN"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."en"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."es"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$."zh-CN"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$."en"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$."es"')) LIKE :search OR ` +
        `product.registrationNumber LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.details, '$.description')) LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(product.details, '$.productCategory')) LIKE :category`,
        { category: `%${category}%` }
      );
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
        isListed: true,
      },
      relations: ['supplier'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 确保供应商也是激活状态
    if (product.supplier && product.supplier.status !== CompanyStatus.ACTIVE) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // 供应商产品管理功能
  async createProduct(
    user: User,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    // 验证企业类型
    if (!user.company || user.company.type !== CompanyType.SUPPLIER) {
      throw new ForbiddenException('Only suppliers can create products');
    }

    const product = this.productRepository.create({
      ...createProductDto,
      supplierId: user.companyId,
      status: ProductStatus.DRAFT,
    });

    return this.productRepository.save(product);
  }

  async getMyProducts(
    user: User,
    myProductsDto: MyProductsDto,
  ): Promise<PaginatedResult<Product>> {
    // 验证企业类型
    if (!user.company || user.company.type !== CompanyType.SUPPLIER) {
      throw new ForbiddenException('Only suppliers can access this endpoint');
    }

    const { search, status, page = 1, limit = 20 } = myProductsDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.supplierId = :supplierId', {
        supplierId: user.companyId,
      });

    if (search) {
      // 直接使用JSON_EXTRACT进行多语言搜索，参考企业搜索的实现
      queryBuilder.andWhere(
        `(JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."zh-CN"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."en"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."es"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$."zh-CN"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$."en"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$."es"')) LIKE :search OR ` +
        `product.registrationNumber LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.details, '$.description')) LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
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

  async getMyProductDetail(user: User, id: number): Promise<Product> {
    // 验证企业类型
    if (!user.company || user.company.type !== CompanyType.SUPPLIER) {
      throw new ForbiddenException('Only suppliers can access this endpoint');
    }

    const product = await this.productRepository.findOne({
      where: {
        id,
        supplierId: user.companyId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateMyProduct(
    user: User,
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.getMyProductDetail(user, id);

    // 只有草稿和被拒绝的产品可以编辑
    if (
      product.status !== ProductStatus.DRAFT &&
      product.status !== ProductStatus.REJECTED
    ) {
      throw new ForbiddenException('Cannot edit product in current status');
    }

    Object.assign(product, updateProductDto);

    // 更新后重置为草稿状态
    if (product.status === ProductStatus.REJECTED) {
      product.status = ProductStatus.DRAFT;
      product.rejectionReason = undefined;
    }

    return this.productRepository.save(product);
  }

  async deleteMyProduct(user: User, id: number): Promise<void> {
    const product = await this.getMyProductDetail(user, id);

    // 只有草稿和被拒绝的产品可以删除
    if (
      product.status !== ProductStatus.DRAFT &&
      product.status !== ProductStatus.REJECTED
    ) {
      throw new ForbiddenException('Cannot delete product in current status');
    }

    await this.productRepository.softDelete(id);
  }

  async submitForReview(user: User, id: number): Promise<Product> {
    const product = await this.getMyProductDetail(user, id);

    // 只有草稿状态的产品可以提交审核
    if (product.status !== ProductStatus.DRAFT) {
      throw new ForbiddenException(
        'Only draft products can be submitted for review',
      );
    }

    product.status = ProductStatus.PENDING_REVIEW;
    product.rejectionReason = undefined;

    return this.productRepository.save(product);
  }
}
