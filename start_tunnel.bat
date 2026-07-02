@echo off
title OlimFood Tunnel
echo ============================================
echo         OlimFood — Tunnel Starter
echo ============================================
echo.
echo Qaysi tunnel ishlatmoqchisiz?
echo   1 - Cloudflare Tunnel (cloudflared) — tekin, hisob kerak emas
echo   2 - ngrok — hisob kerak
echo.
set /p choice="Tanlang (1 yoki 2): "

if "%choice%"=="1" goto cloudflare
if "%choice%"=="2" goto ngrok
echo Noto'g'ri tanlov. 1 yoki 2 kiriting.
pause
exit /b 1

:cloudflare
echo.
echo Cloudflare quick tunnel ishga tushirilmoqda...
echo.
REM cloudflared ni tekshirish
where cloudflared >nul 2>&1
if errorlevel 1 (
    echo cloudflared topilmadi. Yuklab olinmoqda...
    echo.
    REM winget orqali o'rnatish
    winget install --id Cloudflare.cloudflared --silent --accept-source-agreements --accept-package-agreements
    if errorlevel 1 (
        echo.
        echo XATO: cloudflared o'rnatilmadi.
        echo Qo'lda yuklab olish: https://github.com/cloudflare/cloudflared/releases
        echo cloudflared.exe ni C:\Windows\System32\ ga ko'chiring yoki PATH ga qo'shing.
        pause
        exit /b 1
    )
    echo O'rnatish tugadi!
    echo.
)
echo.
echo ============================================
echo  Tunnel ochilmoqda...
echo  URL paydo bo'lganda uni nusxalab .env ga
echo  WEBAPP_URL=https://xxxx.trycloudflare.com
echo  deb yozing, keyin botni qayta ishlating.
echo ============================================
echo.
cloudflared tunnel --url http://localhost:5173
goto end

:ngrok
echo.
REM ngrok ni tekshirish
where ngrok >nul 2>&1
if errorlevel 1 (
    echo ngrok topilmadi.
    echo.
    echo O'rnatish yo'llari:
    echo   1. https://ngrok.com/download — yuklab, PATH ga qo'shing
    echo   2. winget install ngrok.ngrok
    echo   3. choco install ngrok
    echo.
    echo O'rnatgach, 'ngrok config add-authtoken YOUR_TOKEN' ni bajaring.
    pause
    exit /b 1
)
echo.
echo ============================================
echo  Tunnel ochilmoqda...
echo  Paydo bo'lgan https://xxxx.ngrok-free.app
echo  manzilini .env ga WEBAPP_URL= deb yozing,
echo  keyin botni qayta ishlating.
echo ============================================
echo.
ngrok http 5173 --log stdout
goto end

:end
pause
