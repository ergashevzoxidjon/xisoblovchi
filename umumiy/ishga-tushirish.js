// ====================== ISHGA TUSHIRISH ======================
// Bu fayl ENG OXIRIDA yuklanadi — barcha bo'lim fayllari (muvaffaqiyatli yoki xato bilan)
// yuklanib bo'lgandan keyin tizimni ishga tushiradi. Qaysi bo'lim ro'yxatdan o'tmagan bo'lsa,
// init() uni o'tkazib yuboradi va bosh sahifada ogohlantirish ko'rsatadi.
//
// Avval saqlangan katta (siqilmagan) rasmlar bo'lsa, ular init() dan OLDIN siqiladi —
// aks holda bo'limlar eski katta rasmlarni xotiraga yuklab, keyingi saqlashda yana
// "exceeded the quota" xatosiga uchraydi. Siqadigan narsa bo'lmasa init() darhol ishlaydi.
(function () {
    let siqish = null;
    try { siqish = saqlanganRasmlarniSiqish(); } catch (e) { siqish = null; }
    if (siqish) {
        siqish.catch(e => console.error('[Xotira] Rasmlarni siqishda xato:', e)).then(() => init());
    } else {
        init();
    }
})();
