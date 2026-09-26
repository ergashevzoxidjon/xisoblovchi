@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================
echo   index.html ni yig'ish
echo ================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0yigish.ps1" %*
if errorlevel 1 (
    echo.
    echo Yig'ish bajarilmadi - yuqoridagi xatoni o'qing.
)
echo.
pause
