import * as qiniu from 'qiniu';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

const parseZone = (zone: string) => {
  switch (zone) {
    case 'Zone_as0':
      return qiniu.zone.Zone_as0;
    case 'Zone_na0':
      return qiniu.zone.Zone_na0;
    case 'Zone_z0':
      return qiniu.zone.Zone_z0;
    case 'Zone_z1':
      return qiniu.zone.Zone_z1;
    case 'Zone_z2':
      return qiniu.zone.Zone_z2;
  }
};

export const getConfiguration = () =>
  ({
    rootRoleId: parseInt(process.env.ROOT_ROLE_ID || '1'),
    // nodemailer config 邮箱服务相关
    mailer: {
      host: 'xxx',
      port: 80,
      auth: {
        user: 'xxx',
        pass: 'xxx',
      },
      secure: false, // or true using 443
    },
    // amap config
    amap: {
      key: 'xxx',
    },
    // jwt sign secret
    jwt: {
      secret: process.env.JWT_SECRET || '123456',
    },
    // typeorm config
    database: {
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: Number.parseInt(process.env.MYSQL_PORT, 10),
      username: process.env.MYSQL_USERNAME,
      password:
        process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '',
      database: process.env.MYSQL_DATABASE,
      entities: ['src/entity/**/*.ts'],
      migrations: ['dist/src/migrations/**/*.js'],
      autoLoadEntities: true,
      /** https://typeorm.io/migrations */
      synchronize: true,
      logging: ['error'],
      timezone: '+08:00', // 东八区
      cli: {
        migrationsDir: 'src/migrations',
      },
    } as MysqlConnectionOptions,
    redis: {
      host: process.env.REDIS_HOST, // default value
      port: parseInt(process.env.REDIS_PORT, 10), // default value
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB,
    },
    // qiniu config 七牛云 网盘
    qiniu: {
      accessKey: process.env.QINIU_ACCESSKEY,
      secretKey: process.env.QINIU_SECRETKEY,
      domain: process.env.QINIU_DOMAIN,
      bucket: process.env.QINIU_BUCKET,
      zone: parseZone(process.env.QINIU_ZONE || 'Zone_z2'),
      access: (process.env.QINIU_ACCESS_TYPE as any) || 'public',
    },
    // logger config
    logger: {
      timestamp: false,
      dir: process.env.LOGGER_DIR, //日志文件目录
      maxFileSize: process.env.LOGGER_MAX_SIZE,
      maxFiles: process.env.LOGGER_MAX_FILES,
      errorLogName: process.env.LOGGER_ERROR_FILENAME,
      appLogName: process.env.LOGGER_APP_FILENAME,
    },
    // swagger
    swagger: {
      //是否开启API文档
      enable: process.env.SWAGGER_ENABLE === 'true',
      path: process.env.SWAGGER_PATH,
      title: process.env.SWAGGER_TITLE,
      desc: process.env.SWAGGER_DESC,
      version: process.env.SWAGGER_VERSION,
    },
    WaMir: {
      ADD: process.env.WAMIR_HOST,
      PORT: process.env.WAMIR_PORT,
      WAMIR_WS: process.env.WAMIR_WS,
    },
    resources: {
      // 上传文件的域名
      host: `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/`,
      masterHost: `http://${process.env.SERVER_HOST}/`,
      // 上传文件的目录
      uploadDir: process.env.UPLOAD_DIR,
      // 上传文件的最大大小
      uploadMaxSize: process.env.UPLOAD_MAX_SIZE,
      //资源目录
      resourceDir: process.env.RESOURCE_DIR,
    },
  } as const);

export type ConfigurationType = ReturnType<typeof getConfiguration>;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export type ConfigurationKeyPaths = Record<NestedKeyOf<ConfigurationType>, any>;
