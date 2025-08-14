import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierFavorite, User, Company, CompanyType, CompanyStatus } from '../entities';
import { AddSupplierFavoriteDto, UpdateSupplierFavoriteDto } from './dto/supplier-favorite.dto';
import { GetSupplierFavoritesDto } from './dto/get-supplier-favorites.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class SupplierFavoritesService {
  constructor(
    @InjectRepository(SupplierFavorite)
    private readonly supplierFavoriteRepository: Repository<SupplierFavorite>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  /**
   * 添加供应商收藏
   */
  async addFavorite(user: User, dto: AddSupplierFavoriteDto): Promise<SupplierFavorite> {
    // 验证供应商存在且状态正常
    const supplier = await this.companyRepository.findOne({
      where: { 
        id: dto.supplierId, 
        type: CompanyType.SUPPLIER,
        status: CompanyStatus.ACTIVE 
      },
    });

    if (!supplier) {
      throw new NotFoundException('供应商不存在或状态异常');
    }

    // 检查是否已经收藏
    const existingFavorite = await this.supplierFavoriteRepository.findOne({
      where: { userId: user.id, supplierId: dto.supplierId },
    });

    if (existingFavorite) {
      throw new ConflictException('您已经收藏过该供应商');
    }

    // 创建收藏记录
    const favorite = this.supplierFavoriteRepository.create({
      userId: user.id,
      supplierId: dto.supplierId,
      note: dto.note,
    });

    return await this.supplierFavoriteRepository.save(favorite);
  }

  /**
   * 取消供应商收藏
   */
  async removeFavorite(user: User, supplierId: number): Promise<void> {
    const favorite = await this.supplierFavoriteRepository.findOne({
      where: { userId: user.id, supplierId },
    });

    if (!favorite) {
      throw new NotFoundException('收藏记录不存在');
    }

    await this.supplierFavoriteRepository.remove(favorite);
  }

  /**
   * 更新收藏备注
   */
  async updateFavorite(user: User, supplierId: number, dto: UpdateSupplierFavoriteDto): Promise<SupplierFavorite> {
    const favorite = await this.supplierFavoriteRepository.findOne({
      where: { userId: user.id, supplierId },
    });

    if (!favorite) {
      throw new NotFoundException('收藏记录不存在');
    }

    favorite.note = dto.note;
    return await this.supplierFavoriteRepository.save(favorite);
  }

  /**
   * 获取用户收藏的供应商列表
   */
  async getFavorites(user: User, dto: GetSupplierFavoritesDto): Promise<PaginatedResult<SupplierFavorite>> {
    const { search, page = 1, limit = 20 } = dto;

    const queryBuilder = this.supplierFavoriteRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.supplier', 'supplier')
      .where('favorite.userId = :userId', { userId: user.id })
      .andWhere('supplier.status = :status', { status: CompanyStatus.ACTIVE });

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        'supplier.name LIKE :search',
        { search: `%${search}%` }
      );
    }

    // 排序和分页
    queryBuilder
      .orderBy('favorite.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, totalItems] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * 检查是否已收藏某个供应商
   */
  async isFavorited(user: User, supplierId: number): Promise<boolean> {
    const favorite = await this.supplierFavoriteRepository.findOne({
      where: { userId: user.id, supplierId },
    });

    return !!favorite;
  }

  /**
   * 批量检查多个供应商的收藏状态
   */
  async getFavoriteStatus(user: User, supplierIds: number[]): Promise<{ [supplierId: number]: boolean }> {
    if (supplierIds.length === 0) {
      return {};
    }

    const favorites = await this.supplierFavoriteRepository.find({
      where: { 
        userId: user.id,
        supplierId: supplierIds.length === 1 ? supplierIds[0] : undefined
      },
      select: ['supplierId'],
    });

    // 如果有多个ID，需要使用IN查询
    if (supplierIds.length > 1) {
      const favoritesMultiple = await this.supplierFavoriteRepository
        .createQueryBuilder('favorite')
        .select(['favorite.supplierId'])
        .where('favorite.userId = :userId', { userId: user.id })
        .andWhere('favorite.supplierId IN (:...supplierIds)', { supplierIds })
        .getMany();
      
      const favoriteSupplierIds = new Set(favoritesMultiple.map(f => f.supplierId));
      
      return supplierIds.reduce((result, id) => {
        result[id] = favoriteSupplierIds.has(id);
        return result;
      }, {} as { [key: number]: boolean });
    }

    const favoriteSupplierIds = new Set(favorites.map(f => f.supplierId));
    
    return supplierIds.reduce((result, id) => {
      result[id] = favoriteSupplierIds.has(id);
      return result;
    }, {} as { [key: number]: boolean });
  }
}