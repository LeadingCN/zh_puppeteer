import { BaseEntity } from "@/entities/base.entity";
import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, OneToMany, ManyToMany, JoinTable } from "typeorm";
import SysUser from "@/entities/admin/sys-user.entity";
import {Link} from "@/entities/resource/link.entity";
import { Group } from "@/entities/resource/group.entity";
import { TopOrder } from "@/entities/order/top.entity";
@Entity( {name:'zh' })
export class ZH extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'varchar', length: 50 ,unique:true})
  accountNumber: string;
  @Column({ type: "text" })
  cookie: string;

  @Column({ type: 'int',comment:"账号QB余额,除100",default:0 })
  balance: number;
  @Column({ type: 'int',comment:"锁定金额",default:0 })
  balanceLock: number;

  @Column({ type: 'int',comment:"当天充值金额限制,除100",default:10000 })
  rechargeLimit: number;
  @Column({ type: 'int',comment:"当天锁定限额,特定时间归0",default:0 })
  lockLimit: number;

  @Column({ type: 'int',comment:"充值总额",default:0 })
  totalRecharge: number;

  @Column({ type: 'boolean',comment:"是否开启充值",default:true})
  open:boolean

  @Column({ type: 'boolean',comment:"链接是否复用",default:true })
  reuse:boolean
  @Column({ type: 'varchar',length:64, comment:"账号uid",unique:true })
  zuid: string;

  @Column({ type: 'varchar',length:128, comment:"" })
  openid: string;
  @Column({ type: 'varchar',length:128, comment:"" })
  openkey: string;

  @Column({ type: 'int', comment:"账号权重,即生产的链接优先级,默认1",default:0 })
  weight: number;

  @ManyToOne(type => SysUser, SysUser => SysUser.id)
  SysUser: SysUser;

  @OneToMany(type => Link, Link => Link.zh)
  link: Link[];

  @ManyToMany(type => Group, Group => Group.children)
  @JoinTable()
  group: Group[];

  @OneToMany(type => TopOrder, topOrder => topOrder.zh)
  topOrder: TopOrder[];

}
