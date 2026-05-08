@echo off
echo ================================================
echo  Stock Monitor - Instalacion Frontend
echo ================================================

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no encontrado. Instala Node.js 18+ desde https://nodejs.org
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm no encontrado.
    pause
    exit /b 1
)

echo Instalando dependencias de Node...
npm install

echo.
echo ================================================
echo  Instalacion completada.
echo  Para iniciar el frontend ejecuta: start_frontend.bat
echo ================================================
pause
