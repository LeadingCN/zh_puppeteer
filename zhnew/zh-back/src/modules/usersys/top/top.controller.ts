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
import { TopService } from './top.service';
import { AdminUser } from "@/modules/admin/core/decorators/admin-user.decorator";
import { IAdminUser } from "@/modules/admin/admin.interface";
import { AddTopUser, PageQuery } from "@/modules/usersys/top/interfaceClass";

@Controller('/usersys/top')
export class TopController {

  constructor(private readonly topService: TopService,
  ) {}

  @Get('page')
  async page(@Query() query:any,@AdminUser() user: IAdminUser) {
    return this.topService.page(query,user)
  }
  @Post('/add')
  async add(@Body() body:any,@AdminUser() user: IAdminUser) {
    return this.topService.add(body,user)
  }
  @Post('/edit')
  async edit(@Body() body:any,@AdminUser() user: IAdminUser) {
    return this.topService.edit(body,user)
  }
}
