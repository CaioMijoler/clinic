# SKILL: Autenticação JWT e Segurança

## Fluxo de Autenticação

```
1. POST /v1/auth/login  { username: email, password: senha }
       │
       ▼
   AuthService.auth()
       ├── Busca user por email
       ├── Descriptografa senha (decryptText) e compara
       ├── Gera JWT (secret: 'topSecret512', expiresIn: '1 days')
       ├── Salva token no campo users.token
       └── Retorna user sem password + token

2. Requisições autenticadas: Authorization: Bearer <token>
       │
       ▼
   AuthMiddleware → AuthService.verifyToken()
       ├── Extrai token do header (Bearer prefix)
       ├── jwtService.verify(token, { secret: 'topSecret512' })
       ├── Busca user por users.token = token (token ativo)
       └── Injeta user em req.user

3. POST /v1/auth/logout
       ├── Extrai token do header
       ├── Busca user pelo token
       └── Seta users.token = null (invalida sessão)
```

## Características da Implementação de Auth

- **Token persistido no banco**: O JWT é salvo em `users.token`. Isso permite invalidação via logout (blacklist simples por sobrescrição com null)
- **Sessão única**: Um usuário só pode ter um token ativo por vez
- **Verificação dupla**: Além de verificar a assinatura JWT, valida que o token ainda existe no banco
- **Senha criptografada**: Usa a lib `cripto` local (`decryptText` de `src/utils/helpers.ts`)

## Criptografia de Senha

```typescript
// Configuração em app.config.ts → env vars necessárias:
CRIPTO_ALG=...        // algoritmo (ex: aes-256-cbc)
ENCRYPT_SECRET_KEY=... // chave de criptografia
ENCRYPT_IV=...        // vetor de inicialização
```

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
```

## Variáveis de Ambiente de Segurança

```bash
# JWT
# (secret hardcoded em auth.service.ts: 'topSecret512' — verificar se deve migrar para env)

# Criptografia
CRIPTO_ALG=aes-256-cbc
ENCRYPT_SECRET_KEY=sua-chave-aqui
ENCRYPT_IV=seu-iv-aqui
```

> ⚠️ **Atenção**: O secret JWT `'topSecret512'` está hardcoded no `auth.service.ts`.
> Migrar para variável de ambiente `JWT_SECRET` ao refatorar segurança.
