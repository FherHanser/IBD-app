@echo off
echo ================================================
echo  Stock Monitor - Instalacion Backend
echo ================================================

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python no encontrado. Instala Python 3.11+ primero.
    pause
    exit /b 1
)

echo Creando entorno virtual...
python -m venv venv

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo Instalando dependencias...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Copiando archivo de configuracion...
if not exist .env (
    copy .env.example .env
    echo Archivo .env creado. Revisa la configuracion si es necesario.
)

echo.
echo ================================================
echo  Instalacion completada.
echo  Para iniciar el backend ejecuta: start_backend.bat
echo ================================================
pause
