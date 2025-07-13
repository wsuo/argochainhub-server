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
import { User, UserRole } from '../entities/user.entity';
import {
  Company,
  CompanyStatus,
  CompanyType,
} from '../entities/company.entity';
import { AdminUser } from '../entities/admin-user.entity';
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
  ) {}

  async register(registerDto: RegisterDto) {
    const { 
      email, 
      password, 
      userName, 
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
      throw new ConflictException('Email already exists');
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建企业 - 使用用户提供的多语言企业名称和详细信息
    const company = this.companyRepository.create({
      name: companyName,
      type: companyType,
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
    const savedCompany = await this.companyRepository.save(company);

    // 创建用户
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name: userName,
      role: UserRole.OWNER, // 注册用户默认为企业所有者
      companyId: savedCompany.id,
      isActive: false, // 等待审核激活
    });
    await this.userRepository.save(user);

    return {
      message: 'Registration successful. Please wait for approval.',
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
        'Invalid credentials or inactive account',
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 检查企业状态
    if (user.company.status !== CompanyStatus.ACTIVE) {
      throw new UnauthorizedException('Company is not active');
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // 生成JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      companyType: user.company.type,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: {
          id: user.company.id,
          name: user.company.name,
          type: user.company.type,
          status: user.company.status,
        },
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
}
