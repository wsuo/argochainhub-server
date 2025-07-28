import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { VipConfig, VipPlatform, VipLevel, VipCurrency } from '../../entities/vip-config.entity';
import { 
  CreateVipConfigDto, 
  UpdateVipConfigDto, 
  VipConfigQueryDto 
} from '../dto/vip-config-management.dto';

@Injectable()
export class VipConfigService {
  constructor(
    @InjectRepository(VipConfig)
    private readonly vipConfigRepository: Repository<VipConfig>,
  ) {}

  async create(createDto: CreateVipConfigDto): Promise<VipConfig> {
    // 检查是否已存在相同平台、等级和币种的配置
    const existingConfig = await this.vipConfigRepository.findOne({
      where: {
        platform: createDto.platform,
        level: createDto.level,
        currency: createDto.currency,
      },
    });

    if (existingConfig) {
      throw new BadRequestException(
        `该平台、VIP等级和币种的配置已存在，请勿重复创建`
      );
    }

    // 创建新的VIP配置
    const vipConfig = this.vipConfigRepository.create({
      ...createDto,
      discount: this.calculateDiscount(createDto.originalPrice, createDto.currentPrice),
    });

    return await this.vipConfigRepository.save(vipConfig);
  }

  async findAll(query: VipConfigQueryDto): Promise<any> {
    const { 
      platform, 
      level, 
      currency, 
      isActive, 
      keyword,
      page = 1, 
      limit = 20 
    } = query;

    const where: FindOptionsWhere<VipConfig>[] = [];
    const baseCondition: FindOptionsWhere<VipConfig> = {};

    if (platform) {
      baseCondition.platform = platform;
    }

    if (level) {
      baseCondition.level = level;
    }

    if (currency) {
      baseCondition.currency = currency;
    }

    if (isActive !== undefined) {
      baseCondition.isActive = isActive;
    }

    // 关键字搜索（搜索备注）
    if (keyword) {
      where.push(
        {
          ...baseCondition,
          remarkZh: Like(`%${keyword}%`),
        },
        {
          ...baseCondition,
          remarkEn: Like(`%${keyword}%`),
        },
        {
          ...baseCondition,
          remarkEs: Like(`%${keyword}%`),
        }
      );
    } else if (Object.keys(baseCondition).length > 0) {
      where.push(baseCondition);
    }

    const [items, total] = await this.vipConfigRepository.findAndCount({
      where: where.length > 0 ? where : undefined,
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

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

  async findOne(id: number): Promise<VipConfig> {
    const vipConfig = await this.vipConfigRepository.findOne({
      where: { id },
    });

    if (!vipConfig) {
      throw new NotFoundException(`VIP配置 #${id} 不存在`);
    }

    return vipConfig;
  }

  async findByPlatform(platform: VipPlatform): Promise<VipConfig[]> {
    return await this.vipConfigRepository.find({
      where: {
        platform,
        isActive: true,
      },
      order: {
        sortOrder: 'ASC',
        vipLevelNumber: 'ASC',
      },
    });
  }

  async findByPlatformAndLevel(
    platform: VipPlatform, 
    level: VipLevel,
    currency?: VipCurrency
  ): Promise<VipConfig[]> {
    const where: FindOptionsWhere<VipConfig> = {
      platform,
      level,
      isActive: true,
    };

    if (currency) {
      where.currency = currency;
    }

    return await this.vipConfigRepository.find({
      where,
      order: {
        sortOrder: 'ASC',
      },
    });
  }

  async update(id: number, updateDto: UpdateVipConfigDto): Promise<VipConfig> {
    const vipConfig = await this.findOne(id);

    // 如果要更新平台、等级或币种，检查是否会产生重复
    if (updateDto.platform || updateDto.level || updateDto.currency) {
      const checkPlatform = updateDto.platform || vipConfig.platform;
      const checkLevel = updateDto.level || vipConfig.level;
      const checkCurrency = updateDto.currency || vipConfig.currency;

      const existingConfig = await this.vipConfigRepository.findOne({
        where: {
          platform: checkPlatform,
          level: checkLevel,
          currency: checkCurrency,
        },
      });

      if (existingConfig && existingConfig.id !== id) {
        throw new BadRequestException(
          `该平台、VIP等级和币种的配置已存在，无法更新`
        );
      }
    }

    // 如果更新了价格，重新计算折扣
    if (updateDto.originalPrice !== undefined || updateDto.currentPrice !== undefined) {
      const originalPrice = updateDto.originalPrice ?? vipConfig.originalPrice;
      const currentPrice = updateDto.currentPrice ?? vipConfig.currentPrice;
      updateDto.discount = this.calculateDiscount(originalPrice, currentPrice);
    }

    // 更新配置
    Object.assign(vipConfig, updateDto);
    
    return await this.vipConfigRepository.save(vipConfig);
  }

  async remove(id: number): Promise<void> {
    const vipConfig = await this.findOne(id);
    
    // 软删除
    await this.vipConfigRepository.softRemove(vipConfig);
  }

  async toggleStatus(id: number): Promise<VipConfig> {
    const vipConfig = await this.findOne(id);
    
    vipConfig.isActive = !vipConfig.isActive;
    
    return await this.vipConfigRepository.save(vipConfig);
  }

  async batchToggleStatus(ids: number[], isActive: boolean): Promise<void> {
    await this.vipConfigRepository.update(ids, { isActive });
  }

  async updateSortOrder(id: number, sortOrder: number): Promise<VipConfig> {
    const vipConfig = await this.findOne(id);
    
    vipConfig.sortOrder = sortOrder;
    
    return await this.vipConfigRepository.save(vipConfig);
  }

  // 辅助方法：计算折扣
  private calculateDiscount(originalPrice: number, currentPrice: number): string {
    if (originalPrice === 0) return '';
    
    const discountRate = Math.round((currentPrice / originalPrice) * 100);
    
    return discountRate < 100 ? `${discountRate}折` : '';
  }

  // 获取VIP配置统计信息
  async getStatistics(): Promise<any> {
    const totalConfigs = await this.vipConfigRepository.count();
    const activeConfigs = await this.vipConfigRepository.count({ where: { isActive: true } });
    
    const platformStats = await this.vipConfigRepository
      .createQueryBuilder('config')
      .select('config.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .groupBy('config.platform')
      .getRawMany();

    const levelStats = await this.vipConfigRepository
      .createQueryBuilder('config')
      .select('config.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('config.level')
      .getRawMany();

    const currencyStats = await this.vipConfigRepository
      .createQueryBuilder('config')
      .select('config.currency', 'currency')
      .addSelect('COUNT(*)', 'count')
      .groupBy('config.currency')
      .getRawMany();

    return {
      totalConfigs,
      activeConfigs,
      inactiveConfigs: totalConfigs - activeConfigs,
      platformStats,
      levelStats,
      currencyStats,
    };
  }
}