import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { DictionaryCategory } from '../../entities/dictionary-category.entity';
import { DictionaryItem } from '../../entities/dictionary-item.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import {
  CreateDictionaryCategoryDto,
  UpdateDictionaryCategoryDto,
  CreateDictionaryItemDto,
  UpdateDictionaryItemDto,
  BatchImportDictionaryItemDto,
  DictionaryCategoryQueryDto,
  DictionaryItemQueryDto,
} from '../dto/dictionary-management.dto';

@Injectable()
export class DictionaryService {
  constructor(
    @InjectRepository(DictionaryCategory)
    private readonly dictionaryCategoryRepository: Repository<DictionaryCategory>,
    @InjectRepository(DictionaryItem)
    private readonly dictionaryItemRepository: Repository<DictionaryItem>,
  ) {}

  // 字典分类管理
  async getCategories(
    queryDto: DictionaryCategoryQueryDto,
  ): Promise<PaginatedResult<DictionaryCategory>> {
    const { page = 1, limit = 20, code, isActive, isSystem } = queryDto;

    const queryBuilder = this.dictionaryCategoryRepository
      .createQueryBuilder('category');

    if (code) {
      queryBuilder.andWhere('category.code LIKE :code', { code: `%${code}%` });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive });
    }

    if (isSystem !== undefined) {
      queryBuilder.andWhere('category.isSystem = :isSystem', { isSystem });
    }

    const [categories, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.createdAt', 'DESC')
      .getManyAndCount();

    // 为每个分类添加字典项数量
    const categoriesWithItemCount = await Promise.all(
      categories.map(async (category) => {
        const itemCount = await this.dictionaryItemRepository.count({
          where: {
            categoryId: category.id,
            isActive: true,
          },
        });

        return {
          ...category,
          itemCount,
        };
      })
    );

    return {
      data: categoriesWithItemCount,
      meta: {
        totalItems: total,
        itemCount: categories.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getCategoryByCode(code: string): Promise<DictionaryCategory> {
    const category = await this.dictionaryCategoryRepository.findOne({
      where: { code },
      relations: ['items'],
    });

    if (!category) {
      throw new NotFoundException(`Dictionary category with code ${code} not found`);
    }

    return category;
  }

  async createCategory(createDto: CreateDictionaryCategoryDto): Promise<DictionaryCategory> {
    // 检查代码是否已存在
    const existingCategory = await this.dictionaryCategoryRepository.findOne({
      where: { code: createDto.code },
    });

    if (existingCategory) {
      throw new ConflictException('Dictionary category code already exists');
    }

    const category = this.dictionaryCategoryRepository.create({
      ...createDto,
      isSystem: createDto.isSystem ?? false,
      isActive: createDto.isActive ?? true,
      sortOrder: createDto.sortOrder ?? 0,
    });

    return this.dictionaryCategoryRepository.save(category);
  }

  async updateCategory(
    categoryId: number,
    updateDto: UpdateDictionaryCategoryDto,
  ): Promise<DictionaryCategory> {
    const category = await this.dictionaryCategoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Dictionary category not found');
    }

    Object.assign(category, updateDto);
    return this.dictionaryCategoryRepository.save(category);
  }

  async deleteCategory(categoryId: number): Promise<void> {
    const category = await this.dictionaryCategoryRepository.findOne({
      where: { id: categoryId },
      relations: ['items'],
    });

    if (!category) {
      throw new NotFoundException('Dictionary category not found');
    }

    if (category.isSystem) {
      throw new BadRequestException('Cannot delete system dictionary category');
    }

    if (category.items && category.items.length > 0) {
      throw new BadRequestException('Cannot delete category with existing items');
    }

    await this.dictionaryCategoryRepository.remove(category);
  }

  // 字典项管理
  async getItems(
    categoryCode: string,
    queryDto: DictionaryItemQueryDto,
  ): Promise<PaginatedResult<DictionaryItem>> {
    const { page = 1, limit = 20, code, isActive, isSystem, parentId } = queryDto;

    // 首先获取分类
    const category = await this.getCategoryByCode(categoryCode);

    const queryBuilder = this.dictionaryItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.parent', 'parent')
      .leftJoinAndSelect('item.children', 'children', 'children.isActive = :childrenActive', { childrenActive: true })
      .where('item.categoryId = :categoryId', { categoryId: category.id });

    if (code) {
      queryBuilder.andWhere('item.code LIKE :code', { code: `%${code}%` });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('item.isActive = :isActive', { isActive });
    }

    if (isSystem !== undefined) {
      queryBuilder.andWhere('item.isSystem = :isSystem', { isSystem });
    }

    if (parentId !== undefined) {
      if (parentId === 0) {
        // 查询顶级项目
        queryBuilder.andWhere('item.parentId IS NULL');
      } else {
        queryBuilder.andWhere('item.parentId = :parentId', { parentId });
      }
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('item.sortOrder', 'ASC')
      .addOrderBy('item.createdAt', 'DESC')
      .getManyAndCount();

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

  async createItem(
    categoryCode: string,
    createDto: CreateDictionaryItemDto,
  ): Promise<DictionaryItem> {
    // 获取分类
    const category = await this.getCategoryByCode(categoryCode);

    // 检查代码在分类内是否唯一
    const existingItem = await this.dictionaryItemRepository.findOne({
      where: { 
        code: createDto.code,
        categoryId: category.id,
      },
    });

    if (existingItem) {
      throw new ConflictException('Dictionary item code already exists in this category');
    }

    // 如果有父级ID，验证父级是否存在且属于同一分类
    if (createDto.parentId) {
      const parentItem = await this.dictionaryItemRepository.findOne({
        where: { 
          id: createDto.parentId,
          categoryId: category.id,
        },
      });

      if (!parentItem) {
        throw new NotFoundException('Parent dictionary item not found in this category');
      }
    }

    const item = this.dictionaryItemRepository.create({
      ...createDto,
      categoryId: category.id,
      isSystem: createDto.isSystem ?? false,
      isActive: createDto.isActive ?? true,
      sortOrder: createDto.sortOrder ?? 0,
    });

    return this.dictionaryItemRepository.save(item);
  }

  async updateItem(
    itemId: number,
    updateDto: UpdateDictionaryItemDto,
  ): Promise<DictionaryItem> {
    const item = await this.dictionaryItemRepository.findOne({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Dictionary item not found');
    }

    // 如果更新父级ID，验证父级是否存在且属于同一分类
    if (updateDto.parentId !== undefined) {
      if (updateDto.parentId === null || updateDto.parentId === 0) {
        // 设为顶级项目
        item.parentId = undefined;
      } else {
        const parentItem = await this.dictionaryItemRepository.findOne({
          where: { 
            id: updateDto.parentId,
            categoryId: item.categoryId,
          },
        });

        if (!parentItem) {
          throw new NotFoundException('Parent dictionary item not found in this category');
        }

        // 防止循环引用
        if (updateDto.parentId === itemId) {
          throw new BadRequestException('Cannot set item as its own parent');
        }
      }
    }

    Object.assign(item, updateDto);
    return this.dictionaryItemRepository.save(item);
  }

  async deleteItem(itemId: number): Promise<void> {
    const item = await this.dictionaryItemRepository.findOne({
      where: { id: itemId },
      relations: ['children'],
    });

    if (!item) {
      throw new NotFoundException('Dictionary item not found');
    }

    if (item.isSystem) {
      throw new BadRequestException('Cannot delete system dictionary item');
    }

    if (item.children && item.children.length > 0) {
      throw new BadRequestException('Cannot delete dictionary item with children');
    }

    await this.dictionaryItemRepository.remove(item);
  }

  async batchImportItems(
    categoryCode: string,
    batchDto: BatchImportDictionaryItemDto,
  ): Promise<DictionaryItem[]> {
    // 获取分类
    const category = await this.getCategoryByCode(categoryCode);

    // 验证所有代码在分类内唯一
    const codes = batchDto.items.map(item => item.code);
    
    if (codes.length > 0) {
      const existingItems = await this.dictionaryItemRepository
        .createQueryBuilder('item')
        .where('item.categoryId = :categoryId', { categoryId: category.id })
        .andWhere('item.code IN (:...codes)', { codes })
        .getMany();

      if (existingItems.length > 0) {
        const existingCodes = existingItems.map(item => item.code);
        throw new ConflictException(
          `Dictionary item codes already exist: ${existingCodes.join(', ')}`,
        );
      }
    }

    // 批量创建
    const items = batchDto.items.map(itemDto => 
      this.dictionaryItemRepository.create({
        ...itemDto,
        categoryId: category.id,
        isSystem: itemDto.isSystem ?? false,
        isActive: itemDto.isActive ?? true,
        sortOrder: itemDto.sortOrder ?? 0,
      })
    );

    return this.dictionaryItemRepository.save(items);
  }

  // 前端查询接口
  async getDictionaryByCode(categoryCode: string): Promise<DictionaryItem[]> {
    const category = await this.getCategoryByCode(categoryCode);

    return this.dictionaryItemRepository.find({
      where: {
        categoryId: category.id,
        isActive: true,
      },
      relations: ['children'],
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
    });
  }
}