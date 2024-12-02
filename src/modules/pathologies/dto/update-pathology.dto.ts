import { PartialType } from '@nestjs/swagger';
import { CreatePathologyDto } from './create-pathology.dto';

export class UpdatePathologyDto extends PartialType(CreatePathologyDto) {}
