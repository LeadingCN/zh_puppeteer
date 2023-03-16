import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from "@nestjs/common";
import { GroupService } from './group.service';
import { AdminUser } from "@/modules/admin/core/decorators/admin-user.decorator";
import { IAdminUser } from "@/modules/admin/admin.interface";

@Controller('/resource/group')
export class GroupController {
  constructor(private readonly groupService: GroupService
  ) {}

  @Get('page')
  page(@Query() query,@AdminUser() user: IAdminUser) {
    return this.groupService.page(query,user);
  }
  @Post('add')
  add(@Body() body,@AdminUser() user: IAdminUser) {
    return this.groupService.add(body,user);
  }
  @Post('edit')
  edit(@Body() body,@AdminUser() user: IAdminUser) {
    return this.groupService.edit(body,user);
  }

}
