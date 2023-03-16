import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from "@nestjs/common";
import { LinkService } from './link.service';
import { AdminUser } from "@/modules/admin/core/decorators/admin-user.decorator";
import { IAdminUser } from "@/modules/admin/admin.interface";
import { AddLink } from "@/modules/resource/link/dto/dto";

@Controller('/resource/link')
export class LinkController {
  constructor(private readonly linkService: LinkService
  ) {}

  @Get('page')
  page(@Query() query,@AdminUser() user: IAdminUser) {
    return this.linkService.page(query,user);
  }

  @Post('add')
  //对body进行数据校验
  add(@Body() body,@AdminUser() user: IAdminUser) {
    return this.linkService.add(body,user);
  }

  @Post('edit')
  edit(@Body() body,@AdminUser() user: IAdminUser) {
    return this.linkService.edit(body,user);
  }

}
