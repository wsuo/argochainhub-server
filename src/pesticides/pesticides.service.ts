import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { StandardPesticide } from '../entities/standard-pesticide.entity';
import { PesticidePriceTrend } from '../entities/pesticide-price-trend.entity';
import { CreatePesticideDto } from './dto/create-pesticide.dto';
import { UpdatePesticideDto } from './dto/update-pesticide.dto';
import { QueryPesticidesDto } from './dto/query-pesticides.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class PesticidesService {
  constructor(
    @InjectRepository(StandardPesticide)
    private readonly pesticidesRepository: Repository<StandardPesticide>,
    @InjectRepository(PesticidePriceTrend)
    private readonly priceTrendsRepository: Repository<PesticidePriceTrend>,
  ) {}

  /**
   * 创建标准农药
   */
  async create(createPesticideDto: CreatePesticideDto): Promise<StandardPesticide> {
    const pesticide = this.pesticidesRepository.create(createPesticideDto);
    
    try {
      return await this.pesticidesRepository.save(pesticide);
    } catch (error) {
      throw new ConflictException('创建农药失败，可能存在重复数据');
    }
  }

  /**
   * 分页查询标准农药
   */
  async findAll(queryDto: QueryPesticidesDto): Promise<PaginatedResult<StandardPesticide & { latestPrice?: { unitPrice: number; weekEndDate: Date } | null }>> {
    const { page = 1, limit = 20, category, formulation, isVisible, search, hasPrice } = queryDto;
    
    const where: FindOptionsWhere<StandardPesticide> = {};
    
    // 添加筛选条件
    if (category) {
      where.category = category;
    }
    
    if (formulation) {
      where.formulation = formulation;
    }
    
    if (typeof isVisible === 'boolean') {
      where.isVisible = isVisible;
    }

    // 构建查询
    const queryBuilder = this.pesticidesRepository.createQueryBuilder('pesticide');
    
    // 添加基本筛选条件
    Object.keys(where).forEach(key => {
      queryBuilder.andWhere(`pesticide.${key} = :${key}`, { [key]: where[key] });
    });
    
    // 添加搜索条件（支持多语言搜索）
    if (search) {
      queryBuilder.andWhere(
        `(
          JSON_EXTRACT(pesticide.productName, '$."zh-CN"') LIKE :search OR 
          JSON_EXTRACT(pesticide.productName, '$.en') LIKE :search OR 
          JSON_EXTRACT(pesticide.productName, '$.es') LIKE :search
        )`,
        { search: `%${search}%` }
      );
    }
    
    // 添加价格筛选条件
    if (typeof hasPrice === 'boolean') {
      if (hasPrice) {
        // 只显示有价格的农药
        queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM pesticide_price_trends ppt 
            WHERE ppt.pesticideId = pesticide.id 
            AND ppt.deletedAt IS NULL
          )`
        );
      } else {
        // 只显示没有价格的农药
        queryBuilder.andWhere(
          `NOT EXISTS (
            SELECT 1 FROM pesticide_price_trends ppt 
            WHERE ppt.pesticideId = pesticide.id 
            AND ppt.deletedAt IS NULL
          )`
        );
      }
    }
    
    // 分页和排序
    const [data, total] = await queryBuilder
      .orderBy('pesticide.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // 优化：一次性查询所有农药的最新价格
    const pesticideIds = data.map(pesticide => pesticide.id);
    
    if (pesticideIds.length === 0) {
      return {
        data: [],
        meta: {
          totalItems: total,
          itemCount: 0,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      };
    }
    
    // 使用相关子查询获取每个农药的最新价格
    const latestPrices = await this.priceTrendsRepository
      .createQueryBuilder('price')
      .select([
        'price.pesticideId as pesticideId',
        'price.unitPrice as unitPrice', 
        'price.weekEndDate as weekEndDate'
      ])
      .where('price.pesticideId IN (:...pesticideIds)', { pesticideIds })
      .andWhere('price.deletedAt IS NULL')
      .andWhere(`price.weekEndDate = (
        SELECT MAX(p2.weekEndDate) 
        FROM pesticide_price_trends p2 
        WHERE p2.pesticideId = price.pesticideId 
        AND p2.deletedAt IS NULL
      )`)
      .getRawMany();
    
    // 创建价格映射表，便于快速查找
    const priceMap = new Map<number, { unitPrice: number; weekEndDate: Date }>();
    latestPrices.forEach(price => {
      const pesticideId = parseInt(price.pesticideId);
      priceMap.set(pesticideId, {
        unitPrice: parseFloat(price.unitPrice),
        weekEndDate: new Date(price.weekEndDate)
      });
    });

    // 为农药数据添加最新价格
    const pesticidesWithLatestPrice = data.map(pesticide => {
      const pesticideId = parseInt(pesticide.id.toString());
      const latestPrice = priceMap.get(pesticideId) || null;
      return {
        ...pesticide,
        latestPrice
      };
    });

    return {
      data: pesticidesWithLatestPrice,
      meta: {
        totalItems: total,
        itemCount: pesticidesWithLatestPrice.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * 根据ID查询标准农药
   */
  async findOne(id: number): Promise<StandardPesticide> {
    const pesticide = await this.pesticidesRepository.findOne({
      where: { id },
      relations: ['priceHistory']
    });

    if (!pesticide) {
      throw new NotFoundException(`标准农药 ID ${id} 不存在`);
    }

    return pesticide;
  }

  /**
   * 更新标准农药
   */
  async update(id: number, updatePesticideDto: UpdatePesticideDto): Promise<StandardPesticide> {
    const pesticide = await this.findOne(id);
    
    // 更新字段
    Object.assign(pesticide, updatePesticideDto);
    
    try {
      return await this.pesticidesRepository.save(pesticide);
    } catch (error) {
      throw new ConflictException('更新农药失败');
    }
  }

  /**
   * 删除标准农药（软删除）
   */
  async remove(id: number): Promise<void> {
    const pesticide = await this.findOne(id);
    await this.pesticidesRepository.softRemove(pesticide);
  }

  /**
   * 根据产品名称搜索农药（用于图片解析时匹配）
   */
  async findByProductName(productName: string): Promise<StandardPesticide | null> {
    const queryBuilder = this.pesticidesRepository.createQueryBuilder('pesticide');
    
    const pesticide = await queryBuilder
      .where(
        `(
          JSON_EXTRACT(pesticide.productName, '$."zh-CN"') = :productName OR 
          JSON_EXTRACT(pesticide.productName, '$.en') = :productName OR 
          JSON_EXTRACT(pesticide.productName, '$.es') = :productName
        )`,
        { productName }
      )
      .getOne();

    return pesticide;
  }

  /**
   * 批量查询农药（用于图片解析时批处理）
   */
  async findByProductNames(productNames: string[]): Promise<StandardPesticide[]> {
    if (productNames.length === 0) return [];
    
    const queryBuilder = this.pesticidesRepository.createQueryBuilder('pesticide');
    
    const whereConditions = productNames.map((_, index) => 
      `JSON_EXTRACT(pesticide.productName, '$."zh-CN"') = :productName${index} OR 
       JSON_EXTRACT(pesticide.productName, '$.en') = :productName${index} OR 
       JSON_EXTRACT(pesticide.productName, '$.es') = :productName${index}`
    ).join(' OR ');
    
    const parameters = {};
    productNames.forEach((name, index) => {
      parameters[`productName${index}`] = name;
    });
    
    return await queryBuilder
      .where(`(${whereConditions})`, parameters)
      .getMany();
  }
}