# avto-pull.ps1
# Xisoblovchi ERP uchun avtomatik "pull" watcher.
# GitHub'dagi origin/main branch'ni har necha soniyada tekshirib turadi,
# agar u yangilangan bo'lsa va lokal papkada saqlanmagan o'zgarish bo'lmasa,
# avtomatik `git pull` qiladi.
#
# Ishlatish:
#   1. Ushbu faylni E:\AI\xisoblovchi papkasiga joylashtiring.
#   2. PowerShell'da shu papkaga o'ting: cd E:\AI\xisoblovchi
#   3. Ishga tushiring:   .\avto-pull.ps1
#   4. To'xtatish uchun:  Ctrl+C

param(
    [string]$RepoPath = (Get-Location).Path,
    [string]$Branch = "main",
    [int]$IntervalSec = 30
)

Set-Location $RepoPath

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$ts] $msg"
}

if (-not (Test-Path ".git")) {
    Log "XATO: '$RepoPath' papkasida .git topilmadi. Avval 'git clone' qiling."
    exit 1
}

Log "avto-pull ishga tushdi. Repo: $RepoPath | Branch: $Branch | Interval: ${IntervalSec}s"

while ($true) {
    try {
        git fetch origin $Branch 2>&1 | Out-Null

        $local  = git rev-parse HEAD
        $remote = git rev-parse "origin/$Branch"

        if ($local -ne $remote) {
            Log "Yangilanish topildi (GitHub'da yangi commit bor)."

            $dirty = git status --porcelain
            if ($dirty) {
                Log "OGOHLANTIRISH: Lokal papkada saqlanmagan o'zgarishlar bor — avtomatik pull XAVFSIZ EMAS, o'tkazib yuborildi."
                Log "Qo'lda hal qiling: 'git status' bilan tekshiring, keyin commit yoki 'git stash' qiling."
            } else {
                Log "Lokal papka toza. 'git pull' bajarilmoqda..."
                $pullOutput = git pull origin $Branch 2>&1
                Log $pullOutput
                Log "Pull yakunlandi. Joriy holat: $(git rev-parse --short HEAD)"
            }
        } else {
            Log "O'zgarish yo'q. (local=$($local.Substring(0,7)))"
        }
    } catch {
        Log "XATO: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds $IntervalSec
}
