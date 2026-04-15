# SKILL: Validação de DTOs e Transformação de Dados

## Bibliotecas Utilizadas

- **`class-validator`** → decorators de validação em DTOs
- **`class-transformer`** → transformação de dados antes da validação (`@Transform`)
- **`@nestjs/swagger`** → documentação (`@ApiProperty`)

## ErrorMessages — Padrão de Mensagens de Erro

Todas as mensagens de validação são centralizadas em `src/utils/error-message.ts`.
**Nunca escreva mensagens de erro inline nos DTOs.**

```typescript
import { ErrorMessages } from '../../../utils/error-message';

// Uso:
@IsString({ message: ErrorMessages['string.base']('Nome do Campo') })
@MaxLength(50, { message: ErrorMessages['string.max']('Nome do Campo', 50) })
nome: string;
```

### Catálogo completo de ErrorMessages

| Chave | Assinatura | Exemplo de saída |
|---|---|---|
| `empty` | `(param)` | "O campo Nome não pode estar vazio." |
| `length` | `(param, min, max)` | "O campo CEP deve ter entre 8 e 8 caracteres." |
| `invalid` | `(param)` | "O campo Email é inválido!" |
| `string.base` | `(param)` | "O campo Nome deve ser uma string" |
| `string.min` | `(param, limit)` | "O campo Nome deve ter pelo menos 3 caracteres." |
| `string.max` | `(param, limit)` | "O campo Nome não pode ter mais de 50 caracteres." |
| `number.base` | `(param)` | "O campo Id deve ser um número." |
| `number.min` | `(param, limit)` | "O campo Id deve ser maior ou igual a 1." |
| `number.max` | `(param, limit)` | "O campo Id deve ser menor ou igual a 100." |
| `array.base` | `(param)` | "O campo Itens deve ser um array." |
| `array.min` | `(param, limit)` | "O campo Itens deve ser um array e deve ter pelo menos 1 de tamanho." |
| `object.base` | `(param)` | "O campo Endereço deve ser um objeto." |
| `decimal.base` | `(param)` | "O campo Valor deve ser um decimal." |
| `decimal.min` | `(param, limit, digits)` | "O campo Valor deve ser maior ou igual a 0.00." |
| `decimal.max` | `(param, limit, digits)` | "O campo Valor deve ser menor ou igual a 9999.99." |
| `boolean.base` | `(param)` | "O campo Ativo deve ser do tipo booleano" |

## Padrão de DTO de Criação

```typescript
export class CreateXDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Nome') })
  @MaxLength(50, { message: ErrorMessages['string.max']('Nome', 50) })
  name: string;

  @ApiProperty()
  @IsNotEmpty({ message: ErrorMessages['empty']('Email') })
  @IsEmail({}, { message: ErrorMessages['invalid']('Email') })
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ message: ErrorMessages['string.base']('Observação') })
  observation?: string;
}
```

## Padrão de DTO de Atualização

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateXDto } from './create-x.dto';

export class UpdateXDto extends PartialType(CreateXDto) {}
```

## Padrão de DTO Aninhado (Nested Objects)

Para campos que são objetos/arrays complexos use `@ValidateNested` + `@Type`:

```typescript
import { Type } from 'class-transformer';
import { ValidateNested, IsDefined, IsOptional } from 'class-validator';

export class CreateMedicalRecordDto {
  // Campo obrigatório nested:
  @ApiProperty({ type: () => CreateClientDto })
  @IsDefined({ message: ErrorMessages['empty']('Paciente do prontuário') })
  @ValidateNested()
  @Type(() => CreateClientDto)
  client: CreateClientDto;

  // Array opcional nested:
  @ApiProperty({ type: CreateTreatmentDto, isArray: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTreatmentDto)
  treatments?: CreateTreatmentDto[];
}
```

## Transforms Customizados

Definidos em `src/utils/transform.ts`:

### `@FormatPhone()`
Remove todos os não-dígitos e retira o DDI 55 se tiver 12+ dígitos:
```typescript
@FormatPhone()
telephone: string;
// "55 (16) 9 9999-9999" → "16999999999"
// "(16) 9 9999-9999"   → "16999999999"
```

### `@StringToNumberTransform()`
Converte string para float (útil em query params que chegam como string):
```typescript
@StringToNumberTransform()
value: number;
```

### Transform inline (CPF/RG)
Remove pontos, barras e hífens:
```typescript
@Transform(({ value }: TransformFnParams) => value?.replace(/[./-]/g, ''))
document: string;
// "123.456.789-09" → "12345678909"
```

## Validators Comuns por Tipo de Campo

| Tipo de campo | Validators usados |
|---|---|
| Nome/texto | `@IsString` + `@MaxLength` ou `@Length(min, max)` |
| Email | `@IsNotEmpty` + `@IsEmail` |
| CPF | `@IsString` + `@Transform(remove mask)` + `@MaxLength(14)` + `@IsOptional` |
| RG | `@IsString` + `@Transform(remove mask)` + `@MaxLength(20)` + `@IsOptional` |
| Telefone | `@IsString` + `@MaxLength(30)` + `@FormatPhone()` + `@IsOptional` |
| CEP | `@IsString` + `@Length(8, 8)` |
| UF | `@IsString` + `@Length(2, 2)` |
| ID numérico | `@IsNumber` + `@IsOptional` |
| Objeto aninhado | `@IsObject` + `@IsNotEmpty` + `@ValidateNested` + `@Type` |
| Array | `@IsArray` + `@ValidateNested` + `@Type` + `@IsOptional` |
