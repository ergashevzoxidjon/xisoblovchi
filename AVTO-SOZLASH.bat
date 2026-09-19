@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================================
echo    AVTOMATIK YUKLASHNI O'RNATISH
echo ================================================
echo.

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "YORLIQ=%STARTUP%\XisoblovchiAvtoPush.lnk"

echo [1/3] Windows bilan birga ishga tushirish sozlanmoqda...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%YORLIQ%'); $s.TargetPath='%~dp0avto-push-yashirin.vbs'; $s.WorkingDirectory='%~dp0'; $s.Description='Xisoblovchi avtomatik GitHub yuklash'; $s.Save()"

if exist "%YORLIQ%" (echo    Bajarildi.) else (echo    [XATO] Yorliq yaratilmadi.)

echo.
echo [2/3] Eski nusxa to'xtatilmoqda...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*avto-push.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
if exist ".avto-push.lock" del /f /q ".avto-push.lock" >nul 2>&1
echo    Bajarildi.

echo.
echo [3/3] Xizmat ishga tushirilmoqda...
start "" "%~dp0avto-push-yashirin.vbs"
timeout /t 3 >nul
echo    Bajarildi.

echo.
echo ================================================
echo    TAYYOR
echo ================================================
echo.
echo    Endi index.html ni tahrirlab saqlashingiz kifoya.
echo    Bir daqiqadan keyin o'zi GitHub ga yuklanadi.
echo.
echo    Nima bo'layotganini ko'rish uchun:
echo       avto-push.log faylini oching
echo.
echo    To'xtatish uchun:
echo       AVTO-TOXTATISH.bat ni bosing
echo.
pause >nul
