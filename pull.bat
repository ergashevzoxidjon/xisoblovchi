@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ================================================
echo    GitHub dan yuklab olish - xisoblovchi
echo ================================================
echo.

rem ---------- Git ni qidiramiz ----------
set "GIT="
where git >nul 2>&1
if not errorlevel 1 set "GIT=git"
if defined GIT goto :git_topildi
set "P1=%ProgramFiles%\Git\cmd\git.exe"
set "P2=%ProgramFiles(x86)%\Git\cmd\git.exe"
set "P3=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
if exist "%P1%" set "GIT=%P1%"
if defined GIT goto :git_topildi
if exist "%P2%" set "GIT=%P2%"
if defined GIT goto :git_topildi
if exist "%P3%" set "GIT=%P3%"
if defined GIT goto :git_topildi
echo [XATO] Git topilmadi.
goto :son

:git_topildi
set "GIT_EDITOR=true"
set "GIT_MERGE_AUTOEDIT=no"
set "GIT_PAGER=cat"
if exist ".git\index.lock" del /f /q ".git\index.lock" >nul 2>&1

echo [1/3] GitHub dagi holat tekshirilmoqda...
"%GIT%" fetch origin main < nul
if errorlevel 1 goto :fetch_xato

echo.
echo    Mahalliy:
"%GIT%" --no-pager log --oneline -1 < nul
echo    GitHub da:
"%GIT%" --no-pager log --oneline -1 origin/main < nul
echo.

for /f %%C in ('"%GIT%" rev-list --count HEAD..origin/main') do set "YANGI=%%C"
if "!YANGI!"=="0" goto :yangilik_yoq

echo    GitHub da !YANGI! ta yangi commit bor:
"%GIT%" --no-pager log --oneline HEAD..origin/main < nul
echo.

echo [2/3] Mahalliy o'zgarishlar saqlanmoqda...
"%GIT%" add -A < nul
"%GIT%" diff --cached --quiet < nul
if not errorlevel 1 goto :saqlash_kerak_emas
"%GIT%" commit -q -m "Mahalliy o'zgarishlar - pull oldidan saqlandi"
echo    Saqlandi.
goto :yuklab_ol

:saqlash_kerak_emas
echo    Saqlanmagan o'zgarish yo'q.

:yuklab_ol
echo.
echo [3/3] GitHub dan olinmoqda...
"%GIT%" pull origin main --no-rebase --no-edit < nul
if errorlevel 1 goto :pull_xato
echo.
echo ================================================
echo    TAYYOR - GitHub dagi o'zgarishlar olindi
echo ================================================
echo.
echo    So'nggi commitlar:
"%GIT%" --no-pager log --oneline -5 < nul
goto :son

:yangilik_yoq
echo ================================================
echo    YANGILIK YO'Q
echo ================================================
echo.
echo    Mahalliy nusxa GitHub bilan bir xil.
echo    Yuklab oladigan narsa yo'q.
goto :son

:fetch_xato
echo.
echo    [XATO] GitHub ga ulanib bo'lmadi.
echo    Internetni tekshirib, qayta urinib ko'ring.
goto :son

:pull_xato
echo.
echo    [XATO] Birlashtirishda ziddiyat bo'lishi mumkin.
echo    Yuqoridagi matnni nusxalab yuboring - yordam beraman.
goto :son

:son
echo.
echo ------------------------------------------------
echo    Yopish uchun istalgan tugmani bosing
echo ------------------------------------------------
pause >nul
endlocal