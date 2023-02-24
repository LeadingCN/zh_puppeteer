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
import { NewtestService } from './newtest.service';
import { CreateNewtestDto, getoneNewtestDto } from "./dto/create-newtest.dto";
import { SelfFile, UpdateNewtestDto } from "./dto/update-newtest.dto";
import { Authorize } from "@/modules/admin/core/decorators/authorize.decorator";
import { PermissionOptional } from "@/modules/admin/core/decorators/permission-optional.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { ClientProxy } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { ServeStatInfo } from "@/modules/admin/system/serve/serve.class";

@Controller('newtest')
export class NewtestController {

  constructor(private readonly newtestService: NewtestService,
              @Inject('MATH_SERVICE') private readonly client: ClientProxy //tcp远程调用
  ) {}


  @PermissionOptional()
  @Get('getone')
  findOne(@Query() dto: getoneNewtestDto) {
    return this.newtestService.findOne(dto);
  }
  @Authorize()
  @Post('/upfile')
  @UseInterceptors(FileInterceptor('file'))
  private async upfile(@UploadedFile() file: SelfFile) {
    return this.newtestService.upfile(file);
  }

  //tcp远程调用
  @Authorize()
  @Get('testMicroservice')
  async testMicroservice(): Promise<Observable<number>> {
    let r = await this.client.send('accumulate', [1, 2, 3, 4, 5,100]);
    let r2  = await this.client.send('stat',"");

    return r2
  }
}
