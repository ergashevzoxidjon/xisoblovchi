@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================================
echo    AVTOMATIK YUKLASH HOLATI
echo ================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p = Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*avto-push.ps1*' }; if ($p) { Write-Host '   HOLAT: ishlayapti (PID' $p.ProcessId ')' -ForegroundColor Green } else { Write-Host '   HOLAT: ishlamayapti' -ForegroundColor Yellow }"

echo.
set "YORLIQ=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\XisoblovchiAvtoPush.lnk"
if exist "%YORLIQ%" (echo    Windows bilan ishga tushish: YOQILGAN) else (echo    Windows bilan ishga tushish: o'chirilgan)

echo.
echo ------------------------------------------------
echo    So'nggi hodisalar:
echo ------------------------------------------------
if exist "avto-push.log" (powershell -NoProfile -Command "Get-Content 'avto-push.log' -Tail 15") else (echo    Log fayl hali yo'q.)

echo.
pause >nul
