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
  ApiQuery,
} from '@nestjs/swagger';
import { PesticidesService } from './pesticides.service';
import { CreatePesticideDto } from './dto/create-pesticide.dto';
import { UpdatePesticideDto } from './dto/update-pesticide.dto';
import { QueryPesticidesDto } from './dto/query-pesticides.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('农药管理')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('pesticides')
export class PesticidesController {
  constructor(private readonly pesticidesService: PesticidesService) {}

  @Post()
  @AdminRoles('super_admin', 'admin')
  @ApiOperation({ summary: '创建标准农药' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '农药创建成功'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: '农药已存在或数据冲突' 
  })
  async create(@Body() createPesticideDto: CreatePesticideDto) {
    const pesticide = await this.pesticidesService.create(createPesticideDto);
    return ResponseWrapperUtil.success(pesticide, '农药创建成功');
  }

  @Get()
  @AdminRoles('super_admin', 'admin', 'operator')
  @ApiOperation({ summary: '分页查询标准农药' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '查询成功'
  })
  async findAll(@Query() queryDto: QueryPesticidesDto) {
    // 手动处理布尔参数转换问题
    const processedQuery = { ...queryDto };
    
    // 处理 isVisible 参数
    if (typeof queryDto.isVisible === 'string') {
      processedQuery.isVisible = queryDto.isVisible === 'true' ? true : 
                                 queryDto.isVisible === 'false' ? false : undefined;
    }
    
    // 处理 hasPrice 参数
    if (typeof queryDto.hasPrice === 'string') {
      processedQuery.hasPrice = queryDto.hasPrice === 'true' ? true : 
                                queryDto.hasPrice === 'false' ? false : undefined;
    }
    
    const result = await this.pesticidesService.findAll(processedQuery);
    return ResponseWrapperUtil.successWithPagination(result, '查询成功');
  }

  @Get(':id')
  @AdminRoles('super_admin', 'admin', 'operator')
  @ApiOperation({ summary: '根据ID查询标准农药详情' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '查询成功'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '农药不存在' 
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const pesticide = await this.pesticidesService.findOne(id);
    return ResponseWrapperUtil.success(pesticide, '查询成功');
  }

  @Patch(':id')
  @AdminRoles('super_admin', 'admin')
  @ApiOperation({ summary: '更新标准农药' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '更新成功'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '农药不存在' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: '数据冲突' 
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePesticideDto: UpdatePesticideDto,
  ) {
    const pesticide = await this.pesticidesService.update(id, updatePesticideDto);
    return ResponseWrapperUtil.success(pesticide, '更新成功');
  }

  @Delete(':id')
  @AdminRoles('super_admin', 'admin')
  @ApiOperation({ summary: '删除标准农药' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '删除成功'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '农药不存在' 
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.pesticidesService.remove(id);
    return ResponseWrapperUtil.successNoData('删除成功');
  }
}