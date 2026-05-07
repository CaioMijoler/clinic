.PHONY: start stop restart logs dev build start-prod up rebuild migrate

# Sobe as dependências (DB + Redis) em background
start:
	docker compose up -d db redis

# Sobe TUDO (API + DB + Redis) em background
up:
	docker compose up -d

# Para e remove os containers
stop:
	docker compose down

# Reinicia os containers
restart: stop up

# Reconstrói a imagem da API e sobe tudo
rebuild:
	docker compose up -d --build

# Mostra os logs da API
logs:
	docker compose logs -f api

# Roda as migrations dentro do container da API
migrate:
	docker compose exec api npm run migrations:run

# Inicia o ambiente híbrido (dependências no Docker + API local)
dev: start
	yarn dev

# Faz o build local da aplicação
build:
	yarn build

# Inicia em modo de produção local
start-prod: start build
	yarn start:prod
