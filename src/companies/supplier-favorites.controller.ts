import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SupplierFavoritesService } from './supplier-favorites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { AddSupplierFavoriteDto, UpdateSupplierFavoriteDto } from './dto/supplier-favorite.dto';
import { GetSupplierFavoritesDto } from './dto/get-supplier-favorites.dto';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('供应商收藏')
@Controller('companies/suppliers/favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupplierFavoritesController {
  constructor(private readonly supplierFavoritesService: SupplierFavoritesService) {}

  @Post()
  @ApiOperation({ summary: '收藏供应商' })
  @ApiResponse({ status: 201, description: '收藏成功' })
  @ApiResponse({ status: 404, description: '供应商不存在' })
  @ApiResponse({ status: 409, description: '已经收藏过该供应商' })
  async addFavorite(
    @CurrentUser() user: User,
    @Body() dto: AddSupplierFavoriteDto,
  ) {
    const favorite = await this.supplierFavoritesService.addFavorite(user, dto);
    return ResponseWrapperUtil.success(favorite, '收藏成功');
  }

  @Get('list')
  @ApiOperation({ summary: '获取收藏的供应商列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFavorites(
    @CurrentUser() user: User,
    @Query() dto: GetSupplierFavoritesDto,
  ) {
    const result = await this.supplierFavoritesService.getFavorites(user, dto);
    return ResponseWrapperUtil.successWithPagination(result, '获取成功');
  }

  @Get(':supplierId/status')
  @ApiOperation({ summary: '检查供应商收藏状态' })
  @ApiParam({ name: 'supplierId', description: '供应商ID' })
  @ApiResponse({ 
    status: 200, 
    description: '检查成功',
    schema: {
      example: {
        success: true,
        message: '检查成功',
        data: { isFavorited: true }
      }
    }
  })
  async checkFavoriteStatus(
    @CurrentUser() user: User,
    @Param('supplierId', ParseIntPipe) supplierId: number,
  ) {
    const isFavorited = await this.supplierFavoritesService.isFavorited(user, supplierId);
    return ResponseWrapperUtil.success({ isFavorited }, '检查成功');
  }

  @Put(':supplierId')
  @ApiOperation({ summary: '更新收藏备注' })
  @ApiParam({ name: 'supplierId', description: '供应商ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '收藏记录不存在' })
  async updateFavorite(
    @CurrentUser() user: User,
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Body() dto: UpdateSupplierFavoriteDto,
  ) {
    const favorite = await this.supplierFavoritesService.updateFavorite(user, supplierId, dto);
    return ResponseWrapperUtil.success(favorite, '更新成功');
  }

  @Delete(':supplierId')
  @ApiOperation({ summary: '取消收藏供应商' })
  @ApiParam({ name: 'supplierId', description: '供应商ID' })
  @ApiResponse({ status: 200, description: '取消收藏成功' })
  @ApiResponse({ status: 404, description: '收藏记录不存在' })
  async removeFavorite(
    @CurrentUser() user: User,
    @Param('supplierId', ParseIntPipe) supplierId: number,
  ) {
    await this.supplierFavoritesService.removeFavorite(user, supplierId);
    return ResponseWrapperUtil.successNoData('取消收藏成功');
  }
}