import { Inject, Injectable } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { RedisService } from "@/shared/services/redis.service";
import { UtilService } from "@/shared/services/util.service";
import { ZH } from "@/entities/resource/zh.entity";
import { IAdminUser } from "@/modules/admin/admin.interface";
import { Group } from "@/entities/resource/group.entity";
import { ZhService } from "@/modules/resource/zh/zh.service";
import { ProxyService } from "@/modules/usersys/proxy/proxy.service";
import { ApiException } from "@/common/exceptions/api.exception";


@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group) private groupRepository: Repository<Group>,
    private redisService: RedisService,
    private zhService: ZhService,
    private proxyUserService: ProxyService,
    private util: UtilService) {
  }

  async page(params, user: IAdminUser) {
    let {action, page, limit, country } = params;
    if(action == 'use'){
      //返回user创建的组
      let gList = await this.groupRepository.createQueryBuilder("group")
        .leftJoin("group.SysUser", "SysUser")
        .where("SysUser.id = :id", { id: user.id })
        .getMany()
      return gList;
    }
    let qb = await this.groupRepository.createQueryBuilder("group")
      .leftJoin("group.SysUser", "SysUser")
      .leftJoin("group.children", "children")
      .select(["group.id", "group.name", "children.zuid", "children.accountNumber"])
      .where(user.roleLabel == "admin" ? "1=1" : "SysUser.id = :id", { id: user.id })
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
    console.log(params);
    let { name, ids } = params;
    if (ids.length <= 0 || !ids) throw new ApiException(50001);
    let group = new Group();
    //获取ZH 实例
    let children: any = await this.zhService.getInstantiationByZuid(ids, user.id);
    //获取代理用户 实例
    let u = await this.proxyUserService.getInstantiationByUserId(user.id);
    if (!u) {
      throw new ApiException(10017);
    }
    group.name = name;
    group.children = children;
    group.SysUser = u;
    await this.groupRepository.save(group);
  }

  async edit(params, user: IAdminUser) {
    console.log(params);
    let { action, data } = params;
    if(action == 'all'){
      //清空该用户所有群组 移除 关联关系
      let gList =  await this.groupRepository.createQueryBuilder("group")
        .leftJoin("group.SysUser", "SysUser")
        .leftJoinAndSelect("group.children", "children")
        .where("SysUser.id = :id", { id: user.id })
        .getMany();
      for(let g of gList){
        g.children = [];
        await this.groupRepository.save(g);
        //删除g
        await this.groupRepository.delete(g.id);
      }
      return
    }
    let { groupId, ids } = data;


    if (action == "delAccount" || action == "addAccount") {

      let g = await this.groupRepository.createQueryBuilder("group")
        .leftJoin("group.SysUser", "SysUser")
        .leftJoinAndSelect("group.children", "children")
        .where(user.roleLabel == "admin" ? "1=1" : "SysUser.id = :id", { id: user.id })
        .andWhere("group.id = :groupId", { groupId })
        .getOne();
      if (!g) {
        throw new ApiException(10017);
      }
      if (action == "delAccount") {
        //移除g.children 中的 zuid == ids数组里面的 字符串
        g.children = g.children.filter((item: any) => item.zuid != ids);
        await this.groupRepository.save(g);
      } else if (action == "addAccount") {
        let children: any = await this.zhService.getInstantiationByZuid(ids, user.id);
        g.children = [...g.children, ...children];
        //children zuid 去重
        g.children = this.util.unique(g.children, "zuid");
        await this.groupRepository.save(g);
      }

    }
    else if (action == "delGroup") {
      try {
        await this.groupRepository.createQueryBuilder("group")
          .leftJoin("group.SysUser", "SysUser")
          .delete()
          .where(user.roleLabel == "admin" ? "1=1" : "SysUser.id = :id", { id: user.id })
          .andWhere("group.id = :groupId", { groupId: groupId })
          .execute();
      }catch (e) {
        throw new ApiException(50002)
      }

    }
  }


}
