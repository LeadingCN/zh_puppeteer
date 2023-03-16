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
import { OrderTopService } from "@/modules/api/top/orderTop.service";
import { AdminUser } from "@/modules/admin/core/decorators/admin-user.decorator";
import { IAdminUser } from "@/modules/admin/admin.interface";

@Controller('/order/toporder')
export class OrderTopController {

  constructor(
    private readonly topService: OrderTopService,
  ) {}

  @Get('page')
  page(@Query() query,@AdminUser() user: IAdminUser) {
    return this.topService.page(query,user);
  }

  @Post('callback')
  callback(@Body() body,@AdminUser() user: IAdminUser) {
    return this.topService.callback(body,user);
  }

}
