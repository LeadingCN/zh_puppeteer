import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional,IsString,MaxLength,MinLength } from "class-validator";
export class PageQuery {
  @ApiProperty({ description: "页码", example: 1 })
  @Type(() => Number)
  @IsInt({ message: "页码必须是整数" })
  page: number;

  @ApiProperty({ description: "每页数量", example: 10 })
  @Type(() => Number)
  @IsInt({ message: "每页数量必须是整数" })
  limit: number;
}

export class AddTopUser {
  @IsString()
  @MinLength(6,{message:'用户名最少6位'})
  @MaxLength(20,{message:'用户名最多20位'})
  username:string;
  @IsString()
  @MinLength(6,{message:'密码最少6位'})
  @MaxLength(20,{message:'密码最多20位'})
  password:string;
  @IsString()
  @MinLength(2,{message:'昵称最少2位'})
  @MaxLength(20,{message:'昵称最多20位'})
  nickName:string;
}
