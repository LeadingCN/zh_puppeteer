import { ApiProperty } from '@nestjs/swagger';
import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
  Tree,
  TreeChildren, TreeParent
} from "typeorm";
import { BaseEntity } from '../base.entity';
import { ZH } from "@/entities/resource/zh.entity";
import {Link} from "@/entities/resource/link.entity";
import { Group } from "@/entities/resource/group.entity";
import { TopOrder } from "@/entities/order/top.entity";
@Entity({ name: 'sys_user' })
@Tree("closure-table")//TODO 自己加的
export default class SysUser extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column({ name: 'department_id' })
  @ApiProperty()
  departmentId: number;

  @Column()
  @ApiProperty()
  name: string;

  @Column({ unique: true })
  @ApiProperty()
  username: string;

  @Column()
  @ApiProperty()
  password: string;

  @Column({ length: 32 ,comment:'登录密码盐值'})
  @ApiProperty()
  psalt: string;

  @Column({ name: 'nick_name', nullable: true })
  @ApiProperty()
  nickName: string;

  @Column({ name: 'head_img', nullable: true })
  @ApiProperty()
  headImg: string;

  @Column({ nullable: true, default: '' })
  @ApiProperty()
  email: string;

  @Column({ nullable: true, default: '' })
  @ApiProperty()
  phone: string;

  @Column({ nullable: true, default: '' })
  @ApiProperty()
  remark: string;

  @Column({ type: 'tinyint', nullable: true, default: 1 })
  @ApiProperty()
  status: number;


  //代理用户属性
  @Column({ name: 'uuid',type: 'varchar', length: 64, unique: true,comment:"自身系统用户属性" })
  uuid: string;
  @TreeParent()
  parent:SysUser;

  @TreeChildren()
  children:SysUser[];

  @OneToMany(type=>ZH,zh=>zh.SysUser )
  zh:ZH[];

  @OneToMany(type=>Link,link=>link.SysUser)
  link:Link[];

  @OneToMany(type=>Group,Group=>Group.SysUser)
  group:Group[];

  @OneToMany(type=>TopOrder,topOrder=>topOrder.SysUser)
  topOrder:TopOrder[];


  @Column({ type: "int", comment: "余额",default:0})
  balance: number;

  @Column({ type: "int", comment: "代理商级别",default:0})
  lv: number;

  @Column({ type: "boolean", comment: "自身设置是否接单",default:true})
  selfOpen: boolean;
  @Column({ type: "boolean", comment: "父节点设置是否接单",default:true})
  parentOpen: boolean;
  @Column({ type: "int", comment: "父节点费率设置"})
  parentRate: number;

  @Column({type:"int",comment:"自身费率设 置费率 万份位 100 即 1%",default:100})
  rate:number;

  //上游商家属性
  @Column({ type: "varchar", comment: "md5盐值",default:""})
  md5key: string;
}
