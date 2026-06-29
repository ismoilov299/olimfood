@echo off
title OlimFood Telegram Bot
echo ============================================
echo           OlimFood Telegram Bot
echo ============================================
echo.

cd /d "%~dp0"

REM Check if venv exists for the bot
if not exist "telegram_bot\venv" (
    echo Birinchi marta ishga tushirilmoqda — paketlar o'rnatilmoqda...
    python -m venv telegram_bot\venv
    telegram_bot\venv\Scripts\pip install --quiet -r telegram_bot\requirements.txt
    echo O'rnatish tugadi!
    echo.
)

REM Check .env
if not exist ".env" (
    echo XATO: .env fayli topilmadi!
    echo .env.example ni ko'chirib .env yarating va tokenlarni to'ldiring.
    pause
    exit /b 1
)

echo Bot ishga tushmoqda...
telegram_bot\venv\Scripts\python telegram_bot\bot.py

if errorlevel 1 (
    echo.
    echo Bot xato bilan to'xtadi. Yuqoridagi xabarni tekshiring.
    pause
)
