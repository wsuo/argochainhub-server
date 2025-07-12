import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../entities/admin-user.entity';
import { Company } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Plan } from '../entities/plan.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser, Company, User, Plan]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}