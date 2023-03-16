import { BaseEntity } from "@/entities/base.entity";
import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, OneToMany, ManyToMany, JoinTable, OneToOne } from "typeorm";
import SysUser from "@/entities/admin/sys-user.entity";
import { ZH } from "@/entities/resource/zh.entity";
@Entity({ name: "group" })
export class Group extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 50 })
  name: string;

  @ManyToOne(type => SysUser,SysUser=>SysUser.group)
  SysUser: SysUser;

  @ManyToMany(type => ZH, ZH => ZH.group)
  children: ZH[];

}
