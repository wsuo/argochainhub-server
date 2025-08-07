import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { CartItem } from './cart-item.entity';

export enum ShoppingCartStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('shopping_carts')
export class ShoppingCart extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ShoppingCartStatus,
    default: ShoppingCartStatus.ACTIVE,
    comment: '购物车状态'
  })
  status: ShoppingCartStatus;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true, comment: '用户ID' })
  userId: number;

  @ManyToOne(() => User, (user) => user.shoppingCarts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
  items: CartItem[];

  // 辅助方法
  /** 获取购物车中的产品总数 */
  getTotalItemsCount(): number {
    return this.items?.length || 0;
  }

  /** 按供应商分组获取购物车项目 */
  getItemsBySupplier(): Map<number, CartItem[]> {
    const supplierMap = new Map<number, CartItem[]>();
    
    if (!this.items) return supplierMap;
    
    this.items.forEach(item => {
      const supplierId = item.supplierId;
      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, []);
      }
      supplierMap.get(supplierId)!.push(item);
    });
    
    return supplierMap;
  }
}