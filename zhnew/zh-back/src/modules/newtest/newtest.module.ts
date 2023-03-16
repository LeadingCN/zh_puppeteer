import { Module } from '@nestjs/common';
import { NewtestService } from './newtest.service';
import { NewtestController } from './newtest.controller';
import { BullModule } from "@nestjs/bull";
import { SYS_TASK_QUEUE_NAME, SYS_TASK_QUEUE_PREFIX } from "@/modules/admin/admin.constants";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ConfigurationKeyPaths } from "@/config/configuration";
import { WSModule } from "@/modules/ws/ws.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Newtest } from "@/entities/newTest/newtest.entity";
import { SysParamConfigService } from "@/modules/admin/system/param-config/param-config.service";
import { rootRoleIdProvider } from "@/modules/admin/core/provider/root-role-id.provider";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
@Module({

  imports: [
    TypeOrmModule.forFeature([
      Newtest,
    ]),
    ClientsModule.register([
      { name: 'MATH_SERVICE', transport: Transport.TCP, options: {port: 8001 } },
    ]),

    BullModule.registerQueueAsync({
      name: SYS_TASK_QUEUE_NAME,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigurationKeyPaths>) => ({
        redis: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
          db: configService.get<number>('redis.db'),
        },
        prefix: SYS_TASK_QUEUE_PREFIX,
      }),
      inject: [ConfigService],
    }),
    WSModule,
  ],
  controllers: [NewtestController],
  providers: [NewtestService]
})
export class NewtestModule {}
