@echo off
chcp 65001 > nul
echo ====================================
echo   GitHub-ga Yuklash (xisoblovchi2)
echo ====================================
echo.

git add .

set /p msg="O'zgarish izohini kiriting (bo'sh bo'lsa 'Auto update'): "
if "%msg%"=="" set msg=Auto update

git commit -m "%msg%"
git branch -M main
git remote add origin https://github.com/ergashevzoxidjon/xisoblovchi2.git 2>nul
git push -u origin main

echo.
echo ====================================
echo   Muvaffaqiyatli yuklandi!
echo ====================================
pause