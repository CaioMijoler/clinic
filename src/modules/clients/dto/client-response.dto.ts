import { ApiProperty } from '@nestjs/swagger';
import { CreateClientOrUpdateAddressDto } from './create-client.dto';

export class ClientResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  document: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ example: '16999999999' })
  telephone: string;

  @ApiProperty()
  ieRg: string;

  @ApiProperty({ example: '2021-12-01T23:59:59.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2021-12-01T23:59:59.000Z' })
  updatedAt: string;

  @ApiProperty({ type: () => CreateClientOrUpdateAddressDto, nullable: true })
  clientAddress?: CreateClientOrUpdateAddressDto;
}
