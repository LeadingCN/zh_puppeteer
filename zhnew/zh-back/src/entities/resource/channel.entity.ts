import { BaseEntity } from "@/entities/base.entity";
import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, TreeChildren, TreeParent, Tree } from "typeorm";

@Entity({ name: "channel" })
@Tree("closure-table")//TODO 自己加的
export class Channel extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  rate: string;

  @Column({ type: "int", default: 60 * 60 * 24, comment: "默认过期时间" })
  expireTime: number;


  @TreeChildren()
  children: Channel[];

  @TreeParent(

  )
  parent: Channel;


}
