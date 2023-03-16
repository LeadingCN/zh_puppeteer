import {
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { ApiTransformInterceptor } from './common/interceptors/api-transform.interceptor';
import { setupSwagger } from './setup-swagger';
import { LoggerService } from './shared/logger/logger.service';
import { SocketIoAdapter } from '@/modules/ws/socket-io.adapter';
import { ExpressAdapter, NestExpressApplication } from "@nestjs/platform-express";
import process from "process";
import { Transport } from "@nestjs/microservices";
import { sms } from "qiniu";
import message = sms.message;
declare const module: any; //热更新调试
const SERVER_PORT = process.env.SERVER_PORT;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    {
      bufferLogs: true,
    },
  );
  app.enableCors();
  // 给请求添加prefix
  // app.setGlobalPrefix(PREFIX);
  // custom logger
  app.useLogger(app.get(LoggerService));
  // validate
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors: ValidationError[]) => {
        return new UnprocessableEntityException(
          errors
            .filter((item) => !!item.constraints)
            .flatMap((item) => Object.values(item.constraints))
            .join('; '),
        );
      },
    }),
  );
  // execption
  app.useGlobalFilters(new ApiExceptionFilter(app.get(LoggerService)));
  // api interceptor
  app.useGlobalInterceptors(new ApiTransformInterceptor(new Reflector()));
  // websocket
  app.useWebSocketAdapter(new SocketIoAdapter(app, app.get(ConfigService)));
  // app.connectMicroservice({
  //   transport: Transport.RMQ,
  //   options: {
  //     // rabbitmq地址
  //     urls: ['amqp://admin:admin@192.168.23.132:5672'],
  //     // 队列名称
  //     queue: 'queueNameToBeConsumed',
  //     // noAck: false,
  //     queueOptions: {
  //       // 消息是否持久化
  //       durable: false,
  //     },
  //
  //   }
  // })
  // app.startAllMicroservices();
  // swagger
  setupSwagger(app);
  // start
  await app.listen(SERVER_PORT, '0.0.0.0');
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
  const serverUrl = await app.getUrl();
  Logger.log(`api服务已经启动,请访问: ${serverUrl}`);
  Logger.log(`API文档已生成,请访问: ${serverUrl}/${process.env.SWAGGER_PATH}/`);
  Logger.log(
    `ws服务已经启动,请访问: http://localhost:${process.env.WS_PORT}${process.env.WS_PATH}`,
  );
  //重写console.log
  console.log = (args) => {
    if(process.env.NODE_ENV == 'development'){
      if(typeof args == 'object'){
        Logger.log(JSON.stringify(args, null, 4));
      }else{
        Logger.log(args);
      }

    }
  }

}

bootstrap();
