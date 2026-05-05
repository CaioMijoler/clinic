@echo off
setlocal EnableDelayedExpansion

:: ========================
:: Configurações
:: ========================
set ENV_FILE=.env
set COMPOSE_FILE=docker-compose.yml

:: Carrega variáveis do .env (Opcional, útil caso precise usar alguma no bat)
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
if "%command%"=="stop"         goto stop
if "%command%"=="restart"      goto restart
if "%command%"=="down"         goto down
if "%command%"=="logs"         goto logs
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
echo  Docker (Banco de Dados ^& Redis):
echo    make.bat start          - Sobe os containers do Docker
echo    make.bat stop           - Para os containers do Docker
echo    make.bat restart        - Reinicia os containers
echo    make.bat down           - Remove os containers e redes
echo    make.bat logs           - Exibe os logs dos containers
echo.
echo  Aplicacao (NestJS):
echo    make.bat dev            - Sobe o Docker e inicia a API (yarn dev)
echo    make.bat build          - Faz o build da aplicacao
echo    make.bat start-prod     - Sobe o Docker, build e inicia em modo producao
echo =======================================================
echo.
goto end

:: ========================
:: DOCKER (INFRA)
:: ========================
:start
echo [INFO] Iniciando infraestrutura (MySQL e Redis)...
docker compose -f %COMPOSE_FILE% up -d
echo [OK] Containers iniciados.
goto end

:stop
echo [INFO] Parando infraestrutura...
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
docker compose -f %COMPOSE_FILE% logs -f
goto end

:: ========================
:: APLICACAO (NestJS)
:: ========================
:dev
echo [STEP 1/2] Preparando infraestrutura...
call make.bat start
echo.
echo [STEP 2/2] Iniciando API em modo de desenvolvimento...
yarn dev
goto end

:build
echo [INFO] Fazendo build da API...
yarn build
goto end

:start-prod
echo [STEP 1/3] Preparando infraestrutura...
call make.bat start
echo.
echo [STEP 2/3] Fazendo build da API...
call make.bat build
echo.
echo [STEP 3/3] Iniciando API em modo producao...
yarn start:prod
goto end

:end
endlocal
