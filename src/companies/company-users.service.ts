import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Company } from '../entities/company.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { 
  CreateCompanyUserDto, 
  UpdateCompanyUserDto, 
  CompanyUserQueryDto 
} from './dto/company-user.dto';

@Injectable()
export class CompanyUsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  /**
   * 获取企业用户列表
   */
  async getCompanyUsers(
    companyId: number, 
    queryDto: CompanyUserQueryDto,
    currentUser: User | AdminUser
  ): Promise<PaginatedResult<User>> {
    // 管理员可以查看任何企业的用户信息
    if (currentUser instanceof AdminUser) {
      // 管理员没有企业限制，可以查看所有企业用户
    } else {
      // 权限检查：只有企业owner和admin可以查看所有用户，member只能查看自己
      if (Number(currentUser.companyId) !== companyId) {
        throw new ForbiddenException('无权访问其他企业的用户信息');
      }
    }

    const {
      page = 1,
      limit = 20,
      search,
      role,
      department,
      position,
      isActive,
      emailVerified,
      joinedStartDate,
      joinedEndDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = queryDto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company')
      .where('user.companyId = :companyId', { companyId });

    // 如果是普通用户且为member角色，只能查看自己
    if (currentUser instanceof User && currentUser.role === UserRole.MEMBER) {
      queryBuilder.andWhere('user.id = :userId', { userId: currentUser.id });
    }

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('user.email LIKE :search', { search: `%${search}%` })
            .orWhere('user.name LIKE :search', { search: `%${search}%` })
            .orWhere('user.phone LIKE :search', { search: `%${search}%` });
        })
      );
    }

    // 角色筛选
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // 部门筛选
    if (department) {
      queryBuilder.andWhere('user.department = :department', { department });
    }

    // 职位筛选
    if (position) {
      queryBuilder.andWhere('user.position LIKE :position', { 
        position: `%${position}%` 
      });
    }

    // 激活状态筛选
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // 邮箱验证状态筛选
    if (emailVerified !== undefined) {
      queryBuilder.andWhere('user.emailVerified = :emailVerified', { emailVerified });
    }

    // 入职日期筛选
    if (joinedStartDate) {
      queryBuilder.andWhere('user.joinedAt >= :joinedStartDate', { joinedStartDate });
    }

    if (joinedEndDate) {
      queryBuilder.andWhere('user.joinedAt <= :joinedEndDate', { joinedEndDate });
    }

    // 排序
    const orderByMapping: Record<string, string> = {
      createdAt: 'user.createdAt',
      updatedAt: 'user.updatedAt',
      name: 'user.name',
      joinedAt: 'user.joinedAt'
    };

    const orderByField = orderByMapping[sortBy] || 'user.createdAt';
    queryBuilder.orderBy(orderByField, sortOrder as 'ASC' | 'DESC');

    // 分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    // 移除密码字段
    const sanitizedItems = items.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      data: sanitizedItems as User[],
      meta: {
        totalItems: total,
        itemCount: sanitizedItems.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * 获取单个企业用户详情
   */
  async getCompanyUserById(
    companyId: number, 
    userId: number,
    currentUser: User | AdminUser
  ): Promise<User> {
    // 管理员可以查看任何企业的用户信息
    if (currentUser instanceof AdminUser) {
      // 管理员没有企业限制
    } else {
      // 权限检查
      if (Number(currentUser.companyId) !== companyId) {
        throw new ForbiddenException('无权访问其他企业的用户信息');
      }

      // member只能查看自己
      if (currentUser.role === UserRole.MEMBER && currentUser.id !== userId) {
        throw new ForbiddenException('无权查看其他用户信息');
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, companyId },
      relations: ['company']
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * 创建企业用户
   */
  async createCompanyUser(
    companyId: number, 
    createDto: CreateCompanyUserDto,
    currentUser: User | AdminUser
  ): Promise<User> {
    // 权限检查：演示账号不能执行写操作
    if (currentUser instanceof AdminUser && currentUser.role === 'demo_viewer') {
      throw new ForbiddenException('演示账号只能查看数据，不能进行创建操作');
    }
    
    // 管理员可以为任何企业创建用户
    if (currentUser instanceof AdminUser) {
      // 管理员没有企业限制
    } else {
      // 权限检查：只有企业owner和admin可以创建用户
      if (Number(currentUser.companyId) !== companyId) {
        throw new ForbiddenException('无权在其他企业创建用户');
      }

      if (currentUser.role === UserRole.MEMBER) {
        throw new ForbiddenException('无权创建用户');
      }
    }

    // 验证企业是否存在
    const company = await this.companyRepository.findOne({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException('企业不存在');
    }

    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { email: createDto.email }
    });

    if (existingUser) {
      throw new BadRequestException('邮箱地址已被使用');
    }

    // 权限检查：owner可以创建任何角色，admin不能创建owner
    if (currentUser instanceof User && currentUser.role === UserRole.ADMIN && createDto.role === UserRole.OWNER) {
      throw new ForbiddenException('管理员无权创建企业所有者');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    // 创建用户
    const user = this.userRepository.create({
      ...createDto,
      password: hashedPassword,
      companyId,
      joinedAt: createDto.joinedAt ? new Date(createDto.joinedAt) : new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  /**
   * 更新企业用户
   */
  async updateCompanyUser(
    companyId: number, 
    userId: number, 
    updateDto: UpdateCompanyUserDto,
    currentUser: User | AdminUser
  ): Promise<User> {
    // 权限检查：演示账号不能执行写操作
    if (currentUser instanceof AdminUser && currentUser.role === 'demo_viewer') {
      throw new ForbiddenException('演示账号只能查看数据，不能进行修改操作');
    }
    
    // 管理员可以修改任何企业的用户
    if (currentUser instanceof AdminUser) {
      // 管理员没有企业限制
    } else {
      // 权限检查
      if (Number(currentUser.companyId) !== companyId) {
        throw new ForbiddenException('无权修改其他企业的用户');
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, companyId }
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 权限检查：member只能修改自己的基本信息
    if (currentUser instanceof User && currentUser.role === UserRole.MEMBER) {
      if (currentUser.id !== userId) {
        throw new ForbiddenException('无权修改其他用户信息');
      }
      
      // member不能修改角色和激活状态
      if (updateDto.role || updateDto.isActive !== undefined || updateDto.emailVerified !== undefined) {
        throw new ForbiddenException('无权修改角色、激活状态或邮箱验证状态');
      }
    }

    // admin不能修改owner的信息，也不能将用户提升为owner
    if (currentUser instanceof User && currentUser.role === UserRole.ADMIN) {
      if (user.role === UserRole.OWNER) {
        throw new ForbiddenException('管理员无权修改企业所有者信息');
      }
      
      if (updateDto.role === UserRole.OWNER) {
        throw new ForbiddenException('管理员无权将用户提升为企业所有者');
      }
    }

    // 更新用户信息
    Object.assign(user, updateDto);
    
    if (updateDto.joinedAt) {
      user.joinedAt = new Date(updateDto.joinedAt);
    }

    const updatedUser = await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  /**
   * 删除企业用户
   */
  async deleteCompanyUser(
    companyId: number, 
    userId: number,
    currentUser: User | AdminUser
  ): Promise<void> {
    // 权限检查：演示账号不能执行写操作
    if (currentUser instanceof AdminUser && currentUser.role === 'demo_viewer') {
      throw new ForbiddenException('演示账号只能查看数据，不能进行删除操作');
    }
    
    // 管理员可以删除任何企业的用户
    if (currentUser instanceof AdminUser) {
      // 管理员没有企业限制
    } else {
      // 权限检查：只有企业owner和admin可以删除用户
      if (Number(currentUser.companyId) !== companyId) {
        throw new ForbiddenException('无权删除其他企业的用户');
      }

      if (currentUser.role === UserRole.MEMBER) {
        throw new ForbiddenException('无权删除用户');
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, companyId }
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 不能删除自己（仅对普通用户）
    if (currentUser instanceof User && currentUser.id === userId) {
      throw new BadRequestException('不能删除自己');
    }

    // admin不能删除owner
    if (currentUser instanceof User && currentUser.role === UserRole.ADMIN && user.role === UserRole.OWNER) {
      throw new ForbiddenException('管理员无权删除企业所有者');
    }

    await this.userRepository.softDelete(userId);
  }

  /**
   * 切换用户状态
   */
  async toggleUserStatus(
    companyId: number, 
    userId: number,
    currentUser: User | AdminUser
  ): Promise<User> {
    // 权限检查：演示账号不能执行写操作
    if (currentUser instanceof AdminUser && currentUser.role === 'demo_viewer') {
      throw new ForbiddenException('演示账号只能查看数据，不能进行状态修改操作');
    }
    
    // 管理员可以修改任何企业的用户状态
    if (currentUser instanceof AdminUser) {
      // 管理员没有企业限制
    } else {
      // 权限检查：只有企业owner和admin可以切换用户状态
      if (Number(currentUser.companyId) !== companyId) {
        throw new ForbiddenException('无权修改其他企业的用户状态');
      }

      if (currentUser.role === UserRole.MEMBER) {
        throw new ForbiddenException('无权修改用户状态');
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, companyId }
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 不能禁用自己（仅对普通用户）
    if (currentUser instanceof User && currentUser.id === userId) {
      throw new BadRequestException('不能修改自己的状态');
    }

    // admin不能修改owner状态
    if (currentUser instanceof User && currentUser.role === UserRole.ADMIN && user.role === UserRole.OWNER) {
      throw new ForbiddenException('管理员无权修改企业所有者状态');
    }

    user.isActive = !user.isActive;
    const updatedUser = await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }
}