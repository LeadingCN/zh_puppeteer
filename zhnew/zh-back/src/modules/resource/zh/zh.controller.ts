import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from "@nestjs/common";
import { ZhService } from './zh.service';
import { AdminUser } from "@/modules/admin/core/decorators/admin-user.decorator";
import { IAdminUser } from "@/modules/admin/admin.interface";

@Controller('/resource/zh')
export class ZhController {
  constructor(private readonly zhService: ZhService
  ) {}

  @Get('page')
  findOne(@Query() query,@AdminUser() user: IAdminUser) {
    return this.zhService.page(query,user);
  }
  @Post('del')
  del(@Body() body,@AdminUser() user: IAdminUser) {
    return this.zhService.del(body,user);
  }

  @Post('add')
  add(@Body() body,@AdminUser() user: IAdminUser) {
    return this.zhService.add(body,user);
  }
  @Post('edit')
  edit(@Body() body,@AdminUser() user: IAdminUser) {
    return this.zhService.edit(body,user);
  }
}
