import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { PesticidePriceTrend } from '../entities/pesticide-price-trend.entity';
import { StandardPesticide } from '../entities/standard-pesticide.entity';
import { CreatePriceTrendDto } from './dto/create-price-trend.dto';
import { UpdatePriceTrendDto } from './dto/update-price-trend.dto';
import { QueryPriceTrendsDto } from './dto/query-price-trends.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class PriceTrendsService {
  constructor(
    @InjectRepository(PesticidePriceTrend)
    private readonly priceTrendsRepository: Repository<PesticidePriceTrend>,
    @InjectRepository(StandardPesticide)
    private readonly pesticidesRepository: Repository<StandardPesticide>,
  ) {}

  /**
   * 创建价格走势记录
   */
  async create(createPriceTrendDto: CreatePriceTrendDto): Promise<PesticidePriceTrend> {
    // 验证农药是否存在
    const pesticide = await this.pesticidesRepository.findOne({
      where: { id: createPriceTrendDto.pesticideId }
    });
    
    if (!pesticide) {
      throw new NotFoundException(`标准农药 ID ${createPriceTrendDto.pesticideId} 不存在`);
    }

    const priceTrend = this.priceTrendsRepository.create(createPriceTrendDto);
    
    try {
      return await this.priceTrendsRepository.save(priceTrend);
    } catch (error) {
      // 检查是否为唯一约束冲突
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(`该农药在日期 ${createPriceTrendDto.weekEndDate} 的价格记录已存在`);
      }
      throw new ConflictException('创建价格走势记录失败');
    }
  }

  /**
   * 批量创建价格走势记录（优化版本 - 支持图片解析批量保存）
   */
  async batchCreate(createPriceTrendDtos: CreatePriceTrendDto[]): Promise<PesticidePriceTrend[]> {
    if (!createPriceTrendDtos || createPriceTrendDtos.length === 0) {
      return [];
    }

    // 批量验证农药ID是否存在
    const pesticideIds = [...new Set(createPriceTrendDtos.map(dto => dto.pesticideId))];
    const existingPesticides = await this.pesticidesRepository.find({
      where: pesticideIds.map(id => ({ id })),
      select: ['id']
    });
    
    const existingIds = new Set(existingPesticides.map(p => p.id));
    const missingIds = pesticideIds.filter(id => !existingIds.has(id));
    
    if (missingIds.length > 0) {
      throw new NotFoundException(`以下农药ID不存在: ${missingIds.join(', ')}`);
    }

    // 创建实体数组
    const priceTrends = createPriceTrendDtos.map(dto => 
      this.priceTrendsRepository.create(dto)
    );
    
    try {
      // 使用TypeORM的批量插入，更高效
      const result = await this.priceTrendsRepository
        .createQueryBuilder()
        .insert()
        .into(PesticidePriceTrend)
        .values(priceTrends)
        .orIgnore() // 忽略重复数据而不是报错
        .execute();
      
      // 返回保存成功的记录（需要重新查询获取生成的ID）
      if (result.identifiers && result.identifiers.length > 0) {
        const savedIds = result.identifiers.map(item => item.id);
        return await this.priceTrendsRepository.find({
          where: savedIds.map(id => ({ id }))
        });
      }
      
      return [];
    } catch (error) {
      throw new ConflictException(`批量创建价格走势记录失败: ${error.message}`);
    }
  }

  /**
   * 分页查询价格走势
   */
  async findAll(queryDto: QueryPriceTrendsDto): Promise<PaginatedResult<PesticidePriceTrend>> {
    const { 
      page = 1, 
      limit = 20, 
      pesticideId, 
      startDate, 
      endDate, 
      sortBy = 'weekEndDate',
      sortOrder = 'DESC'
    } = queryDto;
    
    const where: FindOptionsWhere<PesticidePriceTrend> = {};
    
    // 添加农药ID筛选
    if (pesticideId) {
      where.pesticideId = pesticideId;
    }
    
    // 构建查询
    const queryBuilder = this.priceTrendsRepository.createQueryBuilder('priceTrend')
      .leftJoinAndSelect('priceTrend.pesticide', 'pesticide');
    
    // 添加基本筛选条件
    Object.keys(where).forEach(key => {
      queryBuilder.andWhere(`priceTrend.${key} = :${key}`, { [key]: where[key] });
    });
    
    // 添加日期范围筛选
    if (startDate && endDate) {
      queryBuilder.andWhere('priceTrend.weekEndDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    } else if (startDate) {
      queryBuilder.andWhere('priceTrend.weekEndDate >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('priceTrend.weekEndDate <= :endDate', { endDate });
    }
    
    // 排序
    const validSortFields = ['weekEndDate', 'unitPrice', 'exchangeRate', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'weekEndDate';
    queryBuilder.orderBy(`priceTrend.${sortField}`, sortOrder);
    
    // 分页
    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * 根据ID查询价格走势记录
   */
  async findOne(id: number): Promise<PesticidePriceTrend> {
    const priceTrend = await this.priceTrendsRepository.findOne({
      where: { id },
      relations: ['pesticide']
    });

    if (!priceTrend) {
      throw new NotFoundException(`价格走势记录 ID ${id} 不存在`);
    }

    return priceTrend;
  }

  /**
   * 更新价格走势记录
   */
  async update(id: number, updatePriceTrendDto: UpdatePriceTrendDto): Promise<PesticidePriceTrend> {
    const priceTrend = await this.findOne(id);
    
    // 更新字段
    Object.assign(priceTrend, updatePriceTrendDto);
    
    try {
      return await this.priceTrendsRepository.save(priceTrend);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(`该农药在日期 ${updatePriceTrendDto.weekEndDate} 的价格记录已存在`);
      }
      throw new ConflictException('更新价格走势记录失败');
    }
  }

  /**
   * 删除价格走势记录（软删除）
   */
  async remove(id: number): Promise<void> {
    const priceTrend = await this.findOne(id);
    await this.priceTrendsRepository.softRemove(priceTrend);
  }

  /**
   * 获取农药的价格走势图表数据
   */
  async getPriceChart(
    pesticideId: number, 
    startDate?: string, 
    endDate?: string
  ): Promise<{
    pesticide: StandardPesticide;
    priceData: Array<{
      date: string;
      cnyPrice: number;
      usdPrice: number;
      exchangeRate: number;
    }>;
  }> {
    const pesticide = await this.pesticidesRepository.findOne({
      where: { id: pesticideId }
    });
    
    if (!pesticide) {
      throw new NotFoundException(`标准农药 ID ${pesticideId} 不存在`);
    }

    const queryBuilder = this.priceTrendsRepository.createQueryBuilder('priceTrend')
      .where('priceTrend.pesticideId = :pesticideId', { pesticideId });

    // 添加日期筛选
    if (startDate && endDate) {
      queryBuilder.andWhere('priceTrend.weekEndDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    } else if (startDate) {
      queryBuilder.andWhere('priceTrend.weekEndDate >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('priceTrend.weekEndDate <= :endDate', { endDate });
    }

    const priceRecords = await queryBuilder
      .orderBy('priceTrend.weekEndDate', 'ASC')
      .getMany();

    const priceData = priceRecords.map(record => ({
      date: record.weekEndDate.toISOString().split('T')[0],
      cnyPrice: Number(record.unitPrice),
      usdPrice: Math.round((Number(record.unitPrice) / Number(record.exchangeRate)) * 100) / 100,
      exchangeRate: Number(record.exchangeRate)
    }));

    return {
      pesticide,
      priceData
    };
  }
}