import { BaseEntity } from "@/entities/base.entity";
import { ApiProperty } from '@nestjs/swagger';
import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

@Entity( {name:'new_test' })
export class Newtest extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'varchar', length: 50, unique: true })
  @ApiProperty()
  name: string;
}
