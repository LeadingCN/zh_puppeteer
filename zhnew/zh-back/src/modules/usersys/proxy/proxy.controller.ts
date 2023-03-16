import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors, Inject
} from "@nestjs/common";
import { ProxyService } from './proxy.service';
import { FileInterceptor } from "@nestjs/platform-express";
import { AdminUser } from "@/modules/admin/core/decorators/admin-user.decorator";
import { IAdminUser } from "@/modules/admin/admin.interface";

@Controller('/usersys/proxy')
export class ProxyController {

  constructor(private readonly proxyService: ProxyService,
  ) {}

  @Get('page')
  async page(@Query() query:any,@AdminUser() user: IAdminUser) {
    return this.proxyService.page(query,user)
  }
  @Post('/add')
  async add(@Body() body:any,@AdminUser() user: IAdminUser) {
    return this.proxyService.add(body,user)
  }

  @Post('/del')
  async del(@Body() body:any,@AdminUser() user: IAdminUser) {
    return this.proxyService.del(body,user)
  }
  @Post('/edit')
  async edit(@Body() body:any,@AdminUser() user: IAdminUser) {
    return this.proxyService.edit(body,user)
  }

  @Post('/proxydeduction')
  async proxyDeduction(@Body() body:any,@AdminUser() user: IAdminUser) {
    return this.proxyService.proxyDeduction(body,user)
  }
}
