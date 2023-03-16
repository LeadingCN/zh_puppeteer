import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from "@nestjs/common";
import { ChannelService } from './channel.service';
import { AdminUser } from "@/modules/admin/core/decorators/admin-user.decorator";
import { IAdminUser } from "@/modules/admin/admin.interface";

@Controller('/resource/channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService
  ) {}

  @Get('page')
  page(@Query() query,@AdminUser() user: IAdminUser) {
    return this.channelService.page(query,user);
  }
  @Post('add')
  add(@Body() body,@AdminUser() user: IAdminUser) {
    return this.channelService.add(body,user);
  }

  @Post('edit')
  edit(@Body() body,@AdminUser() user: IAdminUser) {
    return this.channelService.edit(body,user);
  }

}
