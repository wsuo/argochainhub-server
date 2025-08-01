import {
  Controller,
  Get,
  Post,
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
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('订单管理')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: '创建订单' })
  @ApiResponse({ status: 201, description: '订单创建成功' })
  @ApiResponse({ status: 404, description: '计划不存在' })
  async createOrder(
    @CurrentUser() user: User,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const result = await this.ordersService.createOrder(user, createOrderDto.planId);
    return {
      success: true,
      message: '订单创建成功',
      data: result
    };
  }

  @Get()
  @ApiOperation({ summary: '获取我的订单列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyOrders(
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.ordersService.getMyOrders(user, paginationDto);
    return {
      success: true,
      message: '获取订单列表成功',
      ...result
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '订单不存在' })
  async getOrderDetail(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.ordersService.getOrderDetail(user, id);
    return {
      success: true,
      message: '获取订单详情成功',
      data: result
    };
  }
}
