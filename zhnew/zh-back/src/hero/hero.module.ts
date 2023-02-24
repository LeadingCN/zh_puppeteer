import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { grpcOptions } from '../grpc.options';
import { HeroController } from './hero.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'HERO_PACKAGE',
        ...grpcOptions,
      },
    ]),
  ],
  controllers: [HeroController],
})
export class HeroModule {}
