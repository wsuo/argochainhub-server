import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ShoppingCart } from './shopping-cart.entity';
import { Product } from './product.entity';
import { Company } from './company.entity';
import { MultiLangText } from '../types/multilang';

@Entity('cart_items')
export class CartItem extends BaseEntity {
  @Column('decimal', { 
    precision: 15, 
    scale: 3,
    comment: '数量'
  })
  quantity: number;

  @Column({ 
    length: 50,
    comment: '单位'
  })
  unit: string;

  @Column('json', {
    comment: '产品快照（保存添加到购物车时的产品信息）'
  })
  productSnapshot: {
    name: MultiLangText;
    pesticideName: MultiLangText;
    formulation?: string;
    totalContent?: string;
    activeIngredient1?: {
      name: MultiLangText;
      content: string;
    };
    activeIngredient2?: {
      name: MultiLangText;
      content: string;
    };
    activeIngredient3?: {
      name: MultiLangText;
      content: string;
    };
    minOrderQuantity?: number;
    minOrderUnit?: string;
    registrationNumber?: string;
    registrationHolder?: string;
    effectiveDate?: string;
  };

  @Column('json', {
    comment: '供应商信息快照'
  })
  supplierSnapshot: {
    name: MultiLangText;
    type: string;
    status: string;
  };

  // 关联关系
  @Column({ type: 'bigint', unsigned: true, comment: '购物车ID' })
  cartId: number;

  @ManyToOne(() => ShoppingCart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: ShoppingCart;

  @Column({ type: 'bigint', unsigned: true, comment: '产品ID' })
  productId: number;

  @ManyToOne(() => Product, (product) => product.cartItems)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'bigint', unsigned: true, comment: '供应商ID' })
  supplierId: number;

  @ManyToOne(() => Company, (company) => company.cartItems)
  @JoinColumn({ name: 'supplierId' })
  supplier: Company;

  // 辅助方法
  /** 检查是否超过最低订购量 */
  isValidQuantity(): boolean {
    const minOrderQty = this.productSnapshot.minOrderQuantity;
    const minOrderUnit = this.productSnapshot.minOrderUnit;
    
    if (!minOrderQty || !minOrderUnit) return true;
    
    // 如果单位不一致，暂时认为有效（需要单位转换逻辑）
    if (this.unit !== minOrderUnit) return true;
    
    return this.quantity >= minOrderQty;
  }

  /** 获取有效期状态 */
  isEffective(): boolean {
    const effectiveDate = this.productSnapshot.effectiveDate;
    if (!effectiveDate) return true;
    
    const now = new Date();
    const effective = new Date(effectiveDate);
    
    return now <= effective;
  }
}