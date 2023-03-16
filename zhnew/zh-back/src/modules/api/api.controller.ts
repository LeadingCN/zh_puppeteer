import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors, Inject
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiService } from "@/modules/api/api.service";
import { SysParamConfigService } from "@/modules/admin/system/param-config/param-config.service";
import { Authorize } from "@/modules/admin/core/decorators/authorize.decorator";
import { ApiException } from "@/common/exceptions/api.exception";
import { ChannelService } from "@/modules/resource/channel/channel.service";
import { RedisService } from "@/shared/services/redis.service";
import { Keep } from "@/common/decorators/keep.decorator";

@Controller("/")
export class ApiController {

  constructor(
    private readonly apiService: ApiService,
    private paramConfigService: SysParamConfigService,
    private readonly channelService: ChannelService,
    private redis: RedisService
  ) {
  }

  @Keep()
  @Authorize()
  @Post("/pay")
  async pay(@Body() body: any) {
    let { channel, merId, sign } = body;
    //查看系统是否接单
    let pay = await this.paramConfigService.findValueByKey("pay_open");
    if (Boolean(Number(pay)) === true) {
      //判断是否有请求得channel id
      //先从Redis 读取缓存的父支付通道 如没有则 从系统channel 列表
      let channelList: any = await this.redis.getRedis().get("channel:list");
      if (!channelList) {
        channelList = await this.channelService.channelRoot();
        channelList = channelList.map((item: any) => item.id);
        await this.redis.getRedis().set("channel:list", JSON.stringify(channelList), "EX", 60 * 1);
      } else {
        channelList = JSON.parse(channelList);
      }
      if (!channelList.includes(Number(channel))) {
        throw new ApiException(60002);
      }
      //查看sign加密类型
      if (sign?.toString().length > 32) {
        //RSA加密 TODO
        throw new ApiException(60003);
        return 1;
      } else {
        //MD5 加密 带盐
        return await this.apiService.payMd5(Object.assign(body, { parentChannel: Number(channel) }));
      }
    }
    throw new ApiException(60001);


  }

  @Keep()
  @Authorize()
  @Post("/pay/query")
  async payCheck(@Body() body: any) {
    return await this.apiService.payCheck(body);
  }

  @Keep()
  @Authorize()
  @Post("/getpayurl")
  async getpayurl(@Body() body: any) {
    return await this.apiService.getPayUrl(body);
  }
}
