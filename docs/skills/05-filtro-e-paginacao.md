# SKILL: Sistema de Filtro e Paginação Dinâmica

## Visão Geral

O projeto possui um sistema genérico de query que funciona para qualquer módulo.
Ele é composto por 3 arquivos em `src/utils/`:

```
utils/
├── filter-dto.ts              # DTO de query params (entrada)
├── paginate.ts                # Interface IPaginate (saída paginada)
├── paginate-query-builder.ts  # Funções de construção de query TypeORM
└── query-builder.ts           # Função principal: findAllWithQueryBuilder<T>()
```

## Como Usar em um Service

```typescript
import { findAllWithQueryBuilder } from '../../utils/query-builder';
import { FilterDto } from '../../utils/filter-dto';
import { IPaginate } from '../../utils/paginate';

async findAll(queryParams: FilterDto): Promise<IPaginate<Entity> | Entity[]> {
  return findAllWithQueryBuilder<Entity>(
    this.entityRepository,
    queryParams,
    'alias_da_entidade',  // alias usado no QueryBuilder (ex: 'mr' para MedicalRecord)
  );
}
```

## FilterDto — Query Params Disponíveis

```
GET /v1/clients
  ?paginate=true
  &current_page=1
  &per_page=10
  &filter[status]=CREATED
  &search=João
  &search_fields=name,document
  &relations=clientAddress
  &sort[createdAt]=desc
```

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `paginate` | boolean (`'true'`) | Ativa paginação. Se false, retorna array simples |
| `current_page` | number | Página atual (default: 1). Só usado com `paginate=true` |
| `per_page` | number | Itens por página (default: 10). Só usado com `paginate=true` |
| `limit` | number | Limite sem paginação (default: 30 quando `paginate=false`) |
| `filter` | object | Filtros exatos por campo: `filter[campo]=valor` |
| `search` | string | Termo de busca livre (OR LIKE). **Usar com `search_fields`** |
| `search_fields` | string (CSV) | Campos onde o `search` será aplicado: `name,document` |
| `fields` | string (CSV) | Campos a retornar: `fields=id,name,email` |
| `relations` | string (CSV) | Relations para LEFT JOIN: `relations=client,treatments` |
| `sort` | object | Ordenação: `sort[createdAt]=asc` |

## `filter` vs `search` — Quando usar cada um?

| Situação | Parâmetro a usar | Exemplo |
|---|---|---|
| Filtro por valor exato | `filter` | `filter[clientId]=42` |
| Status específico(s) | `filter` | `filter[status]=CREATED,SCHEDULED` |
| Intervalo de datas | `filter` | `filter[starts_between]=2024-01-01,2024-12-31` |
| Busca livre por texto em 1 campo | `filter` | `filter[name]=João` |
| Busca livre por texto em N campos (OR) | `search` + `search_fields` | `search=João&search_fields=name,document` |

> **Ambos podem ser usados juntos na mesma requisição.** O `filter` aplica `AND`, o `search` também aplica `AND` no conjunto, mas internamente faz `OR` entre os campos.

## Formato da Resposta Paginada (IPaginate)

```typescript
interface IPaginate<T> {
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
  };
  data: T[];
}
```

## Filter Handlers (Filtros Especiais via `filter[key]`)

Alguns filtros têm comportamento customizado além do `campo = valor`:

| Filter key | Comportamento |
|---|---|
| `starts_between` | `WHERE createdAt BETWEEN :start AND :end` (valor: `"2024-01-01,2024-12-31"`) |
| `status` | `WHERE status IN (:...values)` (valor CSV: `"CREATED,SCHEDULED"`) |
| `requesterById` | `WHERE requesterById IN (:...ids)` (valor CSV de IDs) |
| `username` | Faz LEFT JOIN em `user` e filtra por `user.username = :username` |
| `number` | `WHERE number LIKE '%valor%'` (busca parcial num campo único) |
| `externalReference` | `WHERE externalReference LIKE '%valor%'` (busca parcial num campo único) |
| qualquer outro campo | `WHERE alias.campo = :valor` (igualdade exata) |

## Search — Busca Livre OR LIKE (applySearch)

O parâmetro `search` + `search_fields` executa busca LIKE em múltiplos campos com OR:

```sql
-- ?search=João&search_fields=name,document
AND (client.name LIKE '%João%' OR client.document LIKE '%João%')

-- ?search=gripe&search_fields=symptoms,conclusion
AND (mr.symptoms LIKE '%gripe%' OR mr.conclusion LIKE '%gripe%')
```

**Exemplos de uso por módulo:**

| Módulo | Sugestão de search_fields |
|---|---|
| clients | `name,document,email` |
| medical-record | `symptoms,clinicalExam,conclusion` |
| pathologies | `code,description` |
| questions | `name,response` |
| treatment | `description` |

## Exemplos Completos

```
# Pacientes — busca por nome OU CPF, com paginação
GET /v1/clients?search=João&search_fields=name,document&paginate=true&per_page=10

# Prontuários agendados de um cliente, ordenados por data
GET /v1/medical-record?filter[status]=SCHEDULED&filter[clientId]=42&sort[startDate]=desc&relations=client,treatments

# Patologias — busca por código ou descrição
GET /v1/pathologies?search=J00&search_fields=code,description
```

## Notas de Implementação

- As `relations` passadas via query param são adicionadas como `leftJoinAndSelect`
- Os `fields` são prefixados com o alias automaticamente: `alias.campo`
- A paginação usa `skip` + `take` do TypeORM QueryBuilder
- O `ClientsService.findAll()` sempre adiciona `clientAddress` nas relations:
  ```typescript
  if (!params.relations.includes('clientAddress')) {
    params.relations += ',clientAddress';
  }
  ```
- O `applySearch` usa chaves de parâmetro únicas (`search_campo_index`) para evitar conflito quando buscar em vários campos simultaneamente
