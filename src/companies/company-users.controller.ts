import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FlexibleAuthGuard } from '../common/guards/flexible-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { CompanyUsersService } from './company-users.service';
import { 
  CreateCompanyUserDto, 
  UpdateCompanyUserDto, 
  CompanyUserQueryDto 
} from './dto/company-user.dto';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('企业用户管理')
@ApiBearerAuth()
@UseGuards(FlexibleAuthGuard)
@Controller('companies/:companyId/users')
export class CompanyUsersController {
  constructor(private readonly companyUsersService: CompanyUsersService) {}

  @Get()
  @ApiOperation({ summary: '获取企业用户列表' })
  @ApiParam({ name: 'companyId', description: '企业ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async getCompanyUsers(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query() queryDto: CompanyUserQueryDto,
    @CurrentUser() currentUser: User | AdminUser,
  ) {
    const result = await this.companyUsersService.getCompanyUsers(companyId, queryDto, currentUser);
    return ResponseWrapperUtil.successWithPagination(result, '获取成功');
  }

  @Get(':userId')
  @ApiOperation({ summary: '获取企业用户详情' })
  @ApiParam({ name: 'companyId', description: '企业ID' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async getCompanyUserById(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: User | AdminUser,
  ) {
    const user = await this.companyUsersService.getCompanyUserById(companyId, userId, currentUser);
    return ResponseWrapperUtil.success(user, '获取成功');
  }

  @Post()
  @ApiOperation({ summary: '创建企业用户' })
  @ApiParam({ name: 'companyId', description: '企业ID' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '邮箱已存在或参数错误' })
  @ApiResponse({ status: 403, description: '无权创建用户' })
  async createCompanyUser(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() createDto: CreateCompanyUserDto,
    @CurrentUser() currentUser: User | AdminUser,
  ) {
    const user = await this.companyUsersService.createCompanyUser(companyId, createDto, currentUser);
    return ResponseWrapperUtil.success(user, '用户创建成功');
  }

  @Put(':userId')
  @ApiOperation({ summary: '更新企业用户信息' })
  @ApiParam({ name: 'companyId', description: '企业ID' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 403, description: '无权修改' })
  async updateCompanyUser(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateDto: UpdateCompanyUserDto,
    @CurrentUser() currentUser: User | AdminUser,
  ) {
    const user = await this.companyUsersService.updateCompanyUser(companyId, userId, updateDto, currentUser);
    return ResponseWrapperUtil.success(user, '用户更新成功');
  }

  @Delete(':userId')
  @ApiOperation({ summary: '删除企业用户' })
  @ApiParam({ name: 'companyId', description: '企业ID' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 403, description: '无权删除' })
  @ApiResponse({ status: 400, description: '不能删除自己' })
  async deleteCompanyUser(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: User | AdminUser,
  ) {
    await this.companyUsersService.deleteCompanyUser(companyId, userId, currentUser);
    return ResponseWrapperUtil.successNoData('用户删除成功');
  }

  @Patch(':userId/toggle-status')
  @ApiOperation({ summary: '切换用户激活状态' })
  @ApiParam({ name: 'companyId', description: '企业ID' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '状态切换成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 403, description: '无权修改状态' })
  @ApiResponse({ status: 400, description: '不能修改自己的状态' })
  async toggleUserStatus(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: User | AdminUser,
  ) {
    const user = await this.companyUsersService.toggleUserStatus(companyId, userId, currentUser);
    return ResponseWrapperUtil.success(user, '状态切换成功');
  }
}