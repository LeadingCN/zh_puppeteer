import { Inject, Injectable } from "@nestjs/common";
import { CreateNewtestDto, getoneNewtestDto } from "./dto/create-newtest.dto";
import { SelfFile, UpdateNewtestDto } from "./dto/update-newtest.dto";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { RedisService } from "@/shared/services/redis.service";
import { UtilService } from "@/shared/services/util.service";
import { Newtest } from "@/entities/newTest/newtest.entity";

@Injectable()
export class NewtestService {
  constructor(
    @InjectRepository(Newtest) private newtestRepository: Repository<Newtest>,

    private redisService: RedisService,
    @InjectEntityManager() private entityManager: EntityManager,
    private util: UtilService) {
  }


  async findOne(params: getoneNewtestDto) {
    let r =await this.newtestRepository.find({
      where: { id: params.id },
    });
    //判断name test 是否存在 不存在则创建
    await  this.newtestRepository.findOne({where:{name:'test'}}).then(
      async (res)=>{
        if(!res){
          await this.newtestRepository.save({name:'test'}).then(
            async (res)=>{
              console.log(res);
            }
          )
        }
      }
    );

    return `This action returns a #${params.id} 23 ${r[0].name}`;
  }

  async upfile(file:SelfFile) {
    console.log(file.originalname)
    return 'ok';
  }


}
