import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';
import { ShoppingCartService } from './shopping-cart.service';
import { CartBatchOperationsService } from './cart-batch-operations.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { BatchRemoveFromCartDto } from './dto/batch-remove-from-cart.dto';
import { BatchCreateInquiryDto } from './dto/batch-create-inquiry.dto';
import { BatchCreateSampleRequestDto } from './dto/batch-create-sample-request.dto';
import { BatchCreateRegistrationRequestDto } from './dto/batch-create-registration-request.dto';

@ApiTags('购物车管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class ShoppingCartController {
  constructor(
    private readonly shoppingCartService: ShoppingCartService,
    private readonly cartBatchOperationsService: CartBatchOperationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '查看购物车' })
  @ApiResponse({ status: 200, description: '获取购物车成功' })
  async getCart(@CurrentUser() user: User) {
    const result = await this.shoppingCartService.getCartBySupplier(user.id);
    return ResponseWrapperUtil.success(result, '获取购物车成功');
  }

  @Post('items')
  @ApiOperation({ summary: '添加产品到购物车' })
  @ApiResponse({ status: 201, description: '添加到购物车成功' })
  async addToCart(
    @CurrentUser() user: User,
    @Body() addToCartDto: AddToCartDto,
  ) {
    const cartItem = await this.shoppingCartService.addToCart(user.id, addToCartDto);
    return ResponseWrapperUtil.success(cartItem, '添加到购物车成功');
  }

  @Put('items/:id')
  @ApiOperation({ summary: '更新购物车项目' })
  @ApiResponse({ status: 200, description: '更新购物车项目成功' })
  async updateCartItem(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) cartItemId: number,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    const cartItem = await this.shoppingCartService.updateCartItem(user.id, cartItemId, updateDto);
    return ResponseWrapperUtil.success(cartItem, '更新购物车项目成功');
  }

  @Delete('items/:id')
  @ApiOperation({ summary: '移除单个购物车项目' })
  @ApiResponse({ status: 200, description: '移除购物车项目成功' })
  async removeCartItem(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) cartItemId: number,
  ) {
    await this.shoppingCartService.removeCartItem(user.id, cartItemId);
    return ResponseWrapperUtil.successNoData('移除购物车项目成功');
  }

  @Delete('items/batch')
  @ApiOperation({ summary: '批量移除购物车项目' })
  @ApiResponse({ status: 200, description: '批量移除购物车项目成功' })
  async batchRemoveCartItems(
    @CurrentUser() user: User,
    @Body() batchRemoveDto: BatchRemoveFromCartDto,
  ) {
    await this.shoppingCartService.batchRemoveCartItems(user.id, batchRemoveDto);
    return ResponseWrapperUtil.successNoData('批量移除购物车项目成功');
  }

  @Delete('clear')
  @ApiOperation({ summary: '清空购物车' })
  @ApiResponse({ status: 200, description: '清空购物车成功' })
  async clearCart(@CurrentUser() user: User) {
    await this.shoppingCartService.clearCart(user.id);
    return ResponseWrapperUtil.successNoData('清空购物车成功');
  }

  @Get('count')
  @ApiOperation({ summary: '获取购物车项目数量' })
  @ApiResponse({ status: 200, description: '获取购物车数量成功' })
  async getCartItemsCount(@CurrentUser() user: User) {
    const count = await this.shoppingCartService.getCartItemsCount(user.id);
    return ResponseWrapperUtil.success({ count }, '获取购物车数量成功');
  }

  @Get('supplier/:supplierId')
  @ApiOperation({ summary: '获取特定供应商的购物车项目' })
  @ApiResponse({ status: 200, description: '获取供应商购物车项目成功' })
  async getCartItemsBySupplierId(
    @CurrentUser() user: User,
    @Param('supplierId', ParseIntPipe) supplierId: number,
  ) {
    const items = await this.shoppingCartService.getCartItemsBySupplierId(user.id, supplierId);
    return ResponseWrapperUtil.success(items, '获取供应商购物车项目成功');
  }

  // ==================== 批量操作 ====================

  @Post('batch/inquiry')
  @ApiOperation({ summary: '批量创建询价' })
  @ApiResponse({ status: 201, description: '批量创建询价成功' })
  async batchCreateInquiry(
    @CurrentUser() user: User,
    @Body() batchInquiryDto: BatchCreateInquiryDto,
  ) {
    const inquiry = await this.cartBatchOperationsService.batchCreateInquiry(user.id, batchInquiryDto);
    return ResponseWrapperUtil.success(inquiry, '批量创建询价成功');
  }

  @Post('batch/sample-request')
  @ApiOperation({ summary: '批量申请样品' })
  @ApiResponse({ status: 201, description: '批量申请样品成功' })
  async batchCreateSampleRequest(
    @CurrentUser() user: User,
    @Body() batchSampleDto: BatchCreateSampleRequestDto,
  ) {
    const sampleRequests = await this.cartBatchOperationsService.batchCreateSampleRequest(user.id, batchSampleDto);
    return ResponseWrapperUtil.success(sampleRequests, '批量申请样品成功');
  }

  @Post('batch/registration-request')
  @ApiOperation({ summary: '批量申请登记' })
  @ApiResponse({ status: 201, description: '批量申请登记成功' })
  async batchCreateRegistrationRequest(
    @CurrentUser() user: User,
    @Body() batchRegDto: BatchCreateRegistrationRequestDto,
  ) {
    const registrationRequests = await this.cartBatchOperationsService.batchCreateRegistrationRequest(user.id, batchRegDto);
    return ResponseWrapperUtil.success(registrationRequests, '批量申请登记成功');
  }
}