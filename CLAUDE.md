# Xisoblovchi — Bosmaxona ERP

Bosmaxona uchun narx hisoblash va buyurtma tizimi. Server yo'q: brauzerda `index.html` ochiladi
(ikki marta bosib yoki `python -m http.server`), ma'lumotlar brauzer `localStorage`'ida saqlanadi.

## Tuzilma

```
index.html                  ← AVTOMATIK YIG'ILADI — qo'lda tahrirlamang!
yigish.bat / yigish.ps1     ← bo'lim HTML qismlaridan index.html ni yig'adi
umumiy/
  index.template.html       ← sahifa skeleti (login, sarlavha, kalkulyator, admin, hisobotlar)
  core.css                  ← umumiy uslublar
  yordamchi.js              ← 1-yuklanadi: bo'limlar ro'yxati, xatodan himoya, umumiy yordamchilar
  core.js                   ← login, navigatsiya, init(), generateForm()/calculate() tarqatuvchilari
  custom-products.js        ← admin qo'shadigan "maxsus" mahsulotlar
  full-calc.js              ← 👁️ to'liq hisob-kitob modali
  admin-ux.js               ← admin panel: yuqori panel, tez o'tish, saqlanmagan o'zgarishlar, Ctrl+S
  ishga-tushirish.js        ← oxirgi yuklanadi: init() ni chaqiradi
bolimlar/<nomi>/<nomi>.html|.css|.js
  poligrafiya  (Flayer, Listovka, Doorhanger, Buklet, Bloknot, Paket, Kalendar, Papka, Kubarik, Konvert, Otkritka)
  textile      (Futbolka ... Shoper, Bayroqlar)
  suvenir      (Ruchka, Termos, ... Zontik)
  reklama      (Baner, Orakal, ..., Roll Up, Pauk, PopUp, PromoStoyka)
  ofset        (Ofset pechat kalkulyatori + Ofset qog'oz bazasi)
  sifravoy     (Raqamli pechat kalkulyatori)
```

## Qoidalar

1. **`index.html` ni hech qachon to'g'ridan-to'g'ri tahrirlamang.** HTML o'zgarishi →
   `bolimlar/<nomi>/<nomi>.html` yoki `umumiy/index.template.html`, so'ng `yigish.bat`
   (yoki `powershell -NoProfile -ExecutionPolicy Bypass -File yigish.ps1`).
   `yigish.ps1` index.html qo'lda o'zgartirilganini sezsa to'xtaydi.
2. JS/CSS alohida fayl sifatida yuklanadi, lekin `yigish.ps1` har bir havolaga fayl mazmunidan versiya qo'shadi
   (`core.js?v=1a2b3c4d`) — brauzer keshdagi eski faylni ishlatmasligi uchun. Shuning uchun **JS/CSS o'zgargandan
   keyin ham `yigish.bat`** ni ishga tushiring (avto-push buni o'zi qiladi).
3. Bo'lim HTML fayli `<!-- @blok NOMI -->` ... `<!-- @/blok -->` bloklaridan iborat; shablondagi
   `<!-- @include bolim/NOMI -->` o'rniga qo'yiladi (grid — bosh sahifa kartochkalari,
   admin — admin panel bloklari, modal — qalqib chiquvchi oyna).
4. Barcha fayllar klassik `<script>` — umumiy global ko'lamni bo'lishadi (modul emas).
   Bitta nomni ikki faylda `let`/`const` bilan e'lon qilish butun faylni sindiradi.

## Bo'limlar mustaqilligi (bir bo'lim buzilsa, qolganlari ishlaydi)

- Har bir bo'lim JS fayli **oxirida** `bolimRoyxatdan('<nomi>', { talab: [...], init() {...} })`
  chaqiradi. Fayl xato bilan yuklansa bu chaqiruv bo'lmaydi → bo'lim "ishlamayapti" deb belgilanadi,
  bosh sahifada ogohlantirish chiqadi, kartochkalari bloklanadi.
- `init()` — shu bo'limning `localStorage` ma'lumotlarini yuklaydi. `core.js → bolimlarniIshgaTushir()`
  ularni `try/catch` bilan, `BOLIM_INIT_TARTIBI` tartibida chaqiradi (Ofset Poligrafiyadan oldin).
- `talab`: **poligrafiya → ofset, sifravoy** (Bloknot/Papka/Kalendar/Doorhanger Ofset qog'oz bazasi va
  hisobidan foydalanadi). Baner/Orakal admin bazasi Suvenirdagi umumiy "model" boshqaruvini ishlatadi.
- `openCalc`, `calculate`, `openProductManager` xatodan himoyalangan (`mahsulotBolimiTekshir`,
  `calculateIchki`, `openProductManagerIchki`).
- `core.js`/`yordamchi.js` dan boshqa bo'lim o'zgaruvchisiga murojaat qilish kerak bo'lsa —
  `xavfsizOl(() => ..., zaxira)` yoki `typeof fn === 'function'` bilan o'rang.
- Bir nechta bo'lim ishlatadigan narsa (tiraj jadvali funksiyalari, `taxiNarxi` — yagona umumiy taxi narxi, klishe narxlari,
  `selectedPrintType`, `placeholderImg`, `convertBase64`) `umumiy/yordamchi.js` da turadi.

## Muhim biznes qoidalari

- **Ofset minimal tiraji** (`poligrafiyaMahsulotSozlama`, `POLI_DVIGATEL_TURLARI` — Flayer, Listovka, Buklet,
  Konvert, Otkritka): adad kam bo'lsa Ofset tugmasi `disabled`, hisob Raqamli pechatda. Admin → mahsulot →
  "⚙️ Mahsulot sozlamalari" (bichish o'lchami, qo'shimcha ishlov narxi ham shu yerda).
- **Paket** (`paketConfig`, `calculatePaket`) — FAQAT Karton: tur (A5–A2) → tayyor o'lcham (X bo'yi, Y eni, Z kengligi — majburiy).
  Bichish (1 tomon) = (X+Z+3)×(Y+Z+3) → Ofset (A3/A2/A1, eng arzon pechat). Bir xil dizayn: ofsetga 2×adad;
  har xil: adad, qog'oz/forma/pechat ×2 (zapasni `calculateOfsetForMachine` o'zi qo'shadi, +100). Laminatsiya,
  visochka (ofsetFinishingServices), lak, tisneniya — 2×adad bo'lak, mashina narxida. Yig'ish, lenta — har paketga.
  O'lcham tayyor ro'yxatda bo'lmasa — turning bir martalik pichoq narxi. Ma'lumot yetmasa `hisobYaroqsiz` → narx "—".
- **Kubarik** (`kubarikConfig`): Bloknot kabi — qog'oz Ofset A3 bazasidan, turlar (Oq/Rangli/Kleyli/Pechatli) admin tahrirlaydi.
- **Reklama maksimal chop eni** (`reklamaMaxEni`: baner 3.1, orakal/setka/tumanka 1.5 m): IKKALA tomon ham
  kattaroq bo'lsa ogohlantirish (aylantirib sig'sa — yo'q).
- **Taxi** — bitta umumiy `taxiNarxi`, har buyurtmaga bir marta, marja bilan. **Marja** — `marjaOl()`/`marjaQiymati()`
  (0% ham to'g'ri; kiritilgan qiymat mahsulotlar orasida eslab qolinadi).
- Admin panelda har qanday `save...` nomli tugma `admin-ux.js` tomonidan "saqlandi" deb hisoblanadi — yangi
  saqlash tugmasi nomini ham `save` bilan boshlang.

## Avto-push

`avto-push.ps1` — Windows vazifasi ("Xisoblovchi avto-push", har 10 daqiqa, `AVTO-SOZLASH.bat`). Faqat haqiqiy
o'zgarishni, fayllar 2 daqiqa tinch turgach, bitta ma'noli commit bilan yuklaydi; `avto-push.log` hech qachon commit
qilinmaydi. Katta ishni qo'lda, tushunarli xabar bilan commit qilish afzal.

## Yangi mahsulot qo'shish

1. `umumiy/core.js` → `allCategories` va `defaultPrices` ga kalit qo'shing.
2. Bosh sahifa kartochkasi → `bolimlar/<nomi>/<nomi>.html` dagi `grid` bloki.
3. Forma/hisob → `bolimlar/<nomi>/<nomi>.js`; kerak bo'lsa `core.js` dagi `generateForm()`/`calculateIchki()`
   tarqatuvchisiga shox qo'shing. Saqlanadigan sozlama bo'lsa — yuklashni o'sha bo'limning `init()` iga yozing.
4. HTML o'zgargan bo'lsa `yigish.bat`.

## Tekshirish

`python -m http.server 8000` (`.claude/launch.json` → `xisoblovchi-static`), brauzer konsolida xato yo'qligini
va bosh sahifada sariq ogohlantirish chiqmaganini tekshiring.
