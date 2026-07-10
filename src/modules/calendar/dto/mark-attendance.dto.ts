import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { ErrorMessages } from '../../../utils/error-message';

/**
 * Registro de comparecimento no dia da consulta (profissional).
 *
 * - `attended: true`  → paciente compareceu; mantém o status atual do agendamento.
 * - `attended: false` → falta; marca `attended=false` e cancela o agendamento
 *   (`status = canceled_schedule`).
 *
 * Disponível apenas quando o status é `confirmed_schedule` ou `in_progress`.
 */
export class MarkAttendanceDto {
  @ApiProperty({
    description:
      'true = compareceu (mantém fluxo); false = faltou (cancela o agendamento)',
  })
  @IsBoolean({ message: ErrorMessages['boolean.base']('Comparecimento') })
  attended: boolean;
}
