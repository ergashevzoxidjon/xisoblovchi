@echo off
chcp 65001 >nul
schtasks /Delete /F /TN "Xisoblovchi avto-push" >nul 2>&1
if errorlevel 1 (echo Avto-push allaqachon o'chirilgan.) else (echo Avto-push to'xtatildi.)
echo.
pause
