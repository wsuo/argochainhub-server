import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Inquiry } from '../entities/inquiry.entity';
import { SampleRequest } from '../entities/sample-request.entity';
import { RegistrationRequest } from '../entities/registration-request.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { Subscription } from '../entities/subscription.entity';
import { Order } from '../entities/order.entity';
import { Plan } from '../entities/plan.entity';
import { DictionaryCategory } from '../entities/dictionary-category.entity';
import { DictionaryItem } from '../entities/dictionary-item.entity';
import { AdminController } from './admin.controller';
import { DictionaryController, PublicDictionaryController } from './dictionary.controller';
import { AdminService } from './admin.service';
import { DictionaryService } from './services/dictionary.service';
import { CountryDictionaryService } from './services/country-dictionary.service';
import { DictionaryInitService } from './services/dictionary-init.service';
import { VolcTranslateService } from './services/volc-translate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      User,
      Product,
      Inquiry,
      SampleRequest,
      RegistrationRequest,
      AdminUser,
      Subscription,
      Order,
      Plan,
      DictionaryCategory,
      DictionaryItem,
    ]),
  ],
  controllers: [AdminController, DictionaryController, PublicDictionaryController],
  providers: [
    AdminService, 
    DictionaryService,
    CountryDictionaryService,
    DictionaryInitService,
    VolcTranslateService,
  ],
  exports: [
    AdminService, 
    DictionaryService,
    CountryDictionaryService,
    DictionaryInitService,
    VolcTranslateService,
  ],
})
export class AdminModule {}
