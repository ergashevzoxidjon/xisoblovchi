# Avtomatik GitHub sinxronizatsiya - fon kuzatuvchisi
# PUSH: index.html va boshqa fayllar o'zgarsa, tinchigandan keyin commit qilib push qiladi.
# PULL: belgilangan oraliqda GitHub da yangi commit bor-yo'qligini tekshiradi va oladi.

$ErrorActionPreference = "Continue"
$Papka   = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFayl = Join-Path $Papka "avto-push.log"
$QulfFayl = Join-Path $Papka ".avto-push.lock"

# --- sozlamalar ---
$TekshirishOraligi = 15    # necha soniyada bir mahalliy o'zgarish tekshiriladi
$KutishVaqti       = 60    # oxirgi o'zgarishdan keyin necha soniya kutish
$PullOraligi       = 900   # necha soniyada bir GitHub tekshiriladi (900 = 15 daqiqa)

function Yoz($matn) {
    $vaqt = Get-Date -Format "dd.MM.yyyy HH:mm:ss"
    $qator = "[$vaqt] $matn"
    Add-Content -Path $LogFayl -Value $qator -Encoding UTF8
    # log juda katta bo'lib ketmasin
    if ((Get-Item $LogFayl -ErrorAction SilentlyContinue).Length -gt 500KB) {
        $oxirgi = Get-Content $LogFayl -Tail 200
        Set-Content -Path $LogFayl -Value $oxirgi -Encoding UTF8
    }
}

# --- bitta nusxa ishlashi uchun ---
if (Test-Path $QulfFayl) {
    $eskiPid = Get-Content $QulfFayl -ErrorAction SilentlyContinue
    if ($eskiPid -and (Get-Process -Id $eskiPid -ErrorAction SilentlyContinue)) {
        Yoz "Xizmat allaqachon ishlayapti (PID $eskiPid). Chiqildi."
        exit
    }
}
Set-Content -Path $QulfFayl -Value $PID -Encoding ASCII

# --- git ni topamiz ---
$Git = $null
if (Get-Command git -ErrorAction SilentlyContinue) { $Git = "git" }
if (-not $Git) {
    $yollar = @(
        "$env:ProgramFiles\Git\cmd\git.exe",
        "${env:ProgramFiles(x86)}\Git\cmd\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"
    )
    foreach ($y in $yollar) { if (Test-Path $y) { $Git = $y; break } }
}
if (-not $Git) {
    Yoz "XATO: Git topilmadi. Xizmat to'xtadi."
    Remove-Item $QulfFayl -Force -ErrorAction SilentlyContinue
    exit 1
}

$env:GIT_EDITOR = "true"
$env:GIT_MERGE_AUTOEDIT = "no"
$env:GIT_PAGER = "cat"
$env:GIT_TERMINAL_PROMPT = "0"

Set-Location $Papka
Yoz "=== Avtomatik sinxronizatsiya xizmati ishga tushdi (PID $PID) ==="
Yoz "Papka: $Papka"
Yoz "Push: o'zgarishdan $KutishVaqti soniya keyin. Pull: har $PullOraligi soniyada."

function GitIshlat {
    param([string[]]$Argumentlar)
    $natija = & $Git @Argumentlar 2>&1
    return @{ Kod = $LASTEXITCODE; Matn = ($natija -join "`n") }
}

function OzgarishBormi {
    $holat = & $Git status --porcelain 2>&1
    return -not [string]::IsNullOrWhiteSpace(($holat -join ""))
}

function XabarYasa {
    # qaysi fayllar o'zgarganini aniqlaymiz
    $qatorlar = & $Git status --porcelain 2>&1
    $fayllar = @()
    foreach ($q in $qatorlar) {
        $nom = ($q.ToString().Substring(3)).Trim().Trim('"')
        if ($nom) { $fayllar += (Split-Path $nom -Leaf) }
    }
    # @() - bitta element bo'lsa ham massiv bo'lib qolishi uchun.
    # Aks holda matnga aylanadi va $fayllar[0] birinchi HARFni qaytaradi.
    $fayllar = @($fayllar | Select-Object -Unique)
    $vaqt = Get-Date -Format "dd.MM.yyyy HH:mm"

    if ($fayllar.Count -eq 0)      { return "Yangilandi - $vaqt" }
    elseif ($fayllar.Count -eq 1)  { return "$($fayllar[0]) yangilandi - $vaqt" }
    elseif ($fayllar.Count -le 3)  { return "$($fayllar -join ', ') yangilandi - $vaqt" }
    else                           { return "$($fayllar.Count) ta fayl yangilandi - $vaqt" }
}

function Yukla {
    $xabar = XabarYasa
    Yoz "O'zgarish topildi: $xabar"

    $r = GitIshlat @("add", "-A")
    if ($r.Kod -ne 0) { Yoz "XATO add: $($r.Matn)"; return }

    $r = GitIshlat @("commit", "-q", "-m", $xabar)
    if ($r.Kod -ne 0) { Yoz "XATO commit: $($r.Matn)"; return }
    Yoz "Commit qilindi."

    $r = GitIshlat @("push", "origin", "main")
    if ($r.Kod -eq 0) { Yoz "GitHub ga yuklandi."; return }

    Yoz "Push rad etildi, birlashtirilmoqda..."
    $r = GitIshlat @("pull", "origin", "main", "--no-rebase", "--no-edit")
    if ($r.Kod -ne 0) { Yoz "XATO pull: $($r.Matn)"; return }

    $r = GitIshlat @("push", "origin", "main")
    if ($r.Kod -eq 0) { Yoz "GitHub ga yuklandi (birlashtirilgandan keyin)." }
    else { Yoz "XATO push: $($r.Matn)" }
}

function TortibOl {
    # Faqat ish papkasi toza bo'lganda chaqiriladi - shuning uchun
    # tahrirlanayotgan fayl ustiga hech narsa yozilmaydi.
    $r = GitIshlat @("fetch", "origin", "main")
    if ($r.Kod -ne 0) {
        Yoz "Fetch bajarilmadi (internet yo'qmi?): $($r.Matn)"
        return
    }

    $r = GitIshlat @("rev-list", "--count", "HEAD..origin/main")
    if ($r.Kod -ne 0) { return }

    $yangi = 0
    if (-not [int]::TryParse($r.Matn.Trim(), [ref]$yangi)) { return }
    if ($yangi -le 0) { return }

    Yoz "GitHub da $yangi ta yangi commit bor, olinmoqda..."
    $r = GitIshlat @("pull", "origin", "main", "--no-rebase", "--no-edit")
    if ($r.Kod -eq 0) {
        $son = GitIshlat @("log", "--oneline", "-1")
        Yoz "GitHub dan olindi. So'nggi commit: $($son.Matn)"
    }
    else {
        Yoz "XATO pull: $($r.Matn)"
    }
}

# --- asosiy tsikl ---
$OxirgiOzgarish = $null
$OxirgiPull = Get-Date

while ($true) {
    try {
        if (OzgarishBormi) {
            if ($null -eq $OxirgiOzgarish) {
                $OxirgiOzgarish = Get-Date
                Yoz "O'zgarish sezildi, $KutishVaqti soniya kutilmoqda..."
            }
            elseif (((Get-Date) - $OxirgiOzgarish).TotalSeconds -ge $KutishVaqti) {
                Yukla
                $OxirgiOzgarish = $null
                $OxirgiPull = Get-Date
            }
        }
        else {
            $OxirgiOzgarish = $null
            if (((Get-Date) - $OxirgiPull).TotalSeconds -ge $PullOraligi) {
                TortibOl
                $OxirgiPull = Get-Date
            }
        }
    }
    catch {
        Yoz "XATO (tsikl): $($_.Exception.Message)"
    }

    Start-Sleep -Seconds $TekshirishOraligi
}
