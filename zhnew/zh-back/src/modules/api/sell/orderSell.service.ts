import { Inject, Injectable } from "@nestjs/common";
import { RedisService } from "@/shared/services/redis.service";
import { UtilService } from "@/shared/services/util.service";

@Injectable()
export class OrderSellService {
  constructor(
    private redisService: RedisService,
    private util: UtilService) {
  }


}
