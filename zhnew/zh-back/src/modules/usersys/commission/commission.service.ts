import { Inject, Injectable } from "@nestjs/common";
import { RedisService } from "@/shared/services/redis.service";
import { UtilService } from "@/shared/services/util.service";
import { IAdminUser } from "@/modules/admin/admin.interface";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { SysBalanceLog } from "@/entities/admin/sys-balance.entity";
import SysUser from "@/entities/admin/sys-user.entity";
import { SysParamConfigService } from "@/modules/admin/system/param-config/param-config.service";

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(SysBalanceLog) private logRepository: Repository<SysBalanceLog>,
    @InjectRepository(SysUser) private userRepository: Repository<SysUser>,
    @InjectEntityManager() private entityManager: EntityManager,//注入EntityManager
    private paramConfigService: SysParamConfigService,
    private redisService: RedisService,
    private util: UtilService) {
  }

  async page(params: any, user: IAdminUser) {

    let { page, limit } = params;
    let qb = null;
    if (user.roleLabel == "admin") {
      let { event, createdAt, uuid } = params;
      console.log(params);
      qb = await this.logRepository.createQueryBuilder("log")
        .leftJoin(SysUser, "user", "user.uuid = log.uuid")
        .leftJoin(SysUser, "actionUser", "actionUser.uuid = log.actionUuid")
        .select([
          "log.id AS id", "log.event AS event", "log.actionUuid AS actionUuid", "log.amount AS amount", "log.balance AS balance", "log.createdAt AS createdAt",
          "log.orderUuid AS orderUuid", "log.typeEnum as typeEnum", "log.uuid AS uuid",
          "user.username AS username",
          "actionUser.username AS actionUsername"
        ])
        .where(uuid ? "log.uuid = :uuid" : "1=1", { uuid })
        .andWhere(event ? "log.event = :event" : "1=1", { event })
        .andWhere(createdAt ? "DATE_FORMAT(log.created_at,'%Y-%m-%d') >= :createdStart AND DATE_FORMAT(log.created_at,'%Y-%m-%d') <= :createdEnd" : "1=1", {
          createdStart: createdAt ? createdAt[0] : "",
          createdEnd: createdAt ? createdAt[1] : ""
        })
        .orderBy("log.created_at", "DESC")
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
    } else {
      let { event, createdAt } = params;
      let { uuid } = user;
      qb = await this.logRepository.createQueryBuilder("log")
        .select(["log.id", "log.event", "log.amount", "log.balance", "log.createdAt", "log.orderUuid", "log.typeEnum"])
        .where("log.uuid = :uuid", { uuid })
        .andWhere(event ? "log.event = :event" : "1=1", { event })
        .andWhere(createdAt ? "DATE_FORMAT(log.created_at,'%Y-%m-%d') >= :createdStart AND DATE_FORMAT(log.created_at,'%Y-%m-%d') <= :createdEnd" : "1=1", {
          createdStart: createdAt ? createdAt[0] : "",
          createdEnd: createdAt ? createdAt[1] : ""
        })
        .orderBy("log.created_at", "DESC")
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

  }

  async statistics(params: any, user: IAdminUser) {
    if (user.roleLabel == "admin") {
      //获取所有ZH
      let zhList = await this.entityManager.query(`SELECT COUNT(*)AS total FROM zh`);
      //获取昨天 top_order.status = 1 OR top_order.status = 4 的订单记录
      let yesterdayTopOrder = await this.entityManager.query(`SELECT SUM(amount) AS amountTotal,COUNT(*) AS orderTotal FROM top_order WHERE (status = 1 OR status = 4) AND DATE_FORMAT(created_at,'%Y-%m-%d') = DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 1 DAY),'%Y-%m-%d')`);
      //获取今天  top_order.status = 1 OR top_order.status = 4 的订单记录 另外一种写法
      let todayTopOrder = await this.entityManager.query(`SELECT SUM(amount) AS amountTotal,COUNT(*) AS orderTotal FROM top_order WHERE (status = 1 OR status = 4) AND  DATE_FORMAT(created_at,'%Y-%m-%d') = DATE_FORMAT(NOW(),'%Y-%m-%d')`);
      //获取 72小时内 paymentStatus = 0 or paymentStatus = 2 的链接
      let linkList = await this.entityManager.query(`SELECT link.amount,link.paymentStatus,link.created_at AS createdAt FROM link WHERE (paymentStatus = 0 OR paymentStatus = 2) AND created_at >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 3 DAY),'%Y-%m-%d') `);
      //获取系统开启状态 从
      let pay = await this.paramConfigService.findValueByKey("pay_open");
      return {
        ZHCount: zhList[0].total,
        todayOrder: todayTopOrder[0].orderTotal,
        todaySale: todayTopOrder[0].amountTotal ? todayTopOrder[0].amountTotal : 0,
        yesterdayOrder: yesterdayTopOrder[0].orderTotal,
        yesterdaySale: yesterdayTopOrder[0].amountTotal ? yesterdayTopOrder[0].amountTotal : 0,
        link: linkList,
        sysOpen:pay == "1" ? true : false
      };
    } else if (user.roleLabel == "top") {
      //48小时内  的订单记录
      let topOrder = await this.entityManager.query(`SELECT status,amount FROM top_order WHERE (status = 1 OR status = 4) AND created_at >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 48 HOUR),'%Y-%m-%d %H:%i:%s') AND mid = ${user.id}`);
      let linkList = await this.entityManager.query(`SELECT link.amount,link.paymentStatus,link.created_at AS createdAt FROM link WHERE (paymentStatus = 0 OR paymentStatus = 2) AND created_at >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 3 DAY),'%Y-%m-%d') `);
      return {
        topOrder,
        link: linkList
      };
    } else if (user.roleLabel == "proxy") {
      let qb = await this.userRepository.createQueryBuilder("user")
        .leftJoin("user.zh", "zh")
        // .leftJoin('zh.link','zhLink')
        //48小时内 top_order.status = 1 OR top_order.status = 4 的订单记录
        .leftJoin("user.topOrder", "top_order", "(top_order.status = 1 OR top_order.status = 4)AND top_order.createdAt >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 48 HOUR),'%Y-%m-%d %H:%i:%s')")
        //72小时的链接
        .leftJoin("user.link", "link", "(link.paymentStatus = 0 OR link.paymentStatus = 2) AND link.createdAt >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 72 HOUR),'%Y-%m-%d %H:%i:%s')")
        .select(["user.balance", "user.selfOpen"])
        .addSelect(["top_order.amount", "top_order.status", "top_order.createdAt"])
        .addSelect(["link.amount", "link.paymentStatus", "link.createdAt"])
        // .addSelect(['zhLink.amount','zhLink.paymentStatus','zhLink.createdAt'])
        .addSelect(["zh.id"])
        .where("user.uuid = :uuid", { uuid: user.uuid })
        .getOne();
      return qb;
    }

  }

  async edit(params: any, user: IAdminUser) {
    let { action,open } = params;
    switch (action) {
      case "open":
        if(user.roleLabel == 'proxy'){
          await this.userRepository.update({ uuid: user.uuid }, { selfOpen: open });
        }else if(user.roleLabel == 'admin'){
          let t = open ? '1': '0';
          await this.paramConfigService.updateValueByKey("pay_open",t);
        }

        break
    }
  }

}
