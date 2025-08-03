import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionType,
} from '../entities/subscription.entity';
import { Plan } from '../entities/plan.entity';
import { User } from '../entities/user.entity';
import { QuotaService } from '../quota/quota.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly quotaService: QuotaService,
  ) {}

  async getCurrentSubscription(user: User) {
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        companyId: user.companyId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
      order: { endDate: 'DESC' },
    });

    if (!activeSubscription) {
      return {
        hasActiveSubscription: false,
        message: 'No active subscription found',
      };
    }

    const now = new Date();
    const isExpired = activeSubscription.endDate < now;

    if (isExpired) {
      // 更新过期状态
      await this.subscriptionRepository.update(activeSubscription.id, {
        status: SubscriptionStatus.EXPIRED,
      });

      return {
        hasActiveSubscription: false,
        message: 'Subscription has expired',
        expiredSubscription: {
          planName: activeSubscription.plan.name,
          endDate: activeSubscription.endDate,
        },
      };
    }

    return {
      hasActiveSubscription: true,
      subscription: {
        id: activeSubscription.id,
        planName: activeSubscription.plan.name,
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        type: activeSubscription.type,
        status: activeSubscription.status,
        plan: activeSubscription.plan,
      },
    };
  }

  async getQuotaUsage(user: User) {
    if (!user.companyId) {
      throw new BadRequestException('User must be associated with a company to check quota usage');
    }
    return this.quotaService.getQuotaUsage(user.companyId);
  }

  async createTrialSubscription(user: User, planId: number) {
    // 检查是否已有试用订阅
    const existingTrial = await this.subscriptionRepository.findOne({
      where: {
        companyId: user.companyId,
        type: SubscriptionType.TRIAL,
      },
    });

    if (existingTrial) {
      throw new BadRequestException('Trial subscription already exists');
    }

    // 检查计划是否存在
    const plan = await this.planRepository.findOne({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // 创建试用订阅（通常为7天或30天）
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7); // 7天试用

    const subscription = this.subscriptionRepository.create({
      companyId: user.companyId,
      planId: plan.id,
      startDate,
      endDate,
      type: SubscriptionType.TRIAL,
      status: SubscriptionStatus.ACTIVE,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(user: User) {
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        companyId: user.companyId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!activeSubscription) {
      throw new NotFoundException('No active subscription found');
    }

    // 取消订阅（在当前周期结束时生效）
    await this.subscriptionRepository.update(activeSubscription.id, {
      status: SubscriptionStatus.CANCELLED,
    });

    return {
      message: 'Subscription cancelled successfully',
      endDate: activeSubscription.endDate,
    };
  }
}
