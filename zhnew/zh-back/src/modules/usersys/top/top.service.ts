import { Injectable } from "@nestjs/common";
import { RedisService } from "@/shared/services/redis.service";
import { UtilService } from "@/shared/services/util.service";
import { IAdminUser } from "@/modules/admin/admin.interface";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { AddTopUser, PageQuery } from "@/modules/usersys/top/interfaceClass";
import { SysParamConfigService } from "@/modules/admin/system/param-config/param-config.service";
import SysUser from "@/entities/admin/sys-user.entity";
import { isEmpty } from "lodash";
import { ApiException } from "@/common/exceptions/api.exception";
import { SYS_USER_INITPASSWORD } from "@/common/contants/param-config.contants";
import SysUserRole from "@/entities/admin/sys-user-role.entity";
import { Link } from "@/entities/resource/link.entity";

const TOPUSER = 2;

@Injectable()
export class TopService {
  constructor(
    private paramConfigService: SysParamConfigService,
    @InjectEntityManager() private entityManager: EntityManager,//注入EntityManager
    @InjectRepository(SysUser) private userRepository: Repository<SysUser>,
    private redisService: RedisService,
    private util: UtilService) {
  }


  async page(params: any, user: IAdminUser) {
    let { page, limit, nickName, username } = params;
    let qb = await this.userRepository.createQueryBuilder("user")
      .innerJoinAndSelect(
        "sys_user_role",
        "user_role",
        "user_role.user_id = user.id"
      )
      .where("user.id != 1")
      .andWhere("user_role.role_id = 2")
      .andWhere(nickName ? "user.nick_name LIKE :nickName" : "1=1", { nickName: `%${nickName}%` })
      .andWhere(username ? "user.username LIKE :username" : "1=1", { username: `%${username}%` })
      .offset((page - 1) * limit)
      .limit(limit);
    const [_, total] = await qb.getManyAndCount();
    let list = await qb.getMany();
    return {
      list,
      pagination: {
        total,
        page: Number(page),
        size: Number(limit)
      }
    };
  }

  async add(params: AddTopUser, user: IAdminUser) {
    let { username, password, nickName } = params;
    const exists = await this.userRepository.findOne({
      where: { username: username }
    });
    if (!isEmpty(exists)) {
      throw new ApiException(10001);
    }
    // 所有用户初始密码为123456
    await this.entityManager.transaction(async (manager) => {
      const salt = this.util.generateRandomValue(32);
      const md5Key = this.util.generateRandomValue(8);
      const uuid = this.util.generateUUID();
      // 查找配置的初始密码
      const initPassword = await this.paramConfigService.findValueByKey(
        SYS_USER_INITPASSWORD
      );

      const password2 = this.util.md5(`${password ? password : initPassword || "123456"}${salt}`);
      const u = manager.create(SysUser, {
        departmentId: 1,
        username: username,
        password: password2,
        name: "",
        nickName: nickName,
        email: "",
        phone: "",
        remark: "",
        status: 1,
        psalt: salt,
        parentRate: 0,
        uuid,
        md5key: md5Key
      });
      const result = await manager.save(u);
      await manager.insert(SysUserRole, {
        userId: result.id,
        roleId: TOPUSER
      });
    });
  }

  async edit(params: any, user: IAdminUser) {
    let { action, data } = params;
    switch (action) {
      case "delete":
        await this.userRepository.createQueryBuilder("user")
          .where("id IN (:...ids)", { ids: data.ids })
          .delete()
          .execute();
        break;
      case "resetpwd":
        let psalt = this.util.generateRandomValue(32);
        await this.userRepository.createQueryBuilder("user")
          .update(SysUser)
          .set({
            password: this.util.md5(`123456${psalt}`),
            psalt
          })
          .where("id IN (:...ids)", { ids: data.ids })
          .execute();
        break;
    }
  }


  async userInfoById(id: number) {
    return await this.userRepository.findOne({ where: { id: id } });
  }

  async getMd5Key(id: number) {
    //先从缓存查询是否有个该用户
    let topUser: any = await this.redisService.getRedis().get(`usersys:top:${id}`);
    if (!topUser) {
      //如果没有则从数据库查询
      topUser = await this.userInfoById(id);
      if (!topUser) {
        throw new ApiException(10017);
      }
      await this.redisService.getRedis().set(`usersys:top:${id}`, JSON.stringify(topUser), "EX", 60 * 60 * 24);
    }else {
      topUser = JSON.parse(topUser);
    }
    return topUser.md5key;
  }

  /*
  * 获取符合 付费条件的用户
  * */
  async getPayUser(amount:number){
    //2 是上游 3是代理
    //获取当前可接单用户 条件1 金额大于userMinQuota  条件2 有符合金额的链接在paylink表中
    let qb = await this.userRepository.createQueryBuilder('user')
      .leftJoin(SysUserRole,'user_role','user_role.user_id = user.id')
      .select(['user.id','user.uuid','user.username'])
      //代理商
      .where('user_role.role_id = 3')
      //判断是否开启自动接单
      .andWhere('user.selfOpen = 1')
      //判断parent是否开启自动接单
      .andWhere("user.parentOpen = 1")
      //判断金额是否大于用户余额
      .andWhere('user.balance >= :amount',{amount:amount})
      .getMany();
    return qb;
  }
}
