import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Product, ProductStatus } from '../../entities/product.entity';
import { ControlMethod } from '../../entities/control-method.entity';
import { Company } from '../../entities/company.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { 
  AdminCreateProductDto, 
  AdminUpdateProductDto, 
  ProductDetailsDto 
} from '../dto/product-management.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import {
  CreateControlMethodDto,
  UpdateControlMethodDto,
  BatchCreateControlMethodDto
} from '../dto/control-method.dto';
import { ReviewProductDto } from '../dto/review-product.dto';
import { 
  BatchReviewProductsDto, 
  BatchReviewResultDto,
  ProductReviewItemDto 
} from '../dto/batch-review-products.dto';

@Injectable()
export class AdminProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ControlMethod)
    private controlMethodRepository: Repository<ControlMethod>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  // ==================== 产品管理 ====================

  /**
   * 创建产品（管理员）
   */
  async createProduct(createDto: AdminCreateProductDto): Promise<Product> {
    // 验证供应商是否存在
    const supplier = await this.companyRepository.findOne({
      where: { id: createDto.supplierId }
    });

    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    // 创建产品实体
    const product = this.productRepository.create({
      ...createDto,
      details: createDto.details || {},
      status: createDto.status || ProductStatus.PENDING_REVIEW,
      isListed: createDto.isListed || false,
    });

    return this.productRepository.save(product);
  }

  /**
   * 更新产品（管理员）
   */
  async updateProduct(id: number, updateDto: AdminUpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['supplier']
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 如果更新供应商，验证供应商是否存在
    if (updateDto.supplierId && updateDto.supplierId !== product.supplierId) {
      const supplier = await this.companyRepository.findOne({
        where: { id: updateDto.supplierId }
      });
      if (!supplier) {
        throw new NotFoundException('供应商不存在');
      }
    }

    // 合并更新数据
    Object.assign(product, updateDto);

    // 如果有details更新，合并现有details
    if (updateDto.details) {
      product.details = {
        ...product.details,
        ...updateDto.details
      };
    }

    return this.productRepository.save(product);
  }

  /**
   * 删除产品（管理员）
   */
  async deleteProduct(id: number): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id }
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    await this.productRepository.softDelete(id);
  }

  /**
   * 获取产品详情
   */
  async getProductById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['supplier', 'controlMethods']
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    return product;
  }

  /**
   * 获取产品列表（管理员查询）
   */
  async getProducts(queryDto: ProductQueryDto): Promise<PaginatedResult<Product>> {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      supplierId,
      supplierName,
      formulation,
      toxicity,
      activeIngredient,
      registrationNumber,
      registrationHolder,
      productCategory,
      country,
      exportRestrictedCountries,
      minOrderQuantityMin,
      minOrderQuantityMax,
      isListed,
      effectiveDateStart,
      effectiveDateEnd,
      firstApprovalDateStart,
      firstApprovalDateEnd,
      createdStartDate,
      createdEndDate,
      updatedStartDate,
      updatedEndDate,
      hasControlMethods,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = queryDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .leftJoinAndSelect('product.controlMethods', 'controlMethods');

    // 状态筛选
    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    }

    // 供应商筛选
    if (supplierId) {
      queryBuilder.andWhere('product.supplierId = :supplierId', { supplierId });
    }

    if (supplierName) {
      queryBuilder.andWhere('supplier.name LIKE :supplierName', { 
        supplierName: `%${supplierName}%` 
      });
    }

    // 产品属性筛选
    if (formulation) {
      queryBuilder.andWhere('product.formulation = :formulation', { formulation });
    }

    if (toxicity) {
      queryBuilder.andWhere('product.toxicity = :toxicity', { toxicity });
    }

    // 有效成分搜索
    if (activeIngredient) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          const searchConditions: string[] = [];
          const params = { activeIngredient: `%${activeIngredient}%` };
          
          // 搜索三个有效成分字段
          for (let i = 1; i <= 3; i++) {
            searchConditions.push(
              `JSON_UNQUOTE(JSON_EXTRACT(product.activeIngredient${i}, '$.name."zh-CN"')) LIKE :activeIngredient`,
              `JSON_UNQUOTE(JSON_EXTRACT(product.activeIngredient${i}, '$.name."en"')) LIKE :activeIngredient`
            );
          }
          
          qb.where(searchConditions.join(' OR '), params);
        })
      );
    }

    // 登记证信息筛选
    if (registrationNumber) {
      queryBuilder.andWhere('product.registrationNumber LIKE :registrationNumber', { 
        registrationNumber: `%${registrationNumber}%` 
      });
    }

    if (registrationHolder) {
      queryBuilder.andWhere('product.registrationHolder LIKE :registrationHolder', { 
        registrationHolder: `%${registrationHolder}%` 
      });
    }

    // 产品详情筛选
    if (productCategory) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(product.details, '$.productCategory')) = :productCategory`,
        { productCategory }
      );
    }

    if (country) {
      queryBuilder.andWhere('supplier.country = :country', { country });
    }

    if (exportRestrictedCountries && exportRestrictedCountries.length > 0) {
      queryBuilder.andWhere(
        `JSON_OVERLAPS(JSON_EXTRACT(product.details, '$.exportRestrictedCountries'), :exportRestrictedCountries)`,
        { exportRestrictedCountries: JSON.stringify(exportRestrictedCountries) }
      );
    }

    // 订购量筛选
    if (minOrderQuantityMin !== undefined) {
      queryBuilder.andWhere('product.minOrderQuantity >= :minOrderQuantityMin', { 
        minOrderQuantityMin 
      });
    }

    if (minOrderQuantityMax !== undefined) {
      queryBuilder.andWhere('product.minOrderQuantity <= :minOrderQuantityMax', { 
        minOrderQuantityMax 
      });
    }

    // 上架状态筛选
    if (isListed !== undefined) {
      queryBuilder.andWhere('product.isListed = :isListed', { isListed });
    }

    // 日期筛选
    if (effectiveDateStart) {
      queryBuilder.andWhere('product.effectiveDate >= :effectiveDateStart', { 
        effectiveDateStart 
      });
    }

    if (effectiveDateEnd) {
      queryBuilder.andWhere('product.effectiveDate <= :effectiveDateEnd', { 
        effectiveDateEnd 
      });
    }

    if (firstApprovalDateStart) {
      queryBuilder.andWhere('product.firstApprovalDate >= :firstApprovalDateStart', { 
        firstApprovalDateStart 
      });
    }

    if (firstApprovalDateEnd) {
      queryBuilder.andWhere('product.firstApprovalDate <= :firstApprovalDateEnd', { 
        firstApprovalDateEnd 
      });
    }

    if (createdStartDate) {
      queryBuilder.andWhere('DATE(product.createdAt) >= :createdStartDate', { 
        createdStartDate 
      });
    }

    if (createdEndDate) {
      queryBuilder.andWhere('DATE(product.createdAt) <= :createdEndDate', { 
        createdEndDate 
      });
    }

    if (updatedStartDate) {
      queryBuilder.andWhere('DATE(product.updatedAt) >= :updatedStartDate', { 
        updatedStartDate 
      });
    }

    if (updatedEndDate) {
      queryBuilder.andWhere('DATE(product.updatedAt) <= :updatedEndDate', { 
        updatedEndDate 
      });
    }

    // 防治方法筛选
    if (hasControlMethods !== undefined) {
      if (hasControlMethods) {
        queryBuilder.andWhere('controlMethods.id IS NOT NULL');
      } else {
        queryBuilder.andWhere('controlMethods.id IS NULL');
      }
    }

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where(
            `JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."zh-CN"')) LIKE :search`,
            { search: `%${search}%` }
          )
          .orWhere(
            `JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."en"')) LIKE :search`,
            { search: `%${search}%` }
          )
          .orWhere(
            `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$."zh-CN"')) LIKE :search`,
            { search: `%${search}%` }
          )
          .orWhere(
            `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$."en"')) LIKE :search`,
            { search: `%${search}%` }
          )
          .orWhere('product.registrationNumber LIKE :search', { search: `%${search}%` })
          .orWhere('supplier.name LIKE :search', { search: `%${search}%` });
        })
      );
    }

    // 排序
    const orderByMapping: Record<string, string> = {
      createdAt: 'product.createdAt',
      updatedAt: 'product.updatedAt',
      name: 'JSON_UNQUOTE(JSON_EXTRACT(product.name, "$.\"zh-CN\""))',
      pesticideName: 'JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, "$.\"zh-CN\""))',
      effectiveDate: 'product.effectiveDate',
      firstApprovalDate: 'product.firstApprovalDate',
      minOrderQuantity: 'product.minOrderQuantity'
    };

    const orderByField = orderByMapping[sortBy] || 'product.createdAt';
    queryBuilder.orderBy(orderByField, sortOrder as 'ASC' | 'DESC');

    // 分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      data: items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * 审核产品
   */
  async reviewProduct(
    productId: number,
    reviewDto: ReviewProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    if (product.status !== ProductStatus.PENDING_REVIEW) {
      throw new BadRequestException('产品不在待审核状态');
    }

    const { approved, reason } = reviewDto;

    product.status = approved ? ProductStatus.ACTIVE : ProductStatus.REJECTED;
    if (!approved && reason) {
      product.rejectionReason = reason;
    }

    return this.productRepository.save(product);
  }

  /**
   * 批量审核产品
   */
  async batchReviewProducts(batchDto: BatchReviewProductsDto): Promise<BatchReviewResultDto> {
    const { products } = batchDto;
    const result: BatchReviewResultDto = {
      total: products.length,
      success: 0,
      failed: 0,
      successIds: [],
      failures: []
    };

    // 逐一处理每个产品的审核，使用和单个审核相同的逻辑
    for (const reviewItem of products) {
      try {
        // 直接调用单个审核方法
        await this.reviewProduct(reviewItem.productId, {
          approved: reviewItem.approved,
          reason: reviewItem.reason
        });
        
        result.successIds.push(reviewItem.productId);
        result.success++;
      } catch (error) {
        result.failures.push({
          productId: reviewItem.productId,
          error: error.message || '处理失败'
        });
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 产品上架
   */
  async listProduct(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id }
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('只有审核通过的产品可以上架');
    }

    if (!product.canBeListed()) {
      throw new BadRequestException('产品不满足上架条件（请检查登记证和有效期）');
    }

    product.isListed = true;
    return this.productRepository.save(product);
  }

  /**
   * 产品下架
   */
  async unlistProduct(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id }
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    product.isListed = false;
    return this.productRepository.save(product);
  }

  // ==================== 防治方法管理 ====================

  /**
   * 创建防治方法
   */
  async createControlMethod(createDto: CreateControlMethodDto): Promise<ControlMethod> {
    // 验证产品是否存在
    const product = await this.productRepository.findOne({
      where: { id: createDto.productId }
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    const controlMethod = this.controlMethodRepository.create({
      ...createDto,
      sortOrder: createDto.sortOrder || 0,
      isActive: createDto.isActive !== false,
    });

    return this.controlMethodRepository.save(controlMethod);
  }

  /**
   * 批量创建防治方法
   */
  async batchCreateControlMethods(batchDto: BatchCreateControlMethodDto): Promise<ControlMethod[]> {
    // 验证产品是否存在
    const product = await this.productRepository.findOne({
      where: { id: batchDto.productId }
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    const controlMethods = batchDto.controlMethods.map((dto, index) => 
      this.controlMethodRepository.create({
        ...dto,
        productId: batchDto.productId,
        sortOrder: dto.sortOrder || index,
        isActive: dto.isActive !== false,
      })
    );

    return this.controlMethodRepository.save(controlMethods);
  }

  /**
   * 更新防治方法
   */
  async updateControlMethod(
    id: number, 
    updateDto: UpdateControlMethodDto
  ): Promise<ControlMethod> {
    const controlMethod = await this.controlMethodRepository.findOne({
      where: { id }
    });

    if (!controlMethod) {
      throw new NotFoundException('防治方法不存在');
    }

    Object.assign(controlMethod, updateDto);
    return this.controlMethodRepository.save(controlMethod);
  }

  /**
   * 删除防治方法
   */
  async deleteControlMethod(id: number): Promise<void> {
    const controlMethod = await this.controlMethodRepository.findOne({
      where: { id }
    });

    if (!controlMethod) {
      throw new NotFoundException('防治方法不存在');
    }

    await this.controlMethodRepository.remove(controlMethod);
  }

  /**
   * 获取产品的所有防治方法
   */
  async getProductControlMethods(productId: number): Promise<ControlMethod[]> {
    return this.controlMethodRepository.find({
      where: { productId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' }
    });
  }

  /**
   * 更新防治方法排序
   */
  async updateControlMethodsOrder(
    productId: number,
    orderMap: Record<number, number>
  ): Promise<ControlMethod[]> {
    const controlMethods = await this.controlMethodRepository.find({
      where: { 
        productId,
        id: In(Object.keys(orderMap).map(Number))
      }
    });

    if (controlMethods.length !== Object.keys(orderMap).length) {
      throw new BadRequestException('部分防治方法不存在');
    }

    // 更新排序
    const updates = controlMethods.map(cm => {
      cm.sortOrder = orderMap[cm.id];
      return cm;
    });

    return this.controlMethodRepository.save(updates);
  }
}