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
import { FileInterceptor } from "@nestjs/platform-express";
import { OrderSellService } from "@/modules/api/sell/orderSell.service";

@Controller('/order/sell')
export class OrderSellController {

  constructor(
    private readonly sellService: OrderSellService,
  ) {}


}
