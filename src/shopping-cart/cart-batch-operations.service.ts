import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry, InquiryItem, SampleRequest, RegistrationRequest, User } from '../entities';
import { ShoppingCartService } from './shopping-cart.service';
import { BatchCreateInquiryDto } from './dto/batch-create-inquiry.dto';
import { BatchCreateSampleRequestDto } from './dto/batch-create-sample-request.dto';
import { BatchCreateRegistrationRequestDto } from './dto/batch-create-registration-request.dto';

@Injectable()
export class CartBatchOperationsService {
  constructor(
    @InjectRepository(Inquiry)
    private inquiryRepository: Repository<Inquiry>,
    
    @InjectRepository(InquiryItem)
    private inquiryItemRepository: Repository<InquiryItem>,
    
    @InjectRepository(SampleRequest)
    private sampleRequestRepository: Repository<SampleRequest>,
    
    @InjectRepository(RegistrationRequest)
    private registrationRequestRepository: Repository<RegistrationRequest>,
    
    @InjectRepository(User)
    private userRepository: Repository<User>,
    
    private shoppingCartService: ShoppingCartService,
  ) {}

  /**
   * 批量创建询价
   */
  async batchCreateInquiry(userId: number, batchInquiryDto: BatchCreateInquiryDto): Promise<Inquiry> {
    const { supplierId, items, deliveryLocation, tradeTerms, paymentMethod, buyerRemarks } = batchInquiryDto;

    // 验证购物车项目的所有权
    const cartItemIds = items.map(item => item.cartItemId);
    const cartItems = await this.shoppingCartService.validateCartItemOwnership(userId, cartItemIds);

    // 验证所有购物车项目都属于同一供应商
    const uniqueSupplierIds = [...new Set(cartItems.map(item => item.supplierId))];
    if (uniqueSupplierIds.length > 1) {
      throw new BadRequestException('所有购物车项目必须属于同一供应商');
    }

    if (uniqueSupplierIds[0] !== supplierId) {
      throw new BadRequestException('购物车项目的供应商与指定供应商不匹配');
    }

    // 获取用户的企业ID
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'companyId', 'userType'],
    });

    if (!user || !user.companyId) {
      throw new BadRequestException('只有企业用户可以创建询价');
    }

    const buyerId = user.companyId;

    // 生成询价单号
    const inquiryNo = this.generateInquiryNo();

    // 创建询价单
    const inquiry = this.inquiryRepository.create({
      inquiryNo,
      buyerId,
      supplierId,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 默认7天后截止
      details: {
        deliveryLocation,
        tradeTerms,
        paymentMethod,
        buyerRemarks,
      },
    });

    const savedInquiry = await this.inquiryRepository.save(inquiry);

    // 创建询价项目
    const inquiryItems: InquiryItem[] = [];
    for (let i = 0; i < cartItems.length; i++) {
      const cartItem = cartItems[i];
      const itemDto = items.find(item => item.cartItemId === cartItem.id);
      
      const inquiryItem = this.inquiryItemRepository.create({
        inquiryId: savedInquiry.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        unit: cartItem.unit,
        packagingReq: itemDto?.packagingReq,
        productSnapshot: cartItem.productSnapshot,
      });

      inquiryItems.push(inquiryItem);
    }

    await this.inquiryItemRepository.save(inquiryItems);

    return savedInquiry;
  }

  /**
   * 批量创建样品申请
   */
  async batchCreateSampleRequest(userId: number, batchSampleDto: BatchCreateSampleRequestDto): Promise<SampleRequest[]> {
    const { supplierId, items, purpose, shippingAddress, shippingMethod } = batchSampleDto;

    // 验证购物车项目的所有权
    const cartItemIds = items.map(item => item.cartItemId);
    const cartItems = await this.shoppingCartService.validateCartItemOwnership(userId, cartItemIds);

    // 验证所有购物车项目都属于同一供应商
    const uniqueSupplierIds = [...new Set(cartItems.map(item => item.supplierId))];
    if (uniqueSupplierIds.length > 1) {
      throw new BadRequestException('所有购物车项目必须属于同一供应商');
    }

    if (uniqueSupplierIds[0] !== supplierId) {
      throw new BadRequestException('购物车项目的供应商与指定供应商不匹配');
    }

    // 获取用户的企业ID
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'companyId', 'userType'],
    });

    if (!user || !user.companyId) {
      throw new BadRequestException('只有企业用户可以申请样品');
    }

    const buyerId = user.companyId;

    // 创建样品申请
    const sampleRequests: SampleRequest[] = [];
    for (let i = 0; i < cartItems.length; i++) {
      const cartItem = cartItems[i];
      const itemDto = items.find(item => item.cartItemId === cartItem.id);
      
      if (!itemDto) continue;

      const sampleReqNo = this.generateSampleRequestNo();
      
      const sampleRequest = this.sampleRequestRepository.create({
        sampleReqNo,
        buyerId,
        supplierId,
        productId: cartItem.productId,
        quantity: itemDto.quantity,
        unit: itemDto.unit,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 默认7天后截止
        details: {
          purpose,
          shippingAddress,
          shippingMethod,
        },
        productSnapshot: {
          name: cartItem.productSnapshot.name?.['zh-CN'] || '未知产品',
          category: '农药',
          formulation: cartItem.productSnapshot.formulation || '',
          activeIngredient: cartItem.productSnapshot.activeIngredient1?.name?.['zh-CN'] || '',
          content: cartItem.productSnapshot.totalContent || '',
        },
      });

      sampleRequests.push(sampleRequest);
    }

    return await this.sampleRequestRepository.save(sampleRequests);
  }

  /**
   * 批量创建登记申请
   */
  async batchCreateRegistrationRequest(userId: number, batchRegDto: BatchCreateRegistrationRequestDto): Promise<RegistrationRequest[]> {
    const { 
      supplierId, 
      items, 
      targetCountry, 
      isExclusive, 
      docReqs, 
      timeline, 
      budgetAmount, 
      budgetCurrency, 
      additionalRequirements 
    } = batchRegDto;

    // 验证购物车项目的所有权
    const cartItemIds = items.map(item => item.cartItemId);
    const cartItems = await this.shoppingCartService.validateCartItemOwnership(userId, cartItemIds);

    // 验证所有购物车项目都属于同一供应商
    const uniqueSupplierIds = [...new Set(cartItems.map(item => item.supplierId))];
    if (uniqueSupplierIds.length > 1) {
      throw new BadRequestException('所有购物车项目必须属于同一供应商');
    }

    if (uniqueSupplierIds[0] !== supplierId) {
      throw new BadRequestException('购物车项目的供应商与指定供应商不匹配');
    }

    // 获取用户的企业ID
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'companyId', 'userType'],
    });

    if (!user || !user.companyId) {
      throw new BadRequestException('只有企业用户可以申请登记');
    }

    const buyerId = user.companyId;

    // 创建登记申请
    const registrationRequests: RegistrationRequest[] = [];
    for (const cartItem of cartItems) {
      const regReqNo = this.generateRegistrationRequestNo();
      
      const registrationRequest = this.registrationRequestRepository.create({
        regReqNo,
        buyerId,
        supplierId,
        productId: cartItem.productId,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 默认30天后截止
        details: {
          targetCountry,
          isExclusive,
          docReqs,
          timeline,
          budget: budgetAmount ? {
            amount: budgetAmount,
            currency: budgetCurrency || 'USD',
          } : undefined,
          additionalRequirements,
        },
        productSnapshot: {
          name: cartItem.productSnapshot.name?.['zh-CN'] || '未知产品',
          category: '农药',
          formulation: cartItem.productSnapshot.formulation || '',
          activeIngredient: cartItem.productSnapshot.activeIngredient1?.name?.['zh-CN'] || '',
          content: cartItem.productSnapshot.totalContent || '',
        },
      });

      registrationRequests.push(registrationRequest);
    }

    return await this.registrationRequestRepository.save(registrationRequests);
  }

  /**
   * 生成询价单号
   */
  private generateInquiryNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INQ${dateStr}${timeStr}${random}`;
  }

  /**
   * 生成样品申请单号
   */
  private generateSampleRequestNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SAM${dateStr}${timeStr}${random}`;
  }

  /**
   * 生成登记申请单号
   */
  private generateRegistrationRequestNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REG${dateStr}${timeStr}${random}`;
  }
}