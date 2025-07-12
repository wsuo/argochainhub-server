import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { Plan } from '../entities/plan.entity';
import { User } from '../entities/user.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { getTextByLanguage } from '../types/multilang';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async createOrder(user: User, planId: number): Promise<Order> {
    const plan = await this.planRepository.findOne({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // 生成订单号
    const orderNo = this.generateOrderNumber();

    const order = this.orderRepository.create({
      orderNo,
      companyId: user.companyId,
      userId: user.id,
      planId: plan.id,
      planName: getTextByLanguage(plan.name, 'zh-CN'),
      amount: plan.price,
      status: OrderStatus.PENDING_PAYMENT,
    });

    return this.orderRepository.save(order);
  }

  async getMyOrders(
    user: User,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Order>> {
    const { page = 1, limit = 20 } = paginationDto;

    const [orders, total] = await this.orderRepository.findAndCount({
      where: { companyId: user.companyId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: orders,
      meta: {
        totalItems: total,
        itemCount: orders.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getOrderDetail(user: User, id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, companyId: user.companyId },
      relations: ['plan', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD${timestamp}${random}`;
  }

  // TODO: 实现支付处理逻辑
  async processPayment(orderId: number, paymentData: any): Promise<Order> {
    // 这里应该集成支付网关（如Stripe, PayPal等）
    // 目前只是一个占位符实现
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 模拟支付成功
    order.status = OrderStatus.PAID;
    order.paidAt = new Date();
    order.paymentGatewayTxnId = `txn_${Date.now()}`;

    return this.orderRepository.save(order);
  }
}
