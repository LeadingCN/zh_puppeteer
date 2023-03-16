import { BaseEntity } from "@/entities/base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { PrimaryGeneratedColumn, Column, Entity } from "typeorm";

export enum TypeEnum {
  ADD = "ADD",
  REDUCE = "REDUCE"
}

export enum EventEnum {
  recharge = "recharge",
  deduction = "deduction",
  commission = "commission",
  topOrder = "topOrder",
  topOrderRe = "topOrderRe",
  rechargeSub = "rechargeSub",
}

@Entity({ name: "sys_balance_log" })
export class SysBalanceLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: "varchar", length: 32, comment: "用户uuid" })
  uuid: string;
  @Column({ comment: "类型,增加还是减少" })
  typeEnum: string;

  @Column({ type: "int", comment: "金额" })
  amount: number;

  @Column({ comment: "事件 充值,扣费,佣金,上游订单,上游订单超时退款" })
  event: string;
  @Column({ type: "varchar", length: 64, comment: "执行事件的发起用户",default:"" })
  actionUuid: string;
  @Column({ type: "varchar", length: 64, comment: "或者自身平台订单oid号",default:"" })
  orderUuid: string;
  @Column({ comment: "执行后余额" })
  balance: number;

}
