@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================
echo   GitHub dan yangilash (sync)
echo ================================
echo.
echo Joriy holat:
git log --oneline -1
echo.
echo GitHub dan olinmoqda...
git fetch origin
echo.
echo Mahalliy nusxa GitHub bilan tenglashtirilmoqda...
git reset --hard origin/main
echo.
echo ================================
echo   Tayyor! Yangi holat:
git log --oneline -1
echo ================================
pause
