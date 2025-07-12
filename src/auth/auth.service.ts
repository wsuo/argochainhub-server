import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';
import { Company, CompanyStatus, CompanyType } from '../entities/company.entity';
import { JwtPayload } from './jwt.strategy';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, userName, companyName, companyType } = registerDto;

    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建企业
    const company = this.companyRepository.create({
      name: companyName,
      type: companyType,
      status: CompanyStatus.PENDING_REVIEW,
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
      throw new UnauthorizedException('Invalid credentials or inactive account');
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

  async getProfile(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      company: {
        id: user.company.id,
        name: user.company.name,
        type: user.company.type,
        status: user.company.status,
        profile: user.company.profile,
        rating: user.company.rating,
        isTop100: user.company.isTop100,
      },
    };
  }
}