import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from "@nestjs/common";

@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'exchange1',
          type: 'x-delayed-type',
          options:{
            arguments: { 'x-delayed-type': 'direct' },
          }
        },
      ],
      uri: 'amqp://admin:admin@192.168.23.132:5672',
      connectionInitOptions: { wait: true },
      enableControllerDiscovery: true,

    }),
    RabbitExampleModule
  ],
  providers:[],
  exports:[RabbitMQModule]
})
export class RabbitExampleModule {}
