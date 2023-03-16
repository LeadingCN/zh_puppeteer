import { BaseEntity } from "@/entities/base.entity";
import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, OneToMany } from "typeorm";
import {ZH} from "@/entities/resource/zh.entity";
import SysUser from "@/entities/admin/sys-user.entity";
@Entity( {name:'link' })
export class Link extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type:"int",comment:"充值金额,除100"})
  amount: number;

  @Column({type:"int",comment:"提取的上游商家id 0则未提取",default:0})
  mid: number;

  @Column({type:"varchar",length:512})
  url:string;

  @Column({type:"int",comment:"支付状态:-1支付失败,0未支付,1支付成功,2支付中",default:0})
  paymentStatus: number;

  @Column({type:"varchar",length:64,comment:"自身系统订单号",nullable:true})
  tid:string;

  @Column({type:"int",comment:"创建状态:-1创建失败,0未创建,1创建成功,2创建中",default:1})
  createStatus: number;

  @Column({type:"varchar",length:64,comment:"TX平台订单号",unique:true})
  oid:string;

  @Column({comment:"锁定时间",default:() => "CURRENT_TIMESTAMP"})
  lockTime:Date;

  @Column({type:"int",comment:"支付通道id"})
  channel:number;

  @Column({type:"int",comment:"父级支付通道id"})
  parentChannel:number

  @Column({ type: 'boolean',comment:"链接是否复用,继承账号的该状态" })
  reuse:boolean

  @Column({ type: 'int',comment:"乐观锁",default:0 })
  version:number

  @ManyToOne(type => ZH, ZH => ZH.link)
  zh: ZH;

  @ManyToOne(type => SysUser,SysUser=>SysUser.link)
  SysUser: SysUser;



}
