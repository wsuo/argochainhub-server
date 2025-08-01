import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PriceTrendsService } from './price-trends.service';
import { CreatePriceTrendDto } from './dto/create-price-trend.dto';
import { UpdatePriceTrendDto } from './dto/update-price-trend.dto';
import { QueryPriceTrendsDto } from './dto/query-price-trends.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('价格走势管理')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('price-trends')
export class PriceTrendsController {
  constructor(private readonly priceTrendsService: PriceTrendsService) {}

  @Post()
  @AdminRoles('super_admin', 'admin')
  @ApiOperation({ summary: '创建价格走势记录' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '价格记录创建成功'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: '该日期的价格记录已存在' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '关联的农药不存在' 
  })
  async create(@Body() createPriceTrendDto: CreatePriceTrendDto) {
    const priceTrend = await this.priceTrendsService.create(createPriceTrendDto);
    return ResponseWrapperUtil.success(priceTrend, '价格记录创建成功');
  }

  @Get()
  @AdminRoles('super_admin', 'admin', 'operator')
  @ApiOperation({ summary: '分页查询价格走势记录' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '查询成功'
  })
  async findAll(@Query() queryDto: QueryPriceTrendsDto) {
    const result = await this.priceTrendsService.findAll(queryDto);
    return ResponseWrapperUtil.successWithPagination(result, '查询成功');
  }

  @Get('chart/:pesticideId')
  @AdminRoles('super_admin', 'admin', 'operator')
  @ApiOperation({ summary: '获取农药价格走势图表数据' })  
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '查询成功'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '农药不存在' 
  })
  async getPriceChart(
    @Param('pesticideId', ParseIntPipe) pesticideId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const chartData = await this.priceTrendsService.getPriceChart(
      pesticideId,
      startDate,
      endDate
    );
    return ResponseWrapperUtil.success(chartData, '查询成功');
  }

  @Get(':id')
  @AdminRoles('super_admin', 'admin', 'operator')
  @ApiOperation({ summary: '根据ID查询价格走势记录详情' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '查询成功'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '价格记录不存在' 
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const priceTrend = await this.priceTrendsService.findOne(id);
    return ResponseWrapperUtil.success(priceTrend, '查询成功');
  }

  @Patch(':id')
  @AdminRoles('super_admin', 'admin')
  @ApiOperation({ summary: '更新价格走势记录' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '更新成功'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '价格记录不存在' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: '该日期的价格记录已存在' 
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePriceTrendDto: UpdatePriceTrendDto,
  ) {
    const priceTrend = await this.priceTrendsService.update(id, updatePriceTrendDto);
    return ResponseWrapperUtil.success(priceTrend, '更新成功');
  }

  @Delete(':id')
  @AdminRoles('super_admin', 'admin')
  @ApiOperation({ summary: '删除价格走势记录' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '删除成功'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '价格记录不存在' 
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.priceTrendsService.remove(id);
    return ResponseWrapperUtil.successNoData('删除成功');
  }
}