import { BaseEntity } from "@/entities/base.entity";
import { PrimaryGeneratedColumn, Column, Entity,ManyToOne } from 'typeorm';

@Entity( {name:'sub_channel' })
export class SubChannel extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;


}
