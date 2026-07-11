import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MedicalRecordResumeDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  symptoms?: string;
}

export class ResponseMedicalRecordResumeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  summary: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  start: { dateTime?: string; date?: string };

  @ApiProperty()
  end: { dateTime?: string; date?: string };

  @ApiPropertyOptional()
  clientId?: string;

  @ApiPropertyOptional()
  clientName?: string;

  @ApiPropertyOptional({ type: MedicalRecordResumeDto })
  medicalRecord?: MedicalRecordResumeDto;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional({ nullable: true, description: 'Se o paciente compareceu à consulta' })
  attended?: boolean | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Quem cancelou: client | admin',
  })
  canceledBy?: string | null;

  @ApiPropertyOptional({ description: 'Total de sessões dos serviços deste agendamento' })
  quantitySessions?: number;
}