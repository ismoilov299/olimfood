@echo off
title OlimFood Dev Server
echo ============================================
echo           OlimFood — Dev Mode
echo ============================================
echo.

cd /d "%~dp0"

REM ── 1. Backend ──────────────────────────────
echo [1/2] Backend ishga tushirilmoqda (port 8000)...
if not exist "backend\venv" (
    echo   venv yaratilmoqda...
    python -m venv backend\venv
    backend\venv\Scripts\pip install --quiet -r backend\requirements.txt
)
start "OlimFood Backend" cmd /k "cd /d %~dp0backend && ..\backend\venv\Scripts\uvicorn main:app --reload --port 8000"

REM ── 2. Frontend ─────────────────────────────
echo [2/2] Frontend ishga tushirilmoqda (port 5173)...
if not exist "frontend\node_modules" (
    echo   node_modules o'rnatilmoqda...
    cd frontend && npm install && cd ..
)
start "OlimFood Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo  Backend  : http://localhost:8000
echo  Frontend : http://localhost:5173
echo  API docs : http://localhost:8000/docs
echo ============================================
echo.
echo Tunnel ochish uchun start_tunnel.bat ni ishga tushiring.
echo.
pause
