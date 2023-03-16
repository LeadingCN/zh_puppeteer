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
import { AService } from './a.service';
import { FileInterceptor } from "@nestjs/platform-express";

@Controller('newtest')
export class AController {

  constructor(private readonly topService: AService,
  ) {}

  @Get('page')
  page(@Query() dto) {
    return
  }
  @Post('/upfile')
  @UseInterceptors(FileInterceptor('file'))
  private async upfile(@UploadedFile() file) {
    return
  }

}
