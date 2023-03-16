import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { SYS_TASK_QUEUE_NAME, SYS_TASK_QUEUE_PREFIX } from "@/modules/admin/admin.constants";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ConfigurationKeyPaths } from "@/config/configuration";
import { WSModule } from "@/modules/ws/ws.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiController } from "@/modules/api/api.controller";
import { OrderTopController } from "@/modules/api/top/orderTop.controller";
import { OrderSellService } from "@/modules/api/sell/orderSell.service";
import { OrderSellController } from "@/modules/api/sell/orderSell.controller";
import { OrderTopService } from "@/modules/api/top/orderTop.service";
import { ApiService } from "@/modules/api/api.service";
import { SystemModule } from "@/modules/admin/system/system.module";
import { ResourceModule } from "@/modules/resource/resource.module";
import { UsersysModule } from "@/modules/usersys/usersys.module";
import { orderConsumer } from "@/modules/api/orderHandler.service";
import {join} from "path";
import { TopOrder } from "@/entities/order/top.entity";

// @ts-ignore
@Module({

  imports: [
    SystemModule,
    ResourceModule,
    UsersysModule,
    TypeOrmModule.forFeature([
      TopOrder
    ]),
    BullModule.registerQueueAsync({
      name: 'order',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigurationKeyPaths>) => ({
        redis: {
          host: configService.get<string>("redis.host"),
          port: configService.get<number>("redis.port"),
          password: configService.get<string>("redis.password"),
          db: configService.get<number>("redis.db")
        },
        prefix: SYS_TASK_QUEUE_PREFIX,
        processors: [join(__dirname, 'orderHandler.service.js')],
      }),
      inject: [ConfigService]
    }),
    WSModule
  ],
  controllers: [OrderSellController, OrderTopController, ApiController],
  providers: [OrderSellService, OrderTopService, ApiService,orderConsumer],
  exports: [OrderSellService, OrderTopService, ApiService]

})
export class ApiModule {
}
