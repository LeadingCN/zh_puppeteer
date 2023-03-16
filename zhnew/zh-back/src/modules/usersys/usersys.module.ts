import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ADMIN_PREFIX, SYS_TASK_QUEUE_NAME, SYS_TASK_QUEUE_PREFIX } from "@/modules/admin/admin.constants";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ConfigurationKeyPaths } from "@/config/configuration";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TopController } from "@/modules/usersys/top/top.controller";
import { CommissionController } from "@/modules/usersys/commission/commission.controller";
import { ProxyController } from "@/modules/usersys/proxy/proxy.controller";
import { TopService } from "@/modules/usersys/top/top.service";
import { CommissionService } from "@/modules/usersys/commission/commission.service";
import { ProxyService } from "@/modules/usersys/proxy/proxy.service";
import { SystemModule } from "@/modules/admin/system/system.module";
import SysUser from "@/entities/admin/sys-user.entity";
import { SysBalanceLog } from "@/entities/admin/sys-balance.entity";
import { TopOrder } from "@/entities/order/top.entity";
@Module({
  imports: [
    SystemModule,
    TypeOrmModule.forFeature([
      SysUser,
      SysBalanceLog,
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
    }),
  ],
  controllers: [TopController,CommissionController,ProxyController],
  providers: [TopService,CommissionService,ProxyService],
  exports:[TopService,CommissionService,ProxyService]
})
export class UsersysModule {
}
