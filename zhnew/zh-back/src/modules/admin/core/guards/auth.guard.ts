import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { isEmpty } from 'lodash';
import { ApiException } from 'src/common/exceptions/api.exception';
import {
  ADMIN_PREFIX,
  ADMIN_USER,
  PERMISSION_OPTIONAL_KEY_METADATA,
  AUTHORIZE_KEY_METADATA,
} from 'src/modules/admin/admin.constants';
import { LoginService } from 'src/modules/admin/login/login.service';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
/**
 * admin perm check guard
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private loginService: LoginService,
  ) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检测是否是开放类型的，例如获取验证码类型的接口不需要校验，可以加入@Authorize可自动放过
    const authorize = this.reflector.get<boolean>(
      AUTHORIZE_KEY_METADATA,
      context.getHandler(),
    );
    if (authorize) {
      return true;
    }
    // const contextType = context.getType<'http' | 'rmq'>();
    // if (contextType === 'rmq') {
    //   // console.log("rmq");
    //   return  true
    //   // return next.handle();
    // }else {
    //   if(isRabbitContext(context)){
    //     // console.log("isRabbitContext");
    //     return true
    //   }
    //   // console.log(contextType);
    // }
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const url = request.url;
    const path = url.split('?')[0];
    const token = request.headers['authorization'] as string;
    if (isEmpty(token)) {
      throw new ApiException(11001);
    }
    try {
      // 挂载对象到当前请求上
      let user = this.jwtService.verify(token);
      // let r = await this.userService.info(user.uid);
      request[ADMIN_USER] = user; //Object.assign(user, r);
    } catch (e) {
      // 无法通过token校验
      throw new ApiException(11001);
    }
    if (isEmpty(request[ADMIN_USER])) {
      throw new ApiException(11001);
    }
    const pv = await this.loginService.getRedisPasswordVersionById(
      request[ADMIN_USER].uid,
    );
    if (pv !== `${request[ADMIN_USER].pv}`) {
      // 密码版本不一致，登录期间已更改过密码
      throw new ApiException(11002);
    }
    const redisToken = await this.loginService.getRedisTokenById(
      request[ADMIN_USER].uid,
    );
    //取消注释该处可以实现单设备登录
    // if (token !== redisToken) {
    //   console.log("token不一致");
    //   // 与redis保存不一致
    //   throw new ApiException(11002);
    // }
    // 注册该注解，Api则放行检测
    const notNeedPerm = this.reflector.get<boolean>(
      PERMISSION_OPTIONAL_KEY_METADATA,
      context.getHandler(),
    );
    // Token校验身份通过，判断是否需要权限的url，不需要权限则pass
    if (notNeedPerm) {
      return true;
    }
    const perms: string = await this.loginService.getRedisPermsById(
      request[ADMIN_USER].uid,
    );
    // console.log(perms);
    // 安全判空
    if (isEmpty(perms)) {
      throw new ApiException(11001);
    }
    // 将sys:admin:user等转换成sys/admin/user
    const permArray: string[] = (JSON.parse(perms) as string[]).map((e) => {
      return e.replace(/:/g, '/');
    });

    //判断访问的是否admin模块
    if (path.startsWith(`/${ADMIN_PREFIX}/`)) {
      // 遍历权限是否包含该url，不包含则无访问权限
      if (!permArray.includes(path.replace(`/${ADMIN_PREFIX}/`, ''))) {
        throw new ApiException(11003);
      }
    } else {
      // console.log(permArray,path.replace(`/`, ''));//忽略首个路径
      // console.log("当前请求路径"+ path);
      // 非admin模块，判断是否有访问权限
      if (request[ADMIN_USER].id === 1) return true;
      if (!permArray.includes(path.replace(`/`, ''))) {
        throw new ApiException(11003);
      }
    }

    // pass
    return true;
  }
}
