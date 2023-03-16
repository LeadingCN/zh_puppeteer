import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";
import { id } from "date-fns/locale";

export class CreateNewtestDto {}
export class getoneNewtestDto {
  @ApiProperty({
    required: false,
    default: 100,
    description: '测试id',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  id:number;

  @ApiProperty({
    required: false,
    default: 50,
    description: '测试名字',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  name:string
}