import { Module } from "@nestjs/common";
import { ZhService } from "./zh/zh.service";
import { ZhController } from "./zh/zh.controller";
import { BullModule } from "@nestjs/bull";
import { ADMIN_PREFIX, SYS_TASK_QUEUE_NAME, SYS_TASK_QUEUE_PREFIX } from "@/modules/admin/admin.constants";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ConfigurationKeyPaths } from "@/config/configuration";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ZH } from "@/entities/resource/zh.entity";
import { LinkController } from "@/modules/resource/link/link.controller";
import { ChannelController } from "@/modules/resource/channel/channel.controller";
import { Link } from "@/entities/resource/link.entity";
import { Channel } from "@/entities/resource/channel.entity";
import { LinkService } from "@/modules/resource/link/link.service";
import { ChannelService } from "@/modules/resource/channel/channel.service";
import { SystemModule } from "@/modules/admin/system/system.module";
import { Group } from "@/entities/resource/group.entity";
import { GroupController } from "@/modules/resource/group/group.controller";
import { GroupService } from "@/modules/resource/group/group.service";
import { UsersysModule } from "@/modules/usersys/usersys.module";
import { TopOrder } from "@/entities/order/top.entity";

@Module({
  imports: [
    SystemModule,
    UsersysModule,
    TypeOrmModule.forFeature([
      ZH,
      Link,
      Channel,
      Group,
      TopOrder
    ]),
    BullModule.registerQueueAsync({
      name: SYS_TASK_QUEUE_NAME,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigurationKeyPaths>) => ({
        redis: {
          host: configService.get<string>("redis.host"),
          port: configService.get<number>("redis.port"),
          password: configService.get<string>("redis.password"),
          db: configService.get<number>("redis.db")
        },
        prefix: SYS_TASK_QUEUE_PREFIX
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [ZhController, LinkController, ChannelController, GroupController],
  providers: [ZhService, LinkService, ChannelService, GroupService],
  exports:[ZhService, LinkService, ChannelService, GroupService]
})
export class ResourceModule {
}
