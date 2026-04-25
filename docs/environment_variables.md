# Variáveis de Ambiente

Este documento descreve as variáveis de ambiente necessárias para o funcionamento do sistema. Todas as configurações são centralizadas no arquivo `src/config/app.config.ts`.

## Configuração de Ambiente
| Variável | Descrição | Valor Padrão |
|---|---|---|
| `ENV` | Ambiente atual (`dev`, `prod`) | `dev` |
| `PORT` | Porta de execução do servidor | `3001` |
| `LOG_LEVEL` | Nível de log (`debug`, `info`, `warn`, `error`) | `debug` |
| `LOG_INJECTION` | Habilitar injeção de logs | `true` |

## Banco de Dados
| Variável | Descrição | Exemplo |
|---|---|---|
| `DB_TYPE` | Tipo do banco (`mysql` ou `postgres`) | `postgres` |
| `DB_HOST` | Host do banco de dados | `localhost` |
| `DB_PORT` | Porta do banco de dados | `5432` |
| `DB_NAME` | Nome do banco | `clinical` |
| `DB_USER` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | `******` |

## Autenticação e Sessão
| Variável | Descrição | Valor Padrão |
|---|---|---|
| `AUTH_PROVIDER` | Provedor de auth (`local` ou `supabase`) | `local` |
| `AUTH_TOKEN_TTL` | Tempo de vida da sessão no Redis (segundos) | `86400` (24h) |
| `JWT_SECRET` | Segredo para assinatura de tokens locais | `clinical` |

## Supabase
Necessário se `AUTH_PROVIDER=supabase` ou para upload de arquivos.
| Variável | Descrição | Valor Padrão |
|---|---|---|
| `SUPABASE_URL` | URL do projeto Supabase | - |
| `SUPABASE_KEY` | Chave de API (Service Role) | - |
| `SUPABASE_BUCKET` | Nome do bucket de Storage | `clinic-files` |

## Redis
| Variável | Descrição | Valor Padrão |
|---|---|---|
| `REDIS_HOST` | Host do servidor Redis | `localhost` |
| `REDIS_PORT` | Porta do servidor Redis | `6379` |

## Integrações Externas
| Variável | Descrição |
|---|---|
| `CALENDAR_URL` | URL da API do Google Calendar |
| `WHATSAPP_URL` | URL da API do WhatsApp Business |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número de telefone |
| `WHATSAPP_ACCESS_TOKEN` | Token de acesso do WhatsApp |

## Criptografia (Local)
Utilizado para proteção de dados sensíveis no banco de dados.
| Variável | Descrição |
|---|---|
| `CRIPTO_ALG` | Algoritmo de criptografia (ex: `aes-256-ctr`) |
| `ENCRYPT_SECRET_KEY` | Chave secreta em formato hexadecimal (64 caracteres) |
| `ENCRYPT_IV` | Vetor de inicialização em formato hexadecimal (32 caracteres) |
