# avto-push.ps1 - o'zgarishlarni GitHub'ga avtomatik yuklaydi (Windows Vazifa rejalashtiruvchisi
# uni har 10 daqiqada BIR MARTA ishga tushiradi - AVTO-SOZLASH.bat ga qarang).
#
# Keraksiz commitlarning oldini olish qoidalari:
#   1. Haqiqiy o'zgarish bo'lmasa - hech narsa qilinmaydi (bo'sh commit yo'q).
#   2. Log fayl (avto-push.log) .gitignore'da - u hech qachon commit qilinmaydi.
#      (Eski skript o'z logini commit qilib, cheksiz "avto-push.log yangilandi" commitlarini yaratgan.)
#   3. Oxirgi TINCHLIK_DAQIQA ichida fayl o'zgargan bo'lsa - tahrir davom etyapti deb,
#      keyingi safarga qoldiriladi (yarim-chala holat commit qilinmaydi).
#   4. Commitdan oldin yigish.ps1 ishga tushadi; index.html yig'ilmasa - commit qilinmaydi.
#   5. Bitta ishga tushishda ko'pi bilan BITTA commit, ma'noli xabar bilan (qaysi bo'limlar o'zgargani).
#   6. Internet bo'lmasa - commit lokal saqlanadi, keyingi safar push qilinadi.
#
# Qo'lda ishga tushirish: powershell -ExecutionPolicy Bypass -File avto-push.ps1

param([int]$TinchlikDaqiqa = 2)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$logPath = Join-Path $root 'avto-push.log'
$lockPath = Join-Path $root '.avto-push.lock'

function Log([string]$m) {
    $qator = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m"
    Add-Content -Path $logPath -Value $qator -Encoding UTF8
    Write-Host $qator
}

# Log fayli juda kattalashib ketmasin (oxirgi 500 qator qoladi)
if ((Test-Path $logPath) -and ((Get-Item $logPath).Length -gt 200KB)) {
    $oxiri = Get-Content $logPath -Tail 500 -Encoding UTF8
    Set-Content -Path $logPath -Value $oxiri -Encoding UTF8
}

# Bir vaqtda ikki nusxa ishlamasin. Qulfda jarayon raqami (PID) turadi: o'sha jarayon endi
# ishlamayotgan bo'lsa (masalan kompyuter o'chib qolgan) yoki qulf 30 daqiqadan eski bo'lsa - eskirgan.
if (Test-Path $lockPath) {
    $eskiPid = 0
    [void][int]::TryParse(((Get-Content $lockPath -Raw -ErrorAction SilentlyContinue) + '').Trim(), [ref]$eskiPid)
    $tirik = ($eskiPid -gt 0) -and (Get-Process -Id $eskiPid -ErrorAction SilentlyContinue)
    if ($tirik -and (Get-Item $lockPath).LastWriteTime -gt (Get-Date).AddMinutes(-30)) {
        Log "O'TKAZILDI: oldingi avto-push hali ishlayapti (PID $eskiPid)."
        exit 0
    }
    Remove-Item $lockPath -Force
}
Set-Content -Path $lockPath -Value $PID -Encoding ASCII

function G {
    # git chiqishini matn sifatida qaytaradi; xato bo'lsa $LASTEXITCODE orqali tekshiriladi
    $eski = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    $out = & git.exe @args 2>&1 | ForEach-Object { "$_" }
    $ErrorActionPreference = $eski
    return ($out -join "`n")
}

try {
    # Merge/rebase jarayoni tugallanmagan bo'lsa - tegmaymiz
    $gitDir = Join-Path $root '.git'
    if ((Test-Path "$gitDir\MERGE_HEAD") -or (Test-Path "$gitDir\rebase-merge") -or (Test-Path "$gitDir\rebase-apply")) {
        Log "O'TKAZILDI: git merge/rebase tugallanmagan - qo'lda hal qiling."
        exit 0
    }

    # Avto-push'ning o'z fayllari HECH QACHON commit qilinmaydi (hatto git ularni kuzatayotgan bo'lsa ham)
    $oziniki = @('avto-push.log', '.avto-push.lock')
    $holat = ((G status --porcelain -uall).Split("`n") | Where-Object {
        $_.Length -gt 3 -and ($oziniki -notcontains $_.Substring(3).Trim('"'))
    }) -join "`n"
    $bor = -not [string]::IsNullOrWhiteSpace($holat)

    if ($bor) {
        # 3) Tinchlik: oxirgi daqiqalarda o'zgargan fayl bormi?
        $fayllar = $holat.Split("`n") | Where-Object { $_.Length -gt 3 } | ForEach-Object { $_.Substring(3).Trim('"') -replace ' -> .*$', '' }
        $chegara = (Get-Date).AddMinutes(-$TinchlikDaqiqa)
        $yangi = $fayllar | Where-Object { (Test-Path $_ -PathType Leaf) -and ((Get-Item $_).LastWriteTime -gt $chegara) }
        if ($yangi) {
            Log "KUTILMOQDA: fayllar hali tahrirlanyapti ($(@($yangi).Count) ta, oxirgi $TinchlikDaqiqa daqiqada) - keyingi safar."
            exit 0
        }

        # 4) index.html ni yig'amiz
        $yig = & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root 'yigish.ps1') 2>&1 | ForEach-Object { "$_" }
        if ($LASTEXITCODE -ne 0) {
            Log "COMMIT QILINMADI: yigish.ps1 xato berdi: $($yig -join ' ')"
            exit 0
        }

        G add -A | Out-Null
        G reset -q -- @oziniki | Out-Null
        $ozgargan = (G diff --cached --name-only).Split("`n") | Where-Object { $_ }
        if (@($ozgargan).Count -eq 0) {
            Log "O'zgarish yo'q."
        } else {
            # 5) Ma'noli xabar: qaysi bo'limlar o'zgardi
            $qismlar = $ozgargan | ForEach-Object {
                if ($_ -match '^bolimlar/([^/]+)/') { $Matches[1] }
                elseif ($_ -match '^umumiy/') { 'umumiy' }
                elseif ($_ -eq 'index.html') { $null }
                else { $_ }
            } | Where-Object { $_ } | Sort-Object -Unique
            if (-not $qismlar) { $qismlar = @('index.html') }
            $sarlavha = "Avto: $($qismlar -join ', ') - $(@($ozgargan).Count) ta fayl"
            $tana = ($ozgargan | ForEach-Object { "- $_" }) -join "`n"
            $msgFile = Join-Path $gitDir 'AVTO_COMMIT_MSG'
            [IO.File]::WriteAllText($msgFile, "$sarlavha`n`n$tana`n", (New-Object System.Text.UTF8Encoding($false)))
            $c = G commit -q -F $msgFile
            if ($LASTEXITCODE -ne 0) { Log "COMMIT XATOSI: $c"; exit 0 }
            Log "Commit: $sarlavha"
        }
    }

    # 6) Lokal commitlar GitHub'dan oldinda bo'lsa - yuklaymiz
    $f = G fetch -q origin main
    if ($LASTEXITCODE -ne 0) { Log "INTERNET/GITHUB YO'Q: push keyingi safar. ($f)"; exit 0 }
    $oldinda = [int](G rev-list --count origin/main..HEAD)
    $orqada = [int](G rev-list --count HEAD..origin/main)
    if ($oldinda -eq 0) {
        if ($bor) { Log "Push kerak emas." }
        exit 0
    }
    if ($orqada -gt 0) {
        # Boshqa kompyuterdan yangi commit kelgan - ustiga qo'yamiz (rebase)
        $r = G pull -q --rebase origin main
        if ($LASTEXITCODE -ne 0) {
            G rebase --abort | Out-Null
            Log "PUSH QILINMADI: GitHub'dagi o'zgarishlar bilan ziddiyat - qo'lda hal qiling (git pull). $r"
            exit 0
        }
    }
    $p = G push -q origin HEAD:main
    if ($LASTEXITCODE -ne 0) { Log "PUSH XATOSI: $p"; exit 0 }
    Log "GitHub'ga yuklandi ($oldinda ta commit)."
}
catch {
    Log "XATO: $($_.Exception.Message)"
}
finally {
    Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
}
