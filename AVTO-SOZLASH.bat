@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================
echo   Avto-push: har 10 daqiqada GitHub'ga
echo ==========================================
schtasks /Create /F /SC MINUTE /MO 10 /TN "Xisoblovchi avto-push" /TR "wscript.exe \"%~dp0avto-push-yashirin.vbs\"" >nul
rem Noutbuk batareyada ishlaganda ham ishlasin, o'tkazib yuborilgan ishga tushish keyin bajarilsin
powershell -NoProfile -Command "$s = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -MultipleInstances IgnoreNew; Set-ScheduledTask -TaskName 'Xisoblovchi avto-push' -Settings $s | Out-Null"
if errorlevel 1 (
    echo XATO: vazifa yaratilmadi.
) else (
    echo Tayyor! Har 10 daqiqada o'zgarish bo'lsa GitHub'ga yuklanadi.
    echo Jurnal: avto-push.log    To'xtatish: AVTO-TOXTATISH.bat    Holat: HOLAT.bat
)
echo.
pause
