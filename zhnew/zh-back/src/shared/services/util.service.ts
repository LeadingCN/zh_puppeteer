import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { FastifyRequest } from 'fastify';
import { customAlphabet, nanoid } from 'nanoid';
import * as CryptoJS from 'crypto-js';
import dayjs from 'dayjs';
import { ConfigService } from "@nestjs/config";
import { ConfigurationKeyPaths } from "@/config/configuration";
import md5 from 'md5'
@Injectable()
export class UtilService {
  constructor(private readonly httpService: HttpService
              ) {
  }

  /**
   * 获取请求IP
   */
  getReqIP(req: FastifyRequest): string {
    return (
      // 判断是否有反向代理 IP
      (
        (req.headers['x-forwarded-for'] as string) ||
        // 判断后端的 socket 的 IP
        req.socket.remoteAddress
      ).replace('::ffff:', '')
    );
  }

  /* 判断IP是不是内网 */
  IsLAN(ip: string) {
    ip.toLowerCase();
    if (ip == 'localhost') return true;
    let a_ip = 0;
    if (ip == '') return false;
    const aNum = ip.split('.');
    if (aNum.length != 4) return false;
    a_ip += parseInt(aNum[0]) << 24;
    a_ip += parseInt(aNum[1]) << 16;
    a_ip += parseInt(aNum[2]) << 8;
    a_ip += parseInt(aNum[3]) << 0;
    a_ip = (a_ip >> 16) & 0xffff;
    return (
      a_ip >> 8 == 0x7f ||
      a_ip >> 8 == 0xa ||
      a_ip == 0xc0a8 ||
      (a_ip >= 0xac10 && a_ip <= 0xac1f)
    );
  }

  /* 通过ip获取地理位置 */
  async getLocation(ip: string) {
    if (this.IsLAN(ip)) return '内网IP';
    let { data } = await this.httpService.axiosRef.get(
      `http://whois.pconline.com.cn/ipJson.jsp?ip=${ip}&json=true`,
      { responseType: 'arraybuffer' },
    );
    data = new TextDecoder('gbk').decode(data);
    data = JSON.parse(data);
    return data.addr.trim().split(' ').at(0);
  }

  /**
   * AES加密
   */
  public aesEncrypt(msg: string, secret: string): string {
    return CryptoJS.AES.encrypt(msg, secret).toString();
  }

  /**
   * AES解密
   */
  public aesDecrypt(encrypted: string, secret: string): string {
    return CryptoJS.AES.decrypt(encrypted, secret).toString(CryptoJS.enc.Utf8);
  }

  /**
   * md5加密
   */
  public md5(msg: string): string {
    return CryptoJS.MD5(msg).toString();
  }

  /**
   * 生成一个UUID
   */
  public generateUUID(): string {
    return nanoid();
  }




  /**
   * 生成一个随机的值
   */
  public generateRandomValue(
    length: number,
    placeholder = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM',
  ): string {
    const customNanoid = customAlphabet(placeholder, length);
    return customNanoid();
  }
  public getNowTimestamp(): any {
    //获取当前时间戳
    return dayjs().valueOf() / 1000;
  }
  public dayjsFormat(t): any {
    return dayjs(t).format('YYYY-MM-DD HH:mm:ss');
  }
  /*
  * 数组元素去重
  * */
  public unique(arr: any[],key: string): any[] {
    const res = new Map();
    return arr.filter((arr) => !res.has(arr[key]) && res.set(arr[key], 1));
  }
  /*
  * API-pay接口MD5+盐 加密函数 返回sign
  * */
  ascesign(obj: any, yan: string) {
    let newData2 = {}, signData2 = []
    Object.keys(obj).sort().map(key => {
      newData2[key] = obj[key]
      if (key != 'sign'&& key != 'parentChannel') {
        signData2.push(`${key}=${obj[key]}`);
      }
    })
    let sign: string = this.md5(signData2.join('&') + `&key=${yan}`).toLocaleUpperCase();
    return sign
  }
  /*
  * 判断 sign 是否正确
  * */
  checkSign(obj: any, yan: string) {
    let sign = obj.sign
    delete obj.sign
    let sign2 = this.ascesign(obj, yan)
    console.log(`${obj.merId} 请求sign:${sign} 本地sign:${sign2}`);
    return sign == sign2
  }


  //
}
