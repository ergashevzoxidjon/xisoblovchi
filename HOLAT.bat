@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ===== Vazifa =====
schtasks /Query /TN "Xisoblovchi avto-push" /FO LIST /V 2>nul | findstr /C:"Status" /C:"Next Run" /C:"Last Run" /C:"Last Result"
if errorlevel 1 echo Avto-push o'rnatilmagan (AVTO-SOZLASH.bat ni ishga tushiring).
echo.
echo ===== Oxirgi yozuvlar (avto-push.log) =====
powershell -NoProfile -Command "if (Test-Path 'avto-push.log') { Get-Content 'avto-push.log' -Tail 15 -Encoding UTF8 } else { 'Jurnal hali yo''q.' }"
echo.
echo ===== Saqlanmagan o'zgarishlar =====
git status --short
echo.
pause
