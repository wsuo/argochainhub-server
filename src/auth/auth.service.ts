import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserType } from '../entities/user.entity';
import {
  Company,
  CompanyStatus,
  CompanyType,
} from '../entities/company.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { AdminNotificationsService } from '../notifications/admin-notifications.service';
import { JwtPayload } from './jwt.strategy';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { createMultiLangText } from '../types/multilang';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly adminNotificationsService: AdminNotificationsService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { 
      email, 
      password, 
      userName, 
      userType,
      companyName, 
      companyType,
      country,
      businessCategories,
      businessScope,
      companySize,
      mainProducts,
      mainSuppliers,
      annualImportExportValue,
      registrationNumber,
      taxNumber,
      businessLicenseUrl,
      companyPhotosUrls
    } = registerDto;

    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('邮箱已存在');
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 12);

    let savedCompany: Company | null = null;

    // 根据用户类型处理注册逻辑
    if (userType === UserType.SUPPLIER) {
      // 供应商注册：创建企业
      if (!companyName) {
        throw new BadRequestException('供应商注册必须提供企业名称');
      }

      const company = this.companyRepository.create({
        name: companyName,
        type: companyType || CompanyType.SUPPLIER, // 默认为供应商类型
        status: CompanyStatus.PENDING_REVIEW,
        country,
        businessCategories,
        businessScope,
        companySize,
        mainProducts,
        mainSuppliers,
        annualImportExportValue,
        registrationNumber,
        taxNumber,
        businessLicenseUrl,
        companyPhotosUrls,
      });
      savedCompany = await this.companyRepository.save(company);
    }

    // 创建用户
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name: userName,
      userType,
      role: userType === UserType.SUPPLIER ? UserRole.OWNER : UserRole.MEMBER,
      companyId: savedCompany?.id,
      isActive: userType === UserType.INDIVIDUAL_BUYER, // 个人采购商立即激活，供应商需要审核
    });
    const savedUser = await this.userRepository.save(user);

    // 发送管理员通知
    try {
      if (userType === UserType.SUPPLIER && savedCompany) {
        // 供应商注册需要审核，通知管理员
        await this.adminNotificationsService.notifyUserRegistrationPending(
          savedUser.id,
          userName || email
        );
        // 企业认证审核通知
        await this.adminNotificationsService.notifyCompanyReviewPending(
          savedCompany.id,
          typeof companyName === 'string' ? companyName : `企业ID-${savedCompany.id}`
        );
      } else if (userType === UserType.INDIVIDUAL_BUYER) {
        // 个人采购商注册通知
        await this.adminNotificationsService.notifyUserRegistrationPending(
          savedUser.id,
          userName || email
        );
      }
    } catch (error) {
      // 通知发送失败不应该影响用户注册，只记录错误
      console.error('Failed to send admin notification for user registration:', error);
    }

    const message = userType === UserType.SUPPLIER 
      ? '供应商注册成功，请等待审核通过后使用'
      : '个人采购商注册成功，您可以立即开始使用平台';

    return {
      message,
      userType,
      needsApproval: userType === UserType.SUPPLIER,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 查找用户
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      relations: ['company'],
    });

    if (!user) {
      throw new UnauthorizedException(
        '用户不存在或账户未激活',
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    // 检查企业状态（仅供应商需要检查）
    if (user.userType === UserType.SUPPLIER && user.company) {
      if (user.company.status !== CompanyStatus.ACTIVE) {
        throw new UnauthorizedException('企业尚未通过审核，请等待审核完成');
      }
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // 生成JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId || null,
      companyType: user.company?.type || null,
      userType: user.userType,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        role: user.role,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
          type: user.company.type,
          status: user.company.status,
        } : null,
      },
    };
  }

  async changePassword(user: User, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // 哈希新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await this.userRepository.update(user.id, {
      password: hashedNewPassword,
    });

    return { message: 'Password changed successfully' };
  }

  async getProfile(user: User | AdminUser) {
    // 检查是否为管理员用户
    if ('username' in user && !('email' in user)) {
      // AdminUser 类型
      const adminUser = user as AdminUser;
      return {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        lastLoginAt: adminUser.lastLoginAt,
        type: 'admin',
      };
    }

    // 普通用户类型
    const regularUser = user as User;
    return {
      id: regularUser.id,
      email: regularUser.email,
      name: regularUser.name,
      userType: regularUser.userType,
      role: regularUser.role,
      lastLoginAt: regularUser.lastLoginAt,
      type: 'user',
      company: regularUser.company ? {
        id: regularUser.company.id,
        name: regularUser.company.name,
        type: regularUser.company.type,
        status: regularUser.company.status,
        profile: regularUser.company.profile,
        rating: regularUser.company.rating,
        isTop100: regularUser.company.isTop100,
        country: regularUser.company.country,
        businessCategories: regularUser.company.businessCategories,
        businessScope: regularUser.company.businessScope,
        companySize: regularUser.company.companySize,
        mainProducts: regularUser.company.mainProducts,
        mainSuppliers: regularUser.company.mainSuppliers,
        annualImportExportValue: regularUser.company.annualImportExportValue,
        registrationNumber: regularUser.company.registrationNumber,
        taxNumber: regularUser.company.taxNumber,
        businessLicenseUrl: regularUser.company.businessLicenseUrl,
        companyPhotosUrls: regularUser.company.companyPhotosUrls,
      } : null,
    };
  }

  async adminLogin(adminLoginDto: AdminLoginDto) {
    const { username, password } = adminLoginDto;

    // 查找管理员
    const adminUser = await this.adminUserRepository.findOne({
      where: { username, isActive: true },
    });

    if (!adminUser) {
      throw new UnauthorizedException(
        'Invalid admin credentials or inactive account',
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // 更新最后登录时间
    adminUser.lastLoginAt = new Date();
    await this.adminUserRepository.save(adminUser);

    // 生成JWT (为管理员使用特殊的payload结构)
    const payload = {
      sub: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      type: 'admin', // 标识这是管理员token
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      admin: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        lastLoginAt: adminUser.lastLoginAt,
      },
    };
  }

  async refreshToken(user: User) {
    // 重新查询用户最新信息，包含企业关联
    const freshUser = await this.userRepository.findOne({
      where: { id: user.id, isActive: true },
      relations: ['company'],
    });

    if (!freshUser) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    // 生成包含最新信息的JWT
    const payload: JwtPayload = {
      sub: freshUser.id,
      email: freshUser.email,
      companyId: freshUser.companyId || null,
      companyType: freshUser.company?.type || null,
      userType: freshUser.userType,
      role: freshUser.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: freshUser.id,
        email: freshUser.email,
        name: freshUser.name,
        userType: freshUser.userType,
        role: freshUser.role,
        company: freshUser.company ? {
          id: freshUser.company.id,
          name: freshUser.company.name,
          type: freshUser.company.type,
          status: freshUser.company.status,
        } : null,
      },
    };
  }
}
