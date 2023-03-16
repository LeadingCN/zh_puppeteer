import { Inject, Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@/shared/services/redis.service";
import { UtilService } from "@/shared/services/util.service";
import { TopService } from "@/modules/usersys/top/top.service";
import { ApiException } from "@/common/exceptions/api.exception";
import { LinkService } from "@/modules/resource/link/link.service";
import { SysParamConfigService } from "@/modules/admin/system/param-config/param-config.service";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import SysUser from "@/entities/admin/sys-user.entity";
import { LinkObject } from "@/modules/api/dto/interface";
import { ZhService } from "@/modules/resource/zh/zh.service";
import { ProxyService } from "@/modules/usersys/proxy/proxy.service";
import { Channel } from "@/entities/resource/channel.entity";
import { Link } from "@/entities/resource/link.entity";
import { TopOrder } from "@/entities/order/top.entity";
import { Queue } from "bull";
import { InjectQueue } from "@nestjs/bull";
import { ZH } from "@/entities/resource/zh.entity";
import process from "process";
import { OrderTopService } from "@/modules/api/top/orderTop.service";
import { ChannelService } from "@/modules/resource/channel/channel.service";
import { SysBalanceLog } from "@/entities/admin/sys-balance.entity";
import { Notify, NotifyResult } from "@/modules/resource/link/dto/dto";

@Injectable()
export class ApiService {
  private host = null;

  constructor(
    private redisService: RedisService,
    private util: UtilService,
    private topUserService: TopService,
    private proxyUserService: ProxyService,
    private linkService: LinkService,
    private topOrderService: OrderTopService,
    private zhService: ZhService,
    private paramConfigService: SysParamConfigService,
    private channelService: ChannelService,
    @InjectEntityManager() private entityManager: EntityManager,//注入EntityManager

    // private readonly amqpConnection: AmqpConnection
    @InjectQueue("order") private orderQueue: Queue
  ) {
    this.init();
  }

  async init() {
    this.host = await this.paramConfigService.findValueByKey("host");
  }

  async payMd5(body) {
    let { merId, orderAmt } = body;//商户号
    let amount = orderAmt;
    orderAmt = Number(orderAmt) * 100;
    let md5Key = await this.topUserService.getMd5Key(Number(merId));
    //判断签名是否正确
    let sign = process.env.NODE_ENV == "development" ? true : this.util.checkSign(body, md5Key);
    if (sign) {
      //判断 是否 有该金额的 链接
      let haveAmount = await this.linkService.getLinkByAmount(body.orderAmt);
      //判断是否开启 即时生成模式
      if (!haveAmount) await this.getInstant();
      //使用策略获取链接
      let l: any = await this.getLinkByStrategy({
        amount: orderAmt,
        channel: body.channel,
        parentChannel: body.parentChannel
      });
      //生成订单
      //body.parentChannel.toString() 前置补0
      let parentChannel = body.parentChannel.toString().padStart(2, "0");
      let oid = this.util.generateUUID() + parentChannel + amount;

      let order = new TopOrder();
      //获取系统设置的超时时间
      let time = await this.paramConfigService.findValueByKey("orderOutTime");
      if (isNaN(Number(time))) throw new ApiException(60010);
      try {
        let rate = await this.channelService.getRateByChannelId(l.user.id, l.link.channel, l.user.uuid);
        // console.log(`${l.user.id} = ${l.link.channel} ${l.user.uuid}  ${rate}`);
        //创建订单
        order.zh = l.zh;
        order.SysUser = l.user;
        order.amount = Number(amount) * 100;
        order.mid = Number(merId);
        order.oid = oid;
        order.mOid = body.orderId;
        order.mIp = body.ip;
        order.mNotifyUrl = body.notifyUrl;
        order.channel = l.link.channel;
        order.parentChannel = body.parentChannel;
        order.lOid = l.link.oid;
        order.lRate = rate;
        await this.entityManager.save(order);

        //插入流水
        let log = new SysBalanceLog();
        log.amount = order.amount * rate / 10000;
        log.uuid = l.user.uuid;
        log.typeEnum = "reduce";
        log.event = "topOrder";
        log.actionUuid = merId;
        log.orderUuid = order.oid;
        log.balance = l.user.balance - order.amount * rate / 10000;
        await this.entityManager.save(log);

        //缓存订单 订单时间为 订单超时时间
        await this.redisService.getRedis().set(`order:${oid}`, JSON.stringify(Object.assign(order, { url: l.link.url })), "EX", time);


      } catch (e) {
        throw new ApiException(60005);
      } finally {

        //创建延时任务
        await this.orderQueue.add("orderOutTime", order, { delay: Number(time) * 1000, removeOnComplete: true });
      }
      //返回链接
      return { code: 1, payurl: `${this.host}/pay.html?no=${oid}`, sysorderno: oid, orderno: body.orderId };
    }
    throw new ApiException(60003);
  }


  async payCheck(body) {
    let { merId, orderId } = body;//商户号
    let md5Key = await this.topUserService.getMd5Key(Number(merId));
    //判断签名是否正确
    let sign = process.env.NODE_ENV == "development" ? true : this.util.checkSign(body, md5Key);
    if (sign) {
      //查询指定订单状态
      return await this.checkOrder(orderId);
    }
    throw new ApiException(60003);
  }

  //查询订单状态 1 接口查询 2 本地查询
  async checkOrder(orderId, type = 1) {
    let order = await this.topOrderService.getOrderStatusByMOid(orderId);
    let isPay = 0;
    if (order?.status == 1) {
      isPay = 1;
    } else if (order?.status != 1) {
      //查询订单相关的信息
      let oInfo = await this.topOrderService.getOrderInfoByMOid(orderId);
      if (!oInfo) {
        if (type == 1) throw new ApiException(60006); //查单失败
        return false;
      }
      //对订单的zh进行查单 查询该zh在TX平台是否有 lOid的 字符串值
      let have = await this.zhService.checkHaveLOid(oInfo.zh, oInfo.lOid);
      if (have) {
        console.log("到账成功");
        isPay = 1;
        //更新订单状态
        await this.topOrderService.setOrderStatus(oInfo.oid, 1);
        //更新支付链接状态
        await this.linkService.setLinkStatus(oInfo.lOid, 1);
        //计算订单佣金并更新用户余额
        await this.proxyUserService.setOrderCommission(oInfo);
        //执行回调
        let oAmt = oInfo.amount/100
        let tNotify: Notify = {
          merId: oInfo.mid.toString(),
          orderId: oInfo.mOid,
          sysOrderId: oInfo.oid,
          desc: 'no',
          orderAmt: oAmt.toString(),
          status: isPay.toString(),
          nonceStr: this.util.generateRandomValue(16),
          attch: '1'
        }
        console.log("执行回调"+oInfo.mNotifyUrl);
        //获取top的md5key
        let md5Key = await this.topUserService.getMd5Key(oInfo.mid);
        let res = await this.topOrderService.notifyRequest(oInfo.mNotifyUrl, tNotify, md5Key);
        //更新订单回调状态
        console.log("更新订单回调状态");
        await this.topOrderService.setOrderNotifyStatus(oInfo.oid, res);
      }
    } else if (!order) {//查单失败
      throw new ApiException(60006);
    }
    if (type == 1) {
      let res = {
        merId: order.mid,
        status: isPay.toString(),
        orderId: order.mOid,
        sysOrderId: order.oid,
        orderAmt: order.amount,
        nonceStr: this.util.generateRandomValue(16)
      };
      //从缓存中获取top的md5key
      let md5Key = await this.topUserService.getMd5Key(order.mid);
      let sign: string = this.util.ascesign(res, md5Key);
      res["sign"] = sign;
      return res;
    } else if (type == 2) {
      return Boolean(isPay);
    }

  }

  /*
  * 判断是否开启即时生成模式
  * */
  async getInstant() {
    //从系统配置中获取
    let instant = await this.paramConfigService.findValueByKey("instant");
    if (Boolean(Number(instant))) {
      //TODO 即时生成模式
    } else {
      throw new ApiException(60004);
    }
  }


  //根据策略获取链接
  async getLinkByStrategy(linkObject: LinkObject, t = 0) {
    switch (t) {

      default :
        return await this.defaultStrategy(linkObject);
    }
  }

  //默认策略
  async defaultStrategy(linkObject: LinkObject) {
    let { amount, channel, parentChannel } = linkObject;
    // 先队列 代理   再 查找符合金额的链接 再根据 链接权重 随机取1个
    let payUserQueue: any = await this.redisService.getRedis().get("pay:user:queue");
    if (!payUserQueue) {
      payUserQueue = await this.topUserService.getPayUser(linkObject.amount);
      //60秒更新一次查看是否有新的代理开启/关闭或者余额更新
      await this.redisService.getRedis().set("pay:user:queue", JSON.stringify(payUserQueue), "EX", 10);
    } else {
      payUserQueue = JSON.parse(payUserQueue);
    }
    if (payUserQueue.length == 0) {
      Logger.error(`没有可用的代理支付 父通道:${linkObject.parentChannel} 子通道:${linkObject.channel} 金额:${linkObject.amount / 100}元 订单`);
      throw new ApiException(60004);
    }
    //从redis中取出当前排队proxyUserUUID
    let lastUuid = await this.redisService.getRedis().get("pay:userqueue:lastUuid");
    if (!lastUuid) {
      lastUuid = payUserQueue[0].uuid;
      await this.redisService.getRedis().set("pay:userqueue:lastUuid", lastUuid, "EX", 60 * 60 * 24 * 365);
    }
    let l = [];
    //复位队列
    let index = payUserQueue.findIndex((item) => {
      return item.uuid == lastUuid;
    });
    if (index > -1) {
      payUserQueue = payUserQueue.slice(index + 1 > payUserQueue.length ? 0 : index + 1).concat(payUserQueue.slice(0, index + 1 > payUserQueue.length ? 0 : index + 1));
    }
    let nowUuid = null, startUid = null, link = null;
    do {
      //执行弹出
      nowUuid = payUserQueue.shift();
      //记录起始用户uid
      if (!startUid) {
        startUid = nowUuid.uuid;
      } else {
        //如果当前用户uid与起始用户uid相同 说明队列中无符合条件的用户
        if (nowUuid.uuid == startUid) {
          break;
        }
      }
      //将当前用户放入队尾
      payUserQueue.push(nowUuid);
      //查询用户余额是否符合 即数据库余额-缓存的订单金额 即 用户余额
      let userBalance = await this.proxyUserService.checkBalance(nowUuid.uuid, amount);
      if (userBalance) {
        //查询当前用户 账号队列 并返回符合条件的link
        link = await this.queueByUserZh(Object.assign(linkObject, { nowUuid: nowUuid }));
        if (link) nowUuid.balance = userBalance.balance;
      }

    } while (!link);
    //将队列放入redis
    await this.redisService.getRedis().set("pay:userqueue:lastUuid", nowUuid.uuid, "EX", 60 * 60 * 24 * 365);
    if (link) return {
      link: link.link,
      zh: link.zh,
      user: nowUuid
    };
    throw new ApiException(60004);

  }


  //用户持有的zh队列
  async queueByUserZh(linkObject: LinkObject) {
    let { nowUuid, amount, parentChannel } = linkObject;
    let tZhQueue = null;
    let linkLockTime: string = await this.paramConfigService.findValueByKey("linkLockTime");
    //判断是否开发模式
    if (process.env.NODE_ENV == "development") {
      linkLockTime = "0";
    }
    //获取该代理用户最后一次拉取链接的zh
    let lastZuid = await this.redisService.getRedis().get("pay:zhqueue:lastUuid:" + nowUuid.username);
    //获取用户账户队列
    let zhQueue: any = await this.redisService.getRedis().get("pay:userzh:" + nowUuid.username);
    if (!zhQueue) {
      zhQueue = await this.zhService.getZhQueueById(nowUuid.id, amount);

      //复制一份队列
      tZhQueue = JSON.parse(JSON.stringify(zhQueue));
      //60秒更新一次
      await this.redisService.getRedis().set("pay:userzh:" + nowUuid.username, JSON.stringify(zhQueue), "EX", 60);
    } else {
      //复制一份队列
      tZhQueue = JSON.parse(zhQueue);
      zhQueue = JSON.parse(zhQueue);

    }
    if (zhQueue.length == 0) {
      // Logger.error(`没有可用的账户 父通道:${linkObject.parentChannel} 子通道:${linkObject.channel} 金额:${linkObject.amount / 100}元 订单`);
      return false;
    }

    // zhQueue 按照每个元素的weight重新排序
    zhQueue.sort((a, b) => {
      return b.weight - a.weight;
    });
    if (zhQueue[0].weight == 0) {
      // console.log("无权重高账户");
      //如果第一个元素的权重为0 则直接按照默认排序
      zhQueue = tZhQueue;
      //复位队列
      let index = zhQueue.findIndex((item) => {
        return item.zuid == lastZuid;
      });
      if (index > -1) {
        zhQueue = zhQueue.slice(index + 1 > zhQueue.length ? 0 : index + 1).concat(zhQueue.slice(0, index + 1 > zhQueue.length ? 0 : index + 1));
      }
    }

    let nowZuid = null, startUid = null, link = null;
    do {
      //执行弹出
      nowZuid = zhQueue.shift();
      //记录起始用户uid
      if (!startUid) {
        startUid = nowZuid.zuid;
      } else {
        //如果当前用户uid与起始用户uid相同 说明队列中无符合条件的用户
        if (nowZuid.zuid == startUid) {
          break;
        }
      }
      //将当前用户放入队尾
      zhQueue.push(nowZuid);
      //判断当前账号是否有符合的链接
      //通过事务执行查询
      link = await this.entityManager.transaction(async entityManager => {
        try {
          //查询符合链接 并且 该链接的归属zh 是否符合业务逻辑(限额,余额,状态)   //TODO 权重
          let l: any = await entityManager.createQueryBuilder("link", "link")
            .leftJoin("link.zh", "zh", `zh.id = ${nowZuid.id}`)
            .leftJoin(Channel, "channel", "link.channel = channel.id")
            .where("link.amount = :amount", { amount: amount })
            //判断支付通道 父类
            .andWhere("link.parentChannel = :parentChannel", { parentChannel: parentChannel })
            .andWhere("link.paymentStatus = 0")
            .andWhere("link.createStatus = 1")
            //判断链接 lockTime 当前时间是否大于lockTime
            .andWhere("link.lockTime < :lockTime", { lockTime: new Date() })
            .andWhere(`UNIX_TIMESTAMP(now()) < round(UNIX_TIMESTAMP(link.created_at)+ channel.expireTime)`)
            //判断zh open
            .andWhere("zh.open = 1")
            //判断账号得限额 - 锁额-缓存订单金额 > 订单金额
            .andWhere(`zh.rechargeLimit - zh.lockLimit  >= ${amount}`)
            .getOne();
          //更新link zh proxyuser状态
          if (l) {
            let rate = await this.channelService.getRateByChannelId(nowUuid.id, l.channel, nowUuid.uuid);
            let r = await entityManager.createQueryBuilder()
              .update(Link)
              .set({
                paymentStatus: 2,
                lockTime: () => {
                  return `DATE_ADD(now(),INTERVAL ${linkLockTime} SECOND)`;
                },
                version: () => {
                  return `version + 1`;
                }

              })
              .where("id = :id", { id: l.id, version: l.version })
              .execute()
            if(r.affected >=1){//有被更新
              //更新zh状态锁定金额
              await entityManager.createQueryBuilder()
                .update(ZH)
                .set({
                  lockLimit: () => {
                    return `lockLimit + ${amount}`;
                  }
                })
                .where("id = :id", { id: nowZuid.id })
                .execute();

              //更新用户状态锁定金额
              // console.log(`实际扣费${amount*rate/10000}`);
              let rateAmount = amount * rate / 10000;
              await entityManager.createQueryBuilder()
                .update(SysUser)
                .set({
                  balance: () => {
                    return `balance - ${rateAmount}`;
                  }
                })
                .where("id = :id", { id: nowUuid.id })
                .execute();
              return l;
            }
          }
          return null;
        } catch (e) {
          Logger.error("事务提取链接失败")
          Logger.error(e.toString());
          console.log(e);
        }
      });
    } while (!link);
    //将最后zuid放入redis
    await this.redisService.getRedis().set("pay:zhqueue:lastUuid:" + nowUuid.username, nowZuid.zuid, "EX", 60 * 60 * 24 * 365);
    if (link) return {
      link,
      zh: nowZuid
    };
    return false;

  }


  //支付页面处理
  async getPayUrl(params: any) {
    let { orderid, channel, action } = params;
    //从缓存中获取订单信息
    let orderInfo: any = await this.redisService.getRedis().get(`order:${orderid}`);
    let code = 0;
    if (action == "checkorder") {
      if (orderInfo) {
        orderInfo = JSON.parse(orderInfo);
        //本地调用查单函数
        let is = await this.checkOrder(orderInfo.mOid, 2);
        return { code: is ? 1 : 0 };
      }
      return { code: 3 };
    } else {
      if (!orderInfo) return { code: 3, msg: "订单超时,请重新拉取" };
      //返回支付链接
      orderInfo = JSON.parse(orderInfo);
      return { code, msg: "ok", url: orderInfo.url };
    }
  }



}
