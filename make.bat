@echo off
setlocal EnableDelayedExpansion

:: ========================
:: Configurações
:: ========================
set ENV_FILE=.env
set COMPOSE_FILE=docker-compose.yml

:: Carrega variáveis do .env
if exist %ENV_FILE% (
    for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
        set "line=%%a"
        if not "!line:~0,1!"=="#" (
            if not "%%b"=="" set "%%a=%%b"
        )
    )
)

:: ========================
:: Roteador de comandos
:: ========================
set command=%1
if "%command%"==""             goto help
if "%command%"=="help"         goto help
if "%command%"=="start"        goto start
if "%command%"=="up"           goto up
if "%command%"=="rebuild"      goto rebuild
if "%command%"=="stop"         goto stop
if "%command%"=="restart"      goto restart
if "%command%"=="down"         goto down
if "%command%"=="logs"         goto logs
if "%command%"=="migrate"      goto migrate
if "%command%"=="dev"          goto dev
if "%command%"=="build"        goto build
if "%command%"=="start-prod"   goto start-prod

echo [AVISO] Comando '%command%' nao encontrado. Use 'make.bat help'.
goto end

:: ========================
:: HELP
:: ========================
:help
echo.
echo =======================================================
echo              Clinic API - Comandos Disponiveis
echo =======================================================
echo.
echo  Docker (Containers):
echo    make.bat start          - Sobe apenas Infra (DB ^& Redis)
echo    make.bat up             - Sobe TUDO (API + Infra)
echo    make.bat rebuild        - Reconstrói API e sobe tudo
echo    make.bat stop           - Para os containers
echo    make.bat restart        - Reinicia tudo no Docker
echo    make.bat down           - Remove os containers e redes
echo    make.bat logs           - Exibe os logs da API
echo    make.bat migrate        - Roda migrations dentro do Docker
echo.
echo  Local (Hibrido):
echo    make.bat dev            - Infra no Docker + API local (yarn dev)
echo    make.bat build          - Faz o build local da aplicacao
echo    make.bat start-prod     - Infra no Docker + API local (producao)
echo =======================================================
echo.
goto end

:: ========================
:: DOCKER COMMANDS
:: ========================
:start
echo [INFO] Iniciando infraestrutura (DB e Redis)...
docker compose -f %COMPOSE_FILE% up -d db redis
echo [OK] Infraestrutura iniciada.
goto end

:up
echo [INFO] Iniciando todo o ecossistema no Docker...
docker compose -f %COMPOSE_FILE% up -d
echo [OK] Todos os serviços iniciados.
goto end

:rebuild
echo [INFO] Reconstruindo API e reiniciando...
docker compose -f %COMPOSE_FILE% up -d --build
echo [OK] Build e restart concluídos.
goto end

:stop
echo [INFO] Parando containers...
docker compose -f %COMPOSE_FILE% stop
echo [OK] Containers parados.
goto end

:restart
echo [INFO] Reiniciando infraestrutura...
docker compose -f %COMPOSE_FILE% stop
docker compose -f %COMPOSE_FILE% up -d
echo [OK] Containers reiniciados.
goto end

:down
echo [INFO] Removendo containers da infraestrutura...
docker compose -f %COMPOSE_FILE% down
echo [OK] Containers removidos.
goto end

:logs
docker compose -f %COMPOSE_FILE% logs -f api
goto end

:migrate
echo [INFO] Rodando migrations dentro do container...
docker compose exec api npm run migrations:run
goto end

:: ========================
:: LOCAL COMMANDS
:: ========================
:dev
echo [STEP 1/2] Preparando infraestrutura no Docker...
call make.bat start
echo.
echo [STEP 2/2] Iniciando API localmente...
yarn dev
goto end

:build
echo [INFO] Fazendo build local da API...
yarn build
goto end

:start-prod
echo [STEP 1/3] Preparando infraestrutura no Docker...
call make.bat start
echo.
echo [STEP 2/3] Fazendo build local da API...
call make.bat build
echo.
echo [STEP 3/3] Iniciando API local em modo producao...
yarn start:prod
goto end

:end
endlocal
