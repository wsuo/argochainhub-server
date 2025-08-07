import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { 
  ShoppingCart, 
  CartItem, 
  Product, 
  Company, 
  User,
  Inquiry,
  InquiryItem,
  SampleRequest,
  RegistrationRequest,
} from '../entities';
import { ShoppingCartController } from './shopping-cart.controller';
import { ShoppingCartService } from './shopping-cart.service';
import { CartBatchOperationsService } from './cart-batch-operations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShoppingCart,
      CartItem,
      Product,
      Company,
      User,
      Inquiry,
      InquiryItem,
      SampleRequest,
      RegistrationRequest,
    ]),
  ],
  controllers: [ShoppingCartController],
  providers: [ShoppingCartService, CartBatchOperationsService],
  exports: [ShoppingCartService, CartBatchOperationsService],
})
export class ShoppingCartModule {}