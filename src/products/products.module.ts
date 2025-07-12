import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { CommonModule } from '../common/common.module';
import { ProductsService } from './products.service';
import { ProductsController, MyProductsController } from './products.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    CommonModule,
  ],
  providers: [ProductsService],
  controllers: [ProductsController, MyProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}