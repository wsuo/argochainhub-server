import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ShoppingCart, ShoppingCartStatus, CartItem, Product, Company, User } from '../entities';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { BatchRemoveFromCartDto } from './dto/batch-remove-from-cart.dto';

@Injectable()
export class ShoppingCartService {
  constructor(
    @InjectRepository(ShoppingCart)
    private shoppingCartRepository: Repository<ShoppingCart>,
    
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  /**
   * 获取或创建用户的活跃购物车
   */
  async getOrCreateActiveCart(userId: number): Promise<ShoppingCart> {
    let cart = await this.shoppingCartRepository.findOne({
      where: { userId, status: ShoppingCartStatus.ACTIVE },
      relations: ['items', 'items.product', 'items.supplier'],
    });

    if (!cart) {
      cart = this.shoppingCartRepository.create({
        userId,
        status: ShoppingCartStatus.ACTIVE,
      });
      await this.shoppingCartRepository.save(cart);
    }

    return cart;
  }

  /**
   * 获取用户购物车（按供应商分组）
   */
  async getCartBySupplier(userId: number) {
    const cart = await this.getOrCreateActiveCart(userId);
    
    if (!cart.items || cart.items.length === 0) {
      return {
        cart,
        supplierGroups: [],
        totalItems: 0,
      };
    }

    // 按供应商分组
    const supplierGroups = new Map();
    
    for (const item of cart.items) {
      const supplierId = item.supplierId;
      
      if (!supplierGroups.has(supplierId)) {
        supplierGroups.set(supplierId, {
          supplier: item.supplier,
          items: [],
        });
      }
      
      supplierGroups.get(supplierId).items.push(item);
    }

    return {
      cart,
      supplierGroups: Array.from(supplierGroups.values()),
      totalItems: cart.items.length,
    };
  }

  /**
   * 添加产品到购物车
   */
  async addToCart(userId: number, addToCartDto: AddToCartDto): Promise<CartItem> {
    const { productId, quantity, unit } = addToCartDto;

    // 检查产品是否存在并且可以上架
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['supplier'],
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    if (!product.isListed) {
      throw new BadRequestException('该产品未上架，无法添加到购物车');
    }

    // 获取或创建购物车
    const cart = await this.getOrCreateActiveCart(userId);

    // 检查是否已经存在相同的购物车项目
    const existingCartItem = await this.cartItemRepository.findOne({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (existingCartItem) {
      // 如果已存在，更新数量
      existingCartItem.quantity = quantity;
      existingCartItem.unit = unit;
      return await this.cartItemRepository.save(existingCartItem);
    }

    // 创建产品快照
    const productSnapshot = {
      name: product.name,
      pesticideName: product.pesticideName,
      formulation: product.formulation,
      totalContent: product.totalContent,
      activeIngredient1: product.activeIngredient1,
      activeIngredient2: product.activeIngredient2,
      activeIngredient3: product.activeIngredient3,
      minOrderQuantity: product.minOrderQuantity,
      minOrderUnit: product.minOrderUnit,
      registrationNumber: product.registrationNumber,
      registrationHolder: product.registrationHolder,
      effectiveDate: product.effectiveDate ? new Date(product.effectiveDate).toISOString() : undefined,
    };

    // 创建供应商快照
    const supplierSnapshot = {
      name: product.supplier.name,
      type: product.supplier.type,
      status: product.supplier.status,
    };

    // 创建新的购物车项目
    const cartItem = this.cartItemRepository.create({
      cartId: cart.id,
      productId,
      supplierId: product.supplierId,
      quantity,
      unit,
      productSnapshot,
      supplierSnapshot,
    });

    return await this.cartItemRepository.save(cartItem);
  }

  /**
   * 更新购物车项目
   */
  async updateCartItem(userId: number, cartItemId: number, updateDto: UpdateCartItemDto): Promise<CartItem> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart'],
    });

    if (!cartItem) {
      throw new NotFoundException('购物车项目不存在');
    }

    // 检查是否是该用户的购物车
    console.log('Debug - userId from JWT:', userId, 'type:', typeof userId);
    console.log('Debug - cart.userId from DB:', cartItem.cart.userId, 'type:', typeof cartItem.cart.userId);
    if (Number(cartItem.cart.userId) !== Number(userId)) {
      throw new ForbiddenException('无权限操作此购物车项目');
    }

    cartItem.quantity = updateDto.quantity;
    cartItem.unit = updateDto.unit;

    return await this.cartItemRepository.save(cartItem);
  }

  /**
   * 从购物车移除单个项目
   */
  async removeCartItem(userId: number, cartItemId: number): Promise<void> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart'],
    });

    if (!cartItem) {
      throw new NotFoundException('购物车项目不存在');
    }

    // 检查是否是该用户的购物车
    if (Number(cartItem.cart.userId) !== Number(userId)) {
      throw new ForbiddenException('无权限操作此购物车项目');
    }

    await this.cartItemRepository.remove(cartItem);
  }

  /**
   * 批量移除购物车项目
   */
  async batchRemoveCartItems(userId: number, batchRemoveDto: BatchRemoveFromCartDto): Promise<void> {
    let { cartItemIds } = batchRemoveDto;
    
    // 确保ID都是数字类型
    cartItemIds = cartItemIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id);

    if (cartItemIds.length === 0) {
      throw new BadRequestException('cartItemIds数组不能为空');
    }

    // 查找所有要删除的购物车项目
    const cartItems = await this.cartItemRepository.find({
      where: { id: In(cartItemIds) },
      relations: ['cart'],
    });

    // 检查所有项目是否属于该用户
    for (const cartItem of cartItems) {
      if (Number(cartItem.cart.userId) !== Number(userId)) {
        throw new ForbiddenException(`无权限操作购物车项目 ${cartItem.id}`);
      }
    }

    if (cartItems.length === 0) {
      throw new NotFoundException('没有找到要删除的购物车项目');
    }

    await this.cartItemRepository.remove(cartItems);
  }

  /**
   * 清空购物车
   */
  async clearCart(userId: number): Promise<void> {
    const cart = await this.shoppingCartRepository.findOne({
      where: { userId, status: ShoppingCartStatus.ACTIVE },
      relations: ['items'],
    });

    if (!cart || !cart.items?.length) {
      return;
    }

    await this.cartItemRepository.remove(cart.items);
  }

  /**
   * 获取用户购物车项目总数
   */
  async getCartItemsCount(userId: number): Promise<number> {
    const cart = await this.shoppingCartRepository.findOne({
      where: { userId, status: ShoppingCartStatus.ACTIVE },
    });

    if (!cart) {
      return 0;
    }

    return await this.cartItemRepository.count({
      where: { cartId: cart.id },
    });
  }

  /**
   * 获取特定供应商的购物车项目
   */
  async getCartItemsBySupplierId(userId: number, supplierId: number): Promise<CartItem[]> {
    const cart = await this.getOrCreateActiveCart(userId);
    
    return await this.cartItemRepository.find({
      where: {
        cartId: cart.id,
        supplierId,
      },
      relations: ['product', 'supplier'],
    });
  }

  /**
   * 验证购物车项目是否属于用户
   */
  async validateCartItemOwnership(userId: number, cartItemIds: number[]): Promise<CartItem[]> {
    const cartItems = await this.cartItemRepository.find({
      where: { id: In(cartItemIds) },
      relations: ['cart', 'product', 'supplier'],
    });

    // 检查所有项目是否属于该用户
    for (const cartItem of cartItems) {
      if (Number(cartItem.cart.userId) !== Number(userId)) {
        throw new ForbiddenException(`无权限操作购物车项目 ${cartItem.id}`);
      }
    }

    if (cartItems.length !== cartItemIds.length) {
      throw new NotFoundException('部分购物车项目不存在');
    }

    return cartItems;
  }
}