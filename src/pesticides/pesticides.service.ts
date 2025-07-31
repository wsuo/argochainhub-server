import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { StandardPesticide } from '../entities/standard-pesticide.entity';
import { CreatePesticideDto } from './dto/create-pesticide.dto';
import { UpdatePesticideDto } from './dto/update-pesticide.dto';
import { QueryPesticidesDto } from './dto/query-pesticides.dto';

@Injectable()
export class PesticidesService {
  constructor(
    @InjectRepository(StandardPesticide)
    private readonly pesticidesRepository: Repository<StandardPesticide>,
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
  async findAll(queryDto: QueryPesticidesDto): Promise<{
    data: StandardPesticide[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, category, formulation, isVisible, search } = queryDto;
    
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
    
    // 分页和排序
    const [data, total] = await queryBuilder
      .orderBy('pesticide.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
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