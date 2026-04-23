# SKILL: Estrutura Interna de Módulos

## Anatomia de um Módulo NestJS neste Projeto

Cada módulo de domínio em `src/modules/<nome-do-modulo>/` segue **sempre** esta estrutura:

```
<modulo>/
├── <modulo>.module.ts       # Definição do módulo NestJS (imports, providers, exports)
├── <modulo>.controller.ts   # Rotas HTTP − recebe requisição, delega ao service
├── <modulo>.service.ts      # Lógica de negócio + acesso ao banco
├── dto/                     # Data Transfer Objects (entrada e saída)
│   ├── create-<modulo>.dto.ts
│   ├── update-<modulo>.dto.ts   # Geralmente: PartialType(CreateDto)
│   └── <modulo>-response.dto.ts # DTO de resposta (opcional)
└── entities/                # Entidades TypeORM (mapeamento banco → classe)
    └── <modulo>.entity.ts
```

### Módulos com sub-entidades (relações complexas)

Para relações N:M que precisam de coluna extra na tabela pivô, o módulo cria entidades adicionais:

```
medical-record/
├── dto/
│   ├── create-medical-record.dto.ts
│   ├── update-medical-record.dto.ts
│   ├── medical-record-pathologies/
│   │   └── create-medical-record-pathologies.dto.ts
│   └── medical-record-questions/
│       └── create-medical-record-questions.dto.ts
└── entities/
    ├── medical-record.entity.ts
    ├── medical-record-pathologies.entity.ts  ← tabela pivô com dados extras
    └── medical-record-questions.entity.ts    ← tabela pivô com dados extras
```

### Módulos com services auxiliares

Quando um módulo precisa de lógica adicional (ex: cron jobs), cria-se um subdiretório `services/`:

```
calendar/
├── calendar.module.ts
├── calendar.controller.ts
├── calendar.service.ts            ← CRUD principal
├── services/
│   └── calendar-reminder.service.ts  ← cron job de lembretes
└── dto/
    ├── create-calendar.dto.ts
    ├── confirm-attendance.dto.ts
    ├── filter-calendar.dto.ts
    └── ...
```

## Padrão do Module File

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([EntityClass])],  // registra repositório
  controllers: [XController],
  providers: [XService],
  exports: [XService],  // apenas se outro módulo precisar usar o service
})
export class XModule {}
```

**Regra:** Módulos que são usados por outros módulos (ex: `AuthModule` usado pelo `AuthMiddleware`) devem exportar o service.

## Padrão do Controller

```typescript
@ApiTags('nome-do-recurso')        // Swagger tag
@Controller('v1/nome-do-recurso')  // prefixo de rota
@ApiBearerAuth()                   // Swagger: rota protegida
export class XController {
  constructor(private readonly xService: XService) {}

  @Post()
  create(@Body() createDto: CreateXDto) { ... }

  @Get()
  findAll(@Query() queryParams: FilterDto) { ... }

  @Get(':id')
  findOne(@Param('id') id: number) { ... }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateDto: UpdateXDto) { ... }

  @Delete(':id')
  remove(@Param('id') id: number) { ... }
}
```

**Importante:** O `user` autenticado é acessado via `@Req() req: Request` → `req.user` (tipado via `types.d.ts`). Veja uso em `MedicalRecordController` e `CalendarController`.

## Padrão do Service

```typescript
@Injectable()
export class XService {
  constructor(
    @InjectRepository(XEntity)
    private readonly xRepository: Repository<XEntity>,
    @InjectDataSource() private dataSource: DataSource, // quando usar transações
  ) {}

  async create(dto: CreateXDto): Promise<XResponseDto> {
    try {
      // lógica aqui
    } catch (error) {
      const message = 'Mensagem de erro amigável.';
      if (error instanceof HttpException) throw error; // re-throw erros já tratados
      Logger.error(message, error?.stack ?? error.message);
      throw new BadRequestException(message);
    }
  }
}
```

**Padrão de erro:** Todo catch deve:
1. Verificar `instanceof HttpException` → fazer re-throw sem alterar
2. Logar com `Logger.error()`
3. Lançar `BadRequestException` ou outro com mensagem em PT-BR

## Padrão de Transação (DataSource.transaction)

Usado nos módulos que precisam salvar múltiplas entidades atomicamente:

```typescript
const result = await this.dataSource.transaction(async (manager) => {
  const entityA = await manager.save(EntityA, dataA);
  const entityB = await manager.save(EntityB, { ...dataB, entityAId: entityA.id });
  return { ...entityA, entityB };
});
```

Módulos que usam `@InjectDataSource()`: `MedicalRecordService`, `CalendarService`.
