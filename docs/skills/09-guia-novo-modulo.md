# SKILL: Guia — Criando um Novo Módulo

## Checklist para Novo Módulo

Ao criar um novo módulo de domínio neste projeto, siga esta sequência:

---

### 1. Criar a Migration

```bash
npm run migration:create -- NomeDaMigration
```

Editar o arquivo gerado em `src/database/migrations/`:

```typescript
export class NomeDaMigration implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'nome_tabela',
      columns: [
        { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'campo', type: 'varchar', length: '255', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }), true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('nome_tabela');
  }
}
```

---

### 2. Criar a Entity TypeORM

`src/modules/<modulo>/entities/<modulo>.entity.ts`

```typescript
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('nome_tabela')
export class MinhaEntidade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  campo: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;
}
```

---

### 3. Criar os DTOs

**`create-<modulo>.dto.ts`**:
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ErrorMessages } from '../../../utils/error-message';

export class CreateMinhaEntidadeDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Campo') })
  @MaxLength(255, { message: ErrorMessages['string.max']('Campo', 255) })
  campo: string;

  @ApiProperty()
  @IsOptional()
  campoOpcional?: string;
}
```

**`update-<modulo>.dto.ts`**:
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateMinhaEntidadeDto } from './create-minha-entidade.dto';

export class UpdateMinhaEntidadeDto extends PartialType(CreateMinhaEntidadeDto) {}
```

---

### 4. Criar o Service

`src/modules/<modulo>/<modulo>.service.ts`

```typescript
@Injectable()
export class MinhaEntidadeService {
  constructor(
    @InjectRepository(MinhaEntidade)
    private readonly repository: Repository<MinhaEntidade>,
  ) {}

  async create(dto: CreateMinhaEntidadeDto) {
    try {
      return await this.repository.save(dto);
    } catch (error) {
      const message = 'Ocorreu um erro ao criar.';
      if (error instanceof HttpException) throw error;
      Logger.error(message, error?.stack ?? error.message);
      throw new BadRequestException(message);
    }
  }

  async findAll(queryParams: FilterDto) {
    return findAllWithQueryBuilder<MinhaEntidade>(this.repository, queryParams, 'alias');
  }

  async findOne(id: number) {
    return await this.repository.findOne({ where: { id } });
  }

  async update(id: number, dto: UpdateMinhaEntidadeDto) {
    // ... padrão similar ao create
  }

  async remove(id: number) {
    // ... padrão similar
  }
}
```

---

### 5. Criar o Controller

`src/modules/<modulo>/<modulo>.controller.ts`

```typescript
@ApiTags('nome-recurso')
@Controller('v1/nome-recurso')
@ApiBearerAuth()
export class MinhaEntidadeController {
  constructor(private readonly service: MinhaEntidadeService) {}

  @Post()
  create(@Body() dto: CreateMinhaEntidadeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() queryParams: FilterDto) {
    return this.service.findAll(queryParams);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateMinhaEntidadeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
```

---

### 6. Criar o Module

`src/modules/<modulo>/<modulo>.module.ts`

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([MinhaEntidade])],
  controllers: [MinhaEntidadeController],
  providers: [MinhaEntidadeService],
  exports: [MinhaEntidadeService], // só se for usado por outros módulos
})
export class MinhaEntidadeModule {}
```

---

### 7. Registrar no AppModule

`src/app.module.ts`:
```typescript
import { MinhaEntidadeModule } from './modules/minha-entidade/minha-entidade.module';

@Module({
  imports: [
    // ... outros módulos
    MinhaEntidadeModule,
  ],
})
```

---

### 8. Rodar Migration

```bash
npm run migrations:run
```

---

## Convenções de Nomenclatura

| Item | Convenção | Exemplo |
|---|---|---|
| Pasta do módulo | kebab-case | `medical-record/` |
| Classes | PascalCase | `MedicalRecord`, `MedicalRecordService` |
| Tabelas do banco | snake_case | `medical_record` |
| Colunas extras | snake_case (`@Column({ name: ... })`) | `medical_record_id` |
| Arquivos TS | kebab-case | `medical-record.service.ts` |
| Rotas | kebab-case | `/v1/medical-record` |
| Alias QueryBuilder | abreviação lowercase | `'mr'`, `'client'`, `'pt'` |
