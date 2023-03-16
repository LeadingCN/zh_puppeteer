import { Inject, Injectable, Logger } from "@nestjs/common";
import { CreateNewtestDto, getoneNewtestDto } from "../dto/create-newtest.dto";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { RedisService } from "@/shared/services/redis.service";
import { UtilService } from "@/shared/services/util.service";
import { Newtest } from "@/entities/newTest/newtest.entity";
import { ZH } from "@/entities/resource/zh.entity";
import { IAdminUser } from "@/modules/admin/admin.interface";
import SysUser from "@/entities/admin/sys-user.entity";
import { ApiException } from "@/common/exceptions/api.exception";
import { ZhPage } from "@/modules/resource/zh/interface";
import { TopOrder } from "@/entities/order/top.entity";
import { Link } from "@/entities/resource/link.entity";

const REQ = require("request-promise-native");

@Injectable()
export class ZhService {
  constructor(
    @InjectRepository(ZH) private zhRepository: Repository<ZH>,
    @InjectRepository(SysUser) private userRepository: Repository<SysUser>,
    private redisService: RedisService,
    private util: UtilService) {
  }

  async page(params: ZhPage, user: IAdminUser) {
    let { page, limit, zuid, accountNumber, open, username, action } = params;
    //判断用户是否是管理员
    let qb = null;
    if (user.roleLabel != "admin") {
      switch (action) {
        case "cookie": //生成获取cookie
          return await this.getCookieByZuid(zuid, user.id);
          break;
        case "static":// 连同链接查询
          return await this.getByPage(params, user.id);
          break;
        case "createGroup": //建群查询账号
          return await this.getPageByGroup(params, user.id);
          break;
        default:
          return await this.getByPage(params, user.id);
      }
    } else {
      if (action == "createGroup") return await this.getPageByGroup(params, user.id);

      return await this.getByPage(params, user.id);

    }

  }

  async getPageByGroup(params: ZhPage, userid: number) {
    let qb = await this.zhRepository.createQueryBuilder("zh")
      .leftJoin("zh.SysUser", "user")
      .select(["zh.zuid", "zh.accountNumber"])
      .where("user.id = :id", { id: userid })
      .getMany();
    return qb;
  }

  async getPageByStatic(params: ZhPage, userid: number) {
    let { page, limit, zuid, accountNumber } = params;
    let qb = await this.zhRepository.createQueryBuilder("zh")
      .leftJoin("zh.link", "link")
      .leftJoin("zh.SysUser", "user")
      .select(["zh.id", "zh.accountNumber", "zh.balance", "zh.balanceLock", "zh.rechargeLimit", "zh.lockLimit", "zh.totalRecharge", "zh.open", "zh.zuid",
        "link.id", "link.amount"])
      .where("user.id = :id", { id: userid })
      .andWhere(zuid ? "zh.zuid = :zuid" : "1=1", { zuid })
      .andWhere(accountNumber ? "zh.accountNumber LIKE :accountNumber" : "1=1", { accountNumber: `%${accountNumber}%` })
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

  async getCookieByZuid(zuid: string, userid: number) {
    let qb = await this.zhRepository.createQueryBuilder("zh")
      .leftJoin("zh.SysUser", "user")
      .select("zh.cookie")
      .where("zh.zuid = :zuid", { zuid })
      .andWhere("user.id = :id", { id: userid })
      .getOne();
    return qb;
  }

  //获取指定zuid的账户信息和所有link信息
  async getInstantiationByZuid(zuid: string | string[], userid: number) {
    let qb = await this.zhRepository.createQueryBuilder("zh")
      .leftJoin("zh.SysUser", "user")
      .where(typeof zuid == "string" ? "zh.zuid = :zuid" : "1=1", { zuid })
      .andWhere(typeof zuid == "object" ? "zh.zuid IN (:...zuid)" : "1=1", { zuid })
      .andWhere("user.id = :id", { id: userid });
    console.log(await qb.getRawMany());
    if (typeof zuid == "string") {
      return await qb.getOne();
    } else {
      return await qb.getMany();
    }
  }

  async getByPage(params: ZhPage, userid: number) {
    let { page, limit, zuid, accountNumber, open, username, action, groupId } = params;
    let qb = await this.zhRepository.createQueryBuilder("zh")
      .leftJoin("zh.SysUser", "user")
      .leftJoin("zh.group", "group")
      //72小时的链接
      // .leftJoinAndSelect("zh.link", "link", "(link.paymentStatus = 0 OR link.paymentStatus = 2) AND link.createdAt >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 72 HOUR),'%Y-%m-%d %H:%i:%s')")
      .leftJoin((qb) =>
          qb.select(["link.id as linkId", "link.amount as linkAmount", "link.zhId",'COUNT (link.id) as linkCount','SUM(link.amount) as linkSum'])
            .from(Link, "link")
            .where("(link.paymentStatus = 0 OR link.paymentStatus = 2) AND link.createdAt >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 72 HOUR),'%Y-%m-%d %H:%i:%s')")
            .groupBy('link.zhId')
        , "link", "link.zhId = zh.id")
      //48小时的订单
      // .leftJoinAndSelect("zh.topOrder", "top_order", "(top_order.status = 1 OR top_order.status = 4) AND top_order.createdAt >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 48 HOUR),'%Y-%m-%d %H:%i:%s')")
      .leftJoinAndSelect((qb) =>
          qb
            .select(['top_order.id AS top_orderId', 'top_order.amount as top_orderAmount', 'top_order.zhId','top_order.createdAt AS top_orderCreatedAt','sum(amount) AS totalquota','top_order.status AS top_orderStatus'])
            .from(TopOrder, "top_order")
            .where("(top_order.status = 1 OR top_order.status = 4) AND top_order.createdAt >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 48 HOUR),'%Y-%m-%d %H:%i:%s')")
            .groupBy('top_order.zhId')
        , "top_order",'top_order.zhId = zh.id')
      .select(["zh.id AS id ", "zh.accountNumber AS accountNumber", "zh.balance AS balance", "zh.balanceLock AS balanceLock", "zh.rechargeLimit AS rechargeLimit", "zh.lockLimit AS lockLimit", "zh.totalRecharge AS totalRecharge", "zh.open AS open" , "zh.zuid AS zuid", "zh.reuse AS reuse"])
      .addSelect(["user.username as username"])
      .addSelect(['link.linkCount AS stockLink','link.linkSum AS stockLinkAmount'])
      .addSelect([`SUM(DISTINCT CASE WHEN top_order.top_orderCreatedAt >= CURDATE() AND top_order.top_orderCreatedAt < NOW() AND top_order.top_orderStatus = 1 THEN top_order.totalquota ELSE 0 END) AS todaySale`])
      .addSelect([`SUM(DISTINCT CASE WHEN top_order.top_orderCreatedAt >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 1 DAY),'%Y-%m-%d %H:%i:%s') AND top_order.top_orderCreatedAt < CURDATE() AND top_order.top_orderStatus = 1 THEN top_order.totalquota ELSE 0 END) AS yesterdaySale`])
      .where(userid != 1?"user.id = :id":'1=1', { id: userid })
      .andWhere(zuid ? "zh.zuid = :zuid" : "1=1", { zuid })
      .andWhere(open ? "zh.open = :open" : "2=2", { open: open == "true" ? true : false })
      .andWhere(accountNumber ? "zh.accountNumber LIKE :accountNumber" : "3=3", { accountNumber: `%${accountNumber}%` })
      .groupBy('zh.id')
      //分组
      .andWhere(groupId ? "group.id = :groupId" : "4=4", { groupId })
      .offset((page - 1) * limit)
      .limit(limit);
    const [_, total] = await qb.getManyAndCount();
    let list = await qb.getRawMany();
    return {
      list,
      pagination: {
        total,
        page: Number(page),
        size: Number(limit)
      }
    };
  }

  async del(params, user: IAdminUser) {
    let { ids, action } = params;
    console.log(action);
    if (action == "some") {
      await this.zhRepository.createQueryBuilder("zh")
        .leftJoinAndSelect("zh.SysUser", "user")
        .delete()
        .where("zh.id in (:...ids)", { ids })
        .andWhere(user.roleLabel == "admin" ? "1=1" : "user.id = :id", { id: user.id })
        .execute();
    } else if (action == "all") {
      let qb = await this.zhRepository.createQueryBuilder("zh")
        .leftJoinAndSelect("zh.SysUser", "user")
        .delete()
        .where("zh.id in (:...ids)", { ids })
        .andWhere("user.id = :id", { id: user.id });
      console.log(qb.getSql());
      // .execute();
    }
  }

  async add(params, user: IAdminUser) {
    //查询user用户实例
    let u = await this.userRepository.findOne({ where: { id: user.id } });

    let { qq, cookies, openid, openkey } = params;
    //判断qq是否存在
    let zh = await this.zhRepository.findOne({ where: { accountNumber: qq } });
    if (zh) throw new ApiException(40001);
    let a = new ZH();
    a.accountNumber = qq;
    a.cookie = JSON.stringify(cookies);
    let uuid = this.util.generateUUID();
    a.zuid = "QQ-" + uuid;
    a.SysUser = u;
    a.openid = openid;
    a.openkey = openkey;
    await this.zhRepository.save(a);
  }

  //获取账号 用于接单
  async getZhQueueById(id: string, amount: number) {
    let qb = await this.zhRepository.createQueryBuilder("zh")
      .leftJoin("zh.SysUser", "user")
      .select(["zh.zuid", "zh.accountNumber", "zh.id", "zh.weight"])
      .where("user.id = :id", { id })
      .andWhere("zh.open = :open", { open: true })
      .andWhere(`zh.lockLimit+${amount} <= zh.rechargeLimit`)
      .orderBy("zh.weight", "DESC")
      .getMany();
    return qb;

  }

  //更新指定账号 lockLimit
  async updateLockLimitByZuid(zuid: string, amount: number) {
    try {
      let qb = await this.zhRepository.createQueryBuilder("zh")
        .update()
        .set({ lockLimit: () => `lockLimit-${amount}` })
        .where("zh.zuid = :zuid", { zuid })
        .execute();
    } catch (e) {
      Logger.error("更新账号锁定金额失败" + zuid);
    }
  }

  async edit(params, user: IAdminUser) {
    //更新zh
    let { action, ids, zuid, open, rechargeLimit, reuse } = params;
    console.log(params);
    try {
      if (action == "all") {
        let u = await this.userRepository.createQueryBuilder("user")
          .leftJoinAndSelect("user.zh", "zh")
          .where("user.id = :id", { id: user.id })
          .getOne();
        await this.zhRepository.remove(u.zh);
        return;
      }
      if (ids) {
        let qb = await this.zhRepository.createQueryBuilder("zh")
          .leftJoin("zh.SysUser", "user")
          .where("zh.zuid in (:...ids)", { ids })
          .andWhere(user.roleLabel == "admin" ? "1=1" : "user.id = :id", { id: user.id })
          .getMany();
        if (action == "open") {
          for (let i = 0; i < qb.length; i++) {
            qb[i].open = true;
            await this.zhRepository.save(qb[i]);
          }

        } else if (action == "del") {
          for (let i = 0; i < qb.length; i++) {
            await this.zhRepository.remove(qb[i]);
          }
        } else if (action == "upRechargeLimit") {
          for (let i = 0; i < qb.length; i++) {
            qb[i].rechargeLimit = Number(rechargeLimit) * 100;
            await this.zhRepository.save(qb[i]);
          }
        } else if (action == "close") {
          for (let i = 0; i < qb.length; i++) {
            qb[i].open = false;
            await this.zhRepository.save(qb[i]);
          }
        }
      } else {
        let z = await this.zhRepository.createQueryBuilder("zh")
          .leftJoin("zh.SysUser", "user")
          .where("zh.zuid = :zuid", { zuid })
          .andWhere(user.roleLabel == "admin" ? "1=1" : "user.id = :id", { id: user.id })
          .getOne();
        if (!z) throw new ApiException(10017);
        if (action == "open") {
          z.open = open;
          await this.zhRepository.save(z);
        } else if (action == "upRechargeLimit") {
          z.rechargeLimit = Number(rechargeLimit) * 100;
          await this.zhRepository.save(z);
        } else if (action == "del") {
          await this.zhRepository.remove(z);
        } else if (action == "reuse") {
          z.reuse = reuse;
          await this.zhRepository.save(z);
        }
      }
    } catch (e) {
      throw new ApiException(40002);
    }

  }


  //查询zh在TX平台是否有个指定loid的订单
  async checkHaveLOid(zh: ZH, loid: string) {
    //从缓存查看列表
    let l = await this.redisService.getRedis().get(`translist:${zh.accountNumber}`);
    if (l) {
      let list = JSON.parse(l);
      for (let i = 0; i < list.length; i++) {
        if (list[i].SerialNo == loid) {
          return true;
        }
      }
      return false;
    }

    let url = "https://api.unipay.qq.com/v1/r/1450000186/trade_record_query";
    // let beginTime = (new Date().getTime() / 1000).toString()
    const h = {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36"
    };
    let form = {
      CmdCode: "query2",
      SubCmdCode: "default",
      PageNum: "1",
      BeginUnixTime: "1635417724",//TODO 优化开始时间
      EndUnixTime: parseInt((new Date().getTime() / 1000).toString()).toString(),
      PageSize: "100",
      SystemType: "portal",
      pf: "__mds_default",
      pfkey: "pfkey",
      from_h5: "1",
      webversion: "MidasTradeRecord1.0",
      openid: zh.openid,
      openkey: zh.openkey,
      session_id: "openid",
      session_type: "kp_accesstoken"
    };
    let res = await REQ.post({ url: url, headers: h, form: form });
    try {
      let body = JSON.parse(res);
      if (res && body.msg === "ok") {
        // await this.redis.set(`translist_${zh}`, JSON.stringify(body), 10)
        let list = body.WaterList;
        //对该账号的交易列表进行缓存
        await this.redisService.getRedis().set(`translist:${zh.accountNumber}`, JSON.stringify(list), "EX", 10);
        //遍历交易列表，查看是否有loid
        for (let i = 0; i < list.length; i++) {
          if (list[i].SerialNo == loid) {
            return true;
          }
        }
        return false;
      }
      if (res && body.msg === "登录校验失败") {
        Logger.error(`${zh}   ===   cookie 失效 `);
        return false;
      }
    } catch (error) {
      Logger.error(`获取交易列表出错${error}`);
    }

    return "";
  }
}
