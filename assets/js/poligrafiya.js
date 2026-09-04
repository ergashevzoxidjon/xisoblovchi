    let poligrafiyaSizeLabels = {
        flayer: "97x210mm",
        listovka: "148x210mm",
        doorhanger: "90x200mm",
        buklet: "210x297mm",
        bloknot: "105x148mm",
        paket: "250x350mm",
        kalendar: "297x420mm",
        papka: "220x310mm",
        kubarik: "90x90x90mm"
    };

    let poligrafiyaSideTypes = {
        flayer: 1.6, listovka: 1.6, doorhanger: 1.6, buklet: 1.6, bloknot: 1.6,
        paket: 1.6, kalendar: 1.6, papka: 1.6, kubarik: 1.6
    };

    // ====================== POLIGRAFIYA: AQLLI NARXLASH SOZLAMALARI ======================
    // Adad chegirma pog'onalari, forma/sozlash xarajati va minimal buyurtma summasi —
    // Admin Panel > Poligrafiya > "Aqlli narxlash" bo'limidan tahrirlanadi.
    // Bloknotga tegishli emas — bloknotning o'z alohida hisob-kitob tizimi bor.
    let poligrafiyaAdvancedConfig = {
        qtyTiers: [
            { from: 1,    factor: 1.0  },
            { from: 1000, factor: 0.85 },
            { from: 5000, factor: 0.75 }
        ],
        setupFee: 0,        // bir martalik forma/sozlash xarajati (so'm), tirajga bo'linib qo'shiladi
        minOrderAmount: 0   // minimal buyurtma summasi (so'm) — jami narx shundan kam bo'lmaydi
    };

    // ====================== BLOKNOT SOZLAMALARI ======================
    // Barcha qiymatlar Admin Panel > Bloknot bo'limidan o'zgartiriladi.
    let bloknotConfig = {
        // O'lchamlar: usti va ichki varoqlar narxi alohida kiritiladi.
        // a3Share — bitta bloknot ustiga necha A3 list ketishi (lak hisobi uchun).
        sizes: [
            { key: 'a6', name: 'A6', label: '105x148mm', sheets: 35, a3Share: 0.25,
              coverPrice: 2000, innerOnePrice: 4000, innerTwoPrice: 6400, isDefault: true  },
            { key: 'a5', name: 'A5', label: '148x210mm', sheets: 40, a3Share: 0.5,
              coverPrice: 3000, innerOnePrice: 6000, innerTwoPrice: 9600, isDefault: false },
            { key: 'a4', name: 'A4', label: '210x297mm', sheets: 50, a3Share: 1.0,
              coverPrice: 4500, innerOnePrice: 9500, innerTwoPrice: 15200, isDefault: false }
        ],
        // Adad pog'onalari: qaysi adaddan boshlab qanday koeffitsient
        // (faqat usti + ichki varoqlarga qo'llanadi)
        qtyTiers: [
            { from: 1,    factor: 1.0  },
            { from: 1000, factor: 0.85 },
            { from: 5000, factor: 0.75 }
        ],
        // Usti lak: A3 list bo'yicha pog'onali hisob
        lak: {
            firstPackSheets: 1000,     // birinchi paket - necha A3 list
            firstPackPrice: 350000,    // birinchi paket narxi (minimal to'lov)
            nextSheetPrice: 500        // undan keyingi har bir A3 list
        },
        // Tisneniya: dona narxi + bir martalik klishe
        tisneniya: { pricePerUnit: 800, klishePrice: 50000 },
        // Prujina joyi: har biriga alohida narx
        spring: [
            { key: 'top',  name: 'Yuqoridan', price: 0,    isDefault: true  },
            { key: 'side', name: 'Yonidan',   price: 300,  isDefault: false }
        ],
        // Mijozga ma'lumot sifatida ko'rsatiladigan matn
        infoText: "Bloknot usti 250-300gr kartondan tayyorlanadi."
    };

    // Mijoz ekranida tanlangan qiymatlar
    // extra: 'yoq' | 'lak' | 'tisneniya'  — faqat bittasi tanlanadi
    let bloknotSelected = {
        sizeIndex: 0,
        twoSide: false,
        extra: 'yoq',
        springIndex: 0
    };

    let poligrafiyaGsmDatabase = {
        flayer: [
            { gsm: 115, price: 280, isDefault: false },
            { gsm: 130, price: 300, isDefault: true },
            { gsm: 150, price: 340, isDefault: false },
            { gsm: 170, price: 380, isDefault: false }
        ],
        listovka: [
            { gsm: 115, price: 230, isDefault: false },
            { gsm: 130, price: 250, isDefault: true },
            { gsm: 150, price: 290, isDefault: false },
            { gsm: 170, price: 330, isDefault: false }
        ],
        buklet: [
            { gsm: 150, price: 750, isDefault: false },
            { gsm: 170, price: 800, isDefault: true },
            { gsm: 200, price: 900, isDefault: false },
            { gsm: 300, price: 1100, isDefault: false }
        ],
        doorhanger: [
            { gsm: 250, price: 420, isDefault: false },
            { gsm: 300, price: 450, isDefault: true },
            { gsm: 350, price: 500, isDefault: false },
            { gsm: 400, price: 560, isDefault: false }
        ]
    };
    let selectedPoligrafiyaGsmIndex = -1;

    function renderAdminPoligrafiyaGsmTable() {
        let tbody = document.getElementById('adminPoligrafiyaGsmTableBody');
        if (!tbody) return;
        let list = poligrafiyaGsmDatabase[currentManagingProduct] || [];

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding:20px;">Hozircha grammaj kiritilmagan. Kiritilmasa, baza narxi ishlatiladi.</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map((g, index) => `
            <tr>
                <td><input type="number" id="polgsm_gsm_${index}" value="${g.gsm}"></td>
                <td><input type="number" id="polgsm_price_${index}" value="${g.price}"></td>
                <td style="text-align:center;"><input type="radio" name="polgsm_default" id="polgsm_default_${index}" ${g.isDefault ? 'checked' : ''} style="width:16px; height:16px; accent-color: var(--primary);"></td>
                <td style="text-align: right;">
                    <div class="action-btns" style="justify-content: flex-end;">
                        <button class="btn btn-danger" title="O'chirish" onclick="deletePoligrafiyaGsmRow(${index})">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function addPoligrafiyaGsmRow() {
        if (!currentManagingProduct) return;
        if (!poligrafiyaGsmDatabase[currentManagingProduct]) poligrafiyaGsmDatabase[currentManagingProduct] = [];
        let list = poligrafiyaGsmDatabase[currentManagingProduct];
        list.push({ gsm: 130, price: defaultPrices[currentManagingProduct] || 0, isDefault: list.length === 0 });
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
            let priceInput = document.getElementById(`polgsm_price_${index}`);
            let defaultInput = document.getElementById(`polgsm_default_${index}`);
            updated.push({
                gsm: parseInt(gsmInput.value) || 0,
                price: parseFloat(priceInput.value) || 0,
                isDefault: defaultInput.checked
            });
        }
        if (updated.length > 0 && !updated.some(g => g.isDefault)) updated[0].isDefault = true;

        poligrafiyaGsmDatabase[currentManagingProduct] = updated;
        localStorage.setItem('erp_poligrafiya_gsm_db', JSON.stringify(poligrafiyaGsmDatabase));
        renderAdminPoligrafiyaGsmTable();
        showToast("💾 Grammajlar saqlandi!");
    }

    function renderPoligrafiyaGsmOptions(gsmList) {
        const group = document.getElementById('poligrafiyaGsmGroup');
        if (!group) return;
        group.innerHTML = gsmList.map((g, idx) => `
            <button class="opt-btn ${idx === selectedPoligrafiyaGsmIndex ? 'active' : ''}" onclick="selectPoligrafiyaGsm(${idx})">${g.gsm}gr</button>
        `).join('');
    }

    // ====================== BLOKNOT: MIJOZ EKRANI ======================

    function buildBloknotForm() {
        // standart qiymatlarni tiklaymiz
        let defSize = bloknotConfig.sizes.findIndex(s => s.isDefault);
        let defSpring = bloknotConfig.spring.findIndex(s => s.isDefault);
        bloknotSelected = {
            sizeIndex: defSize >= 0 ? defSize : 0,
            twoSide: false,
            extra: 'yoq',
            springIndex: defSpring >= 0 ? defSpring : 0
        };

        return `
            <div class="step-title">Bloknot o'lchami:</div>
            <div class="options-group" id="bloknotSizeGroup"></div>

            <div class="step-title" style="margin-top:16px;">Ichki varoqlar pechati:</div>
            <div class="options-group" id="bloknotSideGroup"></div>

            <div class="step-title" style="margin-top:16px;">Prujina joyi:</div>
            <div class="options-group" id="bloknotSpringGroup"></div>

            <div class="step-title" style="margin-top:16px;">Qo'shimcha ishlov (usti):</div>
            <div class="options-group" id="bloknotExtraGroup"></div>

            <div class="form-group" style="margin-top:16px;">
                <label>Adad (dona):</label>
                <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate(); updateBloknotInfo();">
            </div>

            <div id="bloknotInfoBox" style="margin-top:18px; padding:14px 16px; background:#f0f7ff; border-left:4px solid var(--primary); border-radius:8px;">
                <div style="font-weight:700; font-size:0.85rem; color:var(--primary); margin-bottom:8px;">ℹ️ Ma'lumot</div>
                <div id="bloknotInfoText" style="font-size:0.85rem; color:var(--text-main); line-height:1.7;"></div>
            </div>
        `;
    }

    function renderBloknotOptions() {
        const sizeGroup = document.getElementById('bloknotSizeGroup');
        if (!sizeGroup) return;

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

        document.getElementById('bloknotSpringGroup').innerHTML = bloknotConfig.spring.map((s, idx) => `
            <button class="opt-btn ${idx === bloknotSelected.springIndex ? 'active' : ''}"
                    onclick="selectBloknotSpring(${idx})">${s.name}</button>
        `).join('');

        // Lak va tisneniya birgalikda tanlanmaydi — faqat bittasi
        document.getElementById('bloknotExtraGroup').innerHTML = `
            <button class="opt-btn ${bloknotSelected.extra === 'yoq' ? 'active' : ''}"
                    onclick="selectBloknotExtra('yoq')">Yo'q</button>
            <button class="opt-btn ${bloknotSelected.extra === 'lak' ? 'active' : ''}"
                    onclick="selectBloknotExtra('lak')">Usti lak</button>
            <button class="opt-btn ${bloknotSelected.extra === 'tisneniya' ? 'active' : ''}"
                    onclick="selectBloknotExtra('tisneniya')">Tisneniya</button>
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
        qatorlar.push(`Ichki varoqlar soni: <b>${s.sheets} ta</b>`);
        qatorlar.push(`Bitta ${s.name} bloknot ustiga <b>${s.a3Share} ta A3 list</b> ketadi`);
        qatorlar.push(`<span style="color:var(--text-muted)">Usti lak va tisneniya birgalikda qo'llanilmaydi — bittasini tanlang.</span>`);

        let qty = parseInt(document.getElementById('inpQuantity')?.value) || 0;

        if (bloknotSelected.extra === 'lak' && qty > 0) {
            let a3 = qty * (s.a3Share || 0);
            let jami = bloknotLakTotal(qty, s.a3Share);
            let L = bloknotConfig.lak;
            let izoh = a3 <= (L.firstPackSheets ?? 1000)
                ? `birinchi paket (${L.firstPackSheets} listgacha)`
                : `${L.firstPackSheets} list + ${(a3 - L.firstPackSheets).toLocaleString('ru-RU')} ta qo'shimcha`;
            qatorlar.push(
                `Lak: <b>${a3.toLocaleString('ru-RU')} ta A3 list</b> → ` +
                `<b>${jami.toLocaleString('ru-RU')} so'm</b> <span style="color:var(--text-muted)">(${izoh})</span>`
            );
        }

        if (bloknotSelected.extra === 'tisneniya' && bloknotConfig.tisneniya.klishePrice > 0) {
            qatorlar.push(`Tisneniya klishesi: <b>${bloknotConfig.tisneniya.klishePrice.toLocaleString('ru-RU')} so'm</b> (bir martalik, adadga bo'linadi)`);
        }

        box.innerHTML = qatorlar.join('<br>');
    }

    function selectBloknotSize(idx) {
        bloknotSelected.sizeIndex = idx;
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

    // Lak va tisneniya bir vaqtda bo'lmaydi — bittasini tanlash
    function selectBloknotExtra(tur) {
        bloknotSelected.extra = tur;
        renderBloknotOptions();
        calculate();
    }

    // ====================== BLOKNOT: SOZLAMA MIGRATSIYASI ======================
    // Eski tuzilmadagi saqlangan sozlamalarni yangisiga o'tkazadi,
    // shunda foydalanuvchi kiritgan narxlar yo'qolmaydi.

    function migrateBloknotConfig(saqlangan, standart) {
        let cfg = { ...standart };

        // --- o'lchamlar ---
        if (Array.isArray(saqlangan.sizes) && saqlangan.sizes.length > 0) {
            // eski koeffitsientlar (bo'lsa) ichki narxni hisoblash uchun kerak
            let eskiIkkiTom = saqlangan.innerPrint?.twoSideFactor ?? 1.6;

            cfg.sizes = saqlangan.sizes.map((s, i) => {
                let standartOlcham = standart.sizes.find(d => d.name === s.name) || standart.sizes[i] || standart.sizes[0];

                // A3 ulushi: saqlangan bo'lsa o'sha, bo'lmasa nomiga qarab taxmin
                let a3 = s.a3Share;
                if (a3 === undefined) {
                    let nom = (s.name || '').toUpperCase();
                    a3 = nom === 'A4' ? 1.0 : nom === 'A5' ? 0.5 : nom === 'A6' ? 0.25
                       : (standartOlcham.a3Share ?? 0.5);
                }

                // Eski `basePrice` butun bloknot narxi edi.
                // Uni taxminan uchdan bir usti + qolgani ichki qilib bo'lamiz.
                let usti  = s.coverPrice;
                let ich1  = s.innerOnePrice;
                let ich2  = s.innerTwoPrice;

                if (usti === undefined || ich1 === undefined) {
                    let baza = (s.basePrice !== undefined) ? s.basePrice
                             : (standartOlcham.coverPrice + standartOlcham.innerOnePrice);
                    usti = Math.round(baza / 3);
                    ich1 = baza - usti;
                }
                if (ich2 === undefined) {
                    ich2 = Math.round(ich1 * eskiIkkiTom);
                }

                return {
                    key: s.key || ('s' + i),
                    name: s.name || standartOlcham.name,
                    label: s.label || standartOlcham.label,
                    sheets: s.sheets ?? standartOlcham.sheets,
                    a3Share: a3,
                    coverPrice: usti,
                    innerOnePrice: ich1,
                    innerTwoPrice: ich2,
                    isDefault: !!s.isDefault
                };
            });
            if (!cfg.sizes.some(s => s.isDefault)) cfg.sizes[0].isDefault = true;
        }

        // --- prujina ---
        if (Array.isArray(saqlangan.spring) && saqlangan.spring.length > 0) {
            cfg.spring = saqlangan.spring.map((s, i) => ({
                key: s.key || ('p' + i),
                name: s.name || `Variant ${i + 1}`,
                price: s.price ?? 0,
                isDefault: !!s.isDefault
            }));
            if (!cfg.spring.some(s => s.isDefault)) cfg.spring[0].isDefault = true;
        }

        // --- adad pog'onalari ---
        if (Array.isArray(saqlangan.qtyTiers) && saqlangan.qtyTiers.length > 0) {
            cfg.qtyTiers = saqlangan.qtyTiers
                .map(t => ({ from: t.from ?? 1, factor: t.factor ?? 1 }))
                .sort((a, b) => a.from - b.from);
        }

        // --- lak: eski (dona narxi) -> yangi (A3 pog'onali) ---
        cfg.lak = { ...standart.lak };
        if (saqlangan.lak) {
            if (saqlangan.lak.firstPackSheets !== undefined) {
                cfg.lak = { ...cfg.lak, ...saqlangan.lak };
            }
            // eski `pricePerUnit`/`setupPrice` bo'lsa — tashlab yuboriladi,
            // chunki yangi model butunlay boshqacha hisoblanadi.
        }

        // --- tisneniya ---
        cfg.tisneniya = { ...standart.tisneniya, ...(saqlangan.tisneniya || {}) };

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
                tb.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--text-muted); padding:20px;">O'lcham kiritilmagan.</td></tr>`;
            } else {
                tb.innerHTML = bloknotConfig.sizes.map((s, idx) => `
                    <tr>
                        <td><input type="text" class="bl-size-name" value="${s.name}" style="width:100%;"></td>
                        <td><input type="text" class="bl-size-label" value="${s.label}" style="width:100%;"></td>
                        <td><input type="number" min="1" class="bl-size-sheets" value="${s.sheets}" style="width:100%;"></td>
                        <td><input type="number" min="0" step="0.05" class="bl-size-a3" value="${s.a3Share}" style="width:100%;" oninput="updateBloknotLakPreview()"></td>
                        <td><input type="number" min="0" class="bl-size-cover" value="${s.coverPrice}" style="width:100%;"></td>
                        <td><input type="number" min="0" class="bl-size-inner1" value="${s.innerOnePrice}" style="width:100%;"></td>
                        <td><input type="number" min="0" class="bl-size-inner2" value="${s.innerTwoPrice}" style="width:100%;"></td>
                        <td style="text-align:center;">
                            <input type="radio" name="blSizeDefault" class="bl-size-default" ${s.isDefault ? 'checked' : ''}>
                        </td>
                        <td style="text-align:right;">
                            <button class="btn btn-sm btn-danger" onclick="deleteBloknotSize(${idx})">🗑</button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // --- adad pog'onalari jadvali ---
        let tt = document.getElementById('adminBloknotTierTableBody');
        if (tt) {
            let tiers = bloknotConfig.qtyTiers || [];
            if (tiers.length === 0) {
                tt.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding:20px;">Pog'ona kiritilmagan — narx chegirmasiz hisoblanadi.</td></tr>`;
            } else {
                tt.innerHTML = tiers.map((t, idx) => {
                    let chegirma = Math.round((1 - (t.factor ?? 1)) * 100);
                    return `
                    <tr>
                        <td><input type="number" min="1" class="bl-tier-from" value="${t.from}" style="width:100%;" oninput="updateBloknotTierHints()"></td>
                        <td><input type="number" min="0" step="0.01" class="bl-tier-factor" value="${t.factor}" style="width:100%;" oninput="updateBloknotTierHints()"></td>
                        <td class="bl-tier-hint" style="color: var(--text-muted); font-family: var(--font-mono); font-size: 0.82rem;">
                            ${chegirma > 0 ? '-' + chegirma + '%' : (chegirma < 0 ? '+' + (-chegirma) + '%' : 'chegirmasiz')}
                        </td>
                        <td style="text-align:right;">
                            <button class="btn btn-sm btn-danger" onclick="deleteBloknotTier(${idx})">🗑</button>
                        </td>
                    </tr>`;
                }).join('');
            }
        }

        // --- prujina jadvali ---
        let tp = document.getElementById('adminBloknotSpringTableBody');
        if (tp) {
            if (bloknotConfig.spring.length === 0) {
                tp.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding:20px;">Variant kiritilmagan.</td></tr>`;
            } else {
                tp.innerHTML = bloknotConfig.spring.map((s, idx) => `
                    <tr>
                        <td><input type="text" class="bl-spring-name" value="${s.name}" style="width:100%;"></td>
                        <td><input type="number" min="0" class="bl-spring-price" value="${s.price}" style="width:100%;"></td>
                        <td style="text-align:center;">
                            <input type="radio" name="blSpringDefault" class="bl-spring-default" ${s.isDefault ? 'checked' : ''}>
                        </td>
                        <td style="text-align:right;">
                            <button class="btn btn-sm btn-danger" onclick="deleteBloknotSpring(${idx})">🗑</button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // --- boshqa maydonlar ---
        let q = (id) => document.getElementById(id);
        if (q('bloknotLakFirstSheets'))  q('bloknotLakFirstSheets').value  = bloknotConfig.lak.firstPackSheets;
        if (q('bloknotLakFirstPrice'))   q('bloknotLakFirstPrice').value   = bloknotConfig.lak.firstPackPrice;
        if (q('bloknotLakNextPrice'))    q('bloknotLakNextPrice').value    = bloknotConfig.lak.nextSheetPrice;
        if (q('bloknotTisneniyaPrice'))  q('bloknotTisneniyaPrice').value  = bloknotConfig.tisneniya.pricePerUnit;
        if (q('bloknotKlishePrice'))     q('bloknotKlishePrice').value     = bloknotConfig.tisneniya.klishePrice;
        if (q('bloknotInfoTextInput'))   q('bloknotInfoTextInput').value   = bloknotConfig.infoText || '';

        ['bloknotLakFirstSheets','bloknotLakFirstPrice','bloknotLakNextPrice'].forEach(id => {
            let el = q(id);
            if (el) el.oninput = updateBloknotLakPreview;
        });
        updateBloknotLakPreview();
    }

    // Adad pog'onalari jadvalidagi "chegirma" ustunini jonli yangilaydi
    function updateBloknotTierHints() {
        let factors = document.querySelectorAll('.bl-tier-factor');
        let hints = document.querySelectorAll('.bl-tier-hint');
        factors.forEach((el, i) => {
            let f = parseFloat(el.value);
            if (isNaN(f)) { if (hints[i]) hints[i].innerText = '—'; return; }
            let ch = Math.round((1 - f) * 100);
            if (hints[i]) hints[i].innerText = ch > 0 ? `-${ch}%` : (ch < 0 ? `+${-ch}%` : 'chegirmasiz');
        });
    }

    // Admin panelda lak formulasini namuna bilan ko'rsatadi
    function updateBloknotLakPreview() {
        let box = document.getElementById('bloknotLakPreview');
        if (!box) return;

        let son = (id, d) => { let v = parseFloat(document.getElementById(id)?.value); return isNaN(v) ? d : v; };
        let birinchiList = son('bloknotLakFirstSheets', 1000);
        let birinchiNarx = son('bloknotLakFirstPrice', 350000);
        let keyingiNarx  = son('bloknotLakNextPrice', 500);

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
            sheets: 40, a3Share: 0.5, coverPrice: 0, innerOnePrice: 0, innerTwoPrice: 0,
            isDefault: false
        });
        renderAdminBloknotTables();
    }

    function addBloknotTierRow() {
        collectBloknotTablesFromUI();
        if (!Array.isArray(bloknotConfig.qtyTiers)) bloknotConfig.qtyTiers = [];
        let oxirgi = bloknotConfig.qtyTiers[bloknotConfig.qtyTiers.length - 1];
        bloknotConfig.qtyTiers.push({
            from: oxirgi ? (oxirgi.from * 2 || 1000) : 1,
            factor: oxirgi ? Math.max(0.5, +(oxirgi.factor - 0.1).toFixed(2)) : 1
        });
        renderAdminBloknotTables();
    }

    function deleteBloknotTier(idx) {
        if (!confirm("Ushbu pog'onani o'chirmoqchimisiz?")) return;
        collectBloknotTablesFromUI();
        bloknotConfig.qtyTiers.splice(idx, 1);
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

    function addBloknotSpringRow() {
        collectBloknotTablesFromUI();
        bloknotConfig.spring.push({
            key: 'yangi' + Date.now(), name: 'Yangi variant', price: 0, isDefault: false
        });
        renderAdminBloknotTables();
    }

    function deleteBloknotSpring(idx) {
        if (bloknotConfig.spring.length <= 1) {
            showToast("⚠️ Kamida bitta variant qolishi kerak!");
            return;
        }
        if (!confirm("Ushbu variantni o'chirmoqchimisiz?")) return;
        collectBloknotTablesFromUI();
        let ediStandart = bloknotConfig.spring[idx].isDefault;
        bloknotConfig.spring.splice(idx, 1);
        if (ediStandart && bloknotConfig.spring.length > 0) bloknotConfig.spring[0].isDefault = true;
        renderAdminBloknotTables();
    }

    // jadvaldagi kiritilgan qiymatlarni obyektga yig'adi
    function collectBloknotTablesFromUI() {
        let nomlar = document.querySelectorAll('.bl-size-name');
        if (nomlar.length > 0) {
            let labels   = document.querySelectorAll('.bl-size-label');
            let sheets   = document.querySelectorAll('.bl-size-sheets');
            let a3s      = document.querySelectorAll('.bl-size-a3');
            let covers   = document.querySelectorAll('.bl-size-cover');
            let inner1   = document.querySelectorAll('.bl-size-inner1');
            let inner2   = document.querySelectorAll('.bl-size-inner2');
            let defaults = document.querySelectorAll('.bl-size-default');
            let yangi = [];
            nomlar.forEach((el, i) => {
                yangi.push({
                    key: bloknotConfig.sizes[i]?.key || ('s' + i),
                    name: (el.value || '').trim() || `O'lcham ${i + 1}`,
                    label: (labels[i]?.value || '').trim(),
                    sheets: parseInt(sheets[i]?.value) || 0,
                    a3Share: parseFloat(a3s[i]?.value) || 0,
                    coverPrice: parseFloat(covers[i]?.value) || 0,
                    innerOnePrice: parseFloat(inner1[i]?.value) || 0,
                    innerTwoPrice: parseFloat(inner2[i]?.value) || 0,
                    isDefault: defaults[i]?.checked || false
                });
            });
            if (yangi.length > 0 && !yangi.some(s => s.isDefault)) yangi[0].isDefault = true;
            bloknotConfig.sizes = yangi;
        }

        // --- adad pog'onalari ---
        let tierFrom = document.querySelectorAll('.bl-tier-from');
        if (tierFrom.length > 0) {
            let tierFactor = document.querySelectorAll('.bl-tier-factor');
            let yangi = [];
            tierFrom.forEach((el, i) => {
                let from = parseInt(el.value);
                let factor = parseFloat(tierFactor[i]?.value);
                if (isNaN(from) || from < 1) from = 1;
                if (isNaN(factor) || factor < 0) factor = 1;
                yangi.push({ from, factor });
            });
            yangi.sort((a, b) => a.from - b.from);
            bloknotConfig.qtyTiers = yangi;
        }

        let sNomlar = document.querySelectorAll('.bl-spring-name');
        if (sNomlar.length > 0) {
            let sPrices   = document.querySelectorAll('.bl-spring-price');
            let sDefaults = document.querySelectorAll('.bl-spring-default');
            let yangi = [];
            sNomlar.forEach((el, i) => {
                yangi.push({
                    key: bloknotConfig.spring[i]?.key || ('p' + i),
                    name: (el.value || '').trim() || `Variant ${i + 1}`,
                    price: parseFloat(sPrices[i]?.value) || 0,
                    isDefault: sDefaults[i]?.checked || false
                });
            });
            if (yangi.length > 0 && !yangi.some(s => s.isDefault)) yangi[0].isDefault = true;
            bloknotConfig.spring = yangi;
        }
    }

    function saveBloknotConfig() {
        collectBloknotTablesFromUI();

        let son = (id, standart) => {
            let v = parseFloat(document.getElementById(id)?.value);
            return isNaN(v) || v < 0 ? standart : v;
        };

        bloknotConfig.lak.firstPackSheets       = Math.max(1, son('bloknotLakFirstSheets', 1000));
        bloknotConfig.lak.firstPackPrice        = son('bloknotLakFirstPrice', 0);
        bloknotConfig.lak.nextSheetPrice        = son('bloknotLakNextPrice', 0);
        bloknotConfig.tisneniya.pricePerUnit    = son('bloknotTisneniyaPrice', 0);
        bloknotConfig.tisneniya.klishePrice     = son('bloknotKlishePrice', 0);
        bloknotConfig.infoText = (document.getElementById('bloknotInfoTextInput')?.value || '').trim();

        // asosiy o'lcham yorlig'ini ham yangilaymiz
        let std = bloknotConfig.sizes.find(s => s.isDefault) || bloknotConfig.sizes[0];
        if (std && std.label) poligrafiyaSizeLabels.bloknot = std.label;

        localStorage.setItem('erp_bloknot_config', JSON.stringify(bloknotConfig));
        renderAdminBloknotTables();
        showToast("💾 Bloknot sozlamalari saqlandi!");
    }

    // ====================== BLOKNOT: HISOB-KITOB ======================

    // Adad bo'yicha koeffitsientni topadi
    function bloknotQtyFactor(qty) {
        let tiers = (bloknotConfig.qtyTiers || []).slice().sort((a, b) => a.from - b.from);
        let k = 1;
        for (const t of tiers) {
            if (qty >= t.from) k = t.factor;
        }
        return k;
    }

    // Lak umumiy summasi — A3 listlar soni bo'yicha pog'onali hisob
    function bloknotLakTotal(qty, a3Share) {
        let L = bloknotConfig.lak || {};
        let birinchiList = L.firstPackSheets ?? 1000;
        let birinchiNarx = L.firstPackPrice ?? 0;
        let keyingiNarx  = L.nextSheetPrice ?? 0;

        let a3Soni = qty * (a3Share || 0);
        if (a3Soni <= birinchiList) return birinchiNarx;          // minimal to'lov
        return birinchiNarx + (a3Soni - birinchiList) * keyingiNarx;
    }

    function calculateBloknot(qty) {
        let size = bloknotConfig.sizes[bloknotSelected.sizeIndex] || bloknotConfig.sizes[0];
        let spring = bloknotConfig.spring[bloknotSelected.springIndex] || bloknotConfig.spring[0];

        // 1) Usti + ichki varoqlar narxi (aniq narxlar, koeffitsientsiz)
        let ichkiNarx = bloknotSelected.twoSide
            ? (size.innerTwoPrice || 0)
            : (size.innerOnePrice || 0);

        let unit = (size.coverPrice || 0) + ichkiNarx;

        // 2) Adad pog'onasi — faqat usti va ichki varoqlarga
        unit *= bloknotQtyFactor(qty);

        // 3) Prujina joyi narxi (chegirmasiz)
        unit += (spring.price || 0);

        // 4) Qo'shimcha ishlov — lak YOKI tisneniya (ikkalasi birga emas)
        let lakJami = 0;
        if (bloknotSelected.extra === 'lak') {
            lakJami = bloknotLakTotal(qty, size.a3Share);
            unit += lakJami / qty;
        } else if (bloknotSelected.extra === 'tisneniya') {
            unit += (bloknotConfig.tisneniya.pricePerUnit || 0);
            if (bloknotConfig.tisneniya.klishePrice > 0) {
                unit += (bloknotConfig.tisneniya.klishePrice / qty);
            }
        }

        // Tafsilot matni
        let qismlar = [
            `Bloknot ${size.name} (${size.label})`,
            `${size.sheets} varoq`,
            bloknotSelected.twoSide ? 'ichki 2 tomonlama' : 'ichki 1 tomonlama',
            `prujina ${(spring.name || '').toLowerCase()}`
        ];
        if (bloknotSelected.extra === 'lak') {
            let a3 = qty * (size.a3Share || 0);
            qismlar.push(`usti lak (${a3} A3 list)`);
        } else if (bloknotSelected.extra === 'tisneniya') {
            qismlar.push('tisneniya + klishe');
        }

        return { unitPrice: unit, details: qismlar.join(' | '), lakTotal: lakJami };
    }

    function selectPoligrafiyaGsm(index) {
        selectedPoligrafiyaGsmIndex = index;
        document.querySelectorAll('#poligrafiyaGsmGroup .opt-btn').forEach((btn, idx) => {
            btn.classList.toggle('active', idx === index);
        });
        calculate();
    }



function generateFormHtml_poligrafiya(type) {
    let html = '';
            let sizeLabel = poligrafiyaSizeLabels[type] || '';
            let gsmList = poligrafiyaGsmDatabase[type] || [];
            let gsmHtml = '';
            if (gsmList.length > 0) {
                let defaultIdx = gsmList.findIndex(g => g.isDefault);
                selectedPoligrafiyaGsmIndex = defaultIdx >= 0 ? defaultIdx : 0;
                gsmHtml = `
                    <div class="step-title">Qog'oz grammaji:</div>
                    <div class="options-group" id="poligrafiyaGsmGroup"></div>
                `;
            }

            let sideTypeVal = poligrafiyaSideTypes[type] ?? 1.6;
            let sideTypeLabel = sideTypeVal === 1 ? "Bir tomonlama (4+0)" : "Ikki tomonlama (4+4)";

            html = `
                ${sizeLabel ? `
                <div class="form-group" style="margin-bottom:12px;">
                    <label>Standart o'lcham:</label>
                    <div style="font-weight:700; color: var(--primary); font-family: var(--font-mono); font-size: 1rem; padding: 8px 0;">${sizeLabel}</div>
                </div>` : ''}
                ${gsmHtml}
                <div class="form-group" style="margin-bottom:12px;">
                    <label>Bosma turi:</label>
                    <div style="font-weight:700; color: var(--primary); font-family: var(--font-mono); font-size: 1rem; padding: 8px 0;">${sideTypeLabel}</div>
                </div>
                <div class="form-group">
                    <label>Adad (dona):</label>
                    <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate()">
                </div>
            `;

    return html;
}

    // Adad chegirma koeffitsientini admin belgilagan pog'onalardan topadi
    // (standart: 1000+ dona -15%, 5000+ dona -25% — Admin Panelda o'zgartiriladi)
    function poligrafiyaQtyFactor(qty) {
        let tiers = (poligrafiyaAdvancedConfig.qtyTiers || []).slice().sort((a, b) => a.from - b.from);
        let f = 1;
        for (const t of tiers) {
            if (qty >= t.from) f = t.factor;
        }
        return f;
    }

function calculateResult_poligrafiya(activeProductTypeParam, qty, baseCost) {
    let details = activeProductType.toUpperCase();
    let baseUnitPrice = 0;

                // Kiritish tekshiruvi: manfiy/mantiqsiz miqdorni tozalaymiz
                if (!Number.isFinite(qty) || qty < 1) {
                    qty = 1;
                    showToast("⚠️ Miqdor noto'g'ri kiritildi, 1 dona sifatida hisoblandi.");
                }

                let sideFactor = poligrafiyaSideTypes[activeProductType] ?? 1.6;
                let gsmList = poligrafiyaGsmDatabase[activeProductType] || [];
                let unitBase = baseCost;
                let gsmLabel = '';
                if (gsmList.length > 0) {
                    let g = gsmList[selectedPoligrafiyaGsmIndex] || gsmList[0];
                    unitBase = g.price;
                    gsmLabel = ` | ${g.gsm}gr`;
                }
                let rate = unitBase * sideFactor * poligrafiyaQtyFactor(qty);

                // Forma/sozlash xarajati — bir martalik, tirajga bo'linib qo'shiladi
                // (kichik tirajda dona narxi sun'iy pasaymasligi uchun)
                let setupFee = poligrafiyaAdvancedConfig.setupFee || 0;
                let setupLabel = '';
                if (setupFee > 0) {
                    rate += setupFee / qty;
                    setupLabel = ` | sozlash: ${setupFee.toLocaleString()} so'm (${qty} donaga bo'lingan)`;
                }

                baseUnitPrice = rate;
                let sizeLabel = poligrafiyaSizeLabels[activeProductType];
                details = (sizeLabel ? `Poligrafiya chop etish (${sizeLabel})` : "Poligrafiya chop etish") + gsmLabel + setupLabel;

    return { details, baseUnitPrice };
}
