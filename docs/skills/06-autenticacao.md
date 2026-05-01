# SKILL: Autenticação via Supabase e Redis

## Fluxo de Autenticação

```
1. POST /v1/auth/login  { username: email, password: senha }
       │
       ▼
   AuthService.auth()
       ├── Valida credenciais no Supabase (auth.signInWithPassword)
       ├── Busca usuário correspondente no banco local (sincronização)
       ├── Gera Token de Acesso (Supabase session token)
       ├── Armazena dados do usuário no Redis (Cache)
       └── Retorna usuário + token

2. Requisições autenticadas: Authorization: Bearer <token>
       │
       ▼
   AuthMiddleware → AuthService.verifyToken()
       ├── Extrai token do header (Bearer prefix)
       ├── Tenta recuperar usuário do Redis (Cache hit)
       ├── Se falhar: Valida token no Supabase (auth.getUser)
       ├── Atualiza cache no Redis
       └── Injeta user em req.user

3. POST /v1/auth/logout
       ├── Extrai token do header
       ├── SignOut no Supabase
       └── Remove token do Redis (Invalidação imediata)
```

## Características da Implementação de Auth

- **Supabase Auth**: Gerencia o ciclo de vida da autenticação, senhas e tokens JWT de forma segura.
- **Cache em Redis**: Para evitar chamadas excessivas ao Supabase, os dados do usuário autenticado são cacheados no Redis com um TTL configurado.
- **Sincronização Local**: O sistema mantém uma tabela de `users` local para relacionar dados de negócio (clientes, prontuários, etc) ao ID de autenticação.
- **Middleware Global**: Toda rota protegida passa pelo `AuthMiddleware`, que garante a validade da sessão antes de chegar ao Controller.

## Acesso ao Usuário Autenticado nos Controllers

O `AuthMiddleware` injeta o usuário em `req.user`. Para acessar no controller:

```typescript
import { Req } from '@nestjs/common';
import { Request } from 'express';

@Get()
minhaRota(@Req() req: Request) {
  const user = req.user; // tipado via src/types.d.ts
  return this.meuService.metodo(params, user);
}
```

A declaração de tipo está em `src/types.d.ts`:
```typescript
declare namespace Express {
  interface Request {
    user?: User; // entidade User sem password
  }
}
```

## Rotas Excluídas da Autenticação

Configurado via `.exclude()` no `AppModule.configure()`:
```
POST   /v1/auth/login   → login público
GET    /health          → health check público
POST   /v1/user         → criação de usuário (onboarding)
GET    /v1/calendar/confirm-attendance → confirmação de agenda pública
```

## Variáveis de Ambiente de Segurança

```bash
# Provedor de Auth
AUTH_PROVIDER=supabase
AUTH_TOKEN_TTL=86400

# Supabase Config
SUPABASE_URL=https://sua-url.supabase.co
SUPABASE_KEY=sua-chave-anon-ou-service-role

# Redis Config (Cache)
REDIS_HOST=localhost
REDIS_PORT=6379
```

