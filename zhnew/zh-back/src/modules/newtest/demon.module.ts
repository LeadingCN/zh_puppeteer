import { Module } from '@nestjs/common';
import { BullModule } from "@nestjs/bull";
import { SYS_TASK_QUEUE_NAME, SYS_TASK_QUEUE_PREFIX } from "@/modules/admin/admin.constants";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ConfigurationKeyPaths } from "@/config/configuration";
import { TypeOrmModule } from "@nestjs/typeorm";
@Module({
  imports: [
    TypeOrmModule.forFeature([
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
  ],
  controllers: [],
  providers: []
})
export class DemonModule {}
