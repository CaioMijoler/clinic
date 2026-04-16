# SKILL: Testes — Estrutura, Comandos e Convenções

## Estrutura de Diretórios

```
clinic/
├── src/
│   └── modules/
│       └── health/
│           └── health.controller.spec.ts   # unit test simples (NestJS template)
│
└── test/                                   # ← pasta raiz de testes
    └── medical-record/
        ├── medical-record.factory.ts       # fábricas de dados de teste
        └── medical-record-find-by-client.spec.ts
```

A pasta `test/` na raiz segue o padrão NestJS e já estava prevista no `tsconfig.json` via alias `@test/*`.

---

## Comandos

```bash
# Rodar todos os testes (src/ + test/)
yarn test

# Rodar em modo watch — reexecuta ao salvar
yarn test:watch

# Rodar com relatório de coverage (gerado em /coverage)
yarn test:cov

# Rodar um arquivo específico sem coverage
npx jest test/medical-record/medical-record-find-by-client.spec.ts --no-coverage

# Rodar todos os testes de um módulo
npx jest test/medical-record --no-coverage

# Filtrar por nome de cenário
npx jest --no-coverage -t "deve retornar os prontuários"

# Rodar os testes do src/ (unit tests do NestJS)
npx jest src/ --no-coverage
```

---

## Configuração Jest (`package.json`)

```json
{
  "jest": {
    "rootDir": ".",
    "roots": ["<rootDir>/src", "<rootDir>/test"],
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["src/**/*.(t|j)s"],
    "coverageDirectory": "coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@app/(.*)$": "<rootDir>/src/$1",
      "^@modules/(.*)$": "<rootDir>/src/modules/$1",
      "^@test/(.*)$": "<rootDir>/test/$1"
    }
  }
}
```

Pontos importantes:
- `rootDir: "."` → projeto raiz
- `roots` → Jest varre `src/` E `test/` para encontrar specs
- `collectCoverageFrom` → cobertura apenas do código em `src/`
- `moduleNameMapper` → resolve os aliases do `tsconfig.json`

---

## Aliases de Import nos Testes

Todos os imports nos testes devem usar aliases em vez de caminhos relativos:

| Alias | Resolve para | Exemplo |
|---|---|---|
| `@modules/*` | `src/modules/*` | `@modules/medical-record/medical-record.service` |
| `@app/*` | `src/*` | `@app/utils/filter-dto` |
| `@test/*` | `test/*` | `@test/medical-record/medical-record.factory` |

---

## Padrão de Factory

Factories ficam em `test/<modulo>/<modulo>.factory.ts` e seguem o padrão de funções `make<Entidade>`:

```typescript
// test/medical-record/medical-record.factory.ts
import { MedicalRecord } from '@modules/medical-record/entities/medical-record.entity';

export function makeMedicalRecord(overrides: Partial<MedicalRecord> = {}): MedicalRecord {
  return {
    id: 1,
    symptoms: 'Dor nas costas',
    status: MedicalRecordStatusEnum.CREATED,
    // ... demais campos com valores padrão
    ...overrides,
  } as MedicalRecord;
}

export function makeMedicalRecordList(clientId: number, count = 3): MedicalRecord[] {
  return Array.from({ length: count }, (_, i) =>
    makeMedicalRecord({ id: i + 1, clientId }),
  );
}
```

---

## Padrão de Spec (Teste de Service)

Testes de service sem banco de dados — usa mocks do Repository e DataSource:

```typescript
// test/<modulo>/<modulo>-<funcionalidade>.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { MedicalRecordService } from '@modules/medical-record/medical-record.service';
import { MedicalRecord } from '@modules/medical-record/entities/medical-record.entity';
import * as queryBuilderUtil from '@app/utils/query-builder';

// Mock do utilitário de query genérico
jest.mock('@app/utils/query-builder', () => ({
  findAllWithQueryBuilder: jest.fn(),
}));
const mockFindAll = queryBuilderUtil.findAllWithQueryBuilder as jest.Mock;

// Mock do Repository TypeORM
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
};

// Mock do DataSource (para services que usam transaction)
const mockDataSource = {
  transaction: jest.fn(),
  manager: { findOne: jest.fn(), save: jest.fn(), find: jest.fn() },
};

describe('MeuService — meuMetodo', () => {
  let service: MedicalRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalRecordService,
        { provide: getRepositoryToken(MedicalRecord), useValue: mockRepository },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<MedicalRecordService>(MedicalRecordService);
    jest.clearAllMocks(); // limpa os mocks entre os testes
  });

  it('cenário feliz', async () => {
    mockFindAll.mockResolvedValueOnce([makeMedicalRecord()]);
    const result = await service.findByClient(1, {});
    expect(result).toHaveLength(1);
  });

  it('deve lançar BadRequestException em erro', async () => {
    mockFindAll.mockRejectedValue(new Error('fail'));
    await expect(service.findByClient(1, {})).rejects.toThrow(BadRequestException);
    mockFindAll.mockReset();
  });
});
```

---

## Dicas

- Use `mockResolvedValueOnce` para comportamento por chamada (1 mock = 1 uso)
- Use `mockRejectedValue` (sem `Once`) quando precisa rejeitar em múltiplas chamadas no mesmo `it`
- Sempre chame `jest.clearAllMocks()` no `beforeEach` para evitar vazamento de estado entre testes
- O `mockFindAll.mockReset()` é útil depois de um cenário de erro para "resetar" o mock para os próximos testes
- Coverage é gerado apenas do código em `src/` — arquivos de factory e spec não entram na cobertura
