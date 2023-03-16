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
import { CommissionService } from './commission.service';
import { FileInterceptor } from "@nestjs/platform-express";
import { AdminUser } from "@/modules/admin/core/decorators/admin-user.decorator";
import { IAdminUser } from "@/modules/admin/admin.interface";

@Controller('/usersys/commission')
export class CommissionController {

  constructor(private readonly commissionService: CommissionService,
  ) {}

  @Get('page')
  async page(@Query() query:any,@AdminUser() user: IAdminUser) {
    return this.commissionService.page(query,user)
  }
  @Get('statistics')
  async statistics(@Query() query:any,@AdminUser() user: IAdminUser) {
    return this.commissionService.statistics(query,user)
  }

  @Post('edit')
  async edit(@Body() body:any,@AdminUser() user: IAdminUser) {
    return this.commissionService.edit(body,user)
  }

}
