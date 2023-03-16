import { BaseEntity } from "@/entities/base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { PrimaryGeneratedColumn, Column, Entity, ManyToOne } from "typeorm";
import { ZH } from "@/entities/resource/zh.entity";
import SysUser from "@/entities/admin/sys-user.entity";

@Entity({ name: "top_order" })
export class TopOrder extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" ,comment:"订单金额"})
  amount: number;

  @Column({ type: "int",comment:"上游商家id" })
  mid: number;


  @Column({ type: "int",comment:"支付状态:-1支付超时,0未支付,1支付成功,2支付中 3强制回调 4支付成功强制回调",default:2 })
  status: number;

  @Column({type:"varchar",length:64,comment:"订单出错事件",nullable:true})
  errInfo: string;

  @Column({type:"varchar",length:64,comment:"自身平台订单号",unique:true})
  oid:string;

  @Column({type:"varchar",length:64,comment:"上游平台订单号",unique:true})
  mOid:string;

  @Column({type:"varchar",length:64,comment:"上游平台客户请求ip",nullable:true})
  mIp:string;

  @Column({type:"varchar",length:256,comment:"上游平台回调地址"})
  mNotifyUrl:string;

  @Column({type:"varchar",length:256,comment:"上游平台回调状态信息",nullable:true})
  callbackInfo:string;

  @Column({type:"int",comment:"上游平台回调状态 0等待支付回调  1 回调成功 2 回调失败 3 强制回调 ",default:0})
  callback:number;

  @Column({type:"int",comment:"支付通道类型"})
  channel:number;

  @Column({type:"int",comment:"支付通道根类型"})
  parentChannel:number;

  @Column({type:"varchar",length:256,comment:"订单创建时使用的链接的oid"})
  lOid:string;

  @Column({type:"int",comment:"订单创建时该链接的支付通道实际费率"})
  lRate:number;

  //订单绑定 zh
  @ManyToOne(type => ZH, zh => zh.topOrder)
  zh: ZH;

  //订单绑定 proxy用户
  @ManyToOne(type => SysUser, sysUser => sysUser.topOrder)
  SysUser: SysUser;

}
