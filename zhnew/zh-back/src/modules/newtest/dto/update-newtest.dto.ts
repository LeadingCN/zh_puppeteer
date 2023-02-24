import { PartialType } from '@nestjs/swagger';
import { CreateNewtestDto } from './create-newtest.dto';

export class UpdateNewtestDto extends PartialType(CreateNewtestDto) {}
export class SelfFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
