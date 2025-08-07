import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { InquiryItem } from './inquiry-item.entity';
import { SampleRequest } from './sample-request.entity';
import { RegistrationRequest } from './registration-request.entity';
import { ControlMethod } from './control-method.entity';
import { CartItem } from './cart-item.entity';
import { MultiLangText } from '../types/multilang';
import { 
  ActiveIngredient, 
  ToxicityLevel, 
  ProductStatus, 
  ProductDetails 
} from '../types/product';

@Entity('products')
export class Product extends BaseEntity {
  // ==================== 基础产品信息 ====================
  
  /** 产品名称（多语言） */
  @Column('json', { comment: '产品名称（多语言）' })
  name: MultiLangText;

  /** 农药名称（多语言） */
  @Column('json', { comment: '农药名称（多语言）' })
  pesticideName: MultiLangText;

  // ==================== 供应商信息 ====================
  
  /** 供应商ID */
  @Column({ type: 'bigint', unsigned: true, comment: '供应商ID' })
  supplierId: number;

  @ManyToOne(() => Company, (company) => company.products)
  @JoinColumn({ name: 'supplierId' })
  supplier: Company;

  // ==================== 订购信息 ====================
  
  /** 最低起订量 */
  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: true, 
    comment: '最低起订量' 
  })
  minOrderQuantity?: number;

  /** 最低起订量单位 */
  @Column({ 
    type: 'varchar', 
    length: 50, 
    nullable: true, 
    comment: '最低起订量单位' 
  })
  minOrderUnit?: string;

  // ==================== 注册证信息 ====================
  
  /** 登记证号 */
  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true, 
    comment: '登记证号' 
  })
  registrationNumber?: string;

  /** 登记证持有人 */
  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true, 
    comment: '登记证持有人' 
  })
  registrationHolder?: string;

  /** 有效截止日期 */
  @Column({ 
    type: 'date', 
    nullable: true, 
    comment: '有效截止日期' 
  })
  effectiveDate?: Date;

  /** 首次批准日期 */
  @Column({ 
    type: 'date', 
    nullable: true, 
    comment: '首次批准日期' 
  })
  firstApprovalDate?: Date;

  // ==================== 产品规格信息 ====================
  
  /** 剂型（字典值） */
  @Column({ 
    type: 'varchar', 
    length: 50, 
    nullable: true, 
    comment: '剂型（字典值）' 
  })
  formulation?: string;

  /** 总含量 */
  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true, 
    comment: '总含量' 
  })
  totalContent?: string;

  /** 毒性等级（字典值） */
  @Column({ 
    type: 'enum', 
    enum: ToxicityLevel, 
    nullable: true, 
    comment: '毒性等级（字典值）' 
  })
  toxicity?: ToxicityLevel;

  // ==================== 有效成分信息 ====================
  
  /** 有效成分1 */
  @Column('json', { nullable: true, comment: '有效成分1' })
  activeIngredient1?: ActiveIngredient;

  /** 有效成分2 */
  @Column('json', { nullable: true, comment: '有效成分2' })
  activeIngredient2?: ActiveIngredient;

  /** 有效成分3 */
  @Column('json', { nullable: true, comment: '有效成分3' })
  activeIngredient3?: ActiveIngredient;

  // ==================== 产品详情 ====================
  
  /** 产品详细信息（包含说明、品类、备注、出口限制等） */
  @Column('json', { nullable: true, comment: '产品详细信息' })
  details?: ProductDetails;

  // ==================== 状态信息 ====================
  
  /** 是否上架 */
  @Column({ 
    type: 'boolean', 
    default: false, 
    comment: '是否上架' 
  })
  isListed: boolean;

  /** 产品状态 */
  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
    comment: '产品状态'
  })
  status: ProductStatus;

  /** 拒绝原因（审核被拒时填写） */
  @Column('text', { nullable: true, comment: '拒绝原因' })
  rejectionReason?: string;

  // ==================== 关联关系 ====================
  
  @OneToMany(() => InquiryItem, (inquiryItem) => inquiryItem.product)
  inquiryItems: InquiryItem[];

  @OneToMany(() => SampleRequest, (sampleRequest) => sampleRequest.product)
  sampleRequests: SampleRequest[];

  @OneToMany(() => RegistrationRequest, (regRequest) => regRequest.product)
  registrationRequests: RegistrationRequest[];

  // 防治方法关联（一对多）
  @OneToMany(() => ControlMethod, (controlMethod) => controlMethod.product)
  controlMethods: ControlMethod[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];

  // ==================== 辅助方法 ====================
  
  /** 获取所有有效成分（过滤空值） */
  getAllActiveIngredients(): ActiveIngredient[] {
    const ingredients: ActiveIngredient[] = [];
    
    if (this.activeIngredient1) ingredients.push(this.activeIngredient1);
    if (this.activeIngredient2) ingredients.push(this.activeIngredient2);
    if (this.activeIngredient3) ingredients.push(this.activeIngredient3);
    
    return ingredients;
  }

  /** 检查是否可以上架 */
  canBeListed(): boolean {
    // 检查状态是否为ACTIVE
    if (this.status !== ProductStatus.ACTIVE) {
      return false;
    }
    
    // 检查是否有登记证号
    if (!this.registrationNumber) {
      return false;
    }
    
    // 检查是否有有效期
    if (!this.effectiveDate) {
      return false;
    }
    
    // 比较日期：将有效期转换为Date对象进行比较
    const now = new Date();
    const effectiveDate = new Date(this.effectiveDate);
    
    // 只比较日期部分，忽略时间
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const effectiveDateOnly = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), effectiveDate.getDate());
    
    return nowDateOnly <= effectiveDateOnly;
  }
}

// 重新导出状态枚举以保持向后兼容
export { ProductStatus, ToxicityLevel };
