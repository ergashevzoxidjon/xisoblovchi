@echo off
chcp 65001 >nul
cd /d "%~dp0"
if exist ".git\index.lock" del /f /q ".git\index.lock" >nul 2>&1
if exist ".git\ORIG_HEAD.lock" del /f /q ".git\ORIG_HEAD.lock" >nul 2>&1
echo Qo'shilmoqda...
git add index.html assets/
echo Commit qilinmoqda...
git commit -m "CSS va JS ni alohida fayllarga ajratildi (6 kategoriya + core)"
echo GitHub-ga yuklanmoqda...
git push origin main
echo.
echo TAYYOR.
pause
