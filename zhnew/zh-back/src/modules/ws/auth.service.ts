import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isEmpty } from 'lodash';
import { SocketException } from 'src/common/exceptions/socket.exception';
import { IAdminUser } from '../admin/admin.interface';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  checkAdminAuthToken(
    token: string | string[] | undefined,
  ): IAdminUser | never {
    if (isEmpty(token)) {
      console.log("没有挂载token")
      throw new SocketException(11001);
    }
    try {
      // 挂载对象到当前请求上
      let r = this.jwtService.verify(Array.isArray(token) ? token[0] : token);
      console.log("checkAdminAuthToken", r);
      return r
    } catch (e) {
      // 无法通过token校验
      console.log("checkAdminAuthToken", e);
      throw new SocketException(11001);
    }
  }
}
