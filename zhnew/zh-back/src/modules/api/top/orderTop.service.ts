import { Inject, Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@/shared/services/redis.service";
import { UtilService } from "@/shared/services/util.service";
import { ZhService } from "@/modules/resource/zh/zh.service";
import { LinkService } from "@/modules/resource/link/link.service";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { TopOrder } from "@/entities/order/top.entity";
import { ProxyService } from "@/modules/usersys/proxy/proxy.service";
import { SysBalanceLog } from "@/entities/admin/sys-balance.entity";
import { IAdminUser } from "@/modules/admin/admin.interface";
import { isNaN } from "lodash";
import { ApiException } from "@/common/exceptions/api.exception";
import { Notify, NotifyResult } from "@/modules/resource/link/dto/dto";
import { ApiService } from "@/modules/api/api.service";
import { TopService } from "@/modules/usersys/top/top.service";
const REQ = require('request-promise-native')
@Injectable()
export class OrderTopService {
  constructor(
    private redisService: RedisService,
    private util: UtilService,
    private zhService: ZhService,
    private linkService: LinkService,
    private proxyUserService: ProxyService,
    private topUserService:TopService,
    @InjectEntityManager() private entityManager: EntityManager,
    @InjectRepository(TopOrder) private orderRepository: Repository<TopOrder>
  ) {
  }
  async notifyRequest(url, notify: Notify, yan: string): Promise<NotifyResult> {
    let sign: string = this.util.ascesign(notify, yan);
    let form = JSON.stringify(notify);
    form = JSON.parse(form)
    form['sign'] = sign;
    //请求
    try {
      let r = await REQ.post({url: url, form: form})
      Logger.log("回调结果")
      Logger.log(r)
      if (r && r === 'success') {
        return {
          result : true,
          msg :''
        }
      }
      return {
        result : false,
        msg :''
      }
    } catch (error) {
      return {
        result : false,
        msg :''
      }
    }
  }

  async page(params, user: IAdminUser) {
    //判断角色
    switch (user.roleLabel) {
      case "admin":
        return await this.pageByAdmin(params, user);
      case "proxy":
        return await this.pageByProxy(params, user);
      case "top":
        return await this.pageByTop(params, user);
    }
  }

  async pageByAdmin(params, user: IAdminUser) {
    let { page, limit, mid, oid, lOid, accountNumber, amount, createdAt, channelName, callback, status } = params;
    amount ? amount = Number(amount) * 100 : 0;
    let qb = await this.orderRepository.createQueryBuilder("order")
      .leftJoin("order.SysUser", "user")
      .leftJoin("order.zh", "zh")
      .leftJoin("channel", "channel", "channel.id = order.channel")
      .select([
        "order.amount AS amount", "order.mOid AS mOid", "order.mid AS mid", "order.status AS status", "order.created_at AS createdAt", "order.oid AS oid",
        "order.lOid AS lOid", "order.callback AS callback"
      ])
      .addSelect([
        "channel.name AS channelName"
      ])
      .addSelect([
        "zh.accountNumber AS accountNumber"
      ])
      .where(mid ? "order.mid = :mid" : "1=1", { mid })
      .andWhere(oid ? "order.oid = :oid" : "1=1", { oid })
      .andWhere(lOid ? "order.lOid = :lOid" : "1=1", { lOid })
      .andWhere(accountNumber ? "zh.accountNumber = :accountNumber" : "1=1", { accountNumber })
      .andWhere(amount ? "order.amount = :amount" : "1=1", { amount: !isNaN(amount) ? amount : null })
      .andWhere(createdAt ? "DATE_FORMAT(order.created_at,'%Y-%m-%d') >= :createdStart AND DATE_FORMAT(order.created_at,'%Y-%m-%d') <= :createdEnd" : "1=1", {
        createdStart: createdAt ? createdAt[0] : "",
        createdEnd: createdAt ? createdAt[1] : ""
      })
      .andWhere(channelName ? "channel.id = :channelName" : "1=1", { channelName })
      .andWhere(callback ? "order.callback = :callback" : "1=1", { callback })
      .andWhere(status ? "order.status = :status" : "1=1", { status })
      .orderBy("order.created_at", "DESC")
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

  async pageByProxy(params, user: IAdminUser) {
    let { page, limit, oid, lOid, accountNumber, amount, createdAt, channelName, callback, status } = params;
    amount ? amount = Number(amount) * 100 : 0;
    let qb = await this.orderRepository.createQueryBuilder("order")
      .leftJoin("order.SysUser", "user")
      .leftJoin("order.zh", "zh")
      .leftJoin("channel", "channel", "channel.id = order.channel")
      .select([
        "order.amount AS amount", "order.mOid AS mOid", "order.status AS status", "order.created_at AS createdAt", "order.oid AS oid",
        "order.lOid AS lOid", "order.callback AS callback"
      ])
      .addSelect([
        "channel.name AS channelName"
      ])
      .addSelect([
        "zh.accountNumber AS accountNumber"
      ])
      .where("user.uuid = :uuid", { uuid: user.uuid })
      .andWhere(oid ? "order.oid = :oid" : "1=1", { oid })
      .andWhere(lOid ? "order.lOid = :lOid" : "1=1", { lOid })
      .andWhere(accountNumber ? "zh.accountNumber = :accountNumber" : "1=1", { accountNumber })
      .andWhere(amount ? "order.amount = :amount" : "1=1", { amount: !isNaN(amount) ? amount : null })
      .andWhere(createdAt ? "DATE_FORMAT(order.created_at,'%Y-%m-%d') >= :createdStart AND DATE_FORMAT(order.created_at,'%Y-%m-%d') <= :createdEnd" : "1=1", {
        createdStart: createdAt ? createdAt[0] : "",
        createdEnd: createdAt ? createdAt[1] : ""
      })
      .andWhere(channelName ? "channel.id = :channelName" : "1=1", { channelName })
      .andWhere(callback ? "order.callback = :callback" : "1=1", { callback: callback })
      .andWhere(status ? "order.status = :status" : "1=1", { status })
      .orderBy("order.created_at", "DESC")
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

  async pageByTop(params, user: IAdminUser) {
    let { page, limit, oid, lOid, mOid, amount, createdAt, channelName, status } = params;
    amount ? amount = Number(amount) * 100 : 0;
    let qb = await this.orderRepository.createQueryBuilder("order")
      .leftJoin("channel", "channel", "channel.id = order.parentChannel")
      .select([
        "order.amount AS amount", "order.mOid AS mOid", "order.mid AS mid", "order.status AS status", "order.created_at AS createdAt", "order.oid AS oid",
        "order.lOid AS lOid"
      ])
      .addSelect([
        "channel.name AS channelName"
      ])
      .where("order.mid = :mid", { mid: user.id })
      .andWhere(mOid ? "order.mOid = :mOid" : "1=1", { mOid })
      .andWhere(oid ? "order.oid = :oid" : "1=1", { oid })
      .andWhere(lOid ? "order.lOid = :lOid" : "1=1", { lOid })
      .andWhere(amount ? "order.amount = :amount" : "1=1", { amount: !isNaN(amount) ? amount : null })
      .andWhere(createdAt ? "DATE_FORMAT(order.created_at,'%Y-%m-%d') >= :createdStart AND DATE_FORMAT(order.created_at,'%Y-%m-%d') <= :createdEnd" : "1=1", {
        createdStart: createdAt ? createdAt[0] : "",
        createdEnd: createdAt ? createdAt[1] : ""
      })
      .andWhere(channelName ? "order.parentChannel = :channelName" : "1=1", { channelName })
      // .andWhere(callbackInfo ? "order.callbackInfo = :callbackInfo" : "1=1", { callbackInfo: callbackInfo == "-1" ? null : callbackInfo })
      .andWhere(status ? "order.status = :status" : "1=1", { status })
      .orderBy("order.created_at", "DESC")
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


  async callback(params, user: IAdminUser) {
    let { oid } = params;
    //判断订单是否超时
    let order = await this.orderRepository.createQueryBuilder("order")
      .leftJoin("order.SysUser", "user")
      .where(user.roleLabel == "admin" ? "1=1" : "user.uuid = :uuid", { uuid: user.uuid })
      .andWhere("order.oid = :oid", { oid })
      .getOne();
    console.log(order);
    // if (order?.status == 1) {
    //   throw new ApiException(60008);
    // } else
    if (order?.status != 2) {
      if (order?.status == 3) {
        throw new ApiException(60009);
      }

      //更新订单回调状态
      await this.setOrderCallbackStatus(order.oid, "强制回调");
      //更新支付链接状态
      await this.linkService.setLinkCallback(order.lOid);
      let oInfo: any = await this.getOrderInfoByMOid(order.mOid);

      //执行强制回调
      let oAmt = oInfo.amount/100
      let tNotify: Notify = {
        merId: oInfo.mid.toString(),
        orderId: oInfo.mOid,
        sysOrderId: oInfo.oid,
        desc: 'no',
        orderAmt: oAmt.toString(),
        status: '1',
        nonceStr: this.util.generateRandomValue(16),
        attch: '1'
      }
      console.log("执行回调"+oInfo.mNotifyUrl);
      //获取top的md5key
      let md5Key = await this.topUserService.getMd5Key(oInfo.mid);
      await this.notifyRequest(oInfo.mNotifyUrl, tNotify, md5Key);

      //计算订单佣金并更新用户余额
      await this.proxyUserService.setOrderCommission(oInfo);
      //扣除用户余额 balance
      let balance: any = await this.proxyUserService.updateBalance(oInfo.SysUser.uuid, oInfo.amount * order.lRate / 10000, "sub");
      //记录用户余额变动日志
      let balanceLog = new SysBalanceLog();
      balanceLog.amount = oInfo.amount * order.lRate / 10000;
      balanceLog.balance = balance;
      balanceLog.typeEnum = "sub";
      balanceLog.event = "orderCallback";
      balanceLog.actionUuid = user.uuid;
      balanceLog.orderUuid = order.oid;
      balanceLog.uuid = oInfo.SysUser.uuid;
      await this.entityManager.save(balanceLog);
      return;
    }
    throw new ApiException(60007);

  }

  async orderOuTtime(job) {
    let { data } = job;
    let { zh, SysUser, oid, lOid, lRate, amount } = data;
    // console.log(`zh:${zh.accountNumber}订单超时:${data.amount / 100}元`);
    //判断订单是否成功 成功则不执行
    let order = await this.orderRepository.createQueryBuilder("order")
      .where("order.oid = :oid", { oid })
      .getOne();
    if (order?.status == 1 || order?.status == 3 || order?.status == 4) {
      return;
    }
    //更新账号锁定金额
    await this.zhService.updateLockLimitByZuid(zh.zuid, job.data.amount);
    //更新链接状态
    await this.linkService.reSetLinkStatus(lOid, 0);
    //更新订单状态 -1
    await this.setOrderStatus(oid, -1);
    //更新用户余额
    let addAmount = amount * lRate / 10000;
    // console.log(`实际增加${addAmount}.费率${lRate},金额${amount}`);
    let nowBalance = await this.proxyUserService.updateBalance(SysUser.uuid, addAmount, "add");
    //日志添加
    let log = new SysBalanceLog();
    log.amount = addAmount;
    log.uuid = SysUser.uuid;
    log.typeEnum = "add";
    log.event = "topOrderRe";
    log.actionUuid = "1";
    log.orderUuid = oid;
    log.balance = nowBalance ? nowBalance : 0;
    await this.entityManager.save(log);

  }

  //更新订单支付状态
  async setOrderStatus(oid: string, status: number) {
    console.log(oid);
    try {
      await this.orderRepository.createQueryBuilder()
        .update()
        .set({ status: status })
        .where("oid = :oid", { oid: oid })
        .execute();
    } catch (e) {
      Logger.error("更新订单状态失败");
      Logger.error(e.stack);
    }
  }

  //更新订单回调状态回调信息 支付状态 如果是1 则 4 支付成功强制回调 否则 3 强制回调
  async setOrderCallbackStatus(oid: string, callbackInfo) {
    try {
      await this.orderRepository.createQueryBuilder()
        .update()
        .set({
          callbackInfo,
          status: ()=>{
            return `case when status = 1 or status = 4 then 4 else 3 end`
          },
          callback:3
        })
        .where("oid = :oid", { oid: oid })
        .execute();
    } catch (e) {
      Logger.error("更新订单回调状态失败");
      Logger.error(e.stack);
    }
  }

  //请求通知回调
  async setOrderNotifyStatus(oid: string, res: NotifyResult) {
    console.log("回调结果");
    console.log(res);
    try {
      await this.orderRepository.createQueryBuilder()
        .update()
        .set({
          callbackInfo: res.msg,
          callback: res.result ? 1 : 2
        })
        .where("oid = :oid", { oid: oid })
        .execute();
    } catch (e) {
      Logger.error("更新 请求通知回调状态失败");
      Logger.error(e.stack);
    }
  }

  //查询指定订单状态
  async getOrderStatusByMOid(mOid: string) {
    let qb = await this.orderRepository.createQueryBuilder("order")
      .where("order.mOid = :mOid", { mOid })
      .getOne();
    return qb;
  }

  async getOrderInfoByMOid(mOid: string) {
    try {
      let qb = await this.orderRepository.createQueryBuilder("order")
        .leftJoinAndSelect("order.SysUser", "SysUser")
        .leftJoinAndSelect("order.zh", "zh")
        .select(["order.lOid", "order.amount", "order.oid", "order.mNotifyUrl", "order.mid", "order.mOid",
          "zh.zuid", "zh.accountNumber", "zh.openid", "zh.openkey",
          "SysUser.uuid", "SysUser.username"

        ])
        .where("order.mOid = :mOid", { mOid })
        .getOne();
      return qb;
    } catch (e) {
      Logger.error("查询订单信息失败");
      return false;
    }


  }

}
