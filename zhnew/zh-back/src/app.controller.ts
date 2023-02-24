import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  Request,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ConfigurationKeyPaths } from '@/config/configuration';
import fs from 'fs';
import { join } from 'path';
import { AuthService } from '@/modules/ws/auth.service';
import { Authorize } from '@/modules/admin/core/decorators/authorize.decorator';
import { UtilService } from '@/shared/services/util.service';
import { ApiException } from '@/common/exceptions/api.exception';

export class SelfFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService<ConfigurationKeyPaths>,
    private authService: AuthService,
    private util: UtilService,
  ) {
    let t = this.configService.get<any>('resources').uploadMaxSize;
    let tarr = t.split('*');

    this.fileSizeMax =
      parseInt(tarr[0]) * parseInt(tarr[1]) * parseInt(tarr[2]);
    this.fileTempPath = this.configService.get<any>('resources').uploadDir;
    this.fileSavePath = this.configService.get<any>('resources').resourceDir;
    this.Host = this.configService.get<any>('resources').masterHost;
    //判断文件夹是否存在
    if (!fs.existsSync(this.fileSavePath)) {
      fs.mkdirSync(this.fileSavePath);
    }
    //判断上传文件夹是否存在
    if (!fs.existsSync(this.fileTempPath)) {
      fs.mkdirSync(this.fileTempPath);
    }
    //判断上传文件夹icon是否存在
    if (!fs.existsSync(join(this.fileSavePath, 'icon'))) {
      fs.mkdirSync(join(this.fileSavePath, 'icon'));
    }
  }

  fileSizeMax: number = null;
  fileTempPath: string = null;
  fileSavePath: string = null;
  Host: string = null;

  @Authorize()
  @Post('/upfile')
  @UseInterceptors(FileInterceptor('file'))
  private async upFile(
    @Body() body: any,
    @Request() req: any,
    @UploadedFile() file: SelfFile,
  ) {
    console.log(file);
    console.log(file.mimetype);
    let { action } = req.headers;
    let userinfo: any = await this.authService.checkAdminAuthToken(
      req.headers.token,
    );
    //判断是否过期
    if (Math.floor(this.util.getNowTimestamp() - userinfo.iat) > 86400) {
      throw new ApiException(11002);
    }
    //判断文件类型
    if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
      throw new ApiException(20004);
    }
    if (file.size > this.fileSizeMax) {
      throw new ApiException(20005);
    }
    let fileName =
      this.util.generateRandomValue(32) + '.' + file.mimetype.split('/')[1];
    try {
      fs.writeFileSync(
        join(join(this.fileSavePath, action), fileName),
        file.buffer,
      );
    } catch (e) {
      console.error('文件保存失败', e);
      throw new HttpException('文件保存失败', 500);
    }
    if (action == 'icon') {
      return this.Host + 'resources/icon/' + fileName;
    }
  }
}
