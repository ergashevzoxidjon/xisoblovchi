@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================================
echo    AVTOMATIK YUKLASHNI TO'XTATISH
echo ================================================
echo.

set "YORLIQ=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\XisoblovchiAvtoPush.lnk"

echo [1/2] Ishlab turgan xizmat to'xtatilmoqda...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*avto-push.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
if exist ".avto-push.lock" del /f /q ".avto-push.lock" >nul 2>&1
echo    Bajarildi.

echo [2/2] Avtomatik ishga tushish o'chirilmoqda...
if exist "%YORLIQ%" del /f /q "%YORLIQ%"
echo    Bajarildi.

echo.
echo    Avtomatik yuklash to'xtatildi.
echo    Qayta yoqish uchun AVTO-SOZLASH.bat ni bosing.
echo    Qo'lda yuklash uchun push.bat ishlaydi.
echo.
pause >nul
