import * as qiniu from 'qiniu';

export default {
  rootRoleId: 1,
  // jwt sign secret
  jwt: {
    secret: process.env.JWT_SECRET || '123456',
  },
  // typeorm config
  database: {
    type: 'mysql',
    host: 'bt.leading.ren',
    port: 3306,
    username: 'nestjsTest',
    password: 'XHDi3ZajdHcMKZ4D',
    database: 'nestjsTest',
    synchronize: false,
    logging: false,
  },
  redis: {
    host: '127.0.0.1', // default value
    port: 6379, // default value
    password: '',
    db: 0,
  },
  // qiniu config
  qiniu: {
    accessKey: 'xxx',
    secretKey: 'xxx',
    domain: 'xxx',
    bucket: 'xxx',
    zone: qiniu.zone.Zone_z0,
    access: 'public',
  },
};
