import { Inject, Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@/shared/services/redis.service";
import { UtilService } from "@/shared/services/util.service";
import { SysParamConfigService } from "@/modules/admin/system/param-config/param-config.service";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import SysUser from "@/entities/admin/sys-user.entity";
import { isEmpty } from "lodash";
import { ApiException } from "@/common/exceptions/api.exception";
import { SYS_USER_INITPASSWORD } from "@/common/contants/param-config.contants";
import SysUserRole from "@/entities/admin/sys-user-role.entity";
import { IAdminUser } from "@/modules/admin/admin.interface";
import { SysBalanceLog } from "@/entities/admin/sys-balance.entity";

@Injectable()
export class ProxyService {
  private readonly PROXYUSER = 3;

  constructor(
    private paramConfigService: SysParamConfigService,
    @InjectEntityManager() private entityManager: EntityManager,//注入EntityManager
    @InjectRepository(SysUser) private userRepository: Repository<SysUser>,
    private redisService: RedisService,
    private util: UtilService) {
  }

  async page(params, user: IAdminUser) {
    if (user.roleLabel == "admin") {
      return this.pageByAdmin(params, user);
    } else if (user.roleLabel == "proxy") {
      return this.pageByUser(params, user);
    }
  }

  async pageByAdmin(params, user: IAdminUser) {
    let { page, limit, nickName, username, uuid } = params;
    //判断是否是管理员
    let all = nickName || username || uuid ? false : true;
    let qb = await this.userRepository.createQueryBuilder("user")
      .leftJoinAndSelect("user.children", "children")
      .leftJoinAndSelect("children.children", "children2")
      .innerJoinAndSelect(
        "sys_user_role",
        "user_role",
        "user_role.user_id = user.id"
      )
      .where("user.id != 1")
      .andWhere("user_role.role_id = 3")
      .andWhere(all ? "user.lv =1" : "1=1")
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

  async pageByUser(params, user: IAdminUser) {
    if (user.lv === 3) throw new ApiException(11001);
    let { page, limit, nickName, username } = params;
    let qb = await this.userRepository.createQueryBuilder("user")
      .leftJoinAndSelect("user.parent", "parent")
      .leftJoinAndSelect("user.children", "children")
      .leftJoinAndSelect("children.children", "children2")
      .innerJoinAndSelect(
        "sys_user_role",
        "user_role",
        "user_role.user_id = user.id"
      )
      //排除admin
      .where("user.id != 1")
      // .andWhere("user.lv = :lv", { lv: user.lv + 1 })
      .andWhere("parent.uuid = :uuid", { uuid: user.uuid })
      //排除自己
      .andWhere("user.id != :id", { id: user.id })
      //只能查看代理
      .andWhere("user_role.role_id = 3")
      //用户名和昵称模糊查询
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

  async add(params, user: IAdminUser) {
    if (user.lv === 3) {
      throw new ApiException(30001);
    }
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
      //查找请求用户的实例
      const userObj = await manager.findOne(SysUser, { where: { id: user.id } });
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
        parentRate: userObj.rate,
        uuid,
        md5key: md5Key,
        lv: user.roleLabel == "admin" ? 1 : user.lv + 1
      });
      u.parent = userObj;
      const result = await manager.save(u);
      await manager.insert(SysUserRole, {
        userId: result.id,
        roleId: this.PROXYUSER
      });
    });
  }

  async edit(params, user: IAdminUser) {
    let { action, data } = params;
    let { uuid, parentOpen, rate } = data;
    let u = await this.userRepository.createQueryBuilder("user")
      .leftJoinAndSelect("user.parent", "parent")
      .where("user.uuid = :uuid", { uuid })
      .getOne();
    switch (action) {
      case "parentOpen": //修改上级开关
        //查找用户 uuid 的实例 的parent.uuid == user.uuid
        parentOpen = Boolean(parentOpen);
        if (u.parent.uuid == user.uuid || user.roleLabel == "admin") {
          await this.userRepository.createQueryBuilder()
            .update()
            .set({ parentOpen })
            .where("uuid = :uuid", { uuid })
            .execute();
        } else {
          throw new ApiException(
            11003);
        }
        break;
      case "rate": //修改费率
        rate = Number(rate);
        if (u.parent.uuid == user.uuid || user.roleLabel == "admin") {
          console.log(params);
          await this.userRepository.createQueryBuilder()
            .update()
            .set({ parentRate: rate })
            .where("uuid = :uuid", { uuid })
            .execute();
          //更新redis用户缓存总费率
          await this.redisService.getRedis().del(`usersys:proxy:${uuid}:ratetotal`);
        } else {
          throw new ApiException(
            11003);
        }
        break;
      case "recharge": //充值
        //判断params.data.amount是否是整数
        if (!Number.isInteger(Number(params.data.amount))) {
          throw new ApiException(30003);
        }
        let amount = Number(params.data.amount) * 100;
        //判断执行方是否有足够的余额
        let have = await this.userRepository.createQueryBuilder("user")
          .where("user.uuid = :uuid", { uuid: user.uuid })
          .andWhere("user.balance >= :balance", { balance: amount })
          .getOne();
        if (!have && user.roleLabel != "admin") {
          throw new ApiException(30002);
        }
        //如果足够 则执行事务
        await this.entityManager.transaction(async (manager) => {
          //先扣除user的余额 如果是admin 则不扣除
          try {
            if (user.roleLabel != "admin") {
              //获取user的实例当前的balance
              let h = await manager.findOne(SysUser, { select: { balance: true }, where: { uuid: user.uuid } });
              await manager.update(SysUser, { uuid: user.uuid }
                , { balance: () => `balance-${amount}` });
              //记录日志
              await manager.insert(SysBalanceLog, {
                amount,
                typeEnum: "sub",
                event: "rechargeSub",
                actionUuid: user.uuid,//请求人
                uuid: user.uuid,//归属 请求人
                balance: h.balance - amount
              });
            }

            //再给data.uuid充值
            await manager.update(
              SysUser,
              { uuid: params.data.uuid },
              { balance: () => `balance+${amount}` }
            );
            //获取data.uuid的实例当前的balance
            let t = await manager.findOne(SysUser, { select: { balance: true }, where: { uuid: params.data.uuid } });
            //记录日志 TODO
            await manager.insert(SysBalanceLog, {
              amount,
              typeEnum: "add",
              event: "recharge",
              actionUuid: user.uuid,//请求人
              uuid: params.data.uuid,//被请求人
              balance: t.balance
            });
          } catch (error) {
            console.log(error);
          }

        });
        break;
      case "deduction":
        //必须是admin才能扣除
        if (user.roleLabel != "admin") throw new ApiException(11003);
        if (!Number.isInteger(Number(params.data.amount))) {
          throw new ApiException(30003);
        }

        let amount2 = Number(params.data.amount) * 100;
        let setZero = false;
        if (u.balance < amount2) {
          setZero = true;
        }
        //事务执行扣费
        await this.entityManager.transaction(async (manager) => {
          await manager.update(SysUser, { uuid: params.data.uuid }, { balance: setZero ? 0 : () => `balance-${amount2}` });
          //记录日志
          await manager.insert(SysBalanceLog, {
            amount: setZero ? u.balance : amount2,
            typeEnum: "sub",
            event: "deduction",
            actionUuid: user.uuid,
            uuid,
            balance: setZero ? 0 : u.balance - amount2
          });
        });
        break;
    }
  }

  //代理商下线扣费
  async proxyDeduction(params, user: IAdminUser) {


    if(user.lv > 2){
      Logger.error(`代理商${user.username}执行非法扣费`);
      throw new ApiException(30004);
    }
    let { uuid, amount } = params;
    //获取uuid的所有父节点
    let u = await this.userRepository.findOne({ where: { uuid } });
    let parents = await this.entityManager.getTreeRepository(SysUser).findAncestorsTree(u);
    // console.log(parents);
    //r 判断该 parent 中是否 有 user.uuid
    let isHave = false;
    let parent = parents;
    while (parent) {
      if (parent.uuid == user.uuid) {
        isHave = true
        break;
      }
      parent = parent.parent;
    }
    if (isHave) {
      await this.entityManager.transaction(async (manager) => {
        //判断被执行方params.uuid 金额是否足够扣除
        let u = await manager.findOne(SysUser, { select: { balance: true }, where: { uuid } });
        if(u.balance === 0) throw new ApiException(30005);
        let deductionAmount = amount * 100;
        if (u.balance < amount*100) {
          deductionAmount = u.balance;
        }
        await manager.update(SysUser, { uuid }, { balance: () => `balance-${deductionAmount}` });
        //获取被执行方的实例当前的balance
        let uu = await manager.findOne(SysUser, { select: { balance: true }, where: { uuid } });
        //记录日志 被执行方日志
        await manager.insert(SysBalanceLog, {
          amount:deductionAmount,
          typeEnum: "sub",
          event: "deduction",
          actionUuid: user.uuid,
          uuid,
          balance: uu.balance
        });
        //执行方添加金额
        await manager.update(SysUser, { uuid: user.uuid }, { balance: () => `balance+${deductionAmount}` });
        //获取执行方的实例当前的balance
        let t = await manager.findOne(SysUser, { select: { balance: true }, where: { uuid: user.uuid } });
        //执行方日志
        await manager.insert(SysBalanceLog, {
          amount:deductionAmount,
          typeEnum: "add",
          event: "deduction",
          actionUuid: user.uuid,
          uuid:user.uuid,
          balance:t.balance
        });
      });
      return
    }
    Logger.error(`代理商${user.username}非法执行扣费`);
    throw new ApiException(30004);
  }

  async del(params, user: IAdminUser) {
    let { ids } = params;
    //删除用户 以及用户的children 以及用户的children的children
    //获取ids的所有子节点

    for (let j = 0; j < ids.length; j++) {
      let u = await this.userRepository.findOne({ where: { id: ids[j] } });
      let r = await this.entityManager.getTreeRepository(SysUser).findDescendantsTree(u);
      //遍历底层节点判断是否有下级 如果有下级先删除下级 本系统只有3层树状 如果是4层树状需要修改 使用递归
      if (r.children.length > 0) {
        for (let i = 0; i < r.children.length; i++) {
          let c = r.children[i];
          if (c.children && c.children.length > 0) {
            await this.entityManager.getTreeRepository(SysUser).remove(c.children);
          }
        }
      }
      await this.entityManager.getTreeRepository(SysUser).remove(r.children);
      //再删除自己
      await this.entityManager.getTreeRepository(SysUser).remove(r);
    }


  }

  async getInstantiationByUserId(userId: number) {
    return await this.userRepository.findOne({ where: { id: userId } });
  }


  //查询用户余额是否足够系统配置最低值 和订单金额
  async checkBalance(uuid, amount) {
    //即时查询用户是否有充足的余额 数据库余额-缓存的订单金额 即 用户余额是否大于等于订单金额 并且大于系统设置的最低余额
    let haveBalance = await this.userRepository.createQueryBuilder("user")
      .select(["user.balance", "user.uuid", "user.username", "user.id"])
      .where("user.uuid = :uuid", { uuid })
      .andWhere("user.balance >= :balance", { balance: amount })
      //并且大于系统设置的最低余额
      .andWhere("user.balance >= :minBalance", { minBalance: await this.paramConfigService.findValueByKey("minBalance") })
      .getOne();
    if (!haveBalance) return false;
    //从缓存中获取该用户已经拉取的订单列表
    return haveBalance;
  }

  //更新用户余额 并返回当前余额
  async updateBalance(uuid, amount, typeEnum) {
    try {
      let nowBalance = await this.entityManager.transaction(async (manager) => {
        //先更新用户余额
        await manager.update(SysUser, { uuid }, { balance: () => `balance${typeEnum == "add" ? "+" : "-"}${amount}` });
        //再获取用户当前余额
        let u = await manager.findOne(SysUser, { select: { balance: true }, where: { uuid } });
        return u.balance;
      });
      return nowBalance;
    } catch (e) {
      Logger.error(`更新用户余额失败${uuid}`, e.stack);
      return false;
    }

  }

  //计算订单佣金并更新用户余额
  async setOrderCommission(oInfo: any) {
    //获取用户所有父级
    let u = await this.userRepository.findOne({ where: { uuid: oInfo.SysUser.uuid } });
    let parents = await this.entityManager.getTreeRepository(SysUser).findAncestorsTree(u);
    //计算佣金 从父级开始计算 直至parent为null
    let parent = parents;
    let commission = 0;
    while (parent) {
      //计算佣金
      commission = oInfo.amount * parent.parentRate / 10000;
      // console.log(`用户${parent.parent ? parent.parent.username : "admin"}获得佣金${commission}`);
      //更新用户余额
      let nowBalance = await this.updateBalance(parent.parent ? parent.parent.uuid : "1", commission, "add");
      //记录日志
      await this.entityManager.insert(SysBalanceLog, {
        amount: commission,
        typeEnum: "add",
        event: "commission",
        actionUuid: u.uuid,
        orderUuid: oInfo.oid,
        uuid: parent.parent ? parent.parent.uuid : "1",
        balance: nowBalance ? nowBalance : 0
      });
      parent = parent.parent;
    }
  }
}
