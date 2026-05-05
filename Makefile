.PHONY: start stop restart logs dev build start-prod

# Sobe os containers docker em background
start:
	docker compose up -d

# Para e remove os containers
stop:
	docker compose down

# Reinicia os containers
restart: stop start

# Mostra os logs dos containers
logs:
	docker compose logs -f

# Inicia o ambiente completo (banco, redis e api)
dev: start
	yarn dev

# Faz o build da aplicação
build:
	yarn build

# Inicia em modo de produção
start-prod: start build
	yarn start:prod
