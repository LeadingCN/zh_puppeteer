import { Inject, Injectable } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { RedisService } from "@/shared/services/redis.service";
import { UtilService } from "@/shared/services/util.service";
import { IAdminUser } from "@/modules/admin/admin.interface";
import { Link } from "@/entities/resource/link.entity";
import SysUser from "@/entities/admin/sys-user.entity";
import { ApiException } from "@/common/exceptions/api.exception";
import { ZhService } from "@/modules/resource/zh/zh.service";
import { ZH } from "@/entities/resource/zh.entity";
import { Channel } from "@/entities/resource/channel.entity";
import { ChannelService } from "@/modules/resource/channel/channel.service";
import { AddLink } from "@/modules/resource/link/dto/dto";
import { SysParamConfigService } from "@/modules/admin/system/param-config/param-config.service";

@Injectable()
export class LinkService {
  constructor(
    @InjectRepository(Link) private linkRepository: Repository<Link>,
    @InjectRepository(SysUser) private userRepository: Repository<SysUser>,
    @InjectRepository(ZH) private zhRepository: Repository<ZH>,
    private paramConfigService: SysParamConfigService,
    private redisService: RedisService,
    private zhService: ZhService,
    private channelService: ChannelService,
    private util: UtilService) {
  }

  async page(params, user: IAdminUser) {
    console.log(params);
    let { page, limit, paymentStatus, reuse, channelName, amount, action, username, oid } = params;
    let qb = null;
    if (action == "amountType") {
      //获取用户链接的金额类型
      let amountList = await this.linkRepository.createQueryBuilder("link")
        .leftJoin("link.SysUser", "SysUser")
        .select("link.amount")
        .where(user.roleLabel == "admin" ? "1=1" : "SysUser.id = :id", { id: user.id })
        .groupBy("link.amount")
        .getMany();
      return amountList;
    } else {
      qb = await this.linkRepository.createQueryBuilder("link")
        .leftJoin("link.SysUser", "SysUser")
        .leftJoin("link.zh", "zh")
        .innerJoin("channel", "channel", "channel.id = link.channel")
        .select([
          "link.id AS id", "link.amount AS amount", "link.oid AS oid", "link.reuse  AS reuse", "link.createStatus  AS createStatus", "link.paymentStatus AS paymentStatus",
          "link.created_at AS createdAt",
          "SysUser.username AS username", "zh.accountNumber AS accountNumber", "zh.zuid AS zuid"
          , "channel.name AS channelName"])
        //归属
        .where(user.roleLabel == "admin" ? "1=1" : "SysUser.id = :id", { id: user.id })
        //管理员归属查询
        .andWhere(user.roleLabel == "admin" && username ? "SysUser.username LIKE :username" : "1=1", { username: `%${username}%` })
        //支付状态
        .andWhere(paymentStatus ? "link.paymentStatus = :paymentStatus" : "1=1", { paymentStatus: paymentStatus })
        //复用状态
        .andWhere(reuse ? "link.reuse = :reuse" : "1=1", { reuse: reuse == "true" ? true : false })
        //支付通道类型
        .andWhere(channelName ? "link.channel = :channel" : "1=1", { channel: channelName })
        //金额
        .andWhere(amount ? "link.amount = :amount" : "1=1", { amount: amount })
        //TX订单号
        .andWhere(oid ? "link.oid = :oid" : "1=1", { oid: oid })
        //创建时间排序
        .orderBy("link.created_at", "DESC")
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

  }

  async add(params: AddLink, user: IAdminUser) {
    console.log(params);
    let { pay_link, amount, oid, zuid, channel } = params;
    //查询用户实例
    let u = await this.userRepository.createQueryBuilder("user")
      .where("user.id = :id", { id: user.id })
      .getOne();
    if (!u) throw new ApiException(10017);

    //查询账号实例
    let z: any = await this.zhService.getInstantiationByZuid(zuid, user.id);
    if (!z) throw new ApiException(40003);

    //查询通道详情
    let channelInfo = await this.channelService.getChannelInfo(Number(channel));
    if (!channelInfo) throw new ApiException(40004);

    let link = new Link();
    let buff = Buffer.from(pay_link, "base64");
    const url = buff.toString("utf-8");
    link.zh = z;
    link.SysUser = u;
    link.amount = amount;
    link.oid = oid;
    link.url = url;
    link.channel = channel;
    link.reuse = z.reuse;
    link.parentChannel = channelInfo.parentId;
    await this.linkRepository.save(link);
  }

  async edit(params, user: IAdminUser) {
    let { action, oid, reuse, ids } = params;
    console.log(params);
    switch (action) {
      case "all":
        await this.linkRepository.createQueryBuilder("link")
          .leftJoin("link.SysUser", "SysUser")
          .delete()
          .where("SysUser.id = :id", { id: user.id })
          .execute();
        break;
      case "del":
        await this.linkRepository.createQueryBuilder("link")
          .leftJoin("link.SysUser", "SysUser")
          .delete()
          .where(user.roleLabel == "admin" ? "1=1" : "SysUser.id = :id", { id: user.id })
          .andWhere(oid ? "link.oid = :oid" : "1=1", { oid: oid })
          .andWhere(ids ? "link.oid in (:...ids)" : "1=1", { ids: ids })
          .execute();
        break;
      case "reuse":
        await this.linkRepository.createQueryBuilder("link")
          .leftJoin("link.SysUser", "SysUser")
          .update()
          .set({ reuse: reuse })
          .where(user.roleLabel == "admin" ? "1=1" : "SysUser.id = :id", { id: user.id })
          .andWhere("link.oid = :oid", { oid: oid })
          .execute();
        //判断reuse设置值 如果是true 则该恢复该链接可用状态
        if(reuse){
          //查询链接支付状态如果为 支付中抛出错误
          let link = await this.linkRepository.createQueryBuilder("link")
            .leftJoin("link.SysUser", "SysUser")
            .where(user.roleLabel == "admin" ? "1=1" : "SysUser.id = :id", { id: user.id })
            .andWhere("link.oid = :oid", { oid: oid })
            .getOne();
          if(link.paymentStatus == 2) throw new ApiException(40005);
          await this.linkRepository.createQueryBuilder("link")
          .leftJoin("link.SysUser", "SysUser")
          .update()
          .set({ createStatus: 1,
            paymentStatus: 0,
            createdAt: new Date() //更新创建时间为今天
          })
          .where(user.roleLabel == "admin" ? "1=1" : "SysUser.id = :id", { id: user.id })
          .andWhere("link.oid = :oid", { oid: oid })
          .execute();
        }
        break;
      case "open": //批量开启复位
      case "close"://批量关闭复位
        await this.linkRepository.createQueryBuilder("link")
          .leftJoin("link.SysUser", "SysUser")
          .update()
          .set({ reuse: action == "open" ? true : false })
          .where(user.roleLabel == "admin" ? "1=1" : "SysUser.id = :id", { id: user.id })
          .andWhere("link.oid in (:...ids)", { ids: ids })
          .execute();
        break;
    }
  }

  async getLinkType() {
    //获取系统 设置的链接超时时间
    let link_timeout = await this.paramConfigService.findValueByKey("link_timeout");
    //优化成查询可用链接类型 判断是否超时 完成状态 TODO
    let linkTypeList = await this.linkRepository.createQueryBuilder("link")
      .leftJoin(Channel, "channel", "link.channel = channel.id")
      .select("link.amount AS amount")
      .where("link.paymentStatus = 0")
      .andWhere("link.createStatus = 1")
      //判断 现在时间戳  是否小于于 创建时间戳 + 超时时间
      .andWhere(" UNIX_TIMESTAMP(now()) < round(UNIX_TIMESTAMP(link.created_at)+ channel.expireTime) ")
      //判断链接是否超时
      .groupBy("link.amount")
    //linkTypeList 转换成数组
    let t = await linkTypeList.getRawMany();
    let amountList = t.map((item) => {
      return item.amount.toString();
    });
    return amountList;
  }

  async getLinkByAmount(amount: number | string) {
    if (!amount) throw new ApiException(60004);
    amount = Number(amount);
    if (isNaN(amount)) throw new ApiException(60004);
    //从缓存查询链接的金额类型
    let amountList: any = await this.redisService.getRedis().get("link:amountList");
    if (!amountList) {
      amountList = await this.getLinkType();
      console.log(amountList);
      if (amountList.length === 0)  return false
      await this.redisService.getRedis().set("link:amountList", JSON.stringify(amountList), "EX", 60);
    } else {
      amountList = JSON.parse(amountList);
    }
    if (amountList.includes((amount * 100).toString())) {
      return true;
    }
    return false
  }


  //订单恢复链接状态
  async reSetLinkStatus(oid: string, status: number =0) {
    await this.linkRepository.createQueryBuilder("link")
      .update()
      .set({ paymentStatus: ()=>{
          return `case when reuse = 1  then  ${status}  else -1 end`
        } })
      .where("link.oid = :oid", { oid: oid })
      .execute();
  }
  async setLinkStatus(oid: string, status: number =0) {
    await this.linkRepository.createQueryBuilder("link")
      .update()
      .set({ paymentStatus: status })
      .where("link.oid = :oid", { oid: oid })
      .execute();
  }
  //订单强制回调
  async setLinkCallback(oid: string) {
    await this.linkRepository.createQueryBuilder("link")
      .update()
      .set({ paymentStatus: ()=>{
          return `case when paymentStatus = 1 or paymentStatus = 4 then 4 else 3 end`
        }, })
      .where("link.oid = :oid", { oid: oid })
      .execute();
  }
}
