    let poligrafiyaSizeLabels = {
        flayer: "97x210mm",
        listovka: "148x210mm",
        doorhanger: "95x210mm",
        buklet: "210x297mm",
        bloknot: "105x148mm",
        paket: "250x350mm",
        kalendar: "297x420mm",
        papka: "220x310mm",
        kubarik: "90x90x90mm",
        konvert: "110x220mm",
        otkritka: "100x150mm"
    };

    let poligrafiyaSideTypes = {
        flayer: 1.6, listovka: 1.6, doorhanger: 1.6, buklet: 1.6, bloknot: 1.6,
        paket: 1.6, kalendar: 1.6, papka: 1.6, kubarik: 1.6, konvert: 1.6, otkritka: 1.6
    };

    // Bloknot narxi endi (deyarli) to'liq real ishlab chiqarish xarajatlaridan hisoblanadi:
    // usti/osti (Karton) va ichki varoqlar (Ofset 80gr) — Ofset bo'limidagi haqiqiy xom qog'oz/
    // forma/bosma narx bazasidan (calculateOfsetJobFixedSheets), qolgan qismlar (prujina,
    // yig'ish, laminatsiya, tisneniya, 3D lak, taxi) esa admin tomonidan kiritiladigan aniq
    // narxlar. "Adad pog'onasi" (qtyTiers) kabi sun'iy chegirma koeffitsienti endi yo'q —
    // chegirma real qog'oz/bosma narxining o'ziga (yuqori tirajda 1 donaga kamroq forma/bosma
    // to'g'ri kelishiga) allaqachon singdirilgan.
    let bloknotConfig = {
        sizes: [
            { key: 'a6', name: 'A6', label: '105x148mm',
              // a3Share — bitta bloknot uchun usti+osti (jami) 1 A3 listning necha ulushini
              // egallaydi: A6 = 1/4 (bitta A3 listga 4 ta bloknotning usti+ostisi joylashadi).
              a3Share: 0.25,
              coverGsm: 250,           // Usti/osti Karton grammaji (Ofset bo'limi bazasidan)
              // Ichki varoqlar: adad × innerMultiplier = kerakli barg (varoq) soni,
              // so'ng innerDivisor'ga bo'linadi (1 A3 list buklanib shuncha bargga aylanadi).
              innerMultiplier: 30, innerDivisor: 8,
              assemblyPrice: 1500,     // Yig'ish xarajati (majburiy, so'm/dona)
              // Prujina joyi: mijoz tanlaydi, narxi o'lcham bo'yicha farqlanadi
              spring: [
                  { key: 'top',  name: 'Yuqoridan', price: 300, isDefault: true  },
                  { key: 'side', name: 'Yonidan',   price: 500, isDefault: false }
              ],
              isDefault: true },
            { key: 'a5', name: 'A5', label: '148x210mm',
              a3Share: 0.5, coverGsm: 250,
              innerMultiplier: 40, innerDivisor: 4,
              assemblyPrice: 2000,
              spring: [
                  { key: 'top',  name: 'Yuqoridan', price: 500, isDefault: true  },
                  { key: 'side', name: 'Yonidan',   price: 800, isDefault: false }
              ],
              isDefault: false },
            { key: 'a4', name: 'A4', label: '210x297mm',
              a3Share: 1.0, coverGsm: 250,
              innerMultiplier: 50, innerDivisor: 2,
              assemblyPrice: 2500,
              spring: [
                  { key: 'top',  name: 'Yuqoridan', price: 800,  isDefault: true  },
                  { key: 'side', name: 'Yonidan',   price: 1500, isDefault: false }
              ],
              isDefault: false }
        ],
        // Ichki varoqlar uchun har bir tirajga (buyurtmaga) bir marta qo'shiladigan zapas A3 list
        innerReserveSheets: 100,
        // Laminatsiya — MAJBURIY (mijoz/menejer tanlamaydi), A3 list bo'yicha pog'onali hisob.
        // A3 listlar soni = adad × o'lchamning a3Share'i (usti/osti bilan bir xil sheet asosida).
        laminatsiya: {
            firstPackSheets: 1000,     // birinchi paket - necha A3 list
            firstPackPrice: 350000,    // birinchi paket narxi (minimal to'lov)
            nextSheetPrice: 500        // undan keyingi har bir A3 list
        },
        // Tisneniya: ixtiyoriy (checkbox), dona narxi + bir martalik klishe
        tisneniya: { pricePerUnit: 800, klishePrice: 50000 },
        // 3D lak: ixtiyoriy (checkbox), Tisneniyadan mustaqil — ikkalasi birga tanlanishi mumkin
        lak3d: { pricePerUnit: 1000, klishePrice: 50000 },
        // Taxi xarajati BU YERDA YO'Q — Bloknot ham "poligrafiya" toifasiga kiradi va umumiy
        // "🚕 Taxi" admin panelidan (umumiy taxiNarxi) avtomatik oladi
        // (calculate() ichida, barcha poligrafiyaKeys mahsulotlariga bir xil qo'llanadi).
        // Mijozga ma'lumot sifatida ko'rsatiladigan matn
        infoText: "Bloknot usti 250-300gr kartondan tayyorlanadi."
    };

    // Mijoz ekranida tanlangan qiymatlar.
    // extras.tisneniya va extras.lak3d — mustaqil checkbox'lar, ikkalasi birga tanlanishi mumkin.
    let bloknotSelected = {
        sizeIndex: 0,
        twoSide: false,
        springIndex: 0,
        extras: { tisneniya: false, lak3d: false }
    };

    // Har bir grammaj qatori endi o'zining qog'oz TURIGA (paperType: Ofset/Melovka/Karton/
    // Dizayn qog'ozi) ham ega — chunki bir xil gsm qiymati bir nechta qog'oz turida bo'lishi
    // mumkin (masalan Melovka 250gr VA Karton 250gr), va admin qaysi birini nazarda tutayotgani
    // aniq bo'lishi kerak (avval faqat gsm bo'yicha, turini aniqlamasdan qidirilar edi).
    let poligrafiyaGsmDatabase = {
        flayer: [
            { gsm: 115, paperType: 'Melovka', isDefault: false },
            { gsm: 130, paperType: 'Melovka', isDefault: true },
            { gsm: 150, paperType: 'Melovka', isDefault: false },
            { gsm: 170, paperType: 'Melovka', isDefault: false }
        ],
        listovka: [
            { gsm: 115, paperType: 'Melovka', isDefault: false },
            { gsm: 130, paperType: 'Melovka', isDefault: true },
            { gsm: 150, paperType: 'Melovka', isDefault: false },
            { gsm: 170, paperType: 'Melovka', isDefault: false }
        ],
        buklet: [
            { gsm: 150, paperType: 'Melovka', isDefault: false },
            { gsm: 170, paperType: 'Melovka', isDefault: true },
            { gsm: 200, paperType: 'Melovka', isDefault: false },
            { gsm: 300, paperType: 'Melovka', isDefault: false }
        ],
        doorhanger: [
            { gsm: 250, paperType: 'Karton', isDefault: false },
            { gsm: 300, paperType: 'Karton', isDefault: true },
            { gsm: 350, paperType: 'Karton', isDefault: false },
            { gsm: 400, paperType: 'Karton', isDefault: false }
        ]
        // Konvert va Otkritka — alohida dvigatel (varaqliConfig), qog'ozi Qog'oz bo'limidan
    };
    const POLIGRAFIYA_PAPER_TYPES = ['Ofset', 'Melovka', 'Karton', "Dizayn qog'ozi"];
    let selectedPoligrafiyaGsmIndex = -1;

    // Menejer tanlagan pechat usuli ('ofset' | 'raqamli') va bosma tomoni (1 yoki 2) —
    // narx shu tanlovga qarab Ofset Pechat / Raqamli Pechat bo'limlaridagi haqiqiy
    // qog'oz bazasidan hisoblanadi (pastda calculateResult_poligrafiya ichida).
    let selectedPoligrafiyaEngine = 'ofset';
    let selectedPoligrafiyaSides = 2;

    // ====================== OFSET/RAQAMLI TANLANADIGAN MAHSULOTLAR SOZLAMASI ======================
    // Flayer, Listovka, Buklet, Konvert, Otkritka — umumiy dvigatel (qog'oz grammaji + Ofset yoki
    // Raqamli pechat). Har biri uchun admin belgilaydi:
    //   ofsetMinTiraj  — ofsetda hisoblash uchun eng kam adad. Kiritilgan adad undan kam bo'lsa,
    //                    Ofset tugmasi o'chadi va hisob avtomatik Raqamli (Sifravoy) pechatda bo'ladi.
    //   yoyilganOlcham — bichish (yoyilgan) o'lchami, masalan Konvert 110x220 → 230x330mm.
    //                    Bo'sh bo'lsa, tayyor o'lcham (poligrafiyaSizeLabels) bo'yicha hisoblanadi.
    //   ishlovNomi/ishlovNarxi — qo'shimcha ishlov (vyrubka+skleyka, bigovka), so'm/dona, marjasiz.
    const POLI_DVIGATEL_TURLARI = ['flayer', 'listovka', 'buklet'];
    let poligrafiyaMahsulotSozlama = {
        flayer:   { ofsetMinTiraj: 1000, yoyilganOlcham: '', ishlovNomi: '', ishlovNarxi: 0 },
        listovka: { ofsetMinTiraj: 1000, yoyilganOlcham: '', ishlovNomi: '', ishlovNarxi: 0 },
        buklet:   { ofsetMinTiraj: 1000, yoyilganOlcham: '', ishlovNomi: 'Bigovka (buklash)', ishlovNarxi: 0 }
    };

    function poliSozlama(type) {
        return poligrafiyaMahsulotSozlama[type] || { ofsetMinTiraj: 0, yoyilganOlcham: '', ishlovNomi: '', ishlovNarxi: 0 };
    }

    function renderAdminPoligrafiyaGsmTable() {
        let grid = document.getElementById('adminPoligrafiyaGsmTableBody');
        if (!grid) return;
        let list = poligrafiyaGsmDatabase[currentManagingProduct] || [];

        if (list.length === 0) {
            grid.innerHTML = `<div class="poli-gsm-empty">Hozircha grammaj kiritilmagan. Kiritilgan grammajlar Ofset/Raqamli Pechat bo'limidagi qog'oz bazasi bilan solishtirib narxlanadi.</div>`;
            return;
        }

        grid.innerHTML = list.map((g, index) => `
            <div class="poli-gsm-card ${g.isDefault ? 'is-default' : ''}">
                <button class="poli-gsm-delete" title="O'chirish" onclick="deletePoligrafiyaGsmRow(${index})">✕</button>
                <label class="poli-gsm-default-toggle">
                    <input type="radio" name="polgsm_default" id="polgsm_default_${index}" ${g.isDefault ? 'checked' : ''}>
                    <span>${g.isDefault ? '★ Standart' : '☆ Standart qilish'}</span>
                </label>
                <div class="poli-gsm-field">
                    <label>Qog'oz turi</label>
                    <select id="polgsm_type_${index}" class="poli-gsm-type-select" data-ptype="${g.paperType || 'Melovka'}" onchange="this.dataset.ptype = this.value;">
                        ${POLIGRAFIYA_PAPER_TYPES.map(t => `<option value="${t}" ${((g.paperType || 'Melovka') === t) ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div class="poli-gsm-field">
                    <label>Grammaj</label>
                    <div class="poli-gsm-input-wrap">
                        <input type="number" id="polgsm_gsm_${index}" value="${g.gsm}">
                        <span>gr</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ---- Admin: mahsulot sozlamalari (o'lcham, ofset minimal tiraji, qo'shimcha ishlov) ----
    function renderAdminPoliMahsulotSozlama() {
        let card = document.getElementById('poliMahsulotSozlamaCard');
        if (!card) return;
        let key = currentManagingProduct;
        let dvigatelli = POLI_DVIGATEL_TURLARI.includes(key);
        card.style.display = dvigatelli ? 'block' : 'none';
        if (!dvigatelli) return;
        let s = poliSozlama(key);
        let q = id => document.getElementById(id);
        q('poliSozTayyorOlcham').value = poligrafiyaSizeLabels[key] || '';
        q('poliSozYoyilganOlcham').value = s.yoyilganOlcham || '';
        q('poliSozOfsetMin').value = s.ofsetMinTiraj || 0;
        q('poliSozIshlovNomi').value = s.ishlovNomi || '';
        q('poliSozIshlovNarxi').value = s.ishlovNarxi || 0;
    }

    function saveAdminPoliMahsulotSozlama() {
        let key = currentManagingProduct;
        if (!POLI_DVIGATEL_TURLARI.includes(key)) return;
        let q = id => document.getElementById(id);
        let tayyor = q('poliSozTayyorOlcham').value.trim();
        let yoyilgan = q('poliSozYoyilganOlcham').value.trim();
        if (!parsePoligrafiyaSizeLabel(tayyor)) {
            showToast("⚠️ Tayyor o'lchamni \"97x210mm\" ko'rinishida kiriting!");
            return;
        }
        if (yoyilgan && !parsePoligrafiyaSizeLabel(yoyilgan)) {
            showToast("⚠️ Bichish o'lchamini \"230x330mm\" ko'rinishida kiriting yoki bo'sh qoldiring!");
            return;
        }
        poligrafiyaSizeLabels[key] = tayyor;
        poligrafiyaMahsulotSozlama[key] = {
            ofsetMinTiraj: Math.max(0, parseInt(q('poliSozOfsetMin').value) || 0),
            yoyilganOlcham: yoyilgan,
            ishlovNomi: q('poliSozIshlovNomi').value.trim(),
            ishlovNarxi: Math.max(0, parseFloat(q('poliSozIshlovNarxi').value) || 0)
        };
        localStorage.setItem('erp_poligrafiya_size_labels', JSON.stringify(poligrafiyaSizeLabels));
        localStorage.setItem('erp_poligrafiya_mahsulot_sozlama', JSON.stringify(poligrafiyaMahsulotSozlama));
        let m = poligrafiyaMahsulotSozlama[key];
        if (typeof logAudit === 'function') logAudit("Poligrafiya mahsulot sozlamasi o'zgartirildi",
            `${key}: ${tayyor}${yoyilgan ? ' (bichish ' + yoyilgan + ')' : ''}, ofset min ${m.ofsetMinTiraj} dona, ${m.ishlovNomi || 'ishlov'} ${m.ishlovNarxi} so'm`);
        showToast("💾 Mahsulot sozlamalari saqlandi!");
    }

    function addPoligrafiyaGsmRow() {
        if (!currentManagingProduct) return;
        if (!poligrafiyaGsmDatabase[currentManagingProduct]) poligrafiyaGsmDatabase[currentManagingProduct] = [];
        let list = poligrafiyaGsmDatabase[currentManagingProduct];
        // Doorhanger kabi kartonli mahsulotlarda yangi qator ham Karton bilan boshlansin —
        // qolganlarida Melovka eng ko'p ishlatiladigan standart tur.
        let defaultType = (list.length > 0 && list[list.length - 1].paperType) ? list[list.length - 1].paperType : 'Melovka';
        list.push({ gsm: 130, paperType: defaultType, isDefault: list.length === 0 });
        renderAdminPoligrafiyaGsmTable();
    }

    function deletePoligrafiyaGsmRow(index) {
        let list = poligrafiyaGsmDatabase[currentManagingProduct] || [];
        if (!list[index]) return;
        if (confirm("Ushbu grammajni o'chirmoqchimisiz?")) {
            let wasDefault = list[index].isDefault;
            list.splice(index, 1);
            if (wasDefault && list.length > 0) list[0].isDefault = true;
            renderAdminPoligrafiyaGsmTable();
        }
    }

    function saveAllPoligrafiyaGsm() {
        if (!currentManagingProduct) return;
        let list = poligrafiyaGsmDatabase[currentManagingProduct] || [];
        let updated = [];
        for (let index = 0; index < list.length; index++) {
            let gsmInput = document.getElementById(`polgsm_gsm_${index}`);
            if (!gsmInput) continue;
            let typeInput = document.getElementById(`polgsm_type_${index}`);
            let defaultInput = document.getElementById(`polgsm_default_${index}`);
            updated.push({
                gsm: parseInt(gsmInput.value) || 0,
                paperType: typeInput ? typeInput.value : 'Melovka',
                isDefault: defaultInput.checked
            });
        }
        if (updated.length > 0 && !updated.some(g => g.isDefault)) updated[0].isDefault = true;

        poligrafiyaGsmDatabase[currentManagingProduct] = updated;
        localStorage.setItem('erp_poligrafiya_gsm_db', JSON.stringify(poligrafiyaGsmDatabase));
        if (typeof logAudit === 'function') logAudit("Poligrafiya grammajlari o'zgartirildi", `Mahsulot: ${currentManagingProduct}, ${updated.length} ta grammaj`);
        renderAdminPoligrafiyaGsmTable();
        showToast("💾 Grammajlar saqlandi!");
    }

    function renderPoligrafiyaGsmOptions(gsmList) {
        const group = document.getElementById('poligrafiyaGsmGroup');
        if (!group) return;
        // Bir xil gsm bir nechta qog'oz turida bo'lishi mumkin (masalan Melovka 250gr va
        // Karton 250gr) — shuning uchun tur nomi ham kartochkada ko'rsatiladi.
        group.innerHTML = gsmList.map((g, idx) => `
            <div class="poli-paper-option ${idx === selectedPoligrafiyaGsmIndex ? 'active' : ''}" onclick="selectPoligrafiyaGsm(${idx})">
                <div style="font-size:0.68rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.02em;">${g.paperType || 'Melovka'}</div>
                <div class="poli-paper-gsm">${g.gsm}<small>gr</small></div>
            </div>
        `).join('');
    }

    // ====================== BLOKNOT: MIJOZ EKRANI ======================

    function buildBloknotForm() {
        // standart qiymatlarni tiklaymiz
        let defSize = bloknotConfig.sizes.findIndex(s => s.isDefault);
        let sizeIdx = defSize >= 0 ? defSize : 0;
        let size = bloknotConfig.sizes[sizeIdx];
        let defSpring = (size?.spring || []).findIndex(s => s.isDefault);
        bloknotSelected = {
            sizeIndex: sizeIdx,
            twoSide: false,
            springIndex: defSpring >= 0 ? defSpring : 0,
            extras: { tisneniya: false, lak3d: false }
        };

        return `
            <div class="step-title">Bloknot o'lchami:</div>
            <div class="options-group" id="bloknotSizeGroup"></div>

            <div class="step-title" style="margin-top:16px;">Ichki varoqlar pechati:</div>
            <div class="options-group" id="bloknotSideGroup"></div>

            <div class="step-title" style="margin-top:16px;">Prujina joyi:</div>
            <div class="options-group" id="bloknotSpringGroup"></div>

            <div class="step-title" style="margin-top:16px;">Qo'shimcha ishlovlar:</div>
            <div class="options-group" id="bloknotExtraGroup"></div>

            <div class="form-group" style="margin-top:16px;">
                <label>Adad (dona):</label>
                <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate(); updateBloknotInfo();">
            </div>
        `;
    }

    function renderBloknotOptions() {
        const sizeGroup = document.getElementById('bloknotSizeGroup');
        if (!sizeGroup) return;

        let size = bloknotConfig.sizes[bloknotSelected.sizeIndex] || bloknotConfig.sizes[0];

        sizeGroup.innerHTML = bloknotConfig.sizes.map((s, idx) => `
            <button class="opt-btn ${idx === bloknotSelected.sizeIndex ? 'active' : ''}"
                    onclick="selectBloknotSize(${idx})">${s.name}</button>
        `).join('');

        document.getElementById('bloknotSideGroup').innerHTML = `
            <button class="opt-btn ${!bloknotSelected.twoSide ? 'active' : ''}"
                    onclick="selectBloknotSide(false)">Bir tomonlama</button>
            <button class="opt-btn ${bloknotSelected.twoSide ? 'active' : ''}"
                    onclick="selectBloknotSide(true)">Ikki tomonlama</button>
        `;

        document.getElementById('bloknotSpringGroup').innerHTML = (size.spring || []).map((s, idx) => `
            <button class="opt-btn ${idx === bloknotSelected.springIndex ? 'active' : ''}"
                    onclick="selectBloknotSpring(${idx})">${s.name}</button>
        `).join('');

        // Tisneniya va 3D lak mustaqil — ikkalasi ham birga yoqilishi mumkin
        document.getElementById('bloknotExtraGroup').innerHTML = `
            <button class="opt-btn ${bloknotSelected.extras.tisneniya ? 'active' : ''}"
                    onclick="toggleBloknotExtra('tisneniya')">🔨 Tisneniya</button>
            <button class="opt-btn ${bloknotSelected.extras.lak3d ? 'active' : ''}"
                    onclick="toggleBloknotExtra('lak3d')">✨ 3D lak</button>
        `;

        updateBloknotInfo();
    }

    function updateBloknotInfo() {
        const box = document.getElementById('bloknotInfoText');
        if (!box) return;
        let s = bloknotConfig.sizes[bloknotSelected.sizeIndex] || bloknotConfig.sizes[0];
        let qatorlar = [];
        if (bloknotConfig.infoText) qatorlar.push(bloknotConfig.infoText);
        qatorlar.push(`<b>${s.name}</b> o'lchami: ${s.label}`);

        let qty = Math.max(parseInt(document.getElementById('inpQuantity')?.value) || 0, 0);

        if (qty > 0) {
            let totalLeaves = qty * (s.innerMultiplier || 0);
            let innerSheets = Math.ceil(totalLeaves / (s.innerDivisor || 1)) + (bloknotConfig.innerReserveSheets || 0);
            qatorlar.push(`Ichki varoqlar: <b>${totalLeaves.toLocaleString('ru-RU')} ta barg</b> → ${innerSheets.toLocaleString('ru-RU')} ta A3 list (${bloknotConfig.innerReserveSheets || 0} zapas bilan)`);

            let a3 = qty * (s.a3Share || 0);
            let jami = bloknotLaminatsiyaTotal(qty, s.a3Share);
            let L = bloknotConfig.laminatsiya;
            let izoh = a3 <= (L.firstPackSheets ?? 1000)
                ? `birinchi paket (${L.firstPackSheets} listgacha)`
                : `${L.firstPackSheets} list + ${(a3 - L.firstPackSheets).toLocaleString('ru-RU')} ta qo'shimcha`;
            qatorlar.push(
                `Laminatsiya (majburiy): <b>${a3.toLocaleString('ru-RU')} ta A3 list</b> → ` +
                `<b>${jami.toLocaleString('ru-RU')} so'm</b> <span style="color:var(--text-muted)">(${izoh})</span>`
            );
        }

        if (bloknotSelected.extras.tisneniya && bloknotConfig.tisneniya.klishePrice > 0) {
            qatorlar.push(`Tisneniya klishesi: <b>${bloknotConfig.tisneniya.klishePrice.toLocaleString('ru-RU')} so'm</b> (bir martalik, adadga bo'linadi)`);
        }
        if (bloknotSelected.extras.lak3d && bloknotConfig.lak3d.klishePrice > 0) {
            qatorlar.push(`3D lak klishesi: <b>${bloknotConfig.lak3d.klishePrice.toLocaleString('ru-RU')} so'm</b> (bir martalik, adadga bo'linadi)`);
        }

        box.innerHTML = qatorlar.join('<br>');
    }

    function selectBloknotSize(idx) {
        bloknotSelected.sizeIndex = idx;
        let size = bloknotConfig.sizes[idx];
        let defSpring = (size?.spring || []).findIndex(s => s.isDefault);
        bloknotSelected.springIndex = defSpring >= 0 ? defSpring : 0;
        renderBloknotOptions();
        calculate();
    }

    function selectBloknotSide(twoSide) {
        bloknotSelected.twoSide = twoSide;
        renderBloknotOptions();
        calculate();
    }

    function selectBloknotSpring(idx) {
        bloknotSelected.springIndex = idx;
        renderBloknotOptions();
        calculate();
    }

    // Tisneniya va 3D lak mustaqil checkbox — ikkalasi ham birga yoqilishi mumkin
    function toggleBloknotExtra(key) {
        bloknotSelected.extras[key] = !bloknotSelected.extras[key];
        renderBloknotOptions();
        calculate();
    }

    // ====================== BLOKNOT: SOZLAMA MIGRATSIYASI ======================
    // Eski tuzilmadagi saqlangan sozlamalarni yangisiga o'tkazadi,
    // shunda foydalanuvchi kiritgan narxlar yo'qolmaydi.

    function migrateBloknotConfig(saqlangan, standart) {
        let cfg = { ...standart };

        // --- o'lchamlar ---
        // Eski tuzilmada usti/ichki narxlari to'g'ridan-to'g'ri admin tomonidan kiritilar edi
        // (coverPrice/innerOnePrice/innerTwoPrice). Yangi modelda bu narxlar Ofset bo'limining
        // haqiqiy qog'oz bazasidan hisoblanadi — shu sabab eski dona-narxlari endi mos kelmaydi
        // va ko'chirilmaydi. Faqat geometriyaga bog'liq (a3Share, nomi, o'lchami) va — bo'lsa —
        // allaqachon yangi maydonlar (coverGsm, innerMultiplier/Divisor, assemblyPrice, spring)
        // saqlanadi.
        if (Array.isArray(saqlangan.sizes) && saqlangan.sizes.length > 0) {
            cfg.sizes = saqlangan.sizes.map((s, i) => {
                let standartOlcham = standart.sizes.find(d => d.name === s.name) || standart.sizes[i] || standart.sizes[0];

                let a3 = s.a3Share;
                if (a3 === undefined) {
                    let nom = (s.name || '').toUpperCase();
                    a3 = nom === 'A4' ? 1.0 : nom === 'A5' ? 0.5 : nom === 'A6' ? 0.25
                       : (standartOlcham.a3Share ?? 0.5);
                }

                // Eski global `spring` (bloknotConfig.spring) bo'lsa — uni shu o'lchamning
                // boshlang'ich prujina narxi sifatida ko'chiramiz (admin keyin har bir
                // o'lcham uchun alohida sozlashi kerak bo'ladi).
                let spring = Array.isArray(s.spring) && s.spring.length > 0
                    ? s.spring.map((sp, j) => ({
                        key: sp.key || ('p' + j),
                        name: sp.name || (standartOlcham.spring[j]?.name) || `Variant ${j + 1}`,
                        price: sp.price ?? (standartOlcham.spring[j]?.price ?? 0),
                        isDefault: !!sp.isDefault
                      }))
                    : (Array.isArray(saqlangan.spring) && saqlangan.spring.length > 0
                        ? saqlangan.spring.map((sp, j) => ({
                            key: sp.key || ('p' + j),
                            name: sp.name || (standartOlcham.spring[j]?.name) || `Variant ${j + 1}`,
                            price: sp.price ?? 0,
                            isDefault: !!sp.isDefault
                          }))
                        : standartOlcham.spring.map(sp => ({ ...sp })));
                if (!spring.some(sp => sp.isDefault)) spring[0].isDefault = true;

                return {
                    key: s.key || ('s' + i),
                    name: s.name || standartOlcham.name,
                    label: s.label || standartOlcham.label,
                    a3Share: a3,
                    coverGsm: s.coverGsm ?? standartOlcham.coverGsm,
                    innerMultiplier: s.innerMultiplier ?? standartOlcham.innerMultiplier,
                    innerDivisor: s.innerDivisor ?? standartOlcham.innerDivisor,
                    assemblyPrice: s.assemblyPrice ?? standartOlcham.assemblyPrice,
                    spring,
                    isDefault: !!s.isDefault
                };
            });
            if (!cfg.sizes.some(s => s.isDefault)) cfg.sizes[0].isDefault = true;
        }

        if (typeof saqlangan.innerReserveSheets === 'number') cfg.innerReserveSheets = saqlangan.innerReserveSheets;

        // --- laminatsiya: eski "lak" (A3 pog'onali) endi majburiy "laminatsiya" ---
        cfg.laminatsiya = { ...standart.laminatsiya };
        if (saqlangan.laminatsiya && saqlangan.laminatsiya.firstPackSheets !== undefined) {
            cfg.laminatsiya = { ...cfg.laminatsiya, ...saqlangan.laminatsiya };
        } else if (saqlangan.lak && saqlangan.lak.firstPackSheets !== undefined) {
            cfg.laminatsiya = { ...cfg.laminatsiya, ...saqlangan.lak };
        }

        // --- tisneniya / 3D lak ---
        // (taxiFee endi ko'chirilmaydi — eski saqlangan qiymat bo'lsa ham e'tiborga
        // olinmaydi, chunki Taxi endi umumiy "🚕 Taxi xarajatlari" panelidan olinadi.)
        cfg.tisneniya = { ...standart.tisneniya, ...(saqlangan.tisneniya || {}) };
        cfg.lak3d = { ...standart.lak3d, ...(saqlangan.lak3d || {}) };

        // --- ma'lumot matni ---
        if (typeof saqlangan.infoText === 'string') cfg.infoText = saqlangan.infoText;

        return cfg;
    }

    // ====================== BLOKNOT: ADMIN PANEL ======================

    function renderAdminBloknotTables() {
        // --- o'lchamlar jadvali ---
        let tb = document.getElementById('adminBloknotSizeTableBody');
        if (tb) {
            if (bloknotConfig.sizes.length === 0) {
                tb.innerHTML = `<tr><td colspan="11" style="text-align:center; color: var(--text-muted); padding:20px;">O'lcham kiritilmagan.</td></tr>`;
            } else {
                tb.innerHTML = bloknotConfig.sizes.map((s, idx) => {
                    let top = (s.spring && s.spring[0]) || { price: 0 };
                    let side = (s.spring && s.spring[1]) || { price: 0 };
                    return `
                    <tr>
                        <td><input type="text" class="bl-size-name" value="${s.name}" style="width:100%;"></td>
                        <td><input type="text" class="bl-size-label" value="${s.label}" style="width:100%;"></td>
                        <td><input type="number" min="0" step="0.05" class="bl-size-a3" value="${s.a3Share}" style="width:100%;" oninput="updateBloknotLamPreview()"></td>
                        <td><input type="number" min="0" class="bl-size-covergsm" value="${s.coverGsm}" style="width:100%;"></td>
                        <td><input type="number" min="0" class="bl-size-innermult" value="${s.innerMultiplier}" style="width:100%;"></td>
                        <td><input type="number" min="1" class="bl-size-innerdiv" value="${s.innerDivisor}" style="width:100%;"></td>
                        <td><input type="number" min="0" class="bl-size-assembly" value="${s.assemblyPrice}" style="width:100%;"></td>
                        <td><input type="number" min="0" class="bl-size-springtop" value="${top.price}" style="width:100%;"></td>
                        <td><input type="number" min="0" class="bl-size-springside" value="${side.price}" style="width:100%;"></td>
                        <td style="text-align:center;">
                            <input type="radio" name="blSizeDefault" class="bl-size-default" ${s.isDefault ? 'checked' : ''}>
                        </td>
                        <td style="text-align:right;">
                            <button class="btn btn-sm btn-danger" onclick="deleteBloknotSize(${idx})">🗑</button>
                        </td>
                    </tr>`;
                }).join('');
            }
        }

        // --- boshqa maydonlar ---
        let q = (id) => document.getElementById(id);
        if (q('bloknotInnerReserveSheets')) q('bloknotInnerReserveSheets').value = bloknotConfig.innerReserveSheets;
        if (q('bloknotLamFirstSheets'))  q('bloknotLamFirstSheets').value  = bloknotConfig.laminatsiya.firstPackSheets;
        if (q('bloknotLamFirstPrice'))   q('bloknotLamFirstPrice').value   = bloknotConfig.laminatsiya.firstPackPrice;
        if (q('bloknotLamNextPrice'))    q('bloknotLamNextPrice').value    = bloknotConfig.laminatsiya.nextSheetPrice;
        if (q('bloknotTisneniyaPrice'))  q('bloknotTisneniyaPrice').value  = bloknotConfig.tisneniya.pricePerUnit;
        if (q('bloknotKlishePrice'))     q('bloknotKlishePrice').value     = bloknotConfig.tisneniya.klishePrice;
        if (q('bloknotLak3dPrice'))      q('bloknotLak3dPrice').value      = bloknotConfig.lak3d.pricePerUnit;
        if (q('bloknotLak3dKlishePrice'))q('bloknotLak3dKlishePrice').value = bloknotConfig.lak3d.klishePrice;
        if (q('bloknotInfoTextInput'))   q('bloknotInfoTextInput').value   = bloknotConfig.infoText || '';

        ['bloknotLamFirstSheets','bloknotLamFirstPrice','bloknotLamNextPrice'].forEach(id => {
            let el = q(id);
            if (el) el.oninput = updateBloknotLamPreview;
        });
        updateBloknotLamPreview();
    }

    // Admin panelda laminatsiya formulasini namuna bilan ko'rsatadi
    function updateBloknotLamPreview() {
        let box = document.getElementById('bloknotLamPreview');
        if (!box) return;

        let son = (id, d) => { let v = parseFloat(document.getElementById(id)?.value); return isNaN(v) ? d : v; };
        let birinchiList = son('bloknotLamFirstSheets', 1000);
        let birinchiNarx = son('bloknotLamFirstPrice', 350000);
        let keyingiNarx  = son('bloknotLamNextPrice', 500);

        // birinchi o'lchamning A3 ulushi bilan namuna
        let a3El = document.querySelector('.bl-size-a3');
        let a3Ulush = a3El ? (parseFloat(a3El.value) || 1) : 1;

        let namuna = [1000, 3000];
        let qatorlar = namuna.map(qty => {
            let a3 = qty * a3Ulush;
            let jami = a3 <= birinchiList ? birinchiNarx : birinchiNarx + (a3 - birinchiList) * keyingiNarx;
            return `${qty} dona → ${a3.toLocaleString('ru-RU')} A3 → ${jami.toLocaleString('ru-RU')} so'm`;
        });
        box.innerHTML = qatorlar.join('<br>') +
            `<div style="color:var(--text-muted); margin-top:4px;">(1-o'lcham, A3 ulushi ${a3Ulush})</div>`;
    }

    function addBloknotSizeRow() {
        collectBloknotTablesFromUI();
        bloknotConfig.sizes.push({
            key: 'yangi' + Date.now(), name: 'A5', label: '148x210mm',
            a3Share: 0.5, coverGsm: 250, innerMultiplier: 40, innerDivisor: 4, assemblyPrice: 2000,
            spring: [
                { key: 'top', name: 'Yuqoridan', price: 0, isDefault: true },
                { key: 'side', name: 'Yonidan', price: 0, isDefault: false }
            ],
            isDefault: false
        });
        renderAdminBloknotTables();
    }

    function deleteBloknotSize(idx) {
        if (bloknotConfig.sizes.length <= 1) {
            showToast("⚠️ Kamida bitta o'lcham qolishi kerak!");
            return;
        }
        if (!confirm("Ushbu o'lchamni o'chirmoqchimisiz?")) return;
        collectBloknotTablesFromUI();
        let ediStandart = bloknotConfig.sizes[idx].isDefault;
        bloknotConfig.sizes.splice(idx, 1);
        if (ediStandart && bloknotConfig.sizes.length > 0) bloknotConfig.sizes[0].isDefault = true;
        renderAdminBloknotTables();
    }

    // jadvaldagi kiritilgan qiymatlarni obyektga yig'adi
    function collectBloknotTablesFromUI() {
        let nomlar = document.querySelectorAll('.bl-size-name');
        if (nomlar.length > 0) {
            let labels     = document.querySelectorAll('.bl-size-label');
            let a3s        = document.querySelectorAll('.bl-size-a3');
            let coverGsms  = document.querySelectorAll('.bl-size-covergsm');
            let innerMults = document.querySelectorAll('.bl-size-innermult');
            let innerDivs  = document.querySelectorAll('.bl-size-innerdiv');
            let assemblies = document.querySelectorAll('.bl-size-assembly');
            let springTops = document.querySelectorAll('.bl-size-springtop');
            let springSides= document.querySelectorAll('.bl-size-springside');
            let defaults   = document.querySelectorAll('.bl-size-default');
            let yangi = [];
            nomlar.forEach((el, i) => {
                let oldSpring = bloknotConfig.sizes[i]?.spring || [];
                yangi.push({
                    key: bloknotConfig.sizes[i]?.key || ('s' + i),
                    name: (el.value || '').trim() || `O'lcham ${i + 1}`,
                    label: (labels[i]?.value || '').trim(),
                    a3Share: parseFloat(a3s[i]?.value) || 0,
                    coverGsm: parseFloat(coverGsms[i]?.value) || 0,
                    innerMultiplier: parseFloat(innerMults[i]?.value) || 0,
                    innerDivisor: Math.max(1, parseFloat(innerDivs[i]?.value) || 1),
                    assemblyPrice: parseFloat(assemblies[i]?.value) || 0,
                    spring: [
                        { key: oldSpring[0]?.key || 'top', name: oldSpring[0]?.name || 'Yuqoridan', price: parseFloat(springTops[i]?.value) || 0, isDefault: oldSpring[0]?.isDefault !== false },
                        { key: oldSpring[1]?.key || 'side', name: oldSpring[1]?.name || 'Yonidan', price: parseFloat(springSides[i]?.value) || 0, isDefault: oldSpring[1]?.isDefault === true }
                    ],
                    isDefault: defaults[i]?.checked || false
                });
            });
            if (yangi.length > 0 && !yangi.some(s => s.isDefault)) yangi[0].isDefault = true;
            bloknotConfig.sizes = yangi;
        }
    }

    function saveBloknotConfig() {
        collectBloknotTablesFromUI();

        let son = (id, standart) => {
            let v = parseFloat(document.getElementById(id)?.value);
            return isNaN(v) || v < 0 ? standart : v;
        };

        bloknotConfig.innerReserveSheets        = Math.max(0, son('bloknotInnerReserveSheets', 100));
        bloknotConfig.laminatsiya.firstPackSheets = Math.max(1, son('bloknotLamFirstSheets', 1000));
        bloknotConfig.laminatsiya.firstPackPrice  = son('bloknotLamFirstPrice', 0);
        bloknotConfig.laminatsiya.nextSheetPrice  = son('bloknotLamNextPrice', 0);
        bloknotConfig.tisneniya.pricePerUnit    = son('bloknotTisneniyaPrice', 0);
        bloknotConfig.tisneniya.klishePrice     = son('bloknotKlishePrice', 0);
        bloknotConfig.lak3d.pricePerUnit        = son('bloknotLak3dPrice', 0);
        bloknotConfig.lak3d.klishePrice         = son('bloknotLak3dKlishePrice', 0);
        bloknotConfig.infoText = (document.getElementById('bloknotInfoTextInput')?.value || '').trim();

        // asosiy o'lcham yorlig'ini ham yangilaymiz
        let std = bloknotConfig.sizes.find(s => s.isDefault) || bloknotConfig.sizes[0];
        if (std && std.label) poligrafiyaSizeLabels.bloknot = std.label;

        localStorage.setItem('erp_bloknot_config', JSON.stringify(bloknotConfig));
        if (typeof logAudit === 'function') logAudit("Bloknot sozlamalari o'zgartirildi", "O'lchamlar, narxlar yoki qo'shimcha sozlamalar yangilandi");
        renderAdminBloknotTables();
        showToast("💾 Bloknot sozlamalari saqlandi!");
    }

    // ====================== BLOKNOT: HISOB-KITOB ======================

    // Laminatsiya umumiy summasi — A3 listlar soni bo'yicha pog'onali hisob (MAJBURIY qism)
    function bloknotLaminatsiyaTotal(qty, a3Share) {
        let L = bloknotConfig.laminatsiya || {};
        let birinchiList = L.firstPackSheets ?? 1000;
        let birinchiNarx = L.firstPackPrice ?? 0;
        let keyingiNarx  = L.nextSheetPrice ?? 0;

        let a3Soni = qty * (a3Share || 0);
        if (a3Soni <= birinchiList) return birinchiNarx;          // minimal to'lov
        return birinchiNarx + (a3Soni - birinchiList) * keyingiNarx;
    }

    // Usti + osti (Karton, Ofset A3): 1 A3 listga size.a3Share ulushida bitta bloknotning
    // usti+ostisi to'g'ri keladi (masalan A6 = 1/4, ya'ni 1 A3 listga 4 ta to'plam).
    // Bitta bosqichda (side=1) forma/pechat qilinadi — usti va osti bitta A3 varoqda birga
    // joylashtirilib bosiladi.
    function calculateBloknotCover(qty, size) {
        let workingSheetsNeeded = Math.ceil(qty * (size.a3Share || 0));
        return calculateOfsetJobFixedSheets('A3', qty, 1, 'Karton', size.coverGsm, workingSheetsNeeded, false);
    }

    // Ichki varoqlar (Ofset 80gr, A3): adad × innerMultiplier = kerakli barg soni, so'ng
    // innerDivisor'ga bo'linib (1 A3 list buklanib shuncha bargga aylanadi) kerakli A3 list
    // soni topiladi, va har bir tirajga bir marta innerReserveSheets qo'shiladi. Ikki tomonlama
    // tanlansa — old/orqa sahifalar matni har xil bo'lgani uchun har doim CHUJOY (alohida
    // forma/bosma).
    function calculateBloknotInner(qty, size, twoSide) {
        let totalLeaves = qty * (size.innerMultiplier || 0);
        let workingSheetsNeeded = Math.ceil(totalLeaves / (size.innerDivisor || 1)) + (bloknotConfig.innerReserveSheets || 0);
        let side = twoSide ? 2 : 1;
        return calculateOfsetJobFixedSheets('A3', qty, side, 'Ofset', 80, workingSheetsNeeded, twoSide);
    }

    function calculateBloknot(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let size = bloknotConfig.sizes[bloknotSelected.sizeIndex] || bloknotConfig.sizes[0];
        let spring = (size.spring && size.spring[bloknotSelected.springIndex]) || (size.spring && size.spring[0]) || { name: '', price: 0 };

        let unit = 0;
        let costItems = [];
        let qismlar = [`Bloknot ${size.name} (${size.label})`];

        // 1) Usti + osti (Karton, Ofset A3)
        let coverResult = calculateBloknotCover(qty, size);
        if (coverResult) {
            unit += coverResult.perPieceCostRaw;
            costItems.push({ label: `Usti/osti qog'ozi (Karton ${size.coverGsm}gr, ${coverResult.rawName})`, qty: `${coverResult.totalSheets} xom varoq`, total: Math.round(coverResult.totalPaperCost) });
            costItems.push({ label: 'Usti/osti forma (klishe)', qty: `${coverResult.totalPlates} plastina`, total: Math.round(coverResult.totalPlateCost) });
            costItems.push({ label: 'Usti/osti bosma (pechat)', qty: `${coverResult.totalWorkingSheets} ta A3 varoq`, total: Math.round(coverResult.totalPrintCost) });
        } else {
            qismlar.push(`⚠️ Karton ${size.coverGsm}gr uchun Ofset A3 bazasi topilmadi`);
        }

        // 2) Ichki varoqlar (Ofset 80gr, A3)
        let innerResult = calculateBloknotInner(qty, size, bloknotSelected.twoSide);
        if (innerResult) {
            unit += innerResult.perPieceCostRaw;
            costItems.push({ label: `Ichki varoq qog'ozi (Ofset 80gr, ${innerResult.rawName})`, qty: `${innerResult.totalSheets} xom varoq`, total: Math.round(innerResult.totalPaperCost) });
            costItems.push({ label: 'Ichki varoq forma (klishe)', qty: `${innerResult.totalPlates} plastina`, total: Math.round(innerResult.totalPlateCost) });
            costItems.push({ label: 'Ichki varoq bosma (pechat)', qty: `${innerResult.totalWorkingSheets} ta A3 varoq`, total: Math.round(innerResult.totalPrintCost) });
        } else {
            qismlar.push('⚠️ Ofset 80gr uchun A3 bazasi topilmadi');
        }
        qismlar.push(bloknotSelected.twoSide ? 'ichki 2 tomonlama' : 'ichki 1 tomonlama');

        // 3) Prujina joyi narxi (o'lcham bo'yicha)
        unit += (spring.price || 0);
        qismlar.push(`prujina ${(spring.name || '').toLowerCase()}`);
        costItems.push({ label: `Prujina (${spring.name})`, qty: `${qty} dona`, total: Math.round((spring.price || 0) * qty) });

        // 4) Yig'ish xarajati (majburiy, o'lcham bo'yicha)
        unit += (size.assemblyPrice || 0);
        costItems.push({ label: "Yig'ish", qty: `${qty} dona`, total: Math.round((size.assemblyPrice || 0) * qty) });

        // 5) Laminatsiya (majburiy, A3 list bo'yicha pog'onali)
        let lamJami = bloknotLaminatsiyaTotal(qty, size.a3Share);
        if (lamJami > 0) {
            unit += lamJami / qty;
            costItems.push({ label: 'Laminatsiya', qty: `${Math.ceil(qty * (size.a3Share || 0))} A3 list`, total: Math.round(lamJami) });
        }

        // 6) Tisneniya (ixtiyoriy, checkbox)
        if (bloknotSelected.extras.tisneniya) {
            let klishe = bloknotConfig.tisneniya.klishePrice || 0;
            unit += (bloknotConfig.tisneniya.pricePerUnit || 0) + (klishe / qty);
            qismlar.push('tisneniya');
            costItems.push({ label: 'Tisneniya', qty: `${qty} dona`, total: Math.round((bloknotConfig.tisneniya.pricePerUnit || 0) * qty + klishe) });
        }

        // 7) 3D lak (ixtiyoriy, checkbox — Tisneniyadan mustaqil)
        if (bloknotSelected.extras.lak3d) {
            let klishe = bloknotConfig.lak3d.klishePrice || 0;
            unit += (bloknotConfig.lak3d.pricePerUnit || 0) + (klishe / qty);
            qismlar.push('3D lak');
            costItems.push({ label: '3D lak', qty: `${qty} dona`, total: Math.round((bloknotConfig.lak3d.pricePerUnit || 0) * qty + klishe) });
        }

        // Taxi xarajati bu yerda qo'shilmaydi — umumiy "🚕 Taxi xarajatlari" (poligrafiya)
        // mexanizmi orqali calculate() ichida avtomatik qo'shiladi (barcha poligrafiya
        // mahsulotlariga bir xil, bloknot uchun alohida emas).

        return { unitPrice: unit, details: qismlar.join(' | '), costItems };
    }

    // ====================== KONVERT VA OTKRITKA (varaqli mahsulotlar — umumiy dvigatel) ======================
    // Ikkalasi bir xil hisoblanadi, farqi faqat sozlamada:
    //   1) Tur (admin kiritgan tayyor o'lcham) tanlanadi yoki menejer eni × bo'yini o'zi kiritadi.
    //      Tayyor turning bichish (yoyilgan) o'lchami admin tomonidan aniq kiritiladi; o'z o'lchamida
    //      bichish = (eni + qoshEni) × (bo'yi × boyiKarra + qoshBoyi) va (Konvertda) bir martalik pichoq.
    //   2) Qog'oz — Qog'oz bo'limidagi ro'yxatdan (varaq formati + narxi). Bichim varaqqa joylashtiriladi
    //      (aylantirib ham), varaq soni = ceil(adad / varaqdagi dona) + zapas.
    //   3) Pechat (Sifravoy yoki UF) — turning tiraj oraliqlari bo'yicha dona narxi (admin kiritadi).
    //   4) Konvert: Tisneniya (ixtiyoriy) — umumiy Pardozlash xizmatlari (A3 qatori): dona + klishe.
    //      Otkritka: pardozlash — Oddiy / 3D lak / 3D Tilla-Kumush folga (dona narxi), ikki tomonlama pechat.
    const VARAQLI_TURLAR = ['konvert']; // Otkritka — alohida modul (otkritkaConfig)
    const VARAQLI_PECHAT_NOMI = { sifravoy: 'Sifravoy pechat', uf: 'UF pechat', yoq: 'Pechatsiz' };

    let varaqliConfig = {
        konvert: {
            pichoqNarxi: 500000,   // o'z (nostandart) o'lcham uchun bir martalik pichoq
            zapasVaraq: 10,        // tirajga bir marta qo'shiladigan zapas varaq
            formula: { qoshEni: 30, boyiKarra: 2, qoshBoyi: 50 },
            pechatTurlari: ['sifravoy', 'uf'], // menejer bittasini tanlaydi
            pechatsizMumkin: true, // faqat tisneniya bo'lishi mumkin
            tisneniya: true,
            ikkiTomon: false,
            pardozlar: [],
            turlar: [
                { key: 'evro', nomi: 'Evro', eni: 220, boyi: 110, bichishEni: 230, bichishBoyi: 330,
                  tierlar: [{ dan: 1, sifravoy: 1500, uf: 2500 }, { dan: 100, sifravoy: 1000, uf: 1800 }, { dan: 500, sifravoy: 700, uf: 1300 }, { dan: 1000, sifravoy: 500, uf: 1000 }] },
                { key: 'c6', nomi: 'C6', eni: 162, boyi: 114, bichishEni: 180, bichishBoyi: 260,
                  tierlar: [{ dan: 1, sifravoy: 1300, uf: 2200 }, { dan: 100, sifravoy: 900, uf: 1600 }, { dan: 500, sifravoy: 600, uf: 1100 }, { dan: 1000, sifravoy: 450, uf: 900 }] },
                { key: 'c5', nomi: 'C5', eni: 229, boyi: 162, bichishEni: 250, bichishBoyi: 370,
                  tierlar: [{ dan: 1, sifravoy: 1800, uf: 2800 }, { dan: 100, sifravoy: 1200, uf: 2000 }, { dan: 500, sifravoy: 850, uf: 1500 }, { dan: 1000, sifravoy: 650, uf: 1200 }] },
                { key: 'c4', nomi: 'C4', eni: 324, boyi: 229, bichishEni: 350, bichishBoyi: 500,
                  tierlar: [{ dan: 1, sifravoy: 2500, uf: 3500 }, { dan: 100, sifravoy: 1700, uf: 2600 }, { dan: 500, sifravoy: 1200, uf: 2000 }, { dan: 1000, sifravoy: 950, uf: 1600 }] }
            ]
        }
    };

    let varaqliSelected = { tur: '', qogozId: '', pechat: 'sifravoy', tisneniya: false, pardoz: 'oddiy', ikkiTomon: false };

    function varaqliCfg(type) { return varaqliConfig[type]; }
    function varaqliTuri(type, key) {
        let c = varaqliCfg(type);
        return (c.turlar || []).find(t => t.key === key) || (c.turlar || [])[0] || null;
    }
    function varaqliQogozlar(type) {
        // Qog'oz bo'limi ishlamasa ham kalkulyator yiqilmasin — bo'sh ro'yxat qaytadi
        return xavfsizOl(() => qogozRoyxati(type), []);
    }
    function varaqliOlcham() {
        let v = id => parseFloat(document.getElementById(id)?.value) || 0;
        return { eni: v('vmEni'), boyi: v('vmBoyi') };
    }

    function buildVaraqliForm(type) {
        let c = varaqliCfg(type);
        let t = (c.turlar || [])[0];
        let qog = varaqliQogozlar(type)[0];
        let pechatTurlari = c.pechatTurlari || ['sifravoy', 'uf'];
        varaqliSelected = { tur: t ? t.key : '', qogozId: qog ? qog.id : '', pechat: pechatTurlari[0], tisneniya: false, pardoz: 'oddiy', ikkiTomon: false };
        return `
            <div class="poli-calc">
                <div class="step-title">1. Turi <span class="paket-step-hint">(bosing — o'lcham avtomatik qo'yiladi; boshqa o'lcham kerak bo'lsa o'zingiz kiriting)</span></div>
                <div class="options-group" id="vmTurGroup"></div>
                <div class="paket-olcham-row" style="grid-template-columns: 1fr 1fr;">
                    <div class="form-group">
                        <label>Eni <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="vmEni" min="1" value="${t ? t.eni : ''}" oninput="renderVaraqliTurChips('${type}'); calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Bo'yi <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="vmBoyi" min="1" value="${t ? t.boyi : ''}" oninput="renderVaraqliTurChips('${type}'); calculate()"><span>mm</span></div>
                    </div>
                </div>
                <div id="vmInfo" class="paket-bichish-info"></div>

                <div class="step-title">2. Qog'oz</div>
                <div class="options-group" id="vmQogozGroup"></div>

                <div class="step-title">3. Pechat${pechatTurlari.length === 1 ? ` <span class="paket-step-hint">(${VARAQLI_PECHAT_NOMI[pechatTurlari[0]]})</span>` : ''}</div>
                <div class="options-group" id="vmPechatGroup"></div>

                <div class="step-title">4. Qo'shimcha</div>
                <div class="options-group" id="vmQoshimchaGroup"></div>

                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="500" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function renderVaraqliTurChips(type) {
        let group = document.getElementById('vmTurGroup');
        if (!group) return;
        let { eni, boyi } = varaqliOlcham();
        group.innerHTML = (varaqliCfg(type).turlar || []).map(t => {
            let mos = t.key === varaqliSelected.tur && t.eni === eni && t.boyi === boyi;
            return `<button type="button" class="opt-btn ${mos ? 'active' : ''}" onclick="selectVaraqliTur('${type}', '${t.key}')">${t.nomi}</button>`;
        }).join('') || `<span class="paket-step-hint">Tur kiritilmagan — o'lchamni qo'lda kiriting.</span>`;
    }

    function renderVaraqliOptions(type) {
        let c = varaqliCfg(type);
        renderVaraqliTurChips(type);
        let qogozlar = varaqliQogozlar(type);
        document.getElementById('vmQogozGroup').innerHTML = qogozlar.length === 0
            ? `<span class="paket-xato">⚠️ Qog'oz kiritilmagan — Admin panel → Qog'oz bo'limi</span>`
            : qogozlar.map(q => `
                <button type="button" class="opt-btn ${q.id === varaqliSelected.qogozId ? 'active' : ''}" onclick="selectVaraqli('qogozId', '${q.id}', '${type}')">${q.nomi} · ${q.format}</button>
            `).join('');
        // Pechat turi faqat bir nechta bo'lsa tanlanadi (Otkritka — faqat Sifravoy, tanlovsiz);
        // bir/ikki tomonlama ham shu "Pechat" qadamida.
        let pechatlar = (c.pechatTurlari || ['sifravoy', 'uf']).concat(c.pechatsizMumkin ? ['yoq'] : []);
        if (!pechatlar.includes(varaqliSelected.pechat)) varaqliSelected.pechat = pechatlar[0];
        let pechatHtml = pechatlar.length > 1 ? pechatlar.map(p => `
            <button type="button" class="opt-btn ${varaqliSelected.pechat === p ? 'active' : ''}" onclick="selectVaraqli('pechat', '${p}', '${type}')">${VARAQLI_PECHAT_NOMI[p]}</button>
        `).join('') : '';
        if (c.ikkiTomon) {
            pechatHtml += `<button type="button" class="opt-btn ${!varaqliSelected.ikkiTomon ? 'active' : ''}" onclick="selectVaraqli('ikkiTomon', false, '${type}')">Bir tomonlama</button>`
                + `<button type="button" class="opt-btn ${varaqliSelected.ikkiTomon ? 'active' : ''}" onclick="selectVaraqli('ikkiTomon', true, '${type}')">Ikki tomonlama</button>`;
        }
        document.getElementById('vmPechatGroup').innerHTML = pechatHtml;
        let qosh = [];
        if (c.tisneniya) {
            qosh.push(`<button type="button" class="opt-btn ${varaqliSelected.tisneniya ? 'active' : ''}" onclick="selectVaraqli('tisneniya', ${!varaqliSelected.tisneniya}, '${type}')">🔨 Tisneniya</button>`);
        }
        let pardozHtml = (c.pardozlar || []).length ? `
            <div class="vm-pardoz-group">${c.pardozlar.map(p => `
                <button type="button" class="opt-btn ${varaqliSelected.pardoz === p.key ? 'active' : ''}" onclick="selectVaraqli('pardoz', '${p.key}', '${type}')">${p.nomi}</button>`).join('')}
            </div>` : '';
        document.getElementById('vmQoshimchaGroup').innerHTML = qosh.join('') + pardozHtml;
    }

    function selectVaraqliTur(type, key) {
        let t = varaqliTuri(type, key);
        if (!t) return;
        varaqliSelected.tur = t.key;
        // Tanlangan qog'ozga bu turning bichimi sig'masa — birinchi sig'adigan qog'ozga o'tamiz
        let sigadi = q => q && calculateOfsetGridFitting((q.eni || 0) - 10, (q.boyi || 0) - 10, t.bichishEni, t.bichishBoyi).count > 0;
        let qogozlar = varaqliQogozlar(type);
        if (!sigadi(qogozlar.find(q => q.id === varaqliSelected.qogozId))) {
            let mos = qogozlar.find(sigadi);
            if (mos) varaqliSelected.qogozId = mos.id;
        }
        document.getElementById('vmEni').value = t.eni;
        document.getElementById('vmBoyi').value = t.boyi;
        renderVaraqliOptions(type);
        calculate();
    }

    function selectVaraqli(field, value, type) {
        varaqliSelected[field] = value;
        renderVaraqliOptions(type);
        calculate();
    }

    // Tiraj bo'yicha dona narxi: adaddan kichik yoki teng eng katta "dan" qatori
    function varaqliTierNarxi(tur, qty, pechat) {
        let list = (tur.tierlar || []).slice().sort((a, b) => a.dan - b.dan);
        if (list.length === 0) return 0;
        let mos = list[0];
        list.forEach(t => { if (qty >= t.dan) mos = t; });
        return parseFloat(mos[pechat]) || 0;
    }

    function calculateVaraqli(type, qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let c = varaqliCfg(type);
        let nomi = type === 'konvert' ? 'Konvert' : 'Otkritka';
        let info = html => { let el = document.getElementById('vmInfo'); if (el) el.innerHTML = html; };
        let yaroqsiz = (xabar) => {
            info(`<div class="paket-xato">⚠️ ${xabar}</div>`);
            return { unitPrice: 0, details: `⚠️ ${xabar}`, costItems: [], hisobYaroqsiz: true };
        };

        let tur = varaqliTuri(type, varaqliSelected.tur);
        let { eni, boyi } = varaqliOlcham();
        if (!(eni > 0 && boyi > 0)) return yaroqsiz("Eni va bo'yini kiriting — ikkalasi ham majburiy.");

        // Bichish o'lchami: tayyor turga aynan mos bo'lsa — admin kiritgan, aks holda formula
        let tayyor = tur && tur.eni === eni && tur.boyi === boyi;
        let f = c.formula || { qoshEni: 0, boyiKarra: 1, qoshBoyi: 0 };
        let bEni = tayyor ? tur.bichishEni : eni + (parseFloat(f.qoshEni) || 0);
        let bBoyi = tayyor ? tur.bichishBoyi : boyi * (parseFloat(f.boyiKarra) || 1) + (parseFloat(f.qoshBoyi) || 0);
        let pichoq = (!tayyor && (parseFloat(c.pichoqNarxi) || 0) > 0) ? parseFloat(c.pichoqNarxi) : 0;
        // Narx oraliqlari: tanlangan (yoki eng yaqin) turdan
        let narxTuri = tur || (c.turlar || [])[0];
        if (!narxTuri) return yaroqsiz("Admin panelda birorta tur kiritilmagan.");

        let qogoz = varaqliQogozlar(type).find(q => q.id === varaqliSelected.qogozId) || varaqliQogozlar(type)[0];
        if (!qogoz) return yaroqsiz("Qog'oz kiritilmagan — Admin panel → Qog'oz bo'limi.");

        let fit = calculateOfsetGridFitting((qogoz.eni || 0) - 10, (qogoz.boyi || 0) - 10, bEni, bBoyi);
        if (!fit || fit.count <= 0) return yaroqsiz(`Bichim ${bEni}×${bBoyi} mm "${qogoz.nomi} ${qogoz.format}" (${qogoz.eni}×${qogoz.boyi}) varag'iga sig'maydi — boshqa qog'oz tanlang.`);

        let costItems = [];
        let jami = 0;
        let qosh = (label, soni, summa) => { jami += summa; costItems.push({ label, qty: soni, total: Math.round(summa) }); };

        // 1) Qog'oz
        let varaq = Math.ceil(qty / fit.count) + (parseInt(c.zapasVaraq) || 0);
        qosh(`Qog'oz (${qogoz.nomi}, ${qogoz.format} ${qogoz.eni}×${qogoz.boyi})`, `${varaq} varaq (1 varaqda ${fit.count} dona)`, varaq * (parseFloat(qogoz.narx) || 0));

        // 2) Pechat — tiraj bo'yicha dona narxi
        let pechat = varaqliSelected.pechat;
        if (pechat !== 'yoq') {
            let tomon = (c.ikkiTomon && varaqliSelected.ikkiTomon) ? 2 : 1;
            let dona = varaqliTierNarxi(narxTuri, qty, pechat);
            qosh(`${VARAQLI_PECHAT_NOMI[pechat]}${tomon === 2 ? ' (ikki tomonlama)' : ''}`, `${qty} dona × ${dona.toLocaleString()}${tomon === 2 ? ' × 2' : ''}`, dona * qty * tomon);
        }

        // 3) Konvert: Tisneniya — umumiy Pardozlash xizmatlari (A3)
        if (c.tisneniya && varaqliSelected.tisneniya) {
            let tis = ofsetFinishingServices.tisneniya.a3 || {};
            qosh('Tisneniya', `${qty} dona`, (parseFloat(tis.pricePerUnit) || 0) * qty);
            qosh('Tisneniya klishesi (bir martalik)', '1 marta', parseFloat(tis.klishePrice) || 0);
        }

        // 4) Otkritka: pardozlash (Oddiy / 3D lak / folga)
        let pardoz = (c.pardozlar || []).find(p => p.key === varaqliSelected.pardoz);
        if (pardoz && (parseFloat(pardoz.narx) || 0) > 0) qosh(pardoz.nomi, `${qty} dona`, (parseFloat(pardoz.narx) || 0) * qty);

        // 5) Nostandart o'lcham — bir martalik pichoq
        if (pichoq > 0) qosh(`Pichoq yasatish (bir martalik)`, '1 marta', pichoq);

        info(`
            <div>📐 Bichim: <b>${bEni}×${bBoyi} mm</b> → ${qogoz.format} varaqqa <b>${fit.count} dona</b> · ${varaq} varaq (zapas bilan)</div>
            ${tayyor ? `<div class="paket-pichoq-bor">✓ Tayyor tur: ${tur.nomi}</div>`
                : (pichoq > 0 ? `<div class="paket-pichoq">✂️ Nostandart o'lcham — bir martalik pichoq: <b>${pichoq.toLocaleString()} so'm</b> qo'shildi (narx oraliqlari: ${narxTuri.nomi})</div>`
                              : `<div class="paket-step-hint">O'z o'lchami (narx oraliqlari: ${narxTuri.nomi})</div>`)}
        `);

        let qismlar = [`${nomi} ${tayyor ? tur.nomi + ' ' : ''}${eni}×${boyi}mm (bichim ${bEni}×${bBoyi})`, qogoz.nomi, VARAQLI_PECHAT_NOMI[pechat]];
        if (c.ikkiTomon && varaqliSelected.ikkiTomon && pechat !== 'yoq') qismlar.push('ikki tomonlama');
        if (c.tisneniya && varaqliSelected.tisneniya) qismlar.push('tisneniya');
        if (pardoz && pardoz.key !== 'oddiy') qismlar.push(pardoz.nomi);
        if (pichoq > 0) qismlar.push('pichoq (bir martalik)');
        return { unitPrice: jami / qty, details: qismlar.join(' | '), costItems };
    }

    // ---- Admin: Konvert / Otkritka (bitta umumiy blok, currentManagingProduct bo'yicha) ----
    function renderAdminVaraqli() {
        let type = currentManagingProduct;
        let c = varaqliCfg(type);
        let q = id => document.getElementById(id);
        if (!c || !q('vmAdminTurlar')) return;
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        q('vmAdminSarlavha').textContent = type === 'konvert' ? '✉️ Konvert turlari va pechat narxlari' : '💌 Otkritka turlari va pechat narxlari';
        let ufBor = (c.pechatTurlari || ['sifravoy', 'uf']).includes('uf'); // Otkritka — faqat Sifravoy

        q('vmAdminTurlar').innerHTML = (c.turlar || []).map((t, ti) => `
            <div class="vm-admin-tur">
                <div class="vm-admin-tur-head">
                    <input type="text" id="vmT_nomi_${ti}" value="${esc(t.nomi)}" placeholder="Tur nomi" class="vm-admin-tur-nomi">
                    <button type="button" class="btn btn-danger" style="height:32px; padding:0 10px;" title="Turni o'chirish" onclick="deleteVaraqliTur(${ti})">✕</button>
                </div>
                <div class="vm-admin-olcham">
                    <label>Tayyor o'lcham</label>
                    <div class="input-unit"><input type="number" id="vmT_eni_${ti}" value="${t.eni}" min="1"><span>eni</span></div>
                    <div class="input-unit"><input type="number" id="vmT_boyi_${ti}" value="${t.boyi}" min="1"><span>bo'yi</span></div>
                    <label>Bichim (yoyilgan)</label>
                    <div class="input-unit"><input type="number" id="vmT_beni_${ti}" value="${t.bichishEni}" min="1"><span>eni</span></div>
                    <div class="input-unit"><input type="number" id="vmT_bboyi_${ti}" value="${t.bichishBoyi}" min="1"><span>bo'yi</span></div>
                </div>
                <table class="admin-table vm-tier-table">
                    <thead><tr><th>Adad (dan)</th><th>Sifravoy (so'm/dona)</th>${ufBor ? `<th>UF (so'm/dona)</th>` : ''}<th></th></tr></thead>
                    <tbody>${(t.tierlar || []).map((r, ri) => `
                        <tr>
                            <td><input type="number" id="vmT_${ti}_dan_${ri}" value="${r.dan}" min="1"></td>
                            <td><input type="number" id="vmT_${ti}_sif_${ri}" value="${r.sifravoy}" min="0"></td>
                            ${ufBor ? `<td><input type="number" id="vmT_${ti}_uf_${ri}" value="${r.uf}" min="0"></td>` : ''}
                            <td style="text-align:right;"><button type="button" class="btn btn-outline" style="height:30px; padding:0 8px;" title="Qatorni o'chirish" onclick="deleteVaraqliTier(${ti}, ${ri})">✕</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
                <button type="button" class="btn btn-outline" style="height:32px; font-size:0.78rem; margin-top:6px;" onclick="addVaraqliTier(${ti})">+ Tiraj oralig'i</button>
            </div>
        `).join('');

        q('vmAdminPichoqGroup').style.display = type === 'konvert' ? '' : 'none';
        q('vmAdminPichoq').value = c.pichoqNarxi || 0;
        q('vmAdminZapas').value = c.zapasVaraq || 0;
        q('vmAdminQoshEni').value = c.formula.qoshEni;
        q('vmAdminBoyiKarra').value = c.formula.boyiKarra;
        q('vmAdminQoshBoyi').value = c.formula.qoshBoyi;
        q('vmAdminPardozCard').style.display = (c.pardozlar || []).length ? '' : 'none';
        q('vmAdminPardozlar').innerHTML = (c.pardozlar || []).map((p, pi) => `
            <div class="form-group">
                <label>${esc(p.nomi)}</label>
                <div class="input-unit"><input type="number" id="vmP_${pi}" value="${p.narx || 0}" min="0" ${p.key === 'oddiy' ? 'disabled' : ''}><span>so'm/dona</span></div>
            </div>
        `).join('');
        q('vmAdminTisIzoh').style.display = c.tisneniya ? '' : 'none';
    }

    function collectVaraqliFromUI() {
        let type = currentManagingProduct;
        let c = varaqliCfg(type);
        let q = id => document.getElementById(id);
        if (!c || !q('vmAdminTurlar')) return;
        let son = (id, min) => Math.max(min || 0, parseFloat(q(id)?.value) || 0);
        c.turlar = (c.turlar || []).map((t, ti) => q(`vmT_nomi_${ti}`) ? {
            key: t.key,
            nomi: q(`vmT_nomi_${ti}`).value.trim() || `Tur ${ti + 1}`,
            eni: son(`vmT_eni_${ti}`), boyi: son(`vmT_boyi_${ti}`),
            bichishEni: son(`vmT_beni_${ti}`), bichishBoyi: son(`vmT_bboyi_${ti}`),
            tierlar: (t.tierlar || []).map((r, ri) => q(`vmT_${ti}_dan_${ri}`) ? {
                dan: son(`vmT_${ti}_dan_${ri}`, 1), sifravoy: son(`vmT_${ti}_sif_${ri}`),
                uf: q(`vmT_${ti}_uf_${ri}`) ? son(`vmT_${ti}_uf_${ri}`) : (r.uf || 0)
            } : r)
        } : t);
        c.pichoqNarxi = son('vmAdminPichoq');
        c.zapasVaraq = son('vmAdminZapas');
        c.formula = { qoshEni: son('vmAdminQoshEni'), boyiKarra: son('vmAdminBoyiKarra', 1) || 1, qoshBoyi: son('vmAdminQoshBoyi') };
        (c.pardozlar || []).forEach((p, pi) => { if (q(`vmP_${pi}`) && p.key !== 'oddiy') p.narx = son(`vmP_${pi}`); });
    }

    function addVaraqliTur() {
        collectVaraqliFromUI();
        let c = varaqliCfg(currentManagingProduct);
        let oxirgi = c.turlar.slice(-1)[0];
        c.turlar.push({ key: 't' + Date.now().toString(36), nomi: 'Yangi tur', eni: 100, boyi: 150, bichishEni: 100, bichishBoyi: 150,
            tierlar: oxirgi ? JSON.parse(JSON.stringify(oxirgi.tierlar)) : [{ dan: 1, sifravoy: 0, uf: 0 }] });
        renderAdminVaraqli();
    }

    function deleteVaraqliTur(ti) {
        collectVaraqliFromUI();
        let c = varaqliCfg(currentManagingProduct);
        if (!c.turlar[ti] || !confirm(`"${c.turlar[ti].nomi}" turini o'chirasizmi?`)) return;
        c.turlar.splice(ti, 1);
        renderAdminVaraqli();
    }

    function addVaraqliTier(ti) {
        collectVaraqliFromUI();
        let t = varaqliCfg(currentManagingProduct).turlar[ti];
        if (!t) return;
        let oxirgi = (t.tierlar || []).slice(-1)[0] || { dan: 0, sifravoy: 0, uf: 0 };
        t.tierlar = (t.tierlar || []).concat([{ dan: (oxirgi.dan || 0) * 2 || 1, sifravoy: oxirgi.sifravoy, uf: oxirgi.uf }]);
        renderAdminVaraqli();
    }

    function deleteVaraqliTier(ti, ri) {
        collectVaraqliFromUI();
        let t = varaqliCfg(currentManagingProduct).turlar[ti];
        if (!t || t.tierlar.length <= 1) { showToast("⚠️ Kamida bitta tiraj oralig'i qolishi kerak."); return; }
        t.tierlar.splice(ri, 1);
        renderAdminVaraqli();
    }

    function saveVaraqliConfig() {
        collectVaraqliFromUI();
        let type = currentManagingProduct;
        let c = varaqliCfg(type);
        if (!c) return;
        if (c.turlar.some(t => !(t.eni > 0 && t.boyi > 0 && t.bichishEni > 0 && t.bichishBoyi > 0))) {
            showToast("⚠️ Har bir turning o'lchami va bichimi 0 dan katta bo'lishi kerak!");
            return;
        }
        c.turlar.forEach(t => { t.tierlar.sort((a, b) => a.dan - b.dan); });
        localStorage.setItem('erp_varaqli_config', JSON.stringify(varaqliConfig));
        if (typeof logAudit === 'function') logAudit(`${type === 'konvert' ? 'Konvert' : 'Otkritka'} sozlamalari o'zgartirildi`,
            c.turlar.map(t => `${t.nomi} ${t.eni}×${t.boyi} (${t.tierlar.length} oraliq)`).join('; '));
        renderAdminVaraqli();
        showToast("💾 Sozlamalar saqlandi!");
    }

    function migrateVaraqliConfig(saved, defaults) {
        let cfg = JSON.parse(JSON.stringify(defaults));
        if (!saved || typeof saved !== 'object') return cfg;
        VARAQLI_TURLAR.forEach(type => {
            let s = saved[type];
            if (!s || typeof s !== 'object') return;
            let d = cfg[type];
            if (Array.isArray(s.turlar)) d.turlar = s.turlar;
            ['pichoqNarxi', 'zapasVaraq'].forEach(k => { if (typeof s[k] === 'number') d[k] = s[k]; });
            if (s.formula && typeof s.formula === 'object') d.formula = { ...d.formula, ...s.formula };
            if (Array.isArray(s.pardozlar)) d.pardozlar = d.pardozlar.map(p => {
                let sp = s.pardozlar.find(x => x && x.key === p.key);
                return sp ? { ...p, narx: typeof sp.narx === 'number' ? sp.narx : p.narx } : p;
            });
        });
        return cfg;
    }

    // ====================== OTKRITKA ======================
    // Menejer YOYILGAN (bichim) o'lchamni kiritadi yoki turni bosadi (turning yoyilgan o'lchami qo'yiladi).
    // Otkritkaning O'Z qog'oz ro'yxati bor (Sifravoy pechat qog'ozlaridan alohida, admin kiritadi):
    //   varaq o'lchami, pechat maydoni, 1 tomonlama / 2 tomonlama varaq narxi (qog'oz + Sifravoy pechat).
    //   • ODDIY — shu ro'yxatdagi qog'ozlardan biri (Colotech / Lyon / Kvarts...).
    //   • 3D LAK / 3D TILLA-KUMUSH FOLGA — faqat Colotech 300gr, A2 Sifravoy (680×480) — `lakQogoz`,
    //     + lak/folga ishi — admin kiritgan tiraj oraliqlari bo'yicha, har varaqqa.
    //   Hisob (Sifravoy usuli): bichim varaqning pechat maydoniga joylashtiriladi, varaq × (1 yoki 2 tomon narx).
    //   + Laminatsiya (ixtiyoriy) — umumiy Pardozlash xizmatlari: SRA3 — A3, A2 varaq — A2 narxi, har varaqqa.
    //   + Turning qo'shimcha xizmati (admin kiritadi, so'm/dona) — har bir otkritkaga.
    const OTKRITKA_PARDOZ_NOMI = { oddiy: 'Oddiy', lak3d: '3D lak', folga: '3D Tilla-Kumush folga' };

    let otkritkaConfig = {
        zapasVaraq: 5,
        // Oddiy otkritka qog'ozlari — narx: bitta varaq, qog'oz + Sifravoy pechat
        qogozlar: [
            { id: 'okq1', name: 'Colotech 300g', q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 4500, price2: 5500 },
            { id: 'okq2', name: 'Lyon',          q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 8000, price2: 9500 },
            { id: 'okq3', name: 'Kvarts',        q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 8000, price2: 9500 }
        ],
        // 3D lak / folga qog'ozi — Colotech 300gr, A2 Sifravoy
        lakQogoz: { name: 'Colotech 300g A2', q_eni: 680, q_boyi: 480, p_eni: 670, p_boyi: 470, price1: 12000, price2: 15000 },
        // Faqat lak/folga ishi, so'm / A2 varaq; "dan" — varaq sonidan boshlab
        lakTierlar: [
            { dan: 1,   lak3d: 15000, folga: 20000 },
            { dan: 50,  lak3d: 11000, folga: 15000 },
            { dan: 200, lak3d: 8000,  folga: 11000 },
            { dan: 500, lak3d: 6000,  folga: 9000 }
        ],
        // eni/boyi — tayyor (buklangan) o'lcham, faqat ko'rsatish uchun; bichishEni/Boyi — yoyilgan o'lcham (hisob shu bo'yicha)
        turlar: [
            { key: 'o100', nomi: '100×150', eni: 100, boyi: 150, bichishEni: 100, bichishBoyi: 150, xizmatNomi: "Qo'shimcha xizmat", xizmatNarxi: 0 },
            { key: 'a6', nomi: 'A6 (105×148)', eni: 105, boyi: 148, bichishEni: 105, bichishBoyi: 148, xizmatNomi: "Qo'shimcha xizmat", xizmatNarxi: 0 },
            { key: 'evro', nomi: 'Evro (99×210)', eni: 99, boyi: 210, bichishEni: 99, bichishBoyi: 210, xizmatNomi: "Qo'shimcha xizmat", xizmatNarxi: 0 },
            { key: 'a5buk', nomi: 'A5 buklet (148×210)', eni: 148, boyi: 210, bichishEni: 296, bichishBoyi: 210, xizmatNomi: "Qo'shimcha xizmat", xizmatNarxi: 0 }
        ]
    };

    let otkritkaSelected = { tur: '', pardoz: 'oddiy', qogozId: '', ikkiTomon: false, laminatsiya: false };

    function otkritkaTuri(key) {
        return otkritkaConfig.turlar.find(t => t.key === key) || otkritkaConfig.turlar[0] || null;
    }
    function otkritkaOddiyQogozlar() { return otkritkaConfig.qogozlar || []; }
    function otkritkaLakQogozi() { return otkritkaConfig.lakQogoz || null; }

    function buildOtkritkaForm() {
        let t = otkritkaConfig.turlar[0];
        let q = otkritkaOddiyQogozlar()[0];
        otkritkaSelected = { tur: t ? t.key : '', pardoz: 'oddiy', qogozId: q ? q.id : '', ikkiTomon: false, laminatsiya: false };
        return `
            <div class="poli-calc">
                <div class="step-title">1. Turi <span class="paket-step-hint">(bosing — yoyilgan o'lchami qo'yiladi; boshqa o'lcham kerak bo'lsa o'zingiz kiriting)</span></div>
                <div class="options-group" id="okTurGroup"></div>
                <div class="paket-olcham-row" style="grid-template-columns: 1fr 1fr;">
                    <div class="form-group">
                        <label>Yoyilgan eni <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="okEni" min="1" value="${t ? t.bichishEni : ''}" oninput="renderOtkritkaOptions(); calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Yoyilgan bo'yi <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="okBoyi" min="1" value="${t ? t.bichishBoyi : ''}" oninput="renderOtkritkaOptions(); calculate()"><span>mm</span></div>
                    </div>
                </div>
                <div id="okInfo" class="paket-bichish-info"></div>

                <div class="step-title">2. Pardozlash</div>
                <div class="options-group" id="okPardozGroup"></div>

                <div class="step-title" id="okQogozSarlavha">3. Qog'oz</div>
                <div class="options-group" id="okQogozGroup"></div>

                <div class="step-title">4. Pechat <span class="paket-step-hint">(Sifravoy pechat)</span></div>
                <div class="options-group" id="okPechatGroup"></div>

                <div class="step-title">5. Qo'shimcha</div>
                <div class="options-group" id="okQoshimchaGroup"></div>

                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="300" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function otkritkaOlcham() {
        return { eni: parseFloat(document.getElementById('okEni')?.value) || 0, boyi: parseFloat(document.getElementById('okBoyi')?.value) || 0 };
    }

    function renderOtkritkaOptions() {
        let turGroup = document.getElementById('okTurGroup');
        if (!turGroup) return;
        let s = otkritkaSelected;
        let { eni, boyi } = otkritkaOlcham();
        turGroup.innerHTML = otkritkaConfig.turlar.map(t => `
            <button type="button" class="opt-btn ${t.key === s.tur && t.bichishEni === eni && t.bichishBoyi === boyi ? 'active' : ''}" onclick="selectOtkritkaTur('${t.key}')">${t.nomi}</button>
        `).join('') || `<span class="paket-step-hint">Tur kiritilmagan — yoyilgan o'lchamni qo'lda kiriting.</span>`;

        document.getElementById('okPardozGroup').innerHTML = Object.keys(OTKRITKA_PARDOZ_NOMI).map(k => `
            <button type="button" class="opt-btn ${s.pardoz === k ? 'active' : ''}" onclick="selectOtkritka('pardoz', '${k}')">${OTKRITKA_PARDOZ_NOMI[k]}</button>
        `).join('');

        let oddiy = s.pardoz === 'oddiy';
        document.getElementById('okQogozSarlavha').innerHTML = oddiy
            ? `3. Qog'oz`
            : `3. Qog'oz <span class="paket-step-hint">(3D lak va folga faqat Colotech 300gr, A2 Sifravoy pechatda)</span>`;
        if (oddiy) {
            let list = otkritkaOddiyQogozlar();
            document.getElementById('okQogozGroup').innerHTML = list.length === 0
                ? `<span class="paket-xato">⚠️ Otkritka qog'ozlari kiritilmagan — Admin → Otkritka</span>`
                : list.map(p => `<button type="button" class="opt-btn ${p.id === s.qogozId ? 'active' : ''}" onclick="selectOtkritka('qogozId', '${p.id}')">${p.name}</button>`).join('');
        } else {
            let lq = otkritkaLakQogozi();
            document.getElementById('okQogozGroup').innerHTML = lq
                ? `<button type="button" class="opt-btn active" style="pointer-events:none;">${lq.name} · ${lq.q_eni}×${lq.q_boyi}</button>`
                : `<span class="paket-xato">⚠️ Lak/folga qog'ozi kiritilmagan — Admin → Otkritka</span>`;
        }

        document.getElementById('okPechatGroup').innerHTML = `
            <button type="button" class="opt-btn ${!s.ikkiTomon ? 'active' : ''}" onclick="selectOtkritka('ikkiTomon', false)">Bir tomonlama</button>
            <button type="button" class="opt-btn ${s.ikkiTomon ? 'active' : ''}" onclick="selectOtkritka('ikkiTomon', true)">Ikki tomonlama</button>`;

        document.getElementById('okQoshimchaGroup').innerHTML = `
            <button type="button" class="opt-btn ${s.laminatsiya ? 'active' : ''}" onclick="selectOtkritka('laminatsiya', ${!s.laminatsiya})">🧴 Laminatsiya</button>
        `;
    }

    function selectOtkritkaTur(key) {
        let t = otkritkaTuri(key);
        if (!t) return;
        otkritkaSelected.tur = t.key;
        document.getElementById('okEni').value = t.bichishEni;
        document.getElementById('okBoyi').value = t.bichishBoyi;
        renderOtkritkaOptions();
        calculate();
    }

    function selectOtkritka(field, value) {
        otkritkaSelected[field] = value;
        renderOtkritkaOptions();
        calculate();
    }

    function otkritkaLakTierNarxi(varaq, pardoz) {
        let list = (otkritkaConfig.lakTierlar || []).slice().sort((a, b) => a.dan - b.dan);
        if (list.length === 0) return 0;
        let mos = list[0];
        list.forEach(t => { if (varaq >= t.dan) mos = t; });
        return parseFloat(mos[pardoz]) || 0;
    }

    function calculateOtkritka(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let s = otkritkaSelected;
        let info = html => { let el = document.getElementById('okInfo'); if (el) el.innerHTML = html; };
        let yaroqsiz = xabar => {
            info(`<div class="paket-xato">⚠️ ${xabar}</div>`);
            return { unitPrice: 0, details: `⚠️ ${xabar}`, costItems: [], hisobYaroqsiz: true };
        };

        let tur = otkritkaTuri(s.tur);
        let { eni: bEni, boyi: bBoyi } = otkritkaOlcham(); // menejer kiritgani — yoyilgan o'lcham
        if (!(bEni > 0 && bBoyi > 0)) return yaroqsiz("Yoyilgan eni va bo'yini kiriting — ikkalasi ham majburiy.");
        let tayyor = tur && tur.bichishEni === bEni && tur.bichishBoyi === bBoyi;
        let zapas = parseInt(otkritkaConfig.zapasVaraq) || 0;

        let oddiy = s.pardoz === 'oddiy';
        let qogoz = oddiy ? (otkritkaOddiyQogozlar().find(p => p.id === s.qogozId) || otkritkaOddiyQogozlar()[0]) : otkritkaLakQogozi();
        if (!qogoz) return yaroqsiz(oddiy ? "Otkritka qog'ozlari kiritilmagan — Admin → Otkritka." : "Lak/folga qog'ozi kiritilmagan — Admin → Otkritka.");
        let r = calculateDigitalPriceForPaper(qogoz, bEni, bBoyi, qty, s.ikkiTomon ? 2 : 1);
        if (!r) return yaroqsiz(`Yoyilgan o'lcham ${bEni}×${bBoyi} mm "${qogoz.name}" pechat maydoniga (${qogoz.p_eni}×${qogoz.p_boyi}) sig'maydi.`);

        let costItems = [];
        let jami = 0;
        let qosh = (label, soni, summa) => { jami += summa; costItems.push({ label, qty: soni, total: Math.round(summa) }); };

        // 1) Qog'oz + Sifravoy pechat — varaq narxi (1 / 2 tomonlama)
        let varaq = r.sheetsNeeded + zapas;
        let varaqNarx = parseFloat(s.ikkiTomon ? qogoz.price2 : qogoz.price1) || 0;
        qosh(`Sifravoy pechat (${qogoz.name}, ${s.ikkiTomon ? 'ikki' : 'bir'} tomonlama)`, `${varaq} varaq × ${varaqNarx.toLocaleString()}`, varaq * varaqNarx);

        // 2) 3D lak / folga ishi — tiraj oraliqlari bo'yicha, har varaqqa
        if (!oddiy) {
            let tier = otkritkaLakTierNarxi(varaq, s.pardoz);
            qosh(`${OTKRITKA_PARDOZ_NOMI[s.pardoz]} (A2)`, `${varaq} varaq × ${tier.toLocaleString()}`, varaq * tier);
        }

        // 3) Laminatsiya (ixtiyoriy) — umumiy narx, varaq formatiga qarab
        let lamKey = (Math.max(qogoz.q_eni || 0, qogoz.q_boyi || 0) > 460) ? 'a2' : 'a3';
        if (s.laminatsiya) {
            let lam = parseFloat(ofsetFinishingServices.laminatsiya[lamKey]) || 0;
            qosh(`Laminatsiya (${lamKey.toUpperCase()} narxi)`, `${varaq} varaq`, varaq * lam);
        }

        // 4) Turning qo'shimcha xizmati — har bir otkritkaga (o'z o'lchamida — tanlangan tur bo'yicha)
        let xizmatTuri = tur || otkritkaConfig.turlar[0];
        if (xizmatTuri) {
            let x = parseFloat(xizmatTuri.xizmatNarxi) || 0;
            qosh(xizmatTuri.xizmatNomi || "Qo'shimcha xizmat", `${qty} dona × ${x.toLocaleString()}`, x * qty);
        }

        info(`
            <div>📐 Yoyilgan: <b>${bEni}×${bBoyi} mm</b> → ${qogoz.q_eni}×${qogoz.q_boyi} varaqqa <b>${r.perSheet} dona</b> · ${varaq} varaq (zapas bilan)</div>
            <div class="${tayyor ? 'paket-pichoq-bor' : 'paket-step-hint'}">${tayyor ? `✓ Tur: ${tur.nomi} (tayyor holati ${tur.eni}×${tur.boyi} mm)` : `O'z o'lchami (qo'shimcha xizmat: ${xizmatTuri ? xizmatTuri.nomi : '—'})`}</div>
        `);
        let qismlar = [`Otkritka ${tayyor ? tur.nomi + ' ' : ''}(yoyilgan ${bEni}×${bBoyi}mm)`, OTKRITKA_PARDOZ_NOMI[s.pardoz], qogoz.name,
            s.ikkiTomon ? 'ikki tomonlama' : 'bir tomonlama'];
        if (s.laminatsiya) qismlar.push('laminatsiya');
        return { unitPrice: jami / qty, details: qismlar.join(' | '), costItems };
    }

    // ---- Admin: Otkritka ----
    function otkritkaQogozQatori(p, prefix, i, ochirish) {
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        return `
            <tr>
                <td><input type="text" id="${prefix}_name_${i}" value="${esc(p.name)}" placeholder="masalan: Colotech 250g"></td>
                <td><input type="number" id="${prefix}_qeni_${i}" value="${p.q_eni}" min="1"></td>
                <td><input type="number" id="${prefix}_qboyi_${i}" value="${p.q_boyi}" min="1"></td>
                <td><input type="number" id="${prefix}_peni_${i}" value="${p.p_eni}" min="1"></td>
                <td><input type="number" id="${prefix}_pboyi_${i}" value="${p.p_boyi}" min="1"></td>
                <td><input type="number" id="${prefix}_p1_${i}" value="${p.price1}" min="0"></td>
                <td><input type="number" id="${prefix}_p2_${i}" value="${p.price2}" min="0"></td>
                <td style="text-align:right;">${ochirish ? `<button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deleteOtkritkaQogoz(${i})">✕</button>` : ''}</td>
            </tr>`;
    }

    function otkritkaQogozniOqi(prefix, i, eski) {
        let q = id => document.getElementById(id);
        if (!q(`${prefix}_name_${i}`)) return eski;
        let son = id => Math.max(0, parseFloat(q(id).value) || 0);
        return {
            ...(eski || {}),
            name: q(`${prefix}_name_${i}`).value.trim(),
            q_eni: son(`${prefix}_qeni_${i}`), q_boyi: son(`${prefix}_qboyi_${i}`),
            p_eni: son(`${prefix}_peni_${i}`), p_boyi: son(`${prefix}_pboyi_${i}`),
            price1: son(`${prefix}_p1_${i}`), price2: son(`${prefix}_p2_${i}`)
        };
    }

    function renderAdminOtkritka() {
        let q = id => document.getElementById(id);
        if (!q('okAdminTurlar')) return;
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        q('okAdminTurlar').innerHTML = otkritkaConfig.turlar.map((t, ti) => `
            <div class="vm-admin-tur">
                <div class="vm-admin-tur-head">
                    <input type="text" id="okT_nomi_${ti}" value="${esc(t.nomi)}" placeholder="Tur nomi" class="vm-admin-tur-nomi">
                    <button type="button" class="btn btn-danger" style="height:32px; padding:0 10px;" title="Turni o'chirish" onclick="deleteOtkritkaTur(${ti})">✕</button>
                </div>
                <div class="vm-admin-olcham">
                    <label>Yoyilgan (hisob)</label>
                    <div class="input-unit"><input type="number" id="okT_beni_${ti}" value="${t.bichishEni}" min="1"><span>eni</span></div>
                    <div class="input-unit"><input type="number" id="okT_bboyi_${ti}" value="${t.bichishBoyi}" min="1"><span>bo'yi</span></div>
                    <label>Tayyor holati</label>
                    <div class="input-unit"><input type="number" id="okT_eni_${ti}" value="${t.eni}" min="1"><span>eni</span></div>
                    <div class="input-unit"><input type="number" id="okT_boyi_${ti}" value="${t.boyi}" min="1"><span>bo'yi</span></div>
                </div>
                <div class="ok-admin-xizmat">
                    <input type="text" id="okT_xnomi_${ti}" value="${esc(t.xizmatNomi)}" placeholder="Qo'shimcha xizmat nomi">
                    <div class="input-unit"><input type="number" id="okT_xnarx_${ti}" value="${t.xizmatNarxi || 0}" min="0"><span>so'm/dona</span></div>
                </div>
            </div>
        `).join('');

        q('okAdminQogozBody').innerHTML = otkritkaOddiyQogozlar().length === 0
            ? `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:16px;">Hozircha qog'oz yo'q — "+ Qog'oz qo'shish" ni bosing.</td></tr>`
            : otkritkaOddiyQogozlar().map((p, i) => otkritkaQogozQatori(p, 'okQ', i, true)).join('');
        let lq = otkritkaLakQogozi() || { name: 'Colotech 300g A2', q_eni: 680, q_boyi: 480, p_eni: 670, p_boyi: 470, price1: 0, price2: 0 };
        q('okAdminLakQogozBody').innerHTML = otkritkaQogozQatori(lq, 'okLQ', 0, false);

        q('okAdminLakBody').innerHTML = otkritkaConfig.lakTierlar.map((r, ri) => `
            <tr>
                <td><input type="number" id="okL_dan_${ri}" value="${r.dan}" min="1"></td>
                <td><input type="number" id="okL_lak_${ri}" value="${r.lak3d}" min="0"></td>
                <td><input type="number" id="okL_folga_${ri}" value="${r.folga}" min="0"></td>
                <td style="text-align:right;"><button type="button" class="btn btn-outline" style="height:30px; padding:0 8px;" title="Qatorni o'chirish" onclick="deleteOtkritkaLakTier(${ri})">✕</button></td>
            </tr>
        `).join('');
        q('okAdminZapas').value = otkritkaConfig.zapasVaraq;
    }

    function collectOtkritkaFromUI() {
        let q = id => document.getElementById(id);
        if (!q('okAdminTurlar')) return;
        let son = (id, min) => Math.max(min || 0, parseFloat(q(id)?.value) || 0);
        otkritkaConfig.turlar = otkritkaConfig.turlar.map((t, ti) => q(`okT_nomi_${ti}`) ? {
            key: t.key,
            nomi: q(`okT_nomi_${ti}`).value.trim() || `Tur ${ti + 1}`,
            eni: son(`okT_eni_${ti}`), boyi: son(`okT_boyi_${ti}`),
            bichishEni: son(`okT_beni_${ti}`), bichishBoyi: son(`okT_bboyi_${ti}`),
            xizmatNomi: q(`okT_xnomi_${ti}`).value.trim() || "Qo'shimcha xizmat",
            xizmatNarxi: son(`okT_xnarx_${ti}`)
        } : t);
        otkritkaConfig.qogozlar = otkritkaOddiyQogozlar().map((p, i) => otkritkaQogozniOqi('okQ', i, p));
        otkritkaConfig.lakQogoz = otkritkaQogozniOqi('okLQ', 0, otkritkaConfig.lakQogoz);
        otkritkaConfig.lakTierlar = otkritkaConfig.lakTierlar.map((r, ri) => q(`okL_dan_${ri}`) ? {
            dan: son(`okL_dan_${ri}`, 1), lak3d: son(`okL_lak_${ri}`), folga: son(`okL_folga_${ri}`)
        } : r);
        otkritkaConfig.zapasVaraq = son('okAdminZapas');
    }

    function addOtkritkaTur() {
        collectOtkritkaFromUI();
        otkritkaConfig.turlar.push({ key: 't' + Date.now().toString(36), nomi: 'Yangi tur', eni: 100, boyi: 150, bichishEni: 100, bichishBoyi: 150, xizmatNomi: "Qo'shimcha xizmat", xizmatNarxi: 0 });
        renderAdminOtkritka();
    }

    function deleteOtkritkaTur(ti) {
        collectOtkritkaFromUI();
        let t = otkritkaConfig.turlar[ti];
        if (!t || !confirm(`"${t.nomi}" turini o'chirasizmi?`)) return;
        otkritkaConfig.turlar.splice(ti, 1);
        renderAdminOtkritka();
    }

    function addOtkritkaQogoz() {
        collectOtkritkaFromUI();
        let oxirgi = otkritkaOddiyQogozlar().slice(-1)[0];
        otkritkaConfig.qogozlar = otkritkaOddiyQogozlar().concat([{
            id: 'okq' + Date.now().toString(36), name: '',
            q_eni: oxirgi ? oxirgi.q_eni : 320, q_boyi: oxirgi ? oxirgi.q_boyi : 450,
            p_eni: oxirgi ? oxirgi.p_eni : 310, p_boyi: oxirgi ? oxirgi.p_boyi : 440, price1: 0, price2: 0
        }]);
        renderAdminOtkritka();
    }

    function deleteOtkritkaQogoz(i) {
        collectOtkritkaFromUI();
        let p = otkritkaOddiyQogozlar()[i];
        if (!p || !confirm(`"${p.name || 'Nomsiz'}" qog'ozini o'chirasizmi?`)) return;
        otkritkaConfig.qogozlar.splice(i, 1);
        renderAdminOtkritka();
    }

    function addOtkritkaLakTier() {
        collectOtkritkaFromUI();
        let oxirgi = otkritkaConfig.lakTierlar.slice(-1)[0] || { dan: 0, lak3d: 0, folga: 0 };
        otkritkaConfig.lakTierlar.push({ dan: (oxirgi.dan || 0) * 2 || 1, lak3d: oxirgi.lak3d, folga: oxirgi.folga });
        renderAdminOtkritka();
    }

    function deleteOtkritkaLakTier(ri) {
        collectOtkritkaFromUI();
        if (otkritkaConfig.lakTierlar.length <= 1) { showToast("⚠️ Kamida bitta tiraj oralig'i qolishi kerak."); return; }
        otkritkaConfig.lakTierlar.splice(ri, 1);
        renderAdminOtkritka();
    }

    function saveOtkritkaConfig() {
        collectOtkritkaFromUI();
        let c = otkritkaConfig;
        let xatoQogoz = [...c.qogozlar, c.lakQogoz].find(p => !p || !p.name || !(p.q_eni > 0 && p.q_boyi > 0 && p.p_eni > 0 && p.p_boyi > 0));
        if (c.qogozlar.length === 0) { showToast("⚠️ Kamida bitta otkritka qog'ozini kiriting!"); return; }
        if (xatoQogoz) { showToast("⚠️ Har bir qog'ozning nomi, varaq va pechat maydoni o'lchami bo'lishi kerak!"); return; }
        if (c.turlar.some(t => !(t.eni > 0 && t.boyi > 0 && t.bichishEni > 0 && t.bichishBoyi > 0))) {
            showToast("⚠️ Har bir turning yoyilgan va tayyor o'lchami 0 dan katta bo'lishi kerak!");
            return;
        }
        c.lakTierlar.sort((a, b) => a.dan - b.dan);
        localStorage.setItem('erp_otkritka_config', JSON.stringify(c));
        if (typeof logAudit === 'function') logAudit("Otkritka sozlamalari o'zgartirildi",
            `Qog'ozlar: ${c.qogozlar.map(p => `${p.name} ${p.price1}/${p.price2}`).join(', ')}; lak qog'ozi ${c.lakQogoz.name} ${c.lakQogoz.price1}/${c.lakQogoz.price2}; `
            + c.turlar.map(t => `${t.nomi}: ${t.xizmatNomi} ${t.xizmatNarxi}`).join('; '));
        renderAdminOtkritka();
        showToast("💾 Otkritka sozlamalari saqlandi!");
    }

    // Eski sxemalar: qog'ozlar Sifravoy bazasidan olinardi (oddiyQogozNomlari / oddiyQogozlar prefikslari,
    // lakQogoz — nom). Endi otkritkaning o'z ro'yxati — o'sha qog'ozlar narxi bilan birga bir marta ko'chiriladi.
    function migrateOtkritkaConfig(saved, defaults) {
        let cfg = JSON.parse(JSON.stringify(defaults));
        if (!saved || typeof saved !== 'object') return cfg;
        if (Array.isArray(saved.turlar)) cfg.turlar = saved.turlar;
        if (typeof saved.zapasVaraq === 'number') cfg.zapasVaraq = saved.zapasVaraq;
        let sifravoy = xavfsizOl(() => digitalPapersDatabase, []) || [];
        let nusxa = (p, id) => ({ id, name: p.name, q_eni: p.q_eni, q_boyi: p.q_boyi, p_eni: p.p_eni, p_boyi: p.p_boyi, price1: p.price1, price2: p.price2 });

        if (Array.isArray(saved.qogozlar)) {
            cfg.qogozlar = saved.qogozlar;
        } else {
            let lakNomi = String(typeof saved.lakQogoz === 'string' ? saved.lakQogoz : 'Colotech 300g A2').toLowerCase().trim();
            let tanlangan;
            if (Array.isArray(saved.oddiyQogozNomlari)) {
                tanlangan = sifravoy.filter(p => saved.oddiyQogozNomlari.includes(p.name));
            } else {
                let prefikslar = (Array.isArray(saved.oddiyQogozlar) ? saved.oddiyQogozlar : ['Colotech', 'Lyon', 'Kvarts']).map(x => String(x).toLowerCase().trim());
                tanlangan = sifravoy.filter(p => prefikslar.some(pr => (p.name || '').toLowerCase().startsWith(pr)) && (p.name || '').toLowerCase().trim() !== lakNomi);
            }
            if (tanlangan.length) cfg.qogozlar = tanlangan.map((p, i) => nusxa(p, 'okq' + (i + 1)));
        }

        if (saved.lakQogoz && typeof saved.lakQogoz === 'object') {
            cfg.lakQogoz = saved.lakQogoz;
        } else if (typeof saved.lakQogoz === 'string') {
            let lp = sifravoy.find(p => (p.name || '').toLowerCase().trim() === saved.lakQogoz.toLowerCase().trim());
            if (lp) cfg.lakQogoz = nusxa(lp, 'oklq');
        }
        // lakTierlar faqat yangi (lak/folga ishi) sxemada saqlangan bo'lsa olinadi
        if (saved.lakQogoz && Array.isArray(saved.lakTierlar) && saved.lakTierlar.length) cfg.lakTierlar = saved.lakTierlar;
        return cfg;
    }

    // ====================== PAKET (poligrafiya — Ofset bazasidan, eng murakkab hisob) ======================
    // Menejer paket turini (A5/A4/A3/A2) tanlaydi → admin kiritgan tayyor o'lchamlardan birini bosadi
    // (bo'yi/eni/kengligi avtomatik to'ldiriladi) yoki o'zi kiritadi. Uchala o'lcham ham MAJBURIY.
    //   Bo'yi = X, Eni = Y, Kengligi = Z (mm). Bitta tomonning bichish o'lchami: (X+Z+3) × (Y+Z+3).
    //   Paketning 2 tomoni bor:
    //     • ikki tomoni BIR XIL dizayn  → Ofsetga 2 × adad bo'lak yuboriladi (zapasni Ofset o'zi qo'shadi:
    //       200 paket → 400 + 100 = 500 varoq).
    //     • ikki tomoni HAR XIL dizayn  → Ofsetga adad bo'lak (200 + 100 = 300), va qog'oz, forma, pechat
    //       xarajati ×2 (har tomon uchun alohida).
    //   Laminatsiya, Visochka (majburiy), Lak, Tisneniya (ixtiyoriy) — 2 × adad bo'lak uchun, hisob qaysi
    //   ofset mashinasida (A3/A2/A1) chiqsa, o'sha mashina narxi bilan. Barchasining narxi — Ofset admin
    //   bo'limidagi umumiy "Pardozlash xizmatlari" (ofsetFinishingServices) dan; Lenta — shu yerdan.
    //   + Yig'ish (paket turi bo'yicha, so'm/paket), + Lenta (ixtiyoriy, so'm/paket).
    //   O'lcham tanlangan turning tayyor o'lchamlariga mos kelmasa — shu tur uchun bir martalik pichoq narxi.
    let paketConfig = {
        turlar: [
            // standartGsm — shu turdagi paket uchun avtomatik tanlanadigan karton (qalinroq/yupqaroq
            // kerak bo'lsa menejer ro'yxatdan boshqasini tanlaydi)
            { key: 'a5', name: 'A5', pichoqNarxi: 500000,  yigishNarxi: 1500, standartGsm: 190,
              olchamlar: [{ x: 240, y: 180, z: 80 }, { x: 220, y: 160, z: 70 }] },
            { key: 'a4', name: 'A4', pichoqNarxi: 1000000, yigishNarxi: 2000, standartGsm: 210, isDefault: true,
              olchamlar: [{ x: 330, y: 250, z: 100 }, { x: 320, y: 240, z: 90 }] },
            { key: 'a3', name: 'A3', pichoqNarxi: 1300000, yigishNarxi: 2500, standartGsm: 230,
              olchamlar: [{ x: 450, y: 330, z: 120 }, { x: 420, y: 300, z: 100 }] },
            { key: 'a2', name: 'A2', pichoqNarxi: 1700000, yigishNarxi: 3500, standartGsm: 250,
              olchamlar: [{ x: 600, y: 450, z: 150 }, { x: 550, y: 400, z: 120 }] }
        ],
        // Paket FAQAT Kartondan — menejer tanlay oladigan karton grammajlari (narxi Ofset bo'limidagi
        // Karton bazasidan). Har turning standart kartoni ham shu ro'yxatda bo'lishi kerak.
        qogozlar: [
            { paperType: 'Karton', gsm: 190 },
            { paperType: 'Karton', gsm: 210 },
            { paperType: 'Karton', gsm: 230 },
            { paperType: 'Karton', gsm: 250 },
            { paperType: 'Karton', gsm: 300 },
            { paperType: 'Karton', gsm: 350 }
        ],
        lentaNarxi: 5000 // lentali paket — har bir paketga qo'shimcha xizmat (so'm)
        // Laminatsiya, Visochka, Lak, Tisneniya narxlari — umumiy ofsetFinishingServices dan
        // (Ofset admin → Pardozlash xizmatlari), mashina bo'yicha.
    };

    let paketSelected = { tur: 'a4', gsm: 210, dizayn: 'bir', lenta: false, lak: false, tisneniya: false };

    // Turning standart kartoni (ro'yxatda bo'lmasa — ro'yxatdagi eng yaqini)
    function paketStandartGsm(tur) {
        let list = paketConfig.qogozlar.map(g => g.gsm);
        if (list.length === 0) return 0;
        let s = parseInt(tur && tur.standartGsm) || list[0];
        return list.reduce((eng, g) => Math.abs(g - s) < Math.abs(eng - s) ? g : eng, list[0]);
    }

    function paketTuri(key) {
        return paketConfig.turlar.find(t => t.key === key) || paketConfig.turlar[0] || null;
    }

    function paketOlchamlari() {
        let v = id => parseFloat(document.getElementById(id)?.value) || 0;
        return { x: v('paketX'), y: v('paketY'), z: v('paketZ') };
    }

    // Kiritilgan o'lcham tanlangan turning tayyor o'lchamlaridan biriga aynan mosmi (pichoq bor)?
    function paketTayyorOlchamIndeksi(tur, x, y, z) {
        return (tur && tur.olchamlar || []).findIndex(o => o.x === x && o.y === y && o.z === z);
    }

    function buildPaketForm() {
        let def = paketConfig.turlar.find(t => t.isDefault) || paketConfig.turlar[0];
        paketSelected = { tur: def ? def.key : 'a4', gsm: paketStandartGsm(def), dizayn: 'bir', lenta: false, lak: false, tisneniya: false };
        let o = (def && def.olchamlar && def.olchamlar[0]) || { x: '', y: '', z: '' };
        return `
            <div class="poli-calc paket-calc">
                <div class="step-title">1. Paket turi</div>
                <div class="options-group" id="paketTurGroup"></div>

                <div class="step-title">2. Tayyor o'lchamlar <span class="paket-step-hint">(bosing — o'lchamlar avtomatik qo'yiladi)</span></div>
                <div class="options-group" id="paketOlchamGroup"></div>

                <div class="paket-olcham-row">
                    <div class="form-group">
                        <label>Bo'yi (X) <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="paketX" min="1" value="${o.x}" oninput="renderPaketOlchamChips(); calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Eni (Y) <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="paketY" min="1" value="${o.y}" oninput="renderPaketOlchamChips(); calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Kengligi (Z) <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="paketZ" min="1" value="${o.z}" oninput="renderPaketOlchamChips(); calculate()"><span>mm</span></div>
                    </div>
                </div>
                <div id="paketBichishInfo" class="paket-bichish-info"></div>

                <div class="step-title">3. Karton grammaji <span class="paket-step-hint">(★ — shu tur uchun standart; qalinroq/yupqaroq kerak bo'lsa boshqasini tanlang)</span></div>
                <div class="options-group" id="paketQogozGroup"></div>

                <div class="step-title">4. Ikki tomonining dizayni</div>
                <div class="options-group" id="paketDizaynGroup"></div>

                <div class="step-title">5. Qo'shimcha</div>
                <div class="options-group" id="paketExtraGroup"></div>

                <div class="form-group poli-qty-group">
                    <label>Adad (paket soni)</label>
                    <input type="number" id="inpQuantity" value="500" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function renderPaketOlchamChips() {
        let group = document.getElementById('paketOlchamGroup');
        if (!group) return;
        let tur = paketTuri(paketSelected.tur);
        let { x, y, z } = paketOlchamlari();
        let faol = paketTayyorOlchamIndeksi(tur, x, y, z);
        let list = (tur && tur.olchamlar) || [];
        group.innerHTML = list.length === 0
            ? `<span class="paket-step-hint">Bu tur uchun tayyor o'lcham kiritilmagan — o'lchamni qo'lda kiriting.</span>`
            : list.map((o, i) => `
                <button type="button" class="opt-btn ${i === faol ? 'active' : ''}" onclick="selectPaketOlcham(${i})">${o.x}×${o.y}×${o.z}</button>
            `).join('');
    }

    function renderPaketOptions() {
        let turGroup = document.getElementById('paketTurGroup');
        if (!turGroup) return;
        turGroup.innerHTML = paketConfig.turlar.map(t => `
            <button type="button" class="opt-btn ${t.key === paketSelected.tur ? 'active' : ''}" onclick="selectPaketTur('${t.key}')">${t.name}</button>
        `).join('');
        renderPaketOlchamChips();
        let standart = paketStandartGsm(paketTuri(paketSelected.tur));
        document.getElementById('paketQogozGroup').innerHTML = paketConfig.qogozlar.map(q => `
            <button type="button" class="opt-btn ${q.gsm === paketSelected.gsm ? 'active' : ''}" onclick="selectPaketQogoz(${q.gsm})">${q.gsm === standart ? '★ ' : ''}${q.gsm}gr</button>
        `).join('');
        document.getElementById('paketDizaynGroup').innerHTML = `
            <button type="button" class="opt-btn ${paketSelected.dizayn === 'bir' ? 'active' : ''}" onclick="selectPaketDizayn('bir')">Bir xil</button>
            <button type="button" class="opt-btn ${paketSelected.dizayn === 'har' ? 'active' : ''}" onclick="selectPaketDizayn('har')">Har xil</button>
        `;
        document.getElementById('paketExtraGroup').innerHTML = `
            <button type="button" class="opt-btn ${paketSelected.lenta ? 'active' : ''}" onclick="togglePaketExtra('lenta')">🎀 Lenta</button>
            <button type="button" class="opt-btn ${paketSelected.lak ? 'active' : ''}" onclick="togglePaketExtra('lak')">✨ Lak</button>
            <button type="button" class="opt-btn ${paketSelected.tisneniya ? 'active' : ''}" onclick="togglePaketExtra('tisneniya')">🔨 Tisneniya</button>
        `;
    }

    function selectPaketTur(key) {
        paketSelected.tur = key;
        paketSelected.gsm = paketStandartGsm(paketTuri(key)); // turga mos standart karton
        let o = (paketTuri(key).olchamlar || [])[0];
        if (o) paketOlchamniQoy(o);
        renderPaketOptions();
        calculate();
    }

    function paketOlchamniQoy(o) {
        document.getElementById('paketX').value = o.x;
        document.getElementById('paketY').value = o.y;
        document.getElementById('paketZ').value = o.z;
    }

    function selectPaketOlcham(i) {
        let o = (paketTuri(paketSelected.tur).olchamlar || [])[i];
        if (!o) return;
        paketOlchamniQoy(o);
        renderPaketOlchamChips();
        calculate();
    }

    function selectPaketQogoz(gsm) { paketSelected.gsm = gsm; renderPaketOptions(); calculate(); }
    function selectPaketDizayn(d) { paketSelected.dizayn = d; renderPaketOptions(); calculate(); }
    function togglePaketExtra(name) { paketSelected[name] = !paketSelected[name]; renderPaketOptions(); calculate(); }

    function paketInfo(html) {
        let el = document.getElementById('paketBichishInfo');
        if (el) el.innerHTML = html;
    }

    function calculatePaket(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let tur = paketTuri(paketSelected.tur);
        let { x, y, z } = paketOlchamlari();
        if (!tur || !(x > 0 && y > 0 && z > 0)) {
            paketInfo(`<div class="paket-xato">⚠️ Bo'yi, eni va kengligini kiriting — uchalasi ham majburiy.</div>`);
            return { unitPrice: 0, details: "⚠️ Paket o'lchamlari to'liq kiritilmagan (bo'yi, eni, kengligi majburiy)", costItems: [], hisobYaroqsiz: true };
        }

        // Bitta tomonning bichish (yoyilgan) o'lchami
        let w = x + z + 3, h = y + z + 3;
        let gsm = paketSelected.gsm || paketStandartGsm(tur);
        if (!gsm) {
            return { unitPrice: 0, details: "⚠️ Paket uchun karton grammaji kiritilmagan — Admin panelda kiriting.", costItems: [], hisobYaroqsiz: true };
        }
        let qogoz = { paperType: 'Karton', gsm }; // paket faqat Kartondan
        let harXil = paketSelected.dizayn === 'har';
        let k = harXil ? 2 : 1;                     // qog'oz/forma/pechat necha marta hisoblanadi
        let ofsetTiraj = harXil ? qty : qty * 2;    // Ofsetga yuboriladigan bo'lak (zapasni Ofset o'zi qo'shadi)
        let bolaklar = qty * 2;                     // pardozlash (laminatsiya, visochka, lak, tisneniya) uchun

        let natijalar = ['A3', 'A2', 'A1']
            .map(m => calculateOfsetForMachine(m, w, h, ofsetTiraj, 1, qogoz.paperType, qogoz.gsm))
            .filter(Boolean)
            .sort((a, b) => a.perPieceCostRaw - b.perPieceCostRaw);
        let r = natijalar[0];
        let tayyorIdx = paketTayyorOlchamIndeksi(tur, x, y, z);
        let pichoqKerak = tayyorIdx < 0;

        if (!r) {
            let narxBor = ofsetRawPapers.some(p => p.name === 'Karton' && p.gsm === qogoz.gsm && Object.values(p.prices || {}).some(v => v > 0));
            paketInfo(`<div class="paket-xato">⚠️ ${narxBor
                ? `Bichish o'lchami ${w}×${h} mm hech bir ofset mashinasiga (A3/A2/A1) sig'madi.`
                : `Karton ${qogoz.gsm}gr narxi Ofset bo'limida kiritilmagan — admin <b>Ofset pechat → Karton qog'ozi</b> jadvalida narxini kiritishi kerak.`}</div>`);
            return { unitPrice: 0, details: `⚠️ ${w}×${h} mm bichish o'lchami ofset mashinalariga sig'madi yoki ${qogoz.paperType} ${qogoz.gsm}gr narxi yo'q`, costItems: [], hisobYaroqsiz: true };
        }

        let mKey = r.machine.toLowerCase(); // 'a3' | 'a2' | 'a1'
        let costItems = [];
        let jami = 0;
        let qosh = (label, soni, summa) => { jami += summa; costItems.push({ label, qty: soni, total: Math.round(summa) }); };
        let izohlar = [];

        // 1) Ofset: qog'oz, forma, pechat (har xil dizaynda ×2)
        // Har xil dizaynda: har tomon uchun son × 2 tomon (masalan "300 × 2 tomon" = jami 600)
        let tomon = harXil ? ' × 2 tomon' : '';
        qosh(`Qog'oz (${r.paperName} ${r.paperGsm}gr, ${r.rawName})`, `${r.totalSheets}${tomon} xom varoq`, r.totalPaperCost * k);
        qosh('Forma (klishe)', `${r.totalPlates}${tomon} plastina`, r.totalPlateCost * k);
        qosh('Bosma (pechat)', `${r.totalWorkingSheets}${tomon} ${r.machine} varoq`, r.totalPrintCost * k);

        // 2) Laminatsiya va Visochka — majburiy, 2 × adad bo'lak, mashina narxi bo'yicha
        let lamNarx = parseFloat(ofsetFinishingServices.laminatsiya[mKey]) || 0;
        qosh(`Laminatsiya (${r.machine})`, `${bolaklar} bo'lak`, lamNarx * bolaklar);
        let visTier = ofsetFinishingServices.visochka[mKey];
        let visJami = papkaTieredTotal(bolaklar, visTier);
        qosh(`Visochka (${r.machine})`, `${bolaklar} bo'lak`, visJami);
        if (lamNarx <= 0) izohlar.push(`⚠️ ${r.machine} uchun laminatsiya narxi kiritilmagan`);
        if (visJami <= 0) izohlar.push(`⚠️ ${r.machine} uchun visochka narxi kiritilmagan`);

        // 3) Yig'ish (har bir paket)
        qosh(`Yig'ish (${tur.name})`, `${qty} paket`, (parseFloat(tur.yigishNarxi) || 0) * qty);

        // 4) Ixtiyoriy: lenta, lak, tisneniya
        if (paketSelected.lenta) qosh('Lenta', `${qty} paket`, (parseFloat(paketConfig.lentaNarxi) || 0) * qty);
        if (paketSelected.lak) qosh(`Lak (${r.machine})`, `${bolaklar} bo'lak`, papkaTieredTotal(bolaklar, ofsetFinishingServices.lak[mKey]));
        if (paketSelected.tisneniya) {
            let tis = ofsetFinishingServices.tisneniya[mKey] || {};
            qosh(`Tisneniya (${r.machine})`, `${bolaklar} bo'lak`, (parseFloat(tis.pricePerUnit) || 0) * bolaklar);
            qosh('Tisneniya klishesi (bir martalik)', `${k} ta`, (parseFloat(tis.klishePrice) || 0) * k);
        }

        // 5) Nostandart o'lcham — bir martalik pichoq
        let pichoq = pichoqKerak ? (parseFloat(tur.pichoqNarxi) || 0) : 0;
        if (pichoqKerak) qosh(`Pichoq yasatish (${tur.name}, bir martalik)`, '1 marta', pichoq);

        paketInfo(`
            <div>📐 Bichish (1 tomon): <b>${w}×${h} mm</b> → <b>${r.machine}</b> ofset, 1 varoqqa ${r.itemsPerSheet} dona ·
                Ofsetga ${ofsetTiraj} bo'lak${harXil ? ' × 2 tomon' : ''} (+zapas)</div>
            ${pichoqKerak
                ? `<div class="paket-pichoq">✂️ Nostandart o'lcham — ${tur.name} uchun bir martalik pichoq: <b>${pichoq.toLocaleString()} so'm</b> qo'shildi</div>`
                : `<div class="paket-pichoq-bor">✓ Tayyor pichoq bor — pichoq narxi qo'shilmaydi</div>`}
        `);

        let qismlar = [`Paket ${tur.name} ${x}×${y}×${z}mm (bichish ${w}×${h})`, `${qogoz.paperType} ${qogoz.gsm}gr`,
            `${r.machine} ofset`, harXil ? 'ikki tomoni har xil' : 'ikki tomoni bir xil'];
        if (paketSelected.lenta) qismlar.push('lenta');
        if (paketSelected.lak) qismlar.push('lak');
        if (paketSelected.tisneniya) qismlar.push('tisneniya');
        if (pichoqKerak) qismlar.push('pichoq (bir martalik)');
        qismlar = qismlar.concat(izohlar);

        return { unitPrice: jami / qty, details: qismlar.join(' | '), costItems };
    }

    // ---- Admin: Paket ----
    function renderAdminPaket() {
        let q = id => document.getElementById(id);
        if (!q('paketTurlarBody')) return;
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

        q('paketTurlarBody').innerHTML = paketConfig.turlar.map((t, i) => `
            <tr>
                <td style="font-weight:700;">${esc(t.name)}</td>
                <td><input type="number" id="pkTur_pichoq_${i}" value="${t.pichoqNarxi || 0}" min="0"></td>
                <td><input type="number" id="pkTur_yigish_${i}" value="${t.yigishNarxi || 0}" min="0"></td>
                <td><select id="pkTur_gsm_${i}">${paketConfig.qogozlar.map(g => `<option value="${g.gsm}" ${g.gsm === paketStandartGsm(t) ? 'selected' : ''}>Karton ${g.gsm}gr</option>`).join('')}</select></td>
                <td style="text-align:center;"><input type="radio" name="pkTurDefault" id="pkTur_def_${i}" ${t.isDefault ? 'checked' : ''}></td>
            </tr>
        `).join('');

        q('paketOlchamlarBody').innerHTML = paketConfig.turlar.map((t, ti) => `
            <div class="paket-admin-olcham-tur">
                <div class="paket-admin-olcham-head">
                    <b>${esc(t.name)}</b>
                    <button type="button" class="btn btn-outline" style="height:30px; padding:0 10px; font-size:0.78rem;" onclick="addPaketOlcham(${ti})">+ O'lcham</button>
                </div>
                ${(t.olchamlar || []).length === 0 ? `<div class="paket-step-hint">Tayyor o'lcham yo'q — bu turda har doim pichoq narxi qo'shiladi.</div>` : ''}
                ${(t.olchamlar || []).map((o, oi) => `
                    <div class="paket-admin-olcham-row">
                        <div class="input-unit"><input type="number" id="pkOl_${ti}_${oi}_x" value="${o.x}" min="1" title="Bo'yi (X)"><span>X</span></div>
                        <div class="input-unit"><input type="number" id="pkOl_${ti}_${oi}_y" value="${o.y}" min="1" title="Eni (Y)"><span>Y</span></div>
                        <div class="input-unit"><input type="number" id="pkOl_${ti}_${oi}_z" value="${o.z}" min="1" title="Kengligi (Z)"><span>Z</span></div>
                        <button type="button" class="btn btn-danger" style="height:34px; padding:0 10px;" title="O'chirish" onclick="deletePaketOlcham(${ti}, ${oi})">✕</button>
                    </div>
                `).join('')}
            </div>
        `).join('');

        q('paketQogozlarBody').innerHTML = paketConfig.qogozlar.map((g, i) => `
            <tr>
                <td style="font-weight:600;">Karton</td>
                <td><div class="input-unit"><input type="number" id="pkQ_gsm_${i}" value="${g.gsm}" min="1"><span>gr</span></div></td>
                <td>${paketConfig.turlar.filter(t => paketStandartGsm(t) === g.gsm).map(t => `<span class="paket-std-badge">${t.name} standarti</span>`).join(' ')}</td>
                <td style="text-align:right;"><button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deletePaketQogoz(${i})">✕</button></td>
            </tr>
        `).join('');

        q('paketLentaNarxi').value = paketConfig.lentaNarxi || 0;
    }

    // Formadagi (hali saqlanmagan) qiymatlarni paketConfig ga o'qib oladi
    function collectPaketFromUI() {
        let q = id => document.getElementById(id);
        if (!q('paketTurlarBody')) return;
        let son = (id, min) => Math.max(min || 0, parseFloat(q(id)?.value) || 0);
        paketConfig.turlar = paketConfig.turlar.map((t, i) => ({
            ...t,
            pichoqNarxi: son(`pkTur_pichoq_${i}`),
            yigishNarxi: son(`pkTur_yigish_${i}`),
            standartGsm: q(`pkTur_gsm_${i}`) ? (parseInt(q(`pkTur_gsm_${i}`).value) || t.standartGsm) : t.standartGsm,
            isDefault: !!q(`pkTur_def_${i}`)?.checked,
            olchamlar: (t.olchamlar || []).map((o, oi) => q(`pkOl_${i}_${oi}_x`) ? {
                x: son(`pkOl_${i}_${oi}_x`), y: son(`pkOl_${i}_${oi}_y`), z: son(`pkOl_${i}_${oi}_z`)
            } : o)
        }));
        paketConfig.qogozlar = paketConfig.qogozlar.map((g, i) => q(`pkQ_gsm_${i}`) ? {
            paperType: 'Karton', gsm: son(`pkQ_gsm_${i}`, 1)
        } : g);
        paketConfig.lentaNarxi = son('paketLentaNarxi');
    }

    function addPaketOlcham(ti) {
        collectPaketFromUI();
        let t = paketConfig.turlar[ti];
        if (!t) return;
        let oxirgi = (t.olchamlar || [])[t.olchamlar.length - 1] || { x: 300, y: 250, z: 100 };
        t.olchamlar = (t.olchamlar || []).concat([{ ...oxirgi }]);
        renderAdminPaket();
    }

    function deletePaketOlcham(ti, oi) {
        collectPaketFromUI();
        let t = paketConfig.turlar[ti];
        if (!t || !confirm(`${t.name}: ${t.olchamlar[oi].x}×${t.olchamlar[oi].y}×${t.olchamlar[oi].z} o'lchamini o'chirasizmi?`)) return;
        t.olchamlar.splice(oi, 1);
        renderAdminPaket();
    }

    function addPaketQogoz() {
        collectPaketFromUI();
        let oxirgi = paketConfig.qogozlar.length ? paketConfig.qogozlar[paketConfig.qogozlar.length - 1].gsm : 250;
        paketConfig.qogozlar.push({ paperType: 'Karton', gsm: oxirgi + 20 });
        renderAdminPaket();
    }

    function deletePaketQogoz(i) {
        collectPaketFromUI();
        let g = paketConfig.qogozlar[i];
        let foydalanadi = paketConfig.turlar.filter(t => paketStandartGsm(t) === g.gsm).map(t => t.name);
        if (foydalanadi.length) { showToast(`⚠️ Karton ${g.gsm}gr — ${foydalanadi.join(', ')} turining standarti. Avval turning standart kartonini o'zgartiring.`); return; }
        if (!confirm(`Karton ${g.gsm}gr ni o'chirasizmi?`)) return;
        paketConfig.qogozlar.splice(i, 1);
        renderAdminPaket();
    }

    function savePaketConfig() {
        collectPaketFromUI();
        let xato = paketConfig.turlar.some(t => (t.olchamlar || []).some(o => !(o.x > 0 && o.y > 0 && o.z > 0)));
        if (xato) { showToast("⚠️ Tayyor o'lchamlarda X, Y, Z 0 dan katta bo'lishi kerak!"); return; }
        if (paketConfig.qogozlar.length === 0) { showToast("⚠️ Kamida bitta karton grammajini kiriting!"); return; }
        // takroriy grammajlarni olib tashlab, o'sish tartibida saqlaymiz
        paketConfig.qogozlar = [...new Map(paketConfig.qogozlar.map(g => [g.gsm, g])).values()].sort((a, b) => a.gsm - b.gsm);
        if (!paketConfig.turlar.some(t => t.isDefault)) paketConfig.turlar[0].isDefault = true;
        localStorage.setItem('erp_paket_config', JSON.stringify(paketConfig));
        if (typeof logAudit === 'function') logAudit("Paket sozlamalari o'zgartirildi",
            paketConfig.turlar.map(t => `${t.name}: karton ${t.standartGsm}gr, pichoq ${t.pichoqNarxi}, yig'ish ${t.yigishNarxi}, ${t.olchamlar.length} o'lcham`).join('; ') + `; lenta ${paketConfig.lentaNarxi}`);
        renderAdminPaket();
        showToast("💾 Paket sozlamalari saqlandi!");
    }

    // Saqlangan sozlamani standart tuzilma ustiga xavfsiz qo'yadi (yangi maydonlar qo'shilsa ham buzilmaydi)
    function migratePaketConfig(saved, defaults) {
        let cfg = JSON.parse(JSON.stringify(defaults));
        if (!saved || typeof saved !== 'object') return cfg;
        if (Array.isArray(saved.turlar)) {
            cfg.turlar = defaults.turlar.map(d => {
                let s = saved.turlar.find(x => x && x.key === d.key);
                return s ? { ...d, ...s, olchamlar: Array.isArray(s.olchamlar) ? s.olchamlar : d.olchamlar } : d;
            });
        }
        // Paket faqat Kartondan: eski saqlangan Melovka va boshqa qatorlar tashlab yuboriladi
        let kartonlar = Array.isArray(saved.qogozlar) ? saved.qogozlar.filter(g => g && g.paperType === 'Karton' && g.gsm > 0) : [];
        let eskiFormat = Array.isArray(saved.turlar) && !saved.turlar.some(t => t && t.standartGsm);
        if (eskiFormat) kartonlar = kartonlar.concat(defaults.qogozlar); // turlarning standart kartonlari ro'yxatda bo'lsin
        if (kartonlar.length > 0) {
            cfg.qogozlar = [...new Map(kartonlar.map(g => [g.gsm, { paperType: 'Karton', gsm: g.gsm }])).values()].sort((x, y) => x.gsm - y.gsm);
        }
        if (typeof saved.lentaNarxi === 'number') cfg.lentaNarxi = saved.lentaNarxi;
        // Eski saqlangan lak/tisneniya maydonlari e'tiborga olinmaydi — narx umumiy joydan.
        return cfg;
    }

    // ====================== KUBARIK (poligrafiya, Bloknot kabi — Ofset qog'oz bazasidan) ======================
    // Kubarik — kvadrat varaqlardan yig'ilgan blok (standart 90x90mm, balandligi 90mm). Turlari qog'oz/yelim
    // bo'yicha farqlanadi (Oq, Rangli, Kleyli, Pechatli) — har birini admin tahrirlaydi. Hisob:
    //   A3 varoqlar = ceil(adad × varaqSoni / a3dagiBolak) + zapasVaraq (tirajga bir marta)
    //   Qog'oz narxi — Ofset bo'limi bazasidan (turning qog'oz turi/grammaji, A3 ofset).
    //   Pechatli tur — qo'shimcha forma + bosma (1+0, A3 ofset).
    //   + turning qo'shimcha narxi (rangli qog'oz ustamasi, yelim...) + yig'ish — so'm/dona, marjasiz.
    let kubarikConfig = {
        olcham: '90x90x90mm',
        a3dagiBolak: 12,   // 1 A3 (297x420) varaqdan chiqadigan 90x90 bo'lak soni (3 × 4)
        zapasVaraq: 50,    // tirajga bir marta qo'shiladigan zapas A3 varaq
        turlar: [
            { key: 'oq',       name: 'Oq',       paperType: 'Ofset', gsm: 80, varaqSoni: 900, pechatli: false, qoshimchaNomi: '',                       qoshimchaNarx: 0,    yigishNarxi: 3000, isDefault: true },
            { key: 'rangli',   name: 'Rangli',   paperType: 'Ofset', gsm: 80, varaqSoni: 900, pechatli: false, qoshimchaNomi: "Rangli qog'oz ustamasi", qoshimchaNarx: 4000, yigishNarxi: 3000, isDefault: false },
            { key: 'kleyli',   name: 'Kleyli',   paperType: 'Ofset', gsm: 80, varaqSoni: 500, pechatli: false, qoshimchaNomi: 'Yelim (kley) qatlami',   qoshimchaNarx: 5000, yigishNarxi: 3500, isDefault: false },
            { key: 'pechatli', name: 'Pechatli', paperType: 'Ofset', gsm: 80, varaqSoni: 900, pechatli: true,  qoshimchaNomi: '',                       qoshimchaNarx: 0,    yigishNarxi: 3000, isDefault: false }
        ]
    };
    let kubarikSelected = { turIndex: 0 };

    function kubarikTuri() {
        return kubarikConfig.turlar[kubarikSelected.turIndex] || kubarikConfig.turlar[0] || null;
    }

    function buildKubarikForm() {
        let def = kubarikConfig.turlar.findIndex(t => t.isDefault);
        kubarikSelected = { turIndex: def >= 0 ? def : 0 };
        return `
            <div class="poli-calc">
                <div class="poli-spec-row">
                    <div class="poli-spec-icon">📐</div>
                    <div>
                        <div class="poli-spec-label">Standart o'lcham</div>
                        <div class="poli-spec-value">${kubarikConfig.olcham}</div>
                    </div>
                </div>
                <div class="step-title">Kubarik turi</div>
                <div class="options-group" id="kubarikTurGroup"></div>
                <div id="kubarikInfoText" class="kubarik-info"></div>
                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="100" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function renderKubarikOptions() {
        let group = document.getElementById('kubarikTurGroup');
        if (!group) return;
        if (kubarikConfig.turlar.length === 0) {
            group.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">⚠️ Kubarik turlari kiritilmagan — Admin panelda kiriting.</p>`;
            return;
        }
        group.innerHTML = kubarikConfig.turlar.map((t, i) => `
            <button type="button" class="opt-btn ${i === kubarikSelected.turIndex ? 'active' : ''}" onclick="selectKubarikTur(${i})">${t.name}</button>
        `).join('');
        let t = kubarikTuri();
        let info = document.getElementById('kubarikInfoText');
        if (info && t) {
            info.innerText = `${t.varaqSoni} varaq · ${t.paperType} ${t.gsm}gr`
                + (t.pechatli ? ' · har bir varaqqa pechat (1+0)' : '')
                + (t.qoshimchaNomi ? ` · ${t.qoshimchaNomi}` : '');
        }
    }

    function selectKubarikTur(i) {
        kubarikSelected.turIndex = i;
        renderKubarikOptions();
        calculate();
    }

    function calculateKubarik(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let t = kubarikTuri();
        if (!t) return { unitPrice: 0, details: "⚠️ Kubarik turlari kiritilmagan — Admin panelda kiriting.", costItems: [] };

        let unit = 0;
        let costItems = [];
        let qismlar = [`Kubarik ${t.name} (${kubarikConfig.olcham})`, `${t.varaqSoni} varaq`];

        // 1) Qog'oz (+ pechatli turda forma va bosma) — Ofset A3
        let bolak = Math.max(1, parseInt(kubarikConfig.a3dagiBolak) || 1);
        let a3 = Math.ceil(qty * (parseInt(t.varaqSoni) || 0) / bolak) + (parseInt(kubarikConfig.zapasVaraq) || 0);
        let r = calculateOfsetJobFixedSheets('A3', qty, 1, t.paperType, parseInt(t.gsm) || 0, a3, false);
        if (r) {
            unit += r.totalPaperCost / qty;
            costItems.push({ label: `Qog'oz (${t.paperType} ${t.gsm}gr, ${r.rawName})`, qty: `${r.totalSheets} xom varoq (${a3} A3)`, total: Math.round(r.totalPaperCost) });
            if (t.pechatli) {
                unit += (r.totalPlateCost + r.totalPrintCost) / qty;
                costItems.push({ label: 'Forma (klishe)', qty: `${r.totalPlates} plastina`, total: Math.round(r.totalPlateCost) });
                costItems.push({ label: 'Bosma (pechat 1+0)', qty: `${r.totalWorkingSheets} ta A3 varoq`, total: Math.round(r.totalPrintCost) });
                qismlar.push('pechat 1+0');
            }
        } else {
            qismlar.push(`⚠️ ${t.paperType} ${t.gsm}gr uchun Ofset A3 bazasida narx topilmadi — admin panelda tekshiring`);
        }

        // 2) Turning qo'shimcha narxi (rangli qog'oz ustamasi, yelim...)
        let qoshimcha = parseFloat(t.qoshimchaNarx) || 0;
        if (qoshimcha > 0) {
            unit += qoshimcha;
            costItems.push({ label: t.qoshimchaNomi || "Qo'shimcha", qty: `${qty} dona`, total: Math.round(qoshimcha * qty) });
            if (t.qoshimchaNomi) qismlar.push(t.qoshimchaNomi.toLowerCase());
        }

        // 3) Yig'ish
        let yigish = parseFloat(t.yigishNarxi) || 0;
        unit += yigish;
        costItems.push({ label: "Yig'ish", qty: `${qty} dona`, total: Math.round(yigish * qty) });

        return { unitPrice: unit, details: qismlar.join(' | '), costItems };
    }

    // ---- Admin: Kubarik ----
    function renderAdminKubarik() {
        let q = id => document.getElementById(id);
        if (!q('kubarikTurlarBody')) return;
        q('kubarikOlcham').value = kubarikConfig.olcham;
        q('kubarikA3Bolak').value = kubarikConfig.a3dagiBolak;
        q('kubarikZapas').value = kubarikConfig.zapasVaraq;
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        q('kubarikTurlarBody').innerHTML = kubarikConfig.turlar.length === 0
            ? `<tr><td colspan="10" style="text-align:center; color:var(--text-muted); padding:16px;">Hozircha tur yo'q — "+ Yangi tur" tugmasini bosing.</td></tr>`
            : kubarikConfig.turlar.map((t, i) => `
            <tr>
                <td><input type="text" id="kubTur_name_${i}" value="${esc(t.name)}"></td>
                <td><select id="kubTur_paper_${i}">${POLIGRAFIYA_PAPER_TYPES.map(p => `<option value="${p}" ${t.paperType === p ? 'selected' : ''}>${p}</option>`).join('')}</select></td>
                <td><input type="number" id="kubTur_gsm_${i}" value="${t.gsm}" min="1"></td>
                <td><input type="number" id="kubTur_varaq_${i}" value="${t.varaqSoni}" min="1"></td>
                <td style="text-align:center;"><input type="checkbox" id="kubTur_pechat_${i}" ${t.pechatli ? 'checked' : ''}></td>
                <td><input type="text" id="kubTur_qnomi_${i}" value="${esc(t.qoshimchaNomi)}" placeholder="masalan: Yelim"></td>
                <td><input type="number" id="kubTur_qnarx_${i}" value="${t.qoshimchaNarx || 0}" min="0"></td>
                <td><input type="number" id="kubTur_yigish_${i}" value="${t.yigishNarxi || 0}" min="0"></td>
                <td style="text-align:center;"><input type="radio" name="kubTurDefault" id="kubTur_def_${i}" ${t.isDefault ? 'checked' : ''}></td>
                <td style="text-align:right;"><button class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deleteKubarikTur(${i})">✕</button></td>
            </tr>
        `).join('');
    }

    // Jadvaldagi (hali saqlanmagan) qiymatlarni o'qib oladi — qator qo'shish/o'chirishda ular yo'qolmasligi uchun
    function collectKubarikTurlarFromUI() {
        return kubarikConfig.turlar.map((t, i) => {
            let q = id => document.getElementById(id);
            if (!q(`kubTur_name_${i}`)) return t;
            return {
                key: t.key || ('kub_' + Date.now().toString(36) + i),
                name: q(`kubTur_name_${i}`).value.trim() || `Tur ${i + 1}`,
                paperType: q(`kubTur_paper_${i}`).value,
                gsm: Math.max(1, parseInt(q(`kubTur_gsm_${i}`).value) || 80),
                varaqSoni: Math.max(1, parseInt(q(`kubTur_varaq_${i}`).value) || 1),
                pechatli: q(`kubTur_pechat_${i}`).checked,
                qoshimchaNomi: q(`kubTur_qnomi_${i}`).value.trim(),
                qoshimchaNarx: Math.max(0, parseFloat(q(`kubTur_qnarx_${i}`).value) || 0),
                yigishNarxi: Math.max(0, parseFloat(q(`kubTur_yigish_${i}`).value) || 0),
                isDefault: q(`kubTur_def_${i}`).checked
            };
        });
    }

    function addKubarikTur() {
        kubarikConfig.turlar = collectKubarikTurlarFromUI();
        kubarikConfig.turlar.push({ key: 'kub_' + Date.now().toString(36), name: 'Yangi tur', paperType: 'Ofset', gsm: 80, varaqSoni: 900,
            pechatli: false, qoshimchaNomi: '', qoshimchaNarx: 0, yigishNarxi: 3000, isDefault: kubarikConfig.turlar.length === 0 });
        renderAdminKubarik();
    }

    function deleteKubarikTur(i) {
        let turlar = collectKubarikTurlarFromUI();
        if (!turlar[i] || !confirm(`"${turlar[i].name}" turini o'chirmoqchimisiz?`)) return;
        let wasDefault = turlar[i].isDefault;
        turlar.splice(i, 1);
        if (wasDefault && turlar.length > 0) turlar[0].isDefault = true;
        kubarikConfig.turlar = turlar;
        renderAdminKubarik();
    }

    function saveKubarikConfig() {
        let q = id => document.getElementById(id);
        let olcham = q('kubarikOlcham').value.trim();
        if (!olcham) { showToast("⚠️ O'lchamni kiriting!"); return; }
        let turlar = collectKubarikTurlarFromUI();
        if (turlar.length > 0 && !turlar.some(t => t.isDefault)) turlar[0].isDefault = true;
        kubarikConfig = {
            olcham,
            a3dagiBolak: Math.max(1, parseInt(q('kubarikA3Bolak').value) || 1),
            zapasVaraq: Math.max(0, parseInt(q('kubarikZapas').value) || 0),
            turlar
        };
        localStorage.setItem('erp_kubarik_config', JSON.stringify(kubarikConfig));
        if (typeof logAudit === 'function') logAudit("Kubarik sozlamalari o'zgartirildi", `${turlar.length} ta tur: ${turlar.map(t => t.name).join(', ')}`);
        renderAdminKubarik();
        showToast("💾 Kubarik sozlamalari saqlandi!");
    }

    // ====================== PAPKA (poligrafiya, FAQAT ofset, Karton) ======================
    // 4 ta tayyor tur, har biri o'z YOYILGAN (pona qirqilgandan keyingi) o'lchamiga va QAT'IY
    // ofset mashinasiga ega (1,2,3-turlar A3da, 4-tur A2da hisoblanadi — mashina tanlab
    // ko'rilmaydi). Karton grammajini endi menejer o'zi tanlaydi (Ofset bo'limidagi Karton
    // narx bazasidan). Laminatsiya va Visochka — BARCHA turlarga har doim avtomatik qo'shiladi,
    // mijoz/menejerga umuman ko'rsatilmaydi (faqat admin narxini kiritadi, A3/A2 uchun alohida).
    // Visochka narxi tiered: birinchi 1000 donagacha qat'iy summa, undan oshgan har bir donaga
    // qo'shimcha narx. LAK ham xuddi shunday tiered, lekin — Tisneniya kabi — ixtiyoriy va
    // mijoz/menejer tanlaydi (ikkalasi ham bir vaqtda tanlanishi mumkin). "Karmashkali" turida
    // qo'shimcha "karmashka+yig'ish" narxi ham (hiddenFee) mijozga ko'rsatilmasdan avtomatik
    // qo'shiladi. Eng kam buyurtma 100 dona — kam kiritilsa avtomatik 100ga ko'tariladi.
    let papkaConfig = {
        variants: [
            { key: 'a4_karmashkasiz', name: "A4 Karmashkasiz", flatW: 308, flatH: 440, machine: 'A3', hiddenFee: 0, isDefault: true },
            { key: 'a4_karmashkalik', name: "A4 Karmashkali", flatW: 308, flatH: 440, machine: 'A3', hiddenFee: 1500 },
            { key: 'a4_visochkalik', name: "A4 Visochkali", flatW: 308, flatH: 440, machine: 'A3', hiddenFee: 0 },
            { key: 'a3_visochkalik', name: "A3 Visochkali", flatW: 460, flatH: 680, machine: 'A2', hiddenFee: 0 }
        ],
        paperGsmOptions: [250, 300, 350],
        defaultGsm: 250,
        // Narxi endi "Ofset pechat kalkulyatori" admin bo'limidagi umumiy
        // Visochka/Laminatsiya sozlamasidan (ofsetFinishingServices) olinadi — bu yerda
        // faqat Papka shu xizmatlardan foydalanadimi-yo'qmi belgilanadi.
        laminatsiyaEnabled: true,
        visochkaEnabled: true,
        // Lak va Tisneniya (ixtiyoriy, mijoz/menejer tanlaydi) — narxi umumiy
        // ofsetFinishingServices.lak / .tisneniya dan (Ofset admin → Pardozlash xizmatlari).
        minQty: 100,
        infoText: "Papka Karton qog'ozidan, faqat ofset usulida tayyorlanadi."
    };

    let papkaSelected = { variantIndex: 0, gsm: 250, lak: false, tisneniya: false };

    // Bloknot/Kalendar'dagi bir martalik-to'lov naqshiga o'xshash, lekin "tiered total" shaklida:
    // birinchi `firstQty` donagacha qat'iy `firstPrice`, undan oshgan HAR BIR qo'shimcha donaga
    // `nextPrice` qo'shiladi. Visochka va LAK ikkalasi ham shu formuladan foydalanadi.
    function papkaTieredTotal(qty, tier) {
        if (!tier) return 0;
        let extra = Math.max(0, qty - (tier.firstQty || 0));
        return (tier.firstPrice || 0) + extra * (tier.nextPrice || 0);
    }

    function papkaMachineKey(v) {
        return (v && v.machine === 'A2') ? 'a2' : 'a3';
    }

    function buildPapkaForm() {
        let defIdx = papkaConfig.variants.findIndex(v => v.isDefault);
        papkaSelected = { variantIndex: defIdx >= 0 ? defIdx : 0, gsm: papkaConfig.defaultGsm || papkaConfig.paperGsmOptions[0], lak: false, tisneniya: false };

        return `
            <div class="step-title">Papka turi:</div>
            <div class="options-group" id="papkaVariantGroup"></div>

            <div class="step-title" style="margin-top:16px;">Karton grammaji:</div>
            <div class="options-group" id="papkaGsmGroup"></div>

            <div class="step-title" style="margin-top:16px;">Qo'shimcha ishlov:</div>
            <div class="options-group" id="papkaExtraGroup"></div>

            <div class="form-group" style="margin-top:16px;">
                <label>Adad (dona) — eng kami ${papkaConfig.minQty}:</label>
                <input type="number" id="inpQuantity" value="${papkaConfig.minQty}" min="1" oninput="calculate()">
            </div>
        `;
    }

    function renderPapkaOptions() {
        const variantGroup = document.getElementById('papkaVariantGroup');
        if (!variantGroup) return;

        variantGroup.innerHTML = papkaConfig.variants.map((v, idx) => `
            <button class="opt-btn ${idx === papkaSelected.variantIndex ? 'active' : ''}"
                    onclick="selectPapkaVariant(${idx})">${v.name}</button>
        `).join('');

        const gsmGroup = document.getElementById('papkaGsmGroup');
        if (gsmGroup) {
            gsmGroup.innerHTML = papkaConfig.paperGsmOptions.map(g => `
                <button class="opt-btn ${papkaSelected.gsm === g ? 'active' : ''}" onclick="selectPapkaGsm(${g})">${g}gr</button>
            `).join('');
        }

        // LAK va Tisneniya mustaqil — ikkalasi ham birga tanlanishi mumkin (bloknotdan farqli).
        // Laminatsiya/Visochka/Karmashka+Yig'ish bu yerda umuman ko'rsatilmaydi — ular admin
        // narxi bilan avtomatik qo'shiladi (calculatePapka() ichida).
        document.getElementById('papkaExtraGroup').innerHTML = `
            <button class="opt-btn ${papkaSelected.lak ? 'active' : ''}" onclick="togglePapkaExtra('lak')">✨ LAK</button>
            <button class="opt-btn ${papkaSelected.tisneniya ? 'active' : ''}" onclick="togglePapkaExtra('tisneniya')">🔨 Tisneniya</button>
        `;

        updatePapkaInfo();
    }

    function updatePapkaInfo() {
        const box = document.getElementById('papkaInfoText');
        if (!box) return;
        let v = papkaConfig.variants[papkaSelected.variantIndex] || papkaConfig.variants[0];
        let gsm = papkaSelected.gsm || papkaConfig.defaultGsm;
        let machineKey = papkaMachineKey(v);
        let qatorlar = [];
        if (papkaConfig.infoText) qatorlar.push(papkaConfig.infoText);
        qatorlar.push(`<b>${v.name}</b> yoyilgan o'lchami: ${v.flatW}×${v.flatH} mm`);
        qatorlar.push(`Material: <b>Karton ${gsm}gr</b> | Mashina: <b>${v.machine}</b> | Pechat: <b>faqat Ofset</b>`);
        if (papkaSelected.tisneniya && ofsetFinishingServices.tisneniya[machineKey].klishePrice > 0) {
            qatorlar.push(`Tisneniya klishesi: <b>${ofsetFinishingServices.tisneniya[machineKey].klishePrice.toLocaleString('ru-RU')} so'm</b> (bir martalik, adadga bo'linadi)`);
        }
        let qty = parseInt(document.getElementById('inpQuantity')?.value) || 0;
        if (qty > 0 && qty < papkaConfig.minQty) {
            qatorlar.push(`<span style="color:#dc2626;">⚠️ Eng kam buyurtma — ${papkaConfig.minQty} dona. Narx ${papkaConfig.minQty} dona uchun hisoblanmoqda.</span>`);
        }
        box.innerHTML = qatorlar.join('<br>');
    }

    function selectPapkaVariant(idx) {
        papkaSelected.variantIndex = idx;
        renderPapkaOptions();
        calculate();
    }

    function selectPapkaGsm(g) {
        papkaSelected.gsm = g;
        renderPapkaOptions();
        calculate();
    }

    function togglePapkaExtra(kind) {
        papkaSelected[kind] = !papkaSelected[kind];
        renderPapkaOptions();
        calculate();
    }

    // Real ofset hisobi: yoyilgan o'lcham, tanlangan Karton grammaji bilan, turga QAT'IY
    // biriktirilgan mashinada (A3 yoki A2) hisoblanadi — endi barcha mashinalar sinalmaydi.
    function calculatePapka(qty) {
        let v = papkaConfig.variants[papkaSelected.variantIndex] || papkaConfig.variants[0];
        let effectiveQty = Math.max(parseInt(qty) || 1, papkaConfig.minQty || 1);
        let gsm = papkaSelected.gsm || papkaConfig.defaultGsm;
        let machineKey = papkaMachineKey(v);

        let result = calculateOfsetForMachine(v.machine, v.flatW, v.flatH, effectiveQty, 1, 'Karton', gsm);

        let unit = 0;
        let ofsetInfo = '';
        // To'liq hisob-kitob modali uchun — ushbu buyurtmada NIMA va NECHTA ishlatilgani,
        // hamda har birining tannarxi (marjasiz) alohida-alohida ko'rsatiladi.
        let costItems = [];
        if (result) {
            unit = result.perPieceCostRaw;
            ofsetInfo = ` (${result.machine} mashina, ${result.itemsPerSheet} dona/varoq)`;
            costItems.push({ label: `Qog'oz (${result.paperName} ${result.paperGsm}gr, ${result.rawName})`, qty: `${result.totalSheets} xom varoq`, total: Math.round(result.totalPaperCost) });
            costItems.push({ label: 'Forma (klishe)', qty: `${result.totalPlates} plastina`, total: Math.round(result.totalPlateCost) });
            costItems.push({ label: 'Bosma (pechat)', qty: `${result.totalWorkingSheets} ta ${result.machine} varoq`, total: Math.round(result.totalPrintCost) });
        } else {
            showToast(`⚠️ Karton ${gsm}gr uchun ${v.machine} ofset bazasi topilmadi — admin panelda tekshiring.`);
        }

        // --- Barcha turlarga avtomatik, mijozga ko'rsatilmaydigan xizmatlar — narxi
        // umumiy ofsetFinishingServices'dan (Ofset admin bo'limi) olinadi. ---
        if (papkaConfig.laminatsiyaEnabled) {
            let laminatsiyaPerUnit = ofsetFinishingServices.laminatsiya[machineKey] || 0;
            if (laminatsiyaPerUnit > 0) {
                unit += laminatsiyaPerUnit;
                costItems.push({ label: 'Laminatsiya', qty: `${effectiveQty} dona`, total: Math.round(laminatsiyaPerUnit * effectiveQty) });
            }
        }
        if (papkaConfig.visochkaEnabled) {
            let visochkaTotal = papkaTieredTotal(effectiveQty, ofsetFinishingServices.visochka[machineKey]);
            if (visochkaTotal > 0) {
                unit += visochkaTotal / effectiveQty;
                costItems.push({ label: 'Visochka', qty: `${effectiveQty} dona`, total: Math.round(visochkaTotal) });
            }
        }
        if (v.hiddenFee > 0) {
            unit += v.hiddenFee;
            costItems.push({ label: "Karmashka+Yig'ish", qty: `${effectiveQty} dona`, total: Math.round(v.hiddenFee * effectiveQty) });
        }

        // --- Ixtiyoriy, mijoz/menejer tanlaydigan xizmatlar ---
        if (papkaSelected.lak) {
            let lakTotal = papkaTieredTotal(effectiveQty, ofsetFinishingServices.lak[machineKey]);
            unit += lakTotal / effectiveQty;
            costItems.push({ label: 'LAK', qty: `${effectiveQty} dona`, total: Math.round(lakTotal) });
        }
        if (papkaSelected.tisneniya) {
            let tis = ofsetFinishingServices.tisneniya[machineKey];
            unit += (tis.pricePerUnit || 0);
            if (tis.pricePerUnit > 0) costItems.push({ label: 'Tisneniya', qty: `${effectiveQty} dona`, total: Math.round(tis.pricePerUnit * effectiveQty) });
            if (tis.klishePrice > 0) {
                unit += (tis.klishePrice / effectiveQty);
                costItems.push({ label: 'Tisneniya klishesi (bir martalik)', qty: '1 marta', total: Math.round(tis.klishePrice) });
            }
        }

        let qismlar = [`Papka ${v.name} (${v.flatW}×${v.flatH}mm, Karton ${gsm}gr)${ofsetInfo}`];
        if (papkaSelected.lak) qismlar.push('LAK');
        if (papkaSelected.tisneniya) qismlar.push('Tisneniya + klishe');
        if (effectiveQty !== (parseInt(qty) || 1)) qismlar.push(`eng kam ${papkaConfig.minQty} donaga ko'tarildi`);

        updatePapkaInfo();
        return { unitPrice: unit, details: qismlar.join(' | '), effectiveQty, costItems };
    }

    // --- Papka admin muharriri ---

    function renderAdminPapkaTable() {
        let tbody = document.getElementById('adminPapkaVariantTableBody');
        if (tbody) {
            tbody.innerHTML = papkaConfig.variants.map((v, idx) => `
                <tr>
                    <td>${v.name}</td>
                    <td><input type="number" min="1" value="${v.flatW}" onchange="updatePapkaVariantField(${idx}, 'flatW', this.value)"></td>
                    <td><input type="number" min="1" value="${v.flatH}" onchange="updatePapkaVariantField(${idx}, 'flatH', this.value)"></td>
                    <td style="text-align:center; font-weight:700;">${v.machine}</td>
                    <td><input type="number" min="0" value="${v.hiddenFee || 0}" onchange="updatePapkaVariantField(${idx}, 'hiddenFee', this.value)"></td>
                </tr>
            `).join('');
        }
        let q = id => document.getElementById(id);
        if (q('papkaLaminatsiyaEnabled')) q('papkaLaminatsiyaEnabled').checked = !!papkaConfig.laminatsiyaEnabled;
        if (q('papkaVisochkaEnabled')) q('papkaVisochkaEnabled').checked = !!papkaConfig.visochkaEnabled;
        if (q('papkaMinQty')) q('papkaMinQty').value = papkaConfig.minQty;
    }

    function updatePapkaVariantField(idx, field, value) {
        if (!papkaConfig.variants[idx]) return;
        papkaConfig.variants[idx][field] = parseFloat(value) || 0;
    }

    function savePapkaConfig() {
        let son = (id, fallback) => {
            let el = document.getElementById(id);
            let v = el ? parseFloat(el.value) : NaN;
            return isNaN(v) ? fallback : v;
        };
        let laminatsiyaChk = document.getElementById('papkaLaminatsiyaEnabled');
        let visochkaChk = document.getElementById('papkaVisochkaEnabled');
        papkaConfig.laminatsiyaEnabled = laminatsiyaChk ? laminatsiyaChk.checked : papkaConfig.laminatsiyaEnabled;
        papkaConfig.visochkaEnabled = visochkaChk ? visochkaChk.checked : papkaConfig.visochkaEnabled;
        papkaConfig.minQty = Math.max(1, son('papkaMinQty', 100));
        localStorage.setItem('erp_papka_config', JSON.stringify(papkaConfig));
        if (typeof logAudit === 'function') {
            logAudit("Papka sozlamalari o'zgartirildi", `MOQ: ${papkaConfig.minQty}`);
        }
        showToast("💾 Papka sozlamalari saqlandi!");
    }

    // Eski (yangi A3/A2 + tiered strukturadan OLDINGI) saqlangan papkaConfig'ni yangi shaklga
    // moslashtiradi — eski `lak: {pricePerUnit}` / `tisneniya: {pricePerUnit,klishePrice}` kabi
    // "yassi" obyektlarni yangi standart (a3/a2 ichki kalitli) qiymatlar bilan almashtiradi,
    // aks holda eski saqlangan qiymatlar yangi strukturani "spread" orqali buzib qo'yardi.
    function migratePapkaConfig(saved, defaults) {
        let cfg = JSON.parse(JSON.stringify(defaults));
        if (!saved || typeof saved !== 'object') return cfg;

        if (Array.isArray(saved.variants)) {
            cfg.variants = defaults.variants.map(defV => {
                let sv = saved.variants.find(v => v.key === defV.key);
                if (!sv) return defV;
                return {
                    ...defV,
                    flatW: sv.flatW ?? defV.flatW,
                    flatH: sv.flatH ?? defV.flatH,
                    hiddenFee: (sv.hiddenFee !== undefined) ? sv.hiddenFee : (sv.extraFee !== undefined ? sv.extraFee : defV.hiddenFee)
                };
            });
        }
        if (Array.isArray(saved.paperGsmOptions) && saved.paperGsmOptions.length > 0) cfg.paperGsmOptions = saved.paperGsmOptions;
        if (typeof saved.defaultGsm === 'number') cfg.defaultGsm = saved.defaultGsm;
        // Eski saqlangan ma'lumotda laminatsiya/visochka narxlari alohida bo'lgan bo'lishi
        // mumkin edi — endi ular umumiy ofsetFinishingServices'dan olinadi, shuning uchun
        // bu yerda faqat yoqilgan/o'chirilgan bayrog'i o'qiladi (mavjud bo'lmasa — standart true,
        // ya'ni avvalgi "har doim yoqilgan" xatti-harakat saqlanadi).
        if (typeof saved.laminatsiyaEnabled === 'boolean') cfg.laminatsiyaEnabled = saved.laminatsiyaEnabled;
        if (typeof saved.visochkaEnabled === 'boolean') cfg.visochkaEnabled = saved.visochkaEnabled;
        // Lak/Tisneniya narxlari endi umumiy (ofsetFinishingServices) — eski saqlangan qiymatlar
        // init() da bir marta o'sha yerga ko'chiriladi, bu yerda o'qilmaydi.
        if (typeof saved.minQty === 'number') cfg.minQty = saved.minQty;
        if (typeof saved.infoText === 'string') cfg.infoText = saved.infoText;
        return cfg;
    }

    // ====================== KALENDAR (poligrafiya, 8 pastki tur) ======================
    // Qog'oz (Melovka/Karton) narxi hech qaerda takrorlanmaydi — Ofset (ofsetRawPapers) va,
    // faqat "compound" guruh bloki uchun, Raqamli (digitalPapersDatabase) bo'limining umumiy
    // bazasidan real narx qidiriladi (calculateResult_poligrafiya bilan bir xil naqsh). Imposition
    // ("necha dona bir varoqqa sig'adi") calculateOfsetForMachine() ichida allaqachon avtomatik.
    let kalendarConfig = {
        subtypes: [
            { key: 'desk_a6', name: 'A6 Stol kalendar', group: 'compound',
              blockW: 105, blockH: 148, coverW: 105, coverH: 148,
              listOptions: [7, 13], defaultListCount: 7, fixedListCount: null,
              blockGsmOptions: [105, 115, 130, 150, 170, 200, 250, 300], defaultBlockGsm: 150,
              coverGsmOptions: [250, 300, 350], defaultCoverGsm: 250,
              hardCoverOptions: [ { key: 'standart', name: 'Standart qattiq muqova', price: 15000 } ],
              extras: { laminatsiya: { price: 0 }, prujina: { price: 0 }, yigish: { price: 0 }, tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'desk_a5', name: 'A5 Stol kalendar', group: 'compound',
              blockW: 148, blockH: 210, coverW: 148, coverH: 210,
              listOptions: [7, 13], defaultListCount: 7, fixedListCount: null,
              blockGsmOptions: [105, 115, 130, 150, 170, 200, 250, 300], defaultBlockGsm: 150,
              coverGsmOptions: [250, 300, 350], defaultCoverGsm: 250,
              hardCoverOptions: [ { key: 'standart', name: 'Standart qattiq muqova', price: 18000 } ],
              extras: { laminatsiya: { price: 0 }, prujina: { price: 0 }, yigish: { price: 0 }, tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'desk_a4', name: 'A4 Stol kalendar', group: 'compound',
              blockW: 210, blockH: 297, coverW: 210, coverH: 297,
              listOptions: [7, 13], defaultListCount: 7, fixedListCount: null,
              blockGsmOptions: [105, 115, 130, 150, 170, 200, 250, 300], defaultBlockGsm: 150,
              coverGsmOptions: [250, 300, 350], defaultCoverGsm: 250,
              hardCoverOptions: [ { key: 'standart', name: 'Standart qattiq muqova', price: 22000 } ],
              extras: { laminatsiya: { price: 0 }, prujina: { price: 0 }, yigish: { price: 0 }, tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'wall_quarter', name: 'Devoriy kvartal kalendar', group: 'compound',
              blockW: 297, blockH: 210, coverW: 297, coverH: 210,
              listOptions: null, defaultListCount: null, fixedListCount: 4,
              blockGsmOptions: [105, 115, 130, 150, 170, 200, 250, 300], defaultBlockGsm: 150,
              coverGsmOptions: [250, 300, 350], defaultCoverGsm: 250,
              hardCoverOptions: null,
              extras: { laminatsiya: { price: 0 }, prujina: { price: 0 }, yigish: { price: 0 }, tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'wall_flip', name: 'Devoriy varaqlanadigan kalendar', group: 'compound',
              blockW: 297, blockH: 210, coverW: 297, coverH: 210,
              listOptions: null, defaultListCount: null, fixedListCount: 13,
              blockGsmOptions: [105, 115, 130, 150, 170, 200, 250, 300], defaultBlockGsm: 150,
              coverGsmOptions: [250, 300, 350], defaultCoverGsm: 250,
              hardCoverOptions: null,
              extras: { laminatsiya: { price: 0 }, prujina: { price: 0 }, yigish: { price: 0 }, tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'poster_a3', name: 'Plakat kalendar A3', group: 'poster', w: 297, h: 420, machine: 'A3',
              gsmOptions: [200, 250, 300], defaultGsm: 250,
              extras: { tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'poster_a2', name: 'Plakat kalendar A2', group: 'poster', w: 420, h: 594, machine: 'A2',
              gsmOptions: [200, 250, 300], defaultGsm: 250,
              extras: { tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'pocket', name: 'Karmanniy kalendar', group: 'pocket', w: 70, h: 100,
              gsmOptions: [200, 250, 300], defaultGsm: 250,
              extras: { tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } }
        ]
    };

    let kalendarSelected = {
        subtypeIndex: 0, listCount: 7, coverType: 'soft', hardCoverIndex: 0,
        blockGsm: 150, coverGsm: 250, gsm: 250, engine: 'ofset', sides: 2,
        extras: { tisneniya: false, lak: false }
    };

    function resetKalendarSelectedForSubtype(idx) {
        let s = kalendarConfig.subtypes[idx] || kalendarConfig.subtypes[0];
        kalendarSelected.subtypeIndex = idx;
        kalendarSelected.listCount = s.defaultListCount || (s.listOptions ? s.listOptions[0] : null);
        kalendarSelected.coverType = 'soft';
        kalendarSelected.hardCoverIndex = 0;
        kalendarSelected.blockGsm = s.defaultBlockGsm || null;
        kalendarSelected.coverGsm = s.defaultCoverGsm || null;
        kalendarSelected.gsm = s.defaultGsm || null;
        kalendarSelected.engine = 'ofset';
        kalendarSelected.sides = (s.group === 'compound') ? 2 : 1;
        kalendarSelected.extras = { tisneniya: false, lak: false };
    }

    function buildKalendarForm() {
        let startIdx = (kalendarSelected.subtypeIndex >= 0 && kalendarConfig.subtypes[kalendarSelected.subtypeIndex]) ? kalendarSelected.subtypeIndex : 0;
        resetKalendarSelectedForSubtype(startIdx);
        return `
            <div class="step-title">Kalendar turi:</div>
            <div class="options-group" id="kalendarSubtypeGroup"></div>

            <div id="kalendarDynamicOptions"></div>

            <div class="form-group" style="margin-top:16px;">
                <label>Adad (dona):</label>
                <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate()">
            </div>
        `;
    }

    function renderKalendarOptions() {
        const group = document.getElementById('kalendarSubtypeGroup');
        if (!group) return;
        group.innerHTML = kalendarConfig.subtypes.map((s, idx) => `
            <button class="opt-btn ${idx === kalendarSelected.subtypeIndex ? 'active' : ''}"
                    onclick="selectKalendarSubtype(${idx})">${s.name}</button>
        `).join('');
        renderKalendarDynamicOptions();
    }

    function selectKalendarSubtype(idx) {
        resetKalendarSelectedForSubtype(idx);
        renderKalendarOptions();
        calculate();
    }

    const KALENDAR_EXTRA_LABELS = { laminatsiya: '🧴 Laminatsiya', prujina: '🌀 Prujina', yigish: "🧷 Yig'ish", tisneniya: '🔨 Tisneniya', lak: '✨ LAK' };
    // Laminatsiya/Prujina/Yig'ish — mijoz/menejer tanlamaydi, admin narx kiritsa har doim
    // qo'shiladi (calculateKalendar() ichida). Faqat shu ikkitasi menejerga tugma sifatida chiqadi.
    const KALENDAR_TOGGLEABLE_EXTRAS = ['tisneniya', 'lak'];

    function renderKalendarDynamicOptions() {
        let box = document.getElementById('kalendarDynamicOptions');
        if (!box) return;
        let s = kalendarConfig.subtypes[kalendarSelected.subtypeIndex] || kalendarConfig.subtypes[0];
        let html = '';

        if (s.group === 'compound') {
            if (s.listOptions && s.listOptions.length > 0) {
                html += `
                    <div class="step-title" style="margin-top:16px;">Blok varaq soni:</div>
                    <div class="options-group" id="kalendarListGroup">
                        ${s.listOptions.map(n => `<button class="opt-btn ${kalendarSelected.listCount === n ? 'active' : ''}" onclick="selectKalendarListCount(${n})">${n} varaqli</button>`).join('')}
                    </div>`;
            } else {
                html += `
                    <div class="poli-spec-row poli-spec-row-muted">
                        <div class="poli-spec-icon">📄</div>
                        <div><div class="poli-spec-label">Blok varaq soni</div><div class="poli-spec-value">${s.fixedListCount} varaq (belgilangan)</div></div>
                    </div>`;
            }

            if (s.hardCoverOptions) {
                html += `
                    <div class="step-title" style="margin-top:16px;">Muqova turi:</div>
                    <div class="options-group" id="kalendarCoverTypeGroup">
                        <button class="opt-btn ${kalendarSelected.coverType === 'soft' ? 'active' : ''}" onclick="selectKalendarCoverType('soft')">Oddiy muqova</button>
                        <button class="opt-btn ${kalendarSelected.coverType === 'hard' ? 'active' : ''}" onclick="selectKalendarCoverType('hard')">Qattiq muqova</button>
                    </div>`;
                if (kalendarSelected.coverType === 'hard' && s.hardCoverOptions.length > 0) {
                    html += `
                    <div class="options-group" id="kalendarHardCoverGroup">
                        ${s.hardCoverOptions.map((h, idx) => `<button class="opt-btn ${kalendarSelected.hardCoverIndex === idx ? 'active' : ''}" onclick="selectKalendarHardCover(${idx})">${h.name}</button>`).join('')}
                    </div>`;
                }
            }

            html += `
                <div class="step-title" style="margin-top:16px;">Blok qog'ozi grammaji:</div>
                <div class="options-group" id="kalendarBlockGsmGroup">
                    ${s.blockGsmOptions.map(g => `<button class="opt-btn ${kalendarSelected.blockGsm === g ? 'active' : ''}" onclick="selectKalendarBlockGsm(${g})">${g}gr</button>`).join('')}
                </div>`;

            if (kalendarSelected.coverType !== 'hard') {
                html += `
                <div class="step-title" style="margin-top:16px;">${s.fixedListCount != null ? 'Asos (karton) grammaji' : 'Muqova (karton) grammaji'}:</div>
                <div class="options-group" id="kalendarCoverGsmGroup">
                    ${s.coverGsmOptions.map(g => `<button class="opt-btn ${kalendarSelected.coverGsm === g ? 'active' : ''}" onclick="selectKalendarCoverGsm(${g})">${g}gr</button>`).join('')}
                </div>`;
            }

            html += `
                <div class="step-title" style="margin-top:16px;">Pechat usuli (blok):</div>
                <div class="options-group" id="kalendarEngineGroup">
                    <button class="opt-btn ${kalendarSelected.engine === 'ofset' ? 'active' : ''}" onclick="selectKalendarEngine('ofset')">🖨️ Ofset Pechat</button>
                    <button class="opt-btn ${kalendarSelected.engine === 'raqamli' ? 'active' : ''}" onclick="selectKalendarEngine('raqamli')">🖥️ Raqamli Pechat</button>
                </div>`;
        } else {
            html += `
                <div class="step-title" style="margin-top:16px;">Qog'oz grammaji:</div>
                <div class="options-group" id="kalendarGsmGroup">
                    ${s.gsmOptions.map(g => `<button class="opt-btn ${kalendarSelected.gsm === g ? 'active' : ''}" onclick="selectKalendarGsm(${g})">${g}gr</button>`).join('')}
                </div>`;
        }

        html += `
            <div class="step-title" style="margin-top:16px;">Bosma tomoni:</div>
            <div class="options-group" id="kalendarSidesGroup">
                <button class="opt-btn ${kalendarSelected.sides === 1 ? 'active' : ''}" onclick="selectKalendarSides(1)">Bir tomonlama</button>
                <button class="opt-btn ${kalendarSelected.sides === 2 ? 'active' : ''}" onclick="selectKalendarSides(2)">Ikki tomonlama</button>
            </div>`;

        // Laminatsiya/Prujina/Yig'ish mijoz/menejerdan yashirilgan — admin narx kiritsa,
        // avtomatik (har doim) qo'shiladi. Faqat haqiqiy ixtiyoriy qo'shimchalar (Tisneniya/LAK)
        // tugma sifatida ko'rsatiladi.
        let extraKeys = Object.keys(s.extras || {}).filter(k => KALENDAR_TOGGLEABLE_EXTRAS.includes(k));
        if (extraKeys.length > 0) {
            html += `
                <div class="step-title" style="margin-top:16px;">Qo'shimcha ishlovlar:</div>
                <div class="options-group" id="kalendarExtrasGroup">
                    ${extraKeys.map(k => `<button class="opt-btn ${kalendarSelected.extras[k] ? 'active' : ''}" onclick="toggleKalendarExtra('${k}')">${KALENDAR_EXTRA_LABELS[k] || k}</button>`).join('')}
                </div>`;
        }

        box.innerHTML = html;
        updateKalendarInfo();
    }

    function selectKalendarListCount(n) { kalendarSelected.listCount = n; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarCoverType(type) { kalendarSelected.coverType = type; kalendarSelected.hardCoverIndex = 0; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarHardCover(idx) { kalendarSelected.hardCoverIndex = idx; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarBlockGsm(g) { kalendarSelected.blockGsm = g; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarCoverGsm(g) { kalendarSelected.coverGsm = g; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarGsm(g) { kalendarSelected.gsm = g; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarEngine(e) { kalendarSelected.engine = e; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarSides(sd) { kalendarSelected.sides = sd; renderKalendarDynamicOptions(); calculate(); }
    function toggleKalendarExtra(key) { kalendarSelected.extras[key] = !kalendarSelected.extras[key]; renderKalendarDynamicOptions(); calculate(); }

    function updateKalendarInfo() {
        let box = document.getElementById('kalendarInfoText');
        let wrap = document.getElementById('kalendarInfoBox');
        if (!box || !wrap) return;
        let s = kalendarConfig.subtypes[kalendarSelected.subtypeIndex] || kalendarConfig.subtypes[0];
        let qismlar = [];
        if (s.group === 'compound') {
            qismlar.push(`<b>${s.name}</b> — blok: ${s.blockW}×${s.blockH}mm, ${s.fixedListCount != null ? 'asos' : 'muqova'}: ${s.coverW}×${s.coverH}mm`);
        } else {
            qismlar.push(`<b>${s.name}</b> — o'lcham: ${s.w}×${s.h}mm`);
        }
        if (kalendarSelected.extras.tisneniya && s.extras.tisneniya && s.extras.tisneniya.klishePrice > 0) {
            qismlar.push(`Tisneniya klishesi: <b>${s.extras.tisneniya.klishePrice.toLocaleString('ru-RU')} so'm</b> (bir martalik, adadga bo'linadi)`);
        }
        wrap.style.display = 'block';
        box.innerHTML = qismlar.join('<br>');
    }

    // Bloklar/muqova narxi hech qaerda takrorlanmaydi — Ofset (ofsetRawPapers) va Raqamli
    // (digitalPapersDatabase) bo'limining umumiy bazasidan haqiqiy narx qidiriladi
    // (calculateResult_poligrafiya bilan bir xil naqsh). Imposition (necha dona bir varoqqa
    // sig'adi) calculateOfsetForMachine() ichida allaqachon avtomatik hisoblanadi.
    function calculateKalendar(qty) {
        let s = kalendarConfig.subtypes[kalendarSelected.subtypeIndex] || kalendarConfig.subtypes[0];
        qty = Math.max(parseInt(qty) || 1, 1);
        let unit = 0;
        let qismlar = [];
        // To'liq hisob-kitob modali uchun — ushbu buyurtmada NIMA va NECHTA ishlatilgani,
        // hamda har birining tannarxi (marjasiz) alohida-alohida ko'rsatiladi.
        let costItems = [];

        if (s.group === 'compound') {
            let listCount = (s.fixedListCount != null) ? s.fixedListCount : (kalendarSelected.listCount || (s.listOptions ? s.listOptions[0] : 1));

            // --- BLOK ---
            let blockUnit = 0;
            let blockInfo = '';
            let blockQty = qty * listCount;
            let blockResult = null;
            if (kalendarSelected.engine === 'raqamli') {
                let paperEntry = (typeof digitalPapersDatabase !== 'undefined') ? digitalPapersDatabase.find(p => {
                    let m = /(\d+)/.exec(p.name || '');
                    return m && parseInt(m[1]) === kalendarSelected.blockGsm;
                }) : null;
                if (paperEntry) {
                    let r = calculateDigitalPriceForPaper(paperEntry, s.blockW, s.blockH, blockQty, kalendarSelected.sides);
                    if (r) { blockUnit = r.unitPrice; blockInfo = 'Raqamli Pechat'; }
                }
            } else {
                let results = ['A3', 'A2', 'A1']
                    .map(m => calculateOfsetForMachine(m, s.blockW, s.blockH, blockQty, kalendarSelected.sides, 'Melovka', kalendarSelected.blockGsm))
                    .filter(Boolean);
                if (results.length > 0) {
                    results.sort((a, b) => a.perPieceCostRaw - b.perPieceCostRaw);
                    blockResult = results[0];
                    blockUnit = blockResult.perPieceCostRaw;
                    blockInfo = `Ofset (${blockResult.machine})`;
                }
            }
            if (blockInfo) {
                unit += blockUnit * listCount;
                qismlar.push(`Blok: ${listCount} varaq × ${s.blockW}×${s.blockH}mm, Melovka ${kalendarSelected.blockGsm}gr (${blockInfo})`);
                if (blockResult) {
                    costItems.push({ label: `Blok qog'ozi (${blockResult.paperName} ${blockResult.paperGsm}gr, ${blockResult.rawName})`, qty: `${blockResult.totalSheets} xom varoq`, total: Math.round(blockResult.totalPaperCost) });
                    costItems.push({ label: 'Blok forma (klishe)', qty: `${blockResult.totalPlates} plastina`, total: Math.round(blockResult.totalPlateCost) });
                    costItems.push({ label: 'Blok bosma (pechat)', qty: `${blockResult.totalWorkingSheets} ta ${blockResult.machine} varoq`, total: Math.round(blockResult.totalPrintCost) });
                } else {
                    costItems.push({ label: `Blok (${blockInfo}, ${listCount} varaq/nusxa)`, qty: `${qty} nusxa`, total: Math.round(blockUnit * listCount * qty) });
                }
            } else {
                showToast(`⚠️ Blok uchun ${kalendarSelected.blockGsm}gr Melovka bazasi topilmadi — admin panelda tekshiring.`);
            }

            // --- MUQOVA / ASOS ---
            if (kalendarSelected.coverType === 'hard' && s.hardCoverOptions && s.hardCoverOptions.length > 0) {
                let hc = s.hardCoverOptions[kalendarSelected.hardCoverIndex] || s.hardCoverOptions[0];
                unit += (hc.price || 0);
                qismlar.push(`Muqova: ${hc.name} (${(hc.price || 0).toLocaleString()} so'm/dona)`);
                costItems.push({ label: `Muqova (${hc.name})`, qty: `${qty} dona`, total: Math.round((hc.price || 0) * qty) });
            } else {
                let coverResults = ['A3', 'A2', 'A1']
                    .map(m => calculateOfsetForMachine(m, s.coverW, s.coverH, qty, 1, 'Karton', kalendarSelected.coverGsm))
                    .filter(Boolean);
                if (coverResults.length > 0) {
                    coverResults.sort((a, b) => a.perPieceCostRaw - b.perPieceCostRaw);
                    let cr = coverResults[0];
                    unit += cr.perPieceCostRaw;
                    let coverLabel = s.fixedListCount != null ? 'Asos' : 'Muqova';
                    qismlar.push(`${coverLabel}: Karton ${kalendarSelected.coverGsm}gr (Ofset ${cr.machine})`);
                    costItems.push({ label: `${coverLabel} qog'ozi (${cr.paperName} ${cr.paperGsm}gr, ${cr.rawName})`, qty: `${cr.totalSheets} xom varoq`, total: Math.round(cr.totalPaperCost) });
                    costItems.push({ label: `${coverLabel} forma (klishe)`, qty: `${cr.totalPlates} plastina`, total: Math.round(cr.totalPlateCost) });
                    costItems.push({ label: `${coverLabel} bosma (pechat)`, qty: `${cr.totalWorkingSheets} ta ${cr.machine} varoq`, total: Math.round(cr.totalPrintCost) });
                } else {
                    showToast(`⚠️ ${s.fixedListCount != null ? 'Asos' : 'Muqova'} uchun ${kalendarSelected.coverGsm}gr Karton bazasi topilmadi — admin panelda tekshiring.`);
                }
            }
        } else if (s.group === 'poster') {
            let r = calculateOfsetForMachine(s.machine, s.w, s.h, qty, kalendarSelected.sides, 'Melovka', kalendarSelected.gsm);
            if (r) {
                unit += r.perPieceCostRaw;
                qismlar.push(`${s.name}: ${s.w}×${s.h}mm, Melovka ${kalendarSelected.gsm}gr (Ofset ${r.machine}, ${r.itemsPerSheet} dona/varoq)`);
                costItems.push({ label: `Qog'oz (${r.paperName} ${r.paperGsm}gr, ${r.rawName})`, qty: `${r.totalSheets} xom varoq`, total: Math.round(r.totalPaperCost) });
                costItems.push({ label: 'Forma (klishe)', qty: `${r.totalPlates} plastina`, total: Math.round(r.totalPlateCost) });
                costItems.push({ label: 'Bosma (pechat)', qty: `${r.totalWorkingSheets} ta ${r.machine} varoq`, total: Math.round(r.totalPrintCost) });
            } else {
                showToast(`⚠️ ${kalendarSelected.gsm}gr Melovka uchun ${s.machine} ofset bazasi topilmadi — admin panelda tekshiring.`);
            }
        } else if (s.group === 'pocket') {
            let r = calculateOfsetForMachine('A3', s.w, s.h, qty, kalendarSelected.sides, 'Melovka', kalendarSelected.gsm);
            if (r) {
                unit += r.perPieceCostRaw;
                qismlar.push(`${s.name}: ${s.w}×${s.h}mm, Melovka ${kalendarSelected.gsm}gr (Ofset A3, ${r.itemsPerSheet} dona/varoq — optimal joylashtirilgan)`);
                costItems.push({ label: `Qog'oz (${r.paperName} ${r.paperGsm}gr, ${r.rawName})`, qty: `${r.totalSheets} xom varoq`, total: Math.round(r.totalPaperCost) });
                costItems.push({ label: 'Forma (klishe)', qty: `${r.totalPlates} plastina`, total: Math.round(r.totalPlateCost) });
                costItems.push({ label: 'Bosma (pechat)', qty: `${r.totalWorkingSheets} ta ${r.machine} varoq`, total: Math.round(r.totalPrintCost) });
            } else {
                showToast(`⚠️ ${kalendarSelected.gsm}gr Melovka uchun A3 ofset bazasi topilmadi — admin panelda tekshiring.`);
            }
        }

        // --- Laminatsiya/Prujina/Yig'ish: mijoz/menejer tanlamaydi — admin narxi bo'lsa
        // doim (avtomatik) qo'shiladi. Tisneniya/LAK — haqiqiy ixtiyoriy, menejer tanlaydi.
        let extras = s.extras || {};
        if (extras.laminatsiya) {
            unit += (extras.laminatsiya.price || 0);
            qismlar.push('Laminatsiya');
            costItems.push({ label: 'Laminatsiya', qty: `${qty} dona`, total: Math.round((extras.laminatsiya.price || 0) * qty) });
        }
        if (extras.prujina) {
            unit += (extras.prujina.price || 0);
            qismlar.push('Prujina');
            costItems.push({ label: 'Prujina', qty: `${qty} dona`, total: Math.round((extras.prujina.price || 0) * qty) });
        }
        if (extras.yigish) {
            unit += (extras.yigish.price || 0);
            qismlar.push("Yig'ish");
            costItems.push({ label: "Yig'ish", qty: `${qty} dona`, total: Math.round((extras.yigish.price || 0) * qty) });
        }
        if (kalendarSelected.extras.tisneniya && extras.tisneniya) {
            unit += (extras.tisneniya.price || 0);
            costItems.push({ label: 'Tisneniya', qty: `${qty} dona`, total: Math.round((extras.tisneniya.price || 0) * qty) });
            if (extras.tisneniya.klishePrice > 0) {
                unit += (extras.tisneniya.klishePrice / qty);
                costItems.push({ label: 'Tisneniya klishesi (bir martalik)', qty: '1 marta', total: Math.round(extras.tisneniya.klishePrice) });
            }
            qismlar.push('Tisneniya' + (extras.tisneniya.klishePrice > 0 ? ' + klishe' : ''));
        }
        if (kalendarSelected.extras.lak && extras.lak) {
            unit += (extras.lak.price || 0);
            qismlar.push('LAK');
            costItems.push({ label: 'LAK', qty: `${qty} dona`, total: Math.round((extras.lak.price || 0) * qty) });
        }

        updateKalendarInfo();
        return { unitPrice: unit, details: qismlar.join(' | ') || s.name, costItems };
    }

    // --- Kalendar admin muharriri ---

    function renderAdminKalendarTables() {
        let box = document.getElementById('kalendarSubtypesAdminContainer');
        if (!box) return;

        box.innerHTML = kalendarConfig.subtypes.map((s, idx) => {
            let dimsHtml = '';
            if (s.group === 'compound') {
                let coverLabel = s.fixedListCount != null ? 'Asos' : 'Muqova';
                dimsHtml = `
                    <div class="form-row">
                        <div class="form-group"><label>Blok eni (mm):</label><input type="number" min="1" value="${s.blockW}" onchange="updKalendarField(${idx},'blockW',this.value)"></div>
                        <div class="form-group"><label>Blok bo'yi (mm):</label><input type="number" min="1" value="${s.blockH}" onchange="updKalendarField(${idx},'blockH',this.value)"></div>
                        <div class="form-group"><label>${coverLabel} eni (mm):</label><input type="number" min="1" value="${s.coverW}" onchange="updKalendarField(${idx},'coverW',this.value)"></div>
                        <div class="form-group"><label>${coverLabel} bo'yi (mm):</label><input type="number" min="1" value="${s.coverH}" onchange="updKalendarField(${idx},'coverH',this.value)"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Standart blok grammaji:</label>
                            <select onchange="updKalendarField(${idx},'defaultBlockGsm',this.value)">
                                ${s.blockGsmOptions.map(g => `<option value="${g}" ${g === s.defaultBlockGsm ? 'selected' : ''}>${g}gr</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group"><label>Standart ${coverLabel.toLowerCase()} grammaji:</label>
                            <select onchange="updKalendarField(${idx},'defaultCoverGsm',this.value)">
                                ${s.coverGsmOptions.map(g => `<option value="${g}" ${g === s.defaultCoverGsm ? 'selected' : ''}>${g}gr</option>`).join('')}
                            </select>
                        </div>
                        ${s.fixedListCount != null
                            ? `<div class="form-group"><label>Blok varaq soni (qat'iy):</label><input type="number" min="1" value="${s.fixedListCount}" onchange="updKalendarField(${idx},'fixedListCount',this.value)"></div>`
                            : `<div class="form-group"><label>Standart varaq soni:</label>
                                 <select onchange="updKalendarField(${idx},'defaultListCount',this.value)">
                                     ${(s.listOptions || []).map(n => `<option value="${n}" ${n === s.defaultListCount ? 'selected' : ''}>${n} varaqli</option>`).join('')}
                                 </select></div>`}
                    </div>`;
                if (s.hardCoverOptions) {
                    dimsHtml += `
                    <div style="margin-top:8px;">
                        <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">Qattiq muqova narx jadvali:</label>
                        <table class="admin-table" style="margin-top:6px;">
                            <thead><tr><th>Nomi</th><th style="width:160px;">Narxi (so'm/dona)</th><th style="width:60px;"></th></tr></thead>
                            <tbody>
                                ${s.hardCoverOptions.map((h, hIdx) => `
                                    <tr>
                                        <td><input type="text" value="${h.name}" onchange="updKalendarHardCoverField(${idx},${hIdx},'name',this.value)"></td>
                                        <td><input type="number" min="0" value="${h.price || 0}" onchange="updKalendarHardCoverField(${idx},${hIdx},'price',this.value)"></td>
                                        <td><button class="btn btn-outline" style="padding:4px 8px;" onclick="removeKalendarHardCover(${idx},${hIdx})">✕</button></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                        <button class="btn btn-outline" style="margin-top:6px; padding:4px 10px; font-size:0.78rem;" onclick="addKalendarHardCover(${idx})">+ Qattiq muqova varianti</button>
                    </div>`;
                }
            } else {
                dimsHtml = `
                    <div class="form-row">
                        <div class="form-group"><label>Eni (mm):</label><input type="number" min="1" value="${s.w}" onchange="updKalendarField(${idx},'w',this.value)"></div>
                        <div class="form-group"><label>Bo'yi (mm):</label><input type="number" min="1" value="${s.h}" onchange="updKalendarField(${idx},'h',this.value)"></div>
                        <div class="form-group"><label>Standart grammaj:</label>
                            <select onchange="updKalendarField(${idx},'defaultGsm',this.value)">
                                ${s.gsmOptions.map(g => `<option value="${g}" ${g === s.defaultGsm ? 'selected' : ''}>${g}gr</option>`).join('')}
                            </select>
                        </div>
                    </div>`;
            }

            let extraKeys = Object.keys(s.extras || {});
            let extrasHtml = `<div class="form-row">` + extraKeys.map(k => {
                let e = s.extras[k];
                let klisheField = (k === 'tisneniya') ? `
                    <div class="form-group"><label>${KALENDAR_EXTRA_LABELS[k]} klishesi (bir martalik):</label><input type="number" min="0" value="${e.klishePrice || 0}" onchange="updKalendarExtraField(${idx},'${k}','klishePrice',this.value)"></div>` : '';
                return `
                    <div class="form-group"><label>${KALENDAR_EXTRA_LABELS[k]} (so'm/dona):</label><input type="number" min="0" value="${e.price || 0}" onchange="updKalendarExtraField(${idx},'${k}','price',this.value)"></div>
                    ${klisheField}`;
            }).join('') + `</div>`;

            return `
                <div class="add-pen-card" style="margin-bottom:14px; border:1px solid var(--border, #e2e8f0);">
                    <div class="add-pen-card-title" style="font-size:0.92rem;">${s.name}</div>
                    ${dimsHtml}
                    ${extrasHtml}
                </div>`;
        }).join('');
    }

    function updKalendarField(idx, field, value) {
        let s = kalendarConfig.subtypes[idx];
        if (!s) return;
        const numericFields = ['blockW', 'blockH', 'coverW', 'coverH', 'w', 'h', 'defaultBlockGsm', 'defaultCoverGsm', 'defaultGsm', 'defaultListCount', 'fixedListCount'];
        s[field] = numericFields.includes(field) ? (parseFloat(value) || 0) : value;
    }

    function updKalendarExtraField(idx, extraKey, field, value) {
        let s = kalendarConfig.subtypes[idx];
        if (!s || !s.extras || !s.extras[extraKey]) return;
        s.extras[extraKey][field] = parseFloat(value) || 0;
    }

    function updKalendarHardCoverField(idx, hIdx, field, value) {
        let s = kalendarConfig.subtypes[idx];
        if (!s || !s.hardCoverOptions || !s.hardCoverOptions[hIdx]) return;
        s.hardCoverOptions[hIdx][field] = (field === 'price') ? (parseFloat(value) || 0) : value;
    }

    function addKalendarHardCover(idx) {
        let s = kalendarConfig.subtypes[idx];
        if (!s) return;
        if (!s.hardCoverOptions) s.hardCoverOptions = [];
        s.hardCoverOptions.push({ key: 'variant_' + Date.now(), name: 'Yangi variant', price: 0 });
        renderAdminKalendarTables();
    }

    function removeKalendarHardCover(idx, hIdx) {
        let s = kalendarConfig.subtypes[idx];
        if (!s || !s.hardCoverOptions) return;
        if (s.hardCoverOptions.length <= 1) { showToast("⚠️ Kamida bitta qattiq muqova varianti qolishi kerak."); return; }
        s.hardCoverOptions.splice(hIdx, 1);
        renderAdminKalendarTables();
    }

    function saveKalendarConfig() {
        localStorage.setItem('erp_kalendar_config', JSON.stringify(kalendarConfig));
        if (typeof logAudit === 'function') {
            logAudit("Kalendar sozlamalari o'zgartirildi", `${kalendarConfig.subtypes.length} ta pastki tur yangilandi`);
        }
        showToast("💾 Kalendar sozlamalari saqlandi!");
    }

    // ====================== DOORHANGER (poligrafiya, FAQAT A3 ofset, majburiy CHUJOY) ======================
    // O'lchami (95x210mm) — ilgak/kesim joylashuvi sabab bosma plastinasini "aylantirib"
    // (SVOY) bosib bo'lmaydi, garchi bitta A3 varoqqa 6 dona (juft son) sig'sa ham — shuning
    // uchun old/orqa tomon uchun har doim ALOHIDA forma/bosma (CHUJOY) majburiy qilinadi
    // (calculateOfsetForMachine'ning forceChujoy parametri orqali). Qog'oz grammaji tanlovi
    // (poligrafiyaGsmDatabase.doorhanger) o'zgarishsiz — admin mavjud "Ruxsat etilgan Qog'oz
    // Grammajlari" panelida boshqaradi. Visochka (osish uchun teshik) — barcha buyurtmalarga
    // avtomatik, mijozga ko'rsatilmaydigan, tiered narx (Papka'dagi bilan bir xil naqsh).
    let doorhangerConfig = {
        paperType: 'Karton',
        // Narxi endi "Ofset pechat kalkulyatori" admin bo'limidagi umumiy Visochka
        // sozlamasidan (ofsetFinishingServices.visochka.a3) olinadi — bu yerda faqat
        // Doorhanger shu xizmatdan foydalanadimi-yo'qmi belgilanadi.
        visochkaEnabled: true
    };

    function renderAdminDoorhangerConfig() {
        let q = id => document.getElementById(id);
        if (q('doorhangerVisochkaEnabled')) q('doorhangerVisochkaEnabled').checked = !!doorhangerConfig.visochkaEnabled;
    }

    function saveDoorhangerConfig() {
        let chk = document.getElementById('doorhangerVisochkaEnabled');
        doorhangerConfig.visochkaEnabled = chk ? chk.checked : doorhangerConfig.visochkaEnabled;
        localStorage.setItem('erp_doorhanger_config', JSON.stringify(doorhangerConfig));
        if (typeof logAudit === 'function') {
            logAudit("Doorhanger sozlamalari o'zgartirildi", `Visochka ishlatiladi: ${doorhangerConfig.visochkaEnabled ? 'ha' : 'yo\'q'}`);
        }
        showToast("💾 Doorhanger sozlamalari saqlandi!");
    }

    // Doorhanger uchun mavjud generic poligrafiya HTML shabloni ishlatilmaydi — chunki
    // Pechat usuli (Ofset/Raqamli) va Bosma tomoni (1/2) tanlovlari umuman ko'rsatilmasligi
    // kerak (ikkalasi ham qat'iy belgilangan: faqat Ofset, faqat Chujoy).
    function buildDoorhangerForm() {
        let gsmList = poligrafiyaGsmDatabase.doorhanger || [];
        let defaultIdx = gsmList.findIndex(g => g.isDefault);
        selectedPoligrafiyaGsmIndex = defaultIdx >= 0 ? defaultIdx : 0;
        return `
            <div class="poli-calc">
                <div class="poli-spec-row">
                    <div class="poli-spec-icon">📐</div>
                    <div>
                        <div class="poli-spec-label">Standart o'lcham</div>
                        <div class="poli-spec-value">${poligrafiyaSizeLabels.doorhanger}</div>
                    </div>
                </div>
                <div class="step-title">Qog'oz grammaji</div>
                <div class="poli-paper-grid" id="poligrafiyaGsmGroup"></div>
                <div class="poli-spec-row poli-spec-row-muted">
                    <div class="poli-spec-icon">🖨️</div>
                    <div>
                        <div class="poli-spec-label">Pechat usuli</div>
                        <div class="poli-spec-value">Faqat Ofset (A3, ikki tomonlama — Chujoy)</div>
                    </div>
                </div>
                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function calculateDoorhanger(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let gsmList = poligrafiyaGsmDatabase.doorhanger || [];
        let g = gsmList[selectedPoligrafiyaGsmIndex] || gsmList.find(x => x.isDefault) || gsmList[0];
        let costItems = [];
        let unit = 0;
        let details;

        if (!g) {
            return { details: '⚠️ Doorhanger uchun grammaj bazasi topilmadi — admin panelda tekshiring.', baseUnitPrice: 0, costItems: [] };
        }

        let paperTypeName = g.paperType || doorhangerConfig.paperType || 'Karton';
        let size = parsePoligrafiyaSizeLabel(poligrafiyaSizeLabels.doorhanger);
        let r = size ? calculateOfsetForMachine('A3', size.w, size.h, qty, 2, paperTypeName, g.gsm, true) : null;

        if (r) {
            unit += r.perPieceCostRaw;
            costItems.push({ label: `Qog'oz (${r.paperName} ${r.paperGsm}gr, ${r.rawName})`, qty: `${r.totalSheets} xom varoq`, total: Math.round(r.totalPaperCost) });
            costItems.push({ label: 'Forma (klishe, Chujoy — 8 plastina)', qty: `${r.totalPlates} plastina`, total: Math.round(r.totalPlateCost) });
            costItems.push({ label: 'Bosma (pechat, Chujoy)', qty: `${r.totalWorkingSheets} ta A3 varoq`, total: Math.round(r.totalPrintCost) });
            details = `Doorhanger chop etish (${poligrafiyaSizeLabels.doorhanger}) | ${paperTypeName} ${g.gsm}gr | Ofset A3 | Chujoy (ikki tomonlama)`;
        } else {
            details = `⚠️ ${paperTypeName} ${g.gsm}gr uchun Ofset A3 bazasi topilmadi — admin panelda tekshiring.`;
        }

        let visochkaTotal = doorhangerConfig.visochkaEnabled ? papkaTieredTotal(qty, ofsetFinishingServices.visochka.a3) : 0;
        if (visochkaTotal > 0) {
            unit += visochkaTotal / qty;
            costItems.push({ label: 'Visochka', qty: `${qty} dona`, total: Math.round(visochkaTotal) });
        }

        return { details, baseUnitPrice: unit, costItems };
    }

    function selectPoligrafiyaGsm(index) {
        selectedPoligrafiyaGsmIndex = index;
        document.querySelectorAll('#poligrafiyaGsmGroup .poli-paper-option').forEach((el, idx) => {
            el.classList.toggle('active', idx === index);
        });
        calculate();
    }

    // Menejer Ofset yoki Raqamli (Sifravoy) pechatni tanlaydi — narx shu bo'limning
    // haqiqiy qog'oz bazasidan hisoblanadi (calculateResult_poligrafiya ichida).
    function selectPoligrafiyaEngine(engine) {
        // Adad ofset minimal tirajidan kam bo'lsa, Ofset tugmasi o'chirilgan — bosilsa ham hech narsa bo'lmaydi
        let btn = document.querySelector(`#poligrafiyaEngineGroup [data-engine="${engine}"]`);
        if (btn && btn.disabled) return;
        poliAvtoRaqamli = false; // menejer o'zi tanladi
        selectedPoligrafiyaEngine = engine;
        document.querySelectorAll('#poligrafiyaEngineGroup .opt-btn').forEach(el => {
            el.classList.toggle('active', el.dataset.engine === engine);
        });
        calculate();
    }

    function selectPoligrafiyaSides(sides) {
        selectedPoligrafiyaSides = sides;
        document.querySelectorAll('#poligrafiyaSidesGroup .opt-btn').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.sides) === sides);
        });
        calculate();
    }

    // Ofset minimal tiraj tufayli avtomatik Raqamli pechatga o'tkazilganmi? (adad yetarli bo'lsa, qaytariladi)
    let poliAvtoRaqamli = false;

    // Ofset tugmasi holati va ogohlantirishni adadga moslaydi (calculateResult_poligrafiya chaqiradi)
    function poliOfsetHolatiniYangila(ofsetMumkin, minTiraj, qty) {
        let btn = document.querySelector('#poligrafiyaEngineGroup [data-engine="ofset"]');
        if (btn) {
            btn.disabled = !ofsetMumkin;
            btn.classList.toggle('opt-btn-disabled', !ofsetMumkin);
            btn.title = ofsetMumkin ? '' : `Ofset pechat uchun kamida ${minTiraj.toLocaleString()} dona kerak`;
        }
        document.querySelectorAll('#poligrafiyaEngineGroup .opt-btn').forEach(el => {
            el.classList.toggle('active', el.dataset.engine === selectedPoligrafiyaEngine);
        });
        let box = document.getElementById('poliOfsetMinOgoh');
        if (box) {
            box.style.display = ofsetMumkin ? 'none' : 'block';
            box.innerHTML = ofsetMumkin ? '' : `⚠️ Ofset pechat uchun eng kam adad — <b>${minTiraj.toLocaleString()} dona</b>. `
                + `Siz ${qty.toLocaleString()} dona kiritdingiz, shuning uchun narx <b>Raqamli (Sifravoy) pechatda</b> hisoblandi.`;
        }
    }

    // "97x210mm" kabi o'lcham yorlig'idan W x H (mm) raqamlarini ajratib oladi.
    function parsePoligrafiyaSizeLabel(label) {
        let m = /^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i.exec(label || '');
        if (!m) return null;
        return { w: parseFloat(m[1]), h: parseFloat(m[2]) };
    }

    // Raqamli (Sifravoy) Pechat bo'limidagi qog'oz uchun bir dona narxini hisoblaydi —
    // calculate_raqamli() dagi aynan o'sha joylashtirish (grid-fitting) formulasi,
    // faqat margin (65%) qo'shilmagan holda — umumiy margin keyinroq calculate() da qo'shiladi.
    function calculateDigitalPriceForPaper(paperObj, w, h, qty, sides) {
        if (!paperObj || !w || !h || !qty || qty < 1) return null;
        let pW = paperObj.p_eni || 310;
        let pH = paperObj.p_boyi || 440;
        const gap = 2;

        let cols1 = Math.floor((pW + gap) / (w + gap));
        let rows1 = Math.floor((pH + gap) / (h + gap));
        let count1 = cols1 * rows1;

        let cols2 = Math.floor((pW + gap) / (h + gap));
        let rows2 = Math.floor((pH + gap) / (w + gap));
        let count2 = cols2 * rows2;

        let perSheet = count1;
        let isRotated = false;
        if (count2 > count1) { perSheet = count2; isRotated = true; }

        if (perSheet <= 0) return null;

        let sheetsNeeded = Math.ceil(qty / perSheet);
        let unitPaperPrice = (sides === 1) ? paperObj.price1 : paperObj.price2;
        let totalPaperCost = sheetsNeeded * unitPaperPrice;

        return { unitPrice: totalPaperCost / qty, perSheet, sheetsNeeded, isRotated };
    }



function generateFormHtml_poligrafiya(type) {
    let sizeLabel = poligrafiyaSizeLabels[type] || '';

    let gsmHtml = '';
    let gsmList = poligrafiyaGsmDatabase[type] || [];
    let usesRealPaperPricing = gsmList.length > 0;
    if (usesRealPaperPricing) {
        let defaultIdx = gsmList.findIndex(g => g.isDefault);
        selectedPoligrafiyaGsmIndex = defaultIdx >= 0 ? defaultIdx : 0;
        selectedPoligrafiyaEngine = 'ofset';
        poliAvtoRaqamli = false;
        selectedPoligrafiyaSides = (poligrafiyaSideTypes[type] === 1) ? 1 : 2;
        gsmHtml = `
            <div class="step-title">Qog'oz grammaji</div>
            <div class="poli-paper-grid" id="poligrafiyaGsmGroup"></div>

            <div class="step-title">Pechat usuli</div>
            <div class="options-group" id="poligrafiyaEngineGroup">
                <button type="button" class="opt-btn active" data-engine="ofset" onclick="selectPoligrafiyaEngine('ofset')">🖨️ Ofset Pechat</button>
                <button type="button" class="opt-btn" data-engine="raqamli" onclick="selectPoligrafiyaEngine('raqamli')">🖥️ Raqamli Pechat</button>
            </div>
            <div id="poliOfsetMinOgoh" class="poli-ofset-min-ogoh" style="display:none;"></div>

            <div class="step-title">Bosma tomoni</div>
            <div class="options-group" id="poligrafiyaSidesGroup">
                <button type="button" class="opt-btn ${selectedPoligrafiyaSides === 1 ? 'active' : ''}" data-sides="1" onclick="selectPoligrafiyaSides(1)">Bir tomonlama (4+0)</button>
                <button type="button" class="opt-btn ${selectedPoligrafiyaSides === 2 ? 'active' : ''}" data-sides="2" onclick="selectPoligrafiyaSides(2)">Ikki tomonlama (4+4)</button>
            </div>
        `;
    }

    let sideTypeVal = poligrafiyaSideTypes[type] ?? 1.6;
    let sideTypeLabel = sideTypeVal === 1 ? "Bir tomonlama (4+0)" : "Ikki tomonlama (4+4)";

    let html = `
        <div class="poli-calc">
            ${sizeLabel ? `
            <div class="poli-spec-row">
                <div class="poli-spec-icon">📐</div>
                <div>
                    <div class="poli-spec-label">Standart o'lcham</div>
                    <div class="poli-spec-value">${sizeLabel}</div>
                </div>
            </div>` : ''}
            ${gsmHtml}
            ${!usesRealPaperPricing ? `
            <div class="poli-spec-row poli-spec-row-muted">
                <div class="poli-spec-icon">🖨️</div>
                <div>
                    <div class="poli-spec-label">Bosma turi</div>
                    <div class="poli-spec-value">${sideTypeLabel}</div>
                </div>
            </div>` : ''}
            <div class="form-group poli-qty-group">
                <label>Adad (dona)</label>
                <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate()">
            </div>
        </div>
    `;

    return html;
}

function calculateResult_poligrafiya(activeProductTypeParam, qty, baseCost) {
    let baseUnitPrice = baseCost;

    // Kiritish tekshiruvi: manfiy/mantiqsiz miqdorni tozalaymiz
    if (!Number.isFinite(qty) || qty < 1) {
        qty = 1;
        showToast("⚠️ Miqdor noto'g'ri kiritildi, 1 dona sifatida hisoblandi.");
    }

    let sizeLabel = poligrafiyaSizeLabels[activeProductType] || '';
    let gsmList = poligrafiyaGsmDatabase[activeProductType] || [];
    let details;

    if (gsmList.length > 0) {
        // Narx bu yerda qo'lda kiritilmaydi — tanlangan grammaj Ofset Pechat yoki
        // Raqamli Pechat bo'limidagi haqiqiy qog'oz bazasidan qidiriladi.
        let g = gsmList[selectedPoligrafiyaGsmIndex] || gsmList[0];
        let paperTypeName = g.paperType || 'Melovka';
        let gsmLabel = ` | ${paperTypeName} ${g.gsm}gr`;
        let sozlama = poliSozlama(activeProductType);
        // Hisob bichish (yoyilgan) o'lchami bo'yicha — masalan Konvert yopishtirishdan oldingi shakl
        let hisobOlcham = sozlama.yoyilganOlcham || sizeLabel;
        let size = parsePoligrafiyaSizeLabel(hisobOlcham);
        let sides = (selectedPoligrafiyaSides === 1) ? 1 : 2;

        // Ofset minimal tiraji: adad yetmasa — Raqamli pechatda hisoblanadi, Ofset tugmasi o'chadi
        let minTiraj = parseInt(sozlama.ofsetMinTiraj) || 0;
        let ofsetMumkin = !(minTiraj > 0 && qty < minTiraj);
        if (!ofsetMumkin && selectedPoligrafiyaEngine === 'ofset') {
            selectedPoligrafiyaEngine = 'raqamli';
            poliAvtoRaqamli = true;
        } else if (ofsetMumkin && poliAvtoRaqamli) {
            selectedPoligrafiyaEngine = 'ofset';
            poliAvtoRaqamli = false;
        }
        poliOfsetHolatiniYangila(ofsetMumkin, minTiraj, qty);

        let engine = (selectedPoligrafiyaEngine === 'raqamli') ? 'raqamli' : 'ofset';
        let engineLabel = engine === 'ofset' ? 'Ofset Pechat' : 'Raqamli Pechat';
        let priceFound = false;

        // To'liq hisob-kitob modali uchun — ushbu buyurtmada NIMA va NECHTA ishlatilgani,
        // hamda har birining tannarxi (marjasiz) alohida-alohida ko'rsatiladi.
        let costItems = [];
        if (size) {
            if (engine === 'ofset') {
                let paperEntry = (typeof ofsetRawPapers !== 'undefined') ? ofsetRawPapers.find(p => p.gsm === g.gsm && p.name === paperTypeName) : null;
                if (paperEntry) {
                    let results = ['A3', 'A2', 'A1']
                        .map(m => calculateOfsetForMachine(m, size.w, size.h, qty, sides, paperEntry.name, g.gsm))
                        .filter(Boolean);
                    if (results.length > 0) {
                        results.sort((a, b) => a.perPieceCostRaw - b.perPieceCostRaw);
                        let r = results[0];
                        baseUnitPrice = r.perPieceCostRaw;
                        priceFound = true;
                        costItems.push({ label: `Qog'oz (${r.paperName} ${r.paperGsm}gr, ${r.rawName})`, qty: `${r.totalSheets} xom varoq`, total: Math.round(r.totalPaperCost) });
                        costItems.push({ label: 'Forma (klishe)', qty: `${r.totalPlates} plastina`, total: Math.round(r.totalPlateCost) });
                        costItems.push({ label: 'Bosma (pechat)', qty: `${r.totalWorkingSheets} ta ${r.machine} varoq`, total: Math.round(r.totalPrintCost) });
                    }
                }
            } else {
                let paperEntry = (typeof digitalPapersDatabase !== 'undefined') ? digitalPapersDatabase.find(p => {
                    let m = /(\d+)/.exec(p.name || '');
                    return m && parseInt(m[1]) === g.gsm && (p.name || '').toLowerCase().startsWith(paperTypeName.toLowerCase());
                }) : null;
                if (paperEntry) {
                    let r = calculateDigitalPriceForPaper(paperEntry, size.w, size.h, qty, sides);
                    if (r) {
                        baseUnitPrice = r.unitPrice;
                        priceFound = true;
                        costItems.push({ label: `Qog'oz (Raqamli, ${g.gsm}gr)`, qty: `${r.sheetsNeeded} varoq`, total: Math.round(r.unitPrice * qty) });
                    }
                }
            }
        }

        if (priceFound) {
            details = (sizeLabel ? `Poligrafiya chop etish (${sizeLabel}${sozlama.yoyilganOlcham ? `, bichish ${sozlama.yoyilganOlcham}` : ''})` : "Poligrafiya chop etish")
                + gsmLabel + ` | ${engineLabel} | ${sides === 1 ? 'Bir tomonlama' : 'Ikki tomonlama'}`;
            if (!ofsetMumkin) details += ` (ofset uchun kamida ${minTiraj.toLocaleString()} dona)`;

            // Qo'shimcha ishlov (vyrubka+skleyka, bigovka...) — so'm/dona
            let ishlov = parseFloat(sozlama.ishlovNarxi) || 0;
            if (ishlov > 0) {
                let nomi = sozlama.ishlovNomi || "Qo'shimcha ishlov";
                baseUnitPrice += ishlov;
                costItems.push({ label: nomi, qty: `${qty} dona`, total: Math.round(ishlov * qty) });
                details += ` | ${nomi}`;
            }
        } else {
            baseUnitPrice = 0;
            details = `⚠️ ${paperTypeName} ${g.gsm}gr uchun ${engineLabel} bo'limida mos qog'oz topilmadi — administrator shu qog'ozni ${engineLabel} bo'limiga kiritishi kerak.`;
        }

        return { details, baseUnitPrice, costItems };
    } else {
        // Bu mahsulot turi uchun grammaj bazasi mavjud emas (masalan Paket, Kalendar) —
        // eski oddiy hisob: baza narx * bosma koeffitsienti.
        let sideFactor = poligrafiyaSideTypes[activeProductType] ?? 1.6;
        baseUnitPrice = baseCost * sideFactor;
        details = sizeLabel ? `Poligrafiya chop etish (${sizeLabel})` : "Poligrafiya chop etish";
        return { details, baseUnitPrice };
    }
}

    // ====================== BO'LIMNI RO'YXATDAN O'TKAZISH ======================
    // Bu chaqiruv fayl OXIRIDA turishi shart: fayl oxirigacha xatosiz yuklangandagina
    // bo'lim "ishlayapti" deb belgilanadi. init() — saqlangan (localStorage) ma'lumotlarni
    // yuklaydi; core.js uni xatolikdan himoyalangan holda chaqiradi, shuning uchun bu yerdagi
    // xato faqat shu bo'limni o'chiradi, qolgan bo'limlar ishlayveradi.
    // talab: shu bo'lim ishlashi uchun kerak bo'lgan boshqa bo'limlar (ularning bazasidan foydalanadi).
    bolimRoyxatdan('poligrafiya', {
        talab: ['ofset', 'sifravoy'],
        init: function () {
            let savedPoligrafiyaSizeLabels = localStorage.getItem('erp_poligrafiya_size_labels');
            if (savedPoligrafiyaSizeLabels) {
                poligrafiyaSizeLabels = { ...poligrafiyaSizeLabels, ...JSON.parse(savedPoligrafiyaSizeLabels) };
            }

            let savedPoligrafiyaGsm = localStorage.getItem('erp_poligrafiya_gsm_db');
            if (savedPoligrafiyaGsm) {
                poligrafiyaGsmDatabase = { ...poligrafiyaGsmDatabase, ...JSON.parse(savedPoligrafiyaGsm) };
            }
            // Bir martalik migratsiya: paperType maydoni qo'shilishidan OLDIN saqlangan
            // qatorlarda bu maydon yo'q — Doorhanger uchun Karton, qolganlari uchun Melovka
            // standart qilib to'ldiramiz (avvalgi xatti-harakat bilan mos: doorhanger allaqachon
            // faqat Karton bilan ishlar edi, qolganlari faqat Melovka bilan).
            Object.keys(poligrafiyaGsmDatabase).forEach(key => {
                let list = poligrafiyaGsmDatabase[key];
                if (!Array.isArray(list)) return;
                list.forEach(g => { if (!g.paperType) g.paperType = (key === 'doorhanger') ? 'Karton' : 'Melovka'; });
            });

            // Otkritka — o'z qog'oz ro'yxati bilan. Eski sxemada qog'ozlar Sifravoy bazasidan olinardi —
            // migrateOtkritkaConfig ularni (narxi bilan) bir marta otkritka ro'yxatiga ko'chiradi.
            let savedOtkritka = localStorage.getItem('erp_otkritka_config');
            if (savedOtkritka) {
                try {
                    otkritkaConfig = migrateOtkritkaConfig(JSON.parse(savedOtkritka), otkritkaConfig);
                } catch (e) {
                    console.warn("Otkritka sozlamalarini o'qishda xato:", e);
                }
            }

            let savedVaraqli = localStorage.getItem('erp_varaqli_config');
            if (savedVaraqli) {
                try {
                    varaqliConfig = migrateVaraqliConfig(JSON.parse(savedVaraqli), varaqliConfig);
                } catch (e) {
                    console.warn("Konvert/Otkritka sozlamalarini o'qishda xato:", e);
                }
            }

            let savedPaket = localStorage.getItem('erp_paket_config');
            if (savedPaket) {
                try {
                    paketConfig = migratePaketConfig(JSON.parse(savedPaket), paketConfig);
                } catch (e) {
                    console.warn("Paket sozlamalarini o'qishda xato:", e);
                }
            }

            let savedKubarik = localStorage.getItem('erp_kubarik_config');
            if (savedKubarik) {
                try {
                    let parsed = JSON.parse(savedKubarik);
                    if (parsed && typeof parsed === 'object') {
                        kubarikConfig = {
                            ...kubarikConfig, ...parsed,
                            turlar: Array.isArray(parsed.turlar) ? parsed.turlar : kubarikConfig.turlar
                        };
                    }
                } catch (e) {
                    console.warn("Kubarik sozlamalarini o'qishda xato:", e);
                }
            }

            let savedPoliSozlama = localStorage.getItem('erp_poligrafiya_mahsulot_sozlama');
            if (savedPoliSozlama) {
                try {
                    let parsed = JSON.parse(savedPoliSozlama);
                    Object.keys(parsed || {}).forEach(k => {
                        poligrafiyaMahsulotSozlama[k] = { ...poliSozlama(k), ...parsed[k] };
                    });
                } catch (e) {
                    console.warn("Poligrafiya mahsulot sozlamasini o'qishda xato:", e);
                }
            }

            let savedPoligrafiyaSideTypes = localStorage.getItem('erp_poligrafiya_side_types');
            if (savedPoligrafiyaSideTypes) {
                poligrafiyaSideTypes = { ...poligrafiyaSideTypes, ...JSON.parse(savedPoligrafiyaSideTypes) };
            }

            let savedBloknot = localStorage.getItem('erp_bloknot_config');
            if (savedBloknot) {
                try {
                    bloknotConfig = migrateBloknotConfig(JSON.parse(savedBloknot), bloknotConfig);
                } catch (e) {
                    console.warn('Bloknot sozlamalarini o\'qishda xato:', e);
                }
            }

            let savedPapka = localStorage.getItem('erp_papka_config');
            if (savedPapka) {
                try {
                    let eski = JSON.parse(savedPapka);
                    // Bir martalik ko'chirish: Papka'ning alohida Lak/Tisneniya narxlari (A3/A2) umumiy
                    // pardozlash xizmatlariga — agar umumiy narxlar hali saqlanmagan bo'lsa.
                    if (!ofsetLakTisSaqlangan && eski && (eski.lak || eski.tisneniya)) {
                        ['a3', 'a2'].forEach(m => {
                            if (eski.lak && eski.lak[m] && typeof eski.lak[m] === 'object') ofsetFinishingServices.lak[m] = { ...ofsetFinishingServices.lak[m], ...eski.lak[m] };
                            if (eski.tisneniya && eski.tisneniya[m] && typeof eski.tisneniya[m] === 'object') ofsetFinishingServices.tisneniya[m] = { ...ofsetFinishingServices.tisneniya[m], ...eski.tisneniya[m] };
                        });
                        ofsetLakTisSaqlangan = true;
                        localStorage.setItem('erp_ofset_finishing_services', JSON.stringify(ofsetFinishingServices));
                    }
                    papkaConfig = migratePapkaConfig(eski, papkaConfig);
                } catch (e) {
                    console.warn('Papka sozlamalarini o\'qishda xato:', e);
                }
            }

            let savedKalendar = localStorage.getItem('erp_kalendar_config');
            if (savedKalendar) {
                try {
                    let parsed = JSON.parse(savedKalendar);
                    if (Array.isArray(parsed.subtypes)) {
                        // Admin saqlagan qiymatlarni standart subtypes ustiga qo'shib qo'yamiz — yangi
                        // subtype maydoni keyinchalik qo'shilsa ham eski saqlangan sozlama buzilmaydi.
                        kalendarConfig.subtypes = kalendarConfig.subtypes.map(defSub => {
                            let saved = parsed.subtypes.find(p => p.key === defSub.key);
                            return saved ? { ...defSub, ...saved, extras: { ...defSub.extras, ...(saved.extras || {}) } } : defSub;
                        });
                    }
                } catch (e) {
                    console.warn('Kalendar sozlamalarini o\'qishda xato:', e);
                }
            }

            let savedDoorhanger = localStorage.getItem('erp_doorhanger_config');
            if (savedDoorhanger) {
                try {
                    let parsed = JSON.parse(savedDoorhanger);
                    // Eski saqlangan ma'lumotda visochka narxi alohida bo'lgan bo'lishi mumkin edi —
                    // endi u umumiy ofsetFinishingServices'dan olinadi, bu yerda faqat
                    // yoqilgan/o'chirilgan bayrog'i o'qiladi (mavjud bo'lmasa — standart true).
                    if (typeof parsed.visochkaEnabled === 'boolean') doorhangerConfig.visochkaEnabled = parsed.visochkaEnabled;
                    if (parsed.paperType) doorhangerConfig.paperType = parsed.paperType;
                } catch (e) {
                    console.warn('Doorhanger sozlamalarini o\'qishda xato:', e);
                }
            }

            // Doorhanger 400gr Karton ishlatadi — bu grammaj hali Ofset bazasida yo'q edi,
            // shuning uchun bir martalik (idempotent) qatorni narxi 0 bilan qo'shib qo'yamiz.
            if (!ofsetRawPapers.some(p => p.name === 'Karton' && p.gsm === 400)) {
                ofsetRawPapers.push({ name: 'Karton', gsm: 400, prices: { "sra3": 0, "620x880": 0, "620x940": 0, "700x1000": 0 } });
                localStorage.setItem('erp_ofset_raw_papers', JSON.stringify(ofsetRawPapers));
            }

            // Bir martalik: Paket turlarining standart kartonlari (190/210/230/250) Ofset bazasida bo'lmasa —
            // narxi 0 bilan qo'shiladi (admin Ofset bo'limida narxini kiritadi). Admin keyin o'chirsa,
            // qayta paydo bo'lmasligi uchun bayroq bilan himoyalangan.
            if (!localStorage.getItem('erp_paket_karton_seeded')) {
                let qoshildi = false;
                [190, 210, 230, 250].forEach(g => {
                    if (!ofsetRawPapers.some(p => p.name === 'Karton' && p.gsm === g)) {
                        ofsetRawPapers.push({ name: 'Karton', gsm: g, prices: { "sra3": 0, "620x880": 0, "620x940": 0, "700x1000": 0 } });
                        qoshildi = true;
                    }
                });
                if (qoshildi) localStorage.setItem('erp_ofset_raw_papers', JSON.stringify(ofsetRawPapers));
                localStorage.setItem('erp_paket_karton_seeded', '1');
            }

            // Bir martalik migratsiya: Kalendar moduli uchun kerakli Melovka/Karton grammajlari
            // Ofset bazasida mavjud bo'lmasa, narxi 0 bilan qo'shib qo'yamiz (admin keyin narxni
            // to'g'rilaydi) — admin keyinchalik shu qatorlarni o'chirsa, qayta paydo bo'lmasligi
            // uchun bitta marta ishlaydigan bayroq bilan himoyalangan.
            if (!localStorage.getItem('erp_kalendar_paper_seeded')) {
                let paperChanged = false;
                [["Melovka", 200], ["Melovka", 300], ["Karton", 300], ["Karton", 350]].forEach(([pName, pGsm]) => {
                    let exists = ofsetRawPapers.some(p => p.name === pName && p.gsm === pGsm);
                    if (!exists) {
                        ofsetRawPapers.push({ name: pName, gsm: pGsm, prices: { "sra3": 0, "620x880": 0, "620x940": 0, "700x1000": 0 } });
                        paperChanged = true;
                    }
                });
                if (paperChanged) localStorage.setItem('erp_ofset_raw_papers', JSON.stringify(ofsetRawPapers));
                localStorage.setItem('erp_kalendar_paper_seeded', '1');
            }
        }
    });
