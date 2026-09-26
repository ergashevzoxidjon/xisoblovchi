# yigish.ps1 - bo'lim fayllaridan tayyor index.html ni yig'adi.
#
# Manba fayllar:
#   umumiy/index.template.html   - sahifa skeleti ("<!-- @include bolim/blok -->" belgilari bilan)
#   bolimlar/<nomi>/<nomi>.html  - bo'lim HTML qismlari ("<!-- @blok NOMI --> ... <!-- @/blok -->")
#   umumiy/*.css|js, bolimlar/<nomi>/<nomi>.css|js - index.html ularga havola qiladi (ichiga qo'shilmaydi)
#
# Ishlatish:  yigish.bat              (yoki: powershell -ExecutionPolicy Bypass -File yigish.ps1)
#             yigish.bat -Majburiy    - index.html qo'lda o'zgartirilgan bo'lsa ham ustidan yozadi
#
# Himoya: yig'ilgan index.html ichiga "yigish-hash" yoziladi. Keyingi safar fayl qo'lda
# tahrirlangani aniqlansa, skript to'xtaydi - aks holda o'sha o'zgarishlar yo'qolib ketardi.

param([switch]$Majburiy)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Oqi([string]$p) { return ([IO.File]::ReadAllText($p, $utf8)) -replace "`r`n", "`n" }
function Xesh([string]$s) {
    $sha = [Security.Cryptography.SHA256]::Create()
    $b = $sha.ComputeHash($utf8.GetBytes($s))
    return ((($b | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 16))
}
function Xato([string]$m) { Write-Host "XATO: $m" -ForegroundColor Red; exit 1 }

$tplPath = Join-Path $root 'umumiy\index.template.html'
$outPath = Join-Path $root 'index.html'
if (-not (Test-Path $tplPath)) { Xato "umumiy\index.template.html topilmadi." }

# 1) Bo'limlarning HTML bloklarini yig'amiz
$bloklar = @{}
foreach ($dir in Get-ChildItem (Join-Path $root 'bolimlar') -Directory) {
    $f = Join-Path $dir.FullName ($dir.Name + '.html')
    if (-not (Test-Path $f)) { continue }
    $txt = Oqi $f
    foreach ($m in [regex]::Matches($txt, '(?s)<!-- @blok (\S+) -->\n(.*?)<!-- @/blok -->')) {
        $kalit = $dir.Name + '/' + $m.Groups[1].Value
        if ($bloklar.ContainsKey($kalit)) { Xato "'$kalit' bloki ikki marta yozilgan ($f)." }
        $bloklar[$kalit] = $m.Groups[2].Value
    }
}

# 2) Shablondagi "@include" belgilarini bloklar bilan almashtiramiz
$tpl = Oqi $tplPath
$qatorlar = $tpl.Split("`n")
$sb = New-Object System.Text.StringBuilder
$ishlatilgan = @{}
for ($i = 0; $i -lt $qatorlar.Length; $i++) {
    $q = $qatorlar[$i]
    $m = [regex]::Match($q, '^\s*<!-- @include (\S+) -->\s*$')
    if ($m.Success) {
        $kalit = $m.Groups[1].Value
        if (-not $bloklar.ContainsKey($kalit)) { Xato "Shablonda '$kalit' so'ralgan, lekin bunday blok yo'q (bolimlar\$($kalit.Split('/')[0])\$($kalit.Split('/')[0]).html)." }
        [void]$sb.Append($bloklar[$kalit])
        $ishlatilgan[$kalit] = $true
        continue
    }
    [void]$sb.Append($q)
    if ($i -lt $qatorlar.Length - 1) { [void]$sb.Append("`n") }
}
$tana = $sb.ToString()

foreach ($k in $bloklar.Keys) {
    if (-not $ishlatilgan.ContainsKey($k)) { Write-Host "OGOHLANTIRISH: '$k' bloki hech qayerda ishlatilmagan." -ForegroundColor Yellow }
}

# 3) Havola qilingan CSS/JS fayllar mavjudligini tekshiramiz
foreach ($m in [regex]::Matches($tana, '(?:src|href)="((?:umumiy|bolimlar)/[^"]+)"')) {
    $p = Join-Path $root ($m.Groups[1].Value -replace '/', '\')
    if (-not (Test-Path $p)) { Xato "index.html '$($m.Groups[1].Value)' fayliga havola qiladi, lekin u topilmadi." }
}

# 3b) Kesh: har bir havolaga fayl mazmunidan olingan versiya qo'shamiz (core.js?v=1a2b3c4d).
#     Fayl o'zgarsa havola ham o'zgaradi - brauzer eski (keshdagi) JS/CSS ni ishlatib qolmaydi.
$tana = [regex]::Replace($tana, '((?:src|href)=")((?:umumiy|bolimlar)/[^"?]+)(")', [System.Text.RegularExpressions.MatchEvaluator]{
    param($m)
    $p = Join-Path $root ($m.Groups[2].Value -replace '/', '\')
    return $m.Groups[1].Value + $m.Groups[2].Value + '?v=' + (Xesh (Oqi $p)).Substring(0, 8) + $m.Groups[3].Value
})

# 4) Mavjud index.html qo'lda o'zgartirilmaganini tekshiramiz
$sarlavhaNaqsh = '(?m)^<!-- DIQQAT: .*yigish-hash: ([0-9a-f]{16}) -->\n'
if ((Test-Path $outPath) -and -not $Majburiy) {
    $eski = Oqi $outPath
    $hm = [regex]::Match($eski, $sarlavhaNaqsh)
    if (-not $hm.Success) {
        Xato "index.html yig'uvchi tomonidan yaratilmagan (yigish-hash yo'q). Undagi o'zgarishlarni avval bo'lim fayllariga ko'chiring, so'ng: yigish.bat -Majburiy"
    }
    $eskiTana = $eski.Remove($hm.Index, $hm.Length)
    if ((Xesh $eskiTana) -ne $hm.Groups[1].Value) {
        Xato "index.html oxirgi yig'ishdan keyin QO'LDA o'zgartirilgan. Bu o'zgarishlar yo'qolmasligi uchun ularni bolimlar\ yoki umumiy\ dagi fayllarga ko'chiring (git diff index.html), so'ng: yigish.bat -Majburiy"
    }
}

# 5) Sarlavha (DOCTYPE dan keyingi qator) bilan yozamiz
$xesh = Xesh $tana
$sarlavha = "<!-- DIQQAT: bu fayl AVTOMATIK yig'ilgan (yigish.bat). To'g'ridan-to'g'ri tahrirlamang - o'zgarishlarni umumiy/ va bolimlar/ papkalarida qiling, so'ng yigish.bat ni ishga tushiring. yigish-hash: $xesh -->`n"
$birinchi = $tana.IndexOf("`n") + 1
$natija = $tana.Insert($birinchi, $sarlavha)

$eskiMatn = if (Test-Path $outPath) { Oqi $outPath } else { '' }
if ($eskiMatn -eq $natija) {
    Write-Host "index.html allaqachon yangi - o'zgarish yo'q." -ForegroundColor Green
} else {
    [IO.File]::WriteAllText($outPath, $natija, $utf8)
    Write-Host "Tayyor: index.html yig'ildi ($($bloklar.Count) ta blok, $(($natija.Split("`n")).Length) qator)." -ForegroundColor Green
}
