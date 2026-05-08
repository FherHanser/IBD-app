@echo off
title CNTNL - VALUE

echo.
echo  Iniciando CNTNL - VALUE...
echo.

:: --- Backend ---
echo  [1/2] Levantando backend (puerto 8000)...
start "CNTNL Backend" /MIN cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"

:: Esperar que el backend arranque
timeout /t 4 /nobreak >nul

:: --- Frontend ---
echo  [2/2] Levantando frontend (puerto 3000)...
start "CNTNL Frontend" /MIN cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo  Sistema iniciado.
echo  Abre tu navegador en: http://localhost:3000
echo.
echo  Para detener: cierra las ventanas minimizadas en la barra de tareas.
echo.
pause
