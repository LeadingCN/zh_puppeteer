import { conf } from 'qiniu';

export interface IAdminUser {
  uid: number;
  pv: number;
  id: number;
  /*
  * 分组id
  * */
  departmentId: number;
  name: string;
  username: string;
  nickName: string;
  headImg: string;
  email: string;
  phone: string;
  remark: string;
  status: number;
  roles: Array<number>;
  departmentName: string;
  roleLabel:string;
  lv: number;
  /*过期时间;现在-该值大于某数则过期*/
  iat:number

  uuid:string
}

export type QINIU_ACCESS_CONTROL = 'private' | 'public';

export interface IQiniuConfig {
  accessKey: string;
  secretKey: string;
  bucket: string;
  zone: conf.Zone;
  domain: string;
  access: QINIU_ACCESS_CONTROL;
}
