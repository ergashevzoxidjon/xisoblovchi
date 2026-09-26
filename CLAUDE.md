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
  ishga-tushirish.js        ← oxirgi yuklanadi: init() ni chaqiradi
bolimlar/<nomi>/<nomi>.html|.css|.js
  poligrafiya  (Flayer, Listovka, Doorhanger, Buklet, Bloknot, Paket, Kalendar, Papka, Kubarik)
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
2. **JS/CSS o'zgarishi yig'ishni talab qilmaydi** — index.html ularga `<script src>`/`<link>` orqali havola qiladi.
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

## Yangi mahsulot qo'shish

1. `umumiy/core.js` → `allCategories` va `defaultPrices` ga kalit qo'shing.
2. Bosh sahifa kartochkasi → `bolimlar/<nomi>/<nomi>.html` dagi `grid` bloki.
3. Forma/hisob → `bolimlar/<nomi>/<nomi>.js`; kerak bo'lsa `core.js` dagi `generateForm()`/`calculateIchki()`
   tarqatuvchisiga shox qo'shing. Saqlanadigan sozlama bo'lsa — yuklashni o'sha bo'limning `init()` iga yozing.
4. HTML o'zgargan bo'lsa `yigish.bat`.

## Tekshirish

`python -m http.server 8000` (`.claude/launch.json` → `xisoblovchi-static`), brauzer konsolida xato yo'qligini
va bosh sahifada sariq ogohlantirish chiqmaganini tekshiring.
