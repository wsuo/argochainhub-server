import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { Inquiry } from '../entities/inquiry.entity';
import { SampleRequest } from '../entities/sample-request.entity';
import { RegistrationRequest } from '../entities/registration-request.entity';
import { Product } from '../entities/product.entity';

export enum QuotaType {
  INQUIRY = 'inquiry',
  SAMPLE_REQUEST = 'sample_request',
  REGISTRATION_REQUEST = 'registration_request',
  PRODUCT = 'product',
  AI_QUERY = 'ai_query',
}

interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  message?: string;
}

@Injectable()
export class QuotaService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(SampleRequest)
    private readonly sampleRequestRepository: Repository<SampleRequest>,
    @InjectRepository(RegistrationRequest)
    private readonly registrationRequestRepository: Repository<RegistrationRequest>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async checkQuota(
    companyId: number,
    quotaType: QuotaType,
  ): Promise<QuotaCheckResult> {
    // 获取当前有效订阅
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        companyId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
      order: { endDate: 'DESC' },
    });

    if (!activeSubscription) {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        message: 'No active subscription found',
      };
    }

    // 检查订阅是否过期
    const now = new Date();
    if (activeSubscription.endDate < now) {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        message: 'Subscription has expired',
      };
    }

    // 获取配额限制
    const specs = activeSubscription.plan.specs;
    let limit = 0;
    let currentUsage = 0;

    switch (quotaType) {
      case QuotaType.INQUIRY:
        limit = specs.inquiriesMonthly || 0;
        currentUsage = await this.getCurrentMonthlyUsage(companyId, 'inquiry');
        break;
      case QuotaType.SAMPLE_REQUEST:
        limit = specs.sampleRequestsMonthly || 0;
        currentUsage = await this.getCurrentMonthlyUsage(
          companyId,
          'sample_request',
        );
        break;
      case QuotaType.REGISTRATION_REQUEST:
        limit = specs.registrationRequestsMonthly || 0;
        currentUsage = await this.getCurrentMonthlyUsage(
          companyId,
          'registration_request',
        );
        break;
      case QuotaType.PRODUCT:
        limit = specs.productsLimit || 0;
        currentUsage = await this.getCurrentProductCount(companyId);
        break;
      case QuotaType.AI_QUERY:
        limit = specs.aiQueriesMonthly || 0;
        // AI查询使用量需要从其他地方获取，这里暂时返回0
        currentUsage = 0;
        break;
      default:
        return {
          allowed: false,
          remaining: 0,
          limit: 0,
          message: 'Unknown quota type',
        };
    }

    const remaining = Math.max(0, limit - currentUsage);
    const allowed = remaining > 0;

    return {
      allowed,
      remaining,
      limit,
      message: allowed ? undefined : 'Quota limit exceeded',
    };
  }

  private async getCurrentMonthlyUsage(
    companyId: number,
    type: string,
  ): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    switch (type) {
      case 'inquiry':
        return this.inquiryRepository.count({
          where: {
            buyerId: companyId,
            createdAt: Between(startOfMonth, endOfMonth),
          },
        });
      case 'sample_request':
        return this.sampleRequestRepository.count({
          where: {
            buyerId: companyId,
            createdAt: Between(startOfMonth, endOfMonth),
          },
        });
      case 'registration_request':
        return this.registrationRequestRepository.count({
          where: {
            buyerId: companyId,
            createdAt: Between(startOfMonth, endOfMonth),
          },
        });
      default:
        return 0;
    }
  }

  private async getCurrentProductCount(companyId: number): Promise<number> {
    return this.productRepository.count({
      where: {
        supplierId: companyId,
      },
    });
  }

  async getQuotaUsage(companyId: number) {
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        companyId,
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

    const specs = activeSubscription.plan.specs;
    const inquiryUsage = await this.getCurrentMonthlyUsage(
      companyId,
      'inquiry',
    );
    const sampleRequestUsage = await this.getCurrentMonthlyUsage(
      companyId,
      'sample_request',
    );
    const registrationRequestUsage = await this.getCurrentMonthlyUsage(
      companyId,
      'registration_request',
    );
    const productUsage = await this.getCurrentProductCount(companyId);

    return {
      hasActiveSubscription: true,
      planName: activeSubscription.plan.name,
      endDate: activeSubscription.endDate,
      quotas: {
        inquiries: {
          used: inquiryUsage,
          limit: specs.inquiriesMonthly || 0,
          remaining: Math.max(0, (specs.inquiriesMonthly || 0) - inquiryUsage),
        },
        sampleRequests: {
          used: sampleRequestUsage,
          limit: specs.sampleRequestsMonthly || 0,
          remaining: Math.max(
            0,
            (specs.sampleRequestsMonthly || 0) - sampleRequestUsage,
          ),
        },
        registrationRequests: {
          used: registrationRequestUsage,
          limit: specs.registrationRequestsMonthly || 0,
          remaining: Math.max(
            0,
            (specs.registrationRequestsMonthly || 0) - registrationRequestUsage,
          ),
        },
        products: {
          used: productUsage,
          limit: specs.productsLimit || 0,
          remaining: Math.max(0, (specs.productsLimit || 0) - productUsage),
        },
        aiQueries: {
          used: 0, // TODO: 实现AI查询计数
          limit: specs.aiQueriesMonthly || 0,
          remaining: specs.aiQueriesMonthly || 0,
        },
      },
    };
  }
}
