import { Inject, Injectable } from "@nestjs/common";
import { CreateNewtestDto, getoneNewtestDto } from "../dto/create-newtest.dto";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { RedisService } from "@/shared/services/redis.service";
import { UtilService } from "@/shared/services/util.service";
import { IAdminUser } from "@/modules/admin/admin.interface";
import { Channel } from "@/entities/resource/channel.entity";
import { SysUserService } from "@/modules/admin/system/user/user.service";

@Injectable()
export class ChannelService {
  constructor(
    private userService: SysUserService,
    @InjectRepository(Channel) private channelRepository: Repository<Channel>,
    private redisService: RedisService,
    private util: UtilService) {
  }

  async page(params, user: IAdminUser) {
    let { page, limit, action } = params;
    if (action == "use") {
      return await this.channelRoot();
    } else if (action == "list") {
      return await this.channelList();
    } else {
      let qb = null;
      if (user.roleLabel == "admin") {
        qb = await this.channelRepository.createQueryBuilder("channel")
          .leftJoinAndSelect("channel.children", "children")
          .where("channel.parent is null")
          .offset((page - 1) * limit)
          .limit(limit);
      } else if (user.roleLabel == "proxy") {
        qb = await this.channelRepository.createQueryBuilder("channel")
          .leftJoinAndSelect("channel.children", "children")
          .where("channel.parent is null")
          .offset((page - 1) * limit)
          .limit(limit);
        //查询用户所有父级
      }else if(user.roleLabel == "top"){
        qb = await this.channelRepository.createQueryBuilder("channel")
          .leftJoinAndSelect("channel.children", "children")
          .where("channel.parent is null")
          .offset((page - 1) * limit)
          .limit(limit);
      }
      let rateTotal = await this.userService.getParentsRate(user.id);
      const [_, total] = await qb.getManyAndCount();
      let list = await qb.getMany();
      list.forEach((item) => {
        if (item.children.length > 0) {
          item.children.forEach((child) => {
            child.rate = Number(child.rate) + Number(rateTotal);
          });
        }
      });
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


  async add(params, user: IAdminUser) {
    console.log(params);
    let { name, rate, parent_id } = params;
    let p = null;
    if (parent_id) {
      //查询父级实例
      p = await this.channelRepository.findOne({ where: { id: parent_id } });
    }
    console.log(p);
    let channel = new Channel();
    channel.name = name;
    channel.rate = rate;
    channel.parent = p;
    await this.channelRepository.save(channel);
    return "ok";
  }


  async edit(params, user: IAdminUser) {
    let { action, name, rate, id,expireTime } = params;
    if (action == "edit") {
      await this.channelRepository.update(id, { name, rate,expireTime });
      //更新redis缓存
      await this.redisService.getRedis().del(`channel:${id}`);
    } else if (action == "del") {
      await this.channelRepository.delete(params.id);
    }
  }

  async channelRoot() {
    //获取树状根节点
    let qb = await this.channelRepository.createQueryBuilder("channel")
      .where("channel.parent is null")
      .getMany();
    return qb;
  }

  async channelList() {
    let qb = await this.channelRepository.createQueryBuilder("channel")
      .select(["channel.id", "channel.name"])
      .where("channel.parent is not null")
      .getMany();
    return qb;
  }


  //计算用户该支付通道总费率
  async getRateByChannelId(userId:number,id: number,uuid:string) {
    //用户上级费率
    //先从缓存中查询
    let rateTotal:any = await this.redisService.getRedis().get(`usersys:prxoy:${uuid}:ratetotal`);
    if(!rateTotal){
      rateTotal = await this.userService.getParentsRate(userId);
      await this.redisService.getRedis().set(`usersys:proxy:${uuid}:ratetotal`, rateTotal, "EX", 60 * 60 * 24);
    }
    //支付通道费率
    let channel = await this.getChannelInfo(id);
    if (channel) {
      return Number(channel.rate) + Number(rateTotal);
    }
  }

  //查询通道详情
  async getChannelInfo(id: number) {
    //先从缓存中查询
    let cache = await this.redisService.getRedis().get(`channel:${id}`);
    if (cache) {
      return JSON.parse(cache);
    }
    //使用树状结构查询id的父级id
    let qb = await this.channelRepository.createQueryBuilder("channel")
      //对提取的字段进行重命名
      .select(["channel.id AS id", "channel.name AS name", "channel.rate AS rate", "channel.parentId AS parentId"])
      .where("channel.id = :id", { id })
      .getRawOne();
    if (qb) {
      //缓存一天
      await this.redisService.getRedis().set(`channel:${id}`, JSON.stringify(qb), "EX", 60 * 60 * 24);
      return qb;
    }
    return null;
  }
}
