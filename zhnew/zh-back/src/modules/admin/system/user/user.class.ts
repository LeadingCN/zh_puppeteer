import { ApiProperty } from '@nestjs/swagger';
import SysUser from '@/entities/admin/sys-user.entity';

export class AccountInfo {
  @ApiProperty()
  name: string;

  @ApiProperty()
  nickName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  remark: string;

  @ApiProperty()
  headImg: string;

  @ApiProperty()
  loginIp: string;



  @ApiProperty()
  roleLabel: string;//TODO 自己加的
  @ApiProperty()
  lv: number;//TODO 自己加的
  @ApiProperty()
  uuid: string;//TODO 自己加的
}

export class PageSearchUserInfo {
  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  departmentId: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  headImg: string;

  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  nickName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  remark: string;

  @ApiProperty()
  status: number;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  departmentName: string;

  @ApiProperty()
  roleNames: string[];
}

export class UserDetailInfo extends SysUser {
  @ApiProperty({
    description: '关联角色',
  })
  roles: number[];

  @ApiProperty({
    description: '关联部门名称',
  })
  departmentName: string;
}
