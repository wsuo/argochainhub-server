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
import { ProductsLookupDto } from './dto/products-lookup.dto';
import { MultiLangQueryUtil } from '../utils/multilang-query.util';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async searchProducts(
    searchDto: SearchProductsDto,
    user?: User,
  ): Promise<PaginatedResult<Product>> {
    const { search, category, supplierId, language, page = 1, limit = 20 } = searchDto;

    // 游客用户限制：只能访问前2页数据
    const isGuestUser = !user;
    const maxGuestPage = 2;
    const maxGuestLimit = 20;
    
    if (isGuestUser && page > maxGuestPage) {
      // 游客用户超过限制页数，返回空结果
      return {
        data: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: limit,
          totalPages: maxGuestPage,
          currentPage: page,
          isGuestAccess: true,
          message: '游客用户仅可查看前2页数据，请登录查看更多内容'
        },
      };
    }

    // 游客用户限制每页最大数量
    const actualLimit = isGuestUser ? Math.min(limit, maxGuestLimit) : limit;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.isListed = :isListed', { isListed: true })
      .andWhere('supplier.status = :supplierStatus', {
        supplierStatus: CompanyStatus.ACTIVE,
      });

    // 按供应商ID筛选
    if (supplierId) {
      queryBuilder.andWhere('product.supplierId = :supplierId', { supplierId });
    }

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

    // 对于游客用户，限制查询范围以提高性能
    let totalQuery = queryBuilder.clone();
    if (isGuestUser) {
      // 游客用户只查询前40条记录的总数（2页 * 20条/页）
      totalQuery = totalQuery.limit(maxGuestPage * maxGuestLimit);
    }

    const [products, total] = await Promise.all([
      queryBuilder
        .skip((page - 1) * actualLimit)
        .take(actualLimit)
        .orderBy('product.createdAt', 'DESC')
        .getMany(),
      isGuestUser 
        ? totalQuery.getCount().then(count => Math.min(count, maxGuestPage * maxGuestLimit))
        : queryBuilder.getCount()
    ]);

    // 计算总页数，游客用户最多显示2页
    const actualTotalPages = isGuestUser 
      ? Math.min(Math.ceil(total / actualLimit), maxGuestPage)
      : Math.ceil(total / actualLimit);

    return {
      data: products,
      meta: {
        totalItems: total,
        itemCount: products.length,
        itemsPerPage: actualLimit,
        totalPages: actualTotalPages,
        currentPage: page,
        isGuestAccess: isGuestUser,
        ...(isGuestUser && { message: '游客用户仅可查看前2页数据，请登录查看更多内容' })
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

  // 轻量级产品 lookup 接口，支持分页，仅返回 id、本地化名称和供应商ID
  async productsLookup(
    lookupDto: ProductsLookupDto,
  ): Promise<PaginatedResult<{ id: number; name: any; supplierId: number }>> {
    const { search, supplierId, page = 1, limit = 10 } = lookupDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .select(['product.id', 'product.name', 'product.supplierId', 'product.createdAt'])
      .leftJoin('product.supplier', 'supplier')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.isListed = :isListed', { isListed: true })
      .andWhere('supplier.status = :supplierStatus', {
        supplierStatus: CompanyStatus.ACTIVE,
      });

    // 按供应商ID筛选
    if (supplierId) {
      queryBuilder.andWhere('product.supplierId = :supplierId', { supplierId });
    }

    if (search) {
      queryBuilder.andWhere(
        `(JSON_UNQUOTE(JSON_EXTRACT(product.name, '$.\"zh-CN\"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.name, '$.\"en\"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.name, '$.\"es\"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$.\"zh-CN\"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$.\"en\"')) LIKE :search OR ` +
        `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$.\"es\"')) LIKE :search OR ` +
        `product.registrationNumber LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    // 获取总数和分页数据
    const [products, total] = await queryBuilder
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = products.map(product => ({
      id: product.id,
      name: product.name,
      supplierId: product.supplierId,
    }));

    const meta = {
      totalItems: total,
      itemCount: data.length,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };

    return { data, meta };
  }
}
