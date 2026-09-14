    let textileDatabase = {};
    let textileEditState = { materials: [], colors: [] };
    let selectedTextileMaterial = '';
    let selectedTextileColor = '';

    function txId(prefix) {
        return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    }

    // Berilgan baza narxdan standart tiraj zinapoyasini yasaymiz
    function txDefaultTiers(base) {
        return [
            { from: 1, to: 10, mul: 1.00 },
            { from: 11, to: 50, mul: 0.92 },
            { from: 51, to: 100, mul: 0.85 },
            { from: 101, to: 200, mul: 0.79 },
            { from: 201, to: 500, mul: 0.74 },
            { from: 501, to: 0, mul: 0.70 }
        ].map(r => ({
            from: r.from, to: r.to,
            basePrice: Math.round(base * r.mul / 500) * 500,
            printPrices: { uv: 0, sifravoy: 0, dtf: 0, gravirovka: 0 }
        }));
    }

    // ====================== DTF Pechat narxi (avtomatik, BARCHA tekstil turlariga umumiy) ======================
    // Mashina eni maksimal 58 sm, uzunligi rulon hisoblanadi. Narx FAQAT uzunlikka (bo'yi, sm)
    // bog'liq — eni 58 smgacha narxga ta'sir qilmaydi. 58x100 sm bo'lak narxi — eng kam summa:
    // hatto kiritilgan uzunlik (10, 20, 30, 35 sm va h.k.) 100 sm dan kichik bo'lsa ham shu eng
    // kam summa olinadi. Bir nechta dona/tomon bo'lsa, detallar orasiga oraliq (5mm) qo'yib,
    // BUTUN buyurtma uchun umumiy rulon uzunligi topiladi va narx shunga hisoblanadi (bitta
    // umumiy summa) — keyin dona soniga bo'linadi. Bosish (yopishtirish) mehnat narxi va Taxi
    // (yetkazib berish) alohida qo'shiladi. Naqsh setupFee/bayroqDeliveryFee'ga o'xshash.
    let textileDtfConfig = {
        rollWidthCm: 58,   // mashinaning maksimal eni — faqat ma'lumot/ogohlantirish uchun
        rollLengthCm: 100, // narx belgilangan bo'lak uzunligi (sm)
        rollPrice: 90000,  // shu uzunlikdagi (58x100 sm) DTF narxi, so'm — shu bilan birga eng kam summa
        gapCm: 0.5,        // detallar orasidagi masofa (5 mm), sm
        frontFee: 2000,    // bosish narxi — oldi tomon (so'm/dona)
        backFee: 5000,     // bosish narxi — orqa tomon (so'm/dona)
        kepkaFee: 1000,    // kepkaga bosish narxi — tomon farqisiz, bitta flat summa (so'm/dona)
        taxiFee: 50000     // Taxi (yetkazib berish) — bir martalik, BARCHA tekstil turlariga umumiy
    };

    // Butun buyurtma uchun umumiy DTF (rulon material) xarajati.
    // front/back: {x,y} sm. qty: dona soni. Eni narxga ta'sir qilmaydi, faqat "y" (bo'yi) hisobga olinadi.
    function textileDtfTotal(front, back, qty, cfg) {
        cfg = cfg || textileDtfConfig;
        let n = Math.max(1, parseInt(qty) || 1);
        let frontActive = (parseFloat(front && front.x) > 0) && (parseFloat(front && front.y) > 0);
        let backActive = (parseFloat(back && back.x) > 0) && (parseFloat(back && back.y) > 0);

        let pieceCount = 0;
        let totalLength = 0;
        if (frontActive) { totalLength += (parseFloat(front.y) || 0) * n; pieceCount += n; }
        if (backActive) { totalLength += (parseFloat(back.y) || 0) * n; pieceCount += n; }

        if (pieceCount === 0) {
            return { cost: 0, totalLength: 0, pieceCount: 0, minQollandi: false };
        }

        totalLength += Math.max(0, pieceCount - 1) * (parseFloat(cfg.gapCm) || 0);
        let pricePerCm = (parseFloat(cfg.rollPrice) || 0) / (parseFloat(cfg.rollLengthCm) || 100);
        let raw = totalLength * pricePerCm;
        let minPrice = parseFloat(cfg.rollPrice) || 0;
        let minQollandi = raw < minPrice;
        return {
            cost: Math.round(minQollandi ? minPrice : raw),
            totalLength, pieceCount, minQollandi
        };
    }

    // Bosish (DTF yopishtirish) mehnat narxi — DONA boshiga, tomon(lar)ga qarab.
    // Kepka boshqacha: tomon farqisiz bitta flat summa.
    function textileBosishNarxi(productKey, front, back, cfg) {
        cfg = cfg || textileDtfConfig;
        let frontActive = (parseFloat(front && front.x) > 0) && (parseFloat(front && front.y) > 0);
        let backActive = (parseFloat(back && back.x) > 0) && (parseFloat(back && back.y) > 0);
        if (!frontActive && !backActive) return 0;
        if (productKey === 'kepka') return parseFloat(cfg.kepkaFee) || 0;
        return (frontActive ? (parseFloat(cfg.frontFee) || 0) : 0) + (backActive ? (parseFloat(cfg.backFee) || 0) : 0);
    }

    function renderTextileDtfConfigAdmin() {
        let ids = {
            rollWidthCm: 'txDtfRollWidth', rollLengthCm: 'txDtfRollLength', rollPrice: 'txDtfRollPrice',
            gapCm: 'txDtfGap', frontFee: 'txDtfFrontFee', backFee: 'txDtfBackFee',
            kepkaFee: 'txDtfKepkaFee', taxiFee: 'txDtfTaxiFee'
        };
        Object.keys(ids).forEach(k => {
            let el = document.getElementById(ids[k]);
            if (el) el.value = textileDtfConfig[k];
        });
    }

    function saveTextileDtfConfig() {
        let get = (id, fallback) => {
            let el = document.getElementById(id);
            let v = el ? parseFloat(el.value) : NaN;
            return isNaN(v) ? fallback : v;
        };
        let cfg = {
            rollWidthCm: get('txDtfRollWidth', 58),
            rollLengthCm: get('txDtfRollLength', 100),
            rollPrice: get('txDtfRollPrice', 0),
            gapCm: get('txDtfGap', 0),
            frontFee: get('txDtfFrontFee', 0),
            backFee: get('txDtfBackFee', 0),
            kepkaFee: get('txDtfKepkaFee', 0),
            taxiFee: get('txDtfTaxiFee', 0)
        };
        if (cfg.rollLengthCm <= 0) {
            showToast("⚠️ Bo'lak uzunligi 0 dan katta bo'lishi kerak!");
            return;
        }
        if (cfg.rollWidthCm <= 0) {
            showToast("⚠️ Mashina eni 0 dan katta bo'lishi kerak!");
            return;
        }
        textileDtfConfig = cfg;
        localStorage.setItem('erp_textile_dtf_config', JSON.stringify(textileDtfConfig));
        if (typeof logAudit === 'function') {
            logAudit("Textile DTF/Taxi narxi o'zgartirildi",
                `Rulon: ${cfg.rollPrice.toLocaleString()} so'm / ${cfg.rollLengthCm}sm, Taxi: ${cfg.taxiFee.toLocaleString()} so'm`);
        }
        showToast("💾 DTF va Taxi sozlamalari saqlandi!");
    }

    function getDefaultTextileDb() {
        const db = {};
        textileKeys.forEach(key => {
            if (key === 'bayroqlar') return; // o'z alohida bazasiga (bayroqDatabase) ega, material/rang dvigatelini ishlatmaydi
            let base = defaultPrices[key] || 45000;
            db[key] = {
                materials: [
                    { id: txId('MAT'), name: 'Paxta 100% (standart)', tiers: txDefaultTiers(base) },
                    { id: txId('MAT'), name: 'Paxta/Polyester (peniye)', tiers: txDefaultTiers(base * 1.15) },
                    { id: txId('MAT'), name: 'Polyester (sport)', tiers: txDefaultTiers(base * 0.9) }
                ],
                // Rang — doimiy ustama sifatida qo'shiladi (tirajdan qat'iy nazar bir xil).
                // Standart ranglar 0, qiyin ranglar qimmatroq.
                colors: [
                    { id: txId('CLR'), name: 'Oq', hex: '#ffffff', surcharge: 0 },
                    { id: txId('CLR'), name: 'Qora', hex: '#111827', surcharge: 5000 },
                    { id: txId('CLR'), name: "Ko'k", hex: '#1d4ed8', surcharge: 3000 },
                    { id: txId('CLR'), name: 'Qizil', hex: '#dc2626', surcharge: 3000 }
                ]
            };
        });
        return db;
    }
    // (Eslatma: DTF pechat narxi endi bu yerda emas — textileDtfConfig orqali BARCHA turlarga umumiy.)

    function normalizeTextileItem(it, prefix) {
        it = it || {};
        return {
            id: it.id || txId(prefix),
            name: (it.name || '').toString(),
            hex: (it.hex || '#94a3b8').toString(),
            tiers: normalizeTierList(it.tiers)
        };
    }

    // Ranglar endi tirajga bog'liq oraliqlar jadvaliga ega emas — har biri BITTA doimiy
    // ustama (so'm) qiymatiga ega. Eski (tiraj-jadvalli) ma'lumotdan migratsiya: birinchi
    // oraliqning narxini doimiy ustama sifatida olamiz, shunda mavjud narxlar yo'qolib qolmaydi.
    function normalizeTextileColor(c) {
        c = c || {};
        let surcharge;
        if (typeof c.surcharge === 'number' || typeof c.surcharge === 'string') {
            surcharge = parseFloat(c.surcharge) || 0;
        } else if (Array.isArray(c.tiers) && c.tiers.length > 0) {
            let first = normalizeTierList(c.tiers)[0];
            surcharge = first ? (parseFloat(first.basePrice) || 0) : 0;
        } else {
            surcharge = 0;
        }
        return {
            id: c.id || txId('CLR'),
            name: (c.name || '').toString(),
            hex: (c.hex || '#94a3b8').toString(),
            surcharge
        };
    }

    function getTextileConfig(key) {
        let cfg = textileDatabase[key] || {};
        return {
            materials: (cfg.materials || []).map(m => normalizeTextileItem(m, 'MAT')),
            colors: (cfg.colors || []).map(normalizeTextileColor)
        };
    }

    // Material uchun berilgan tirajdagi narxi (materiallar hamon tiraj bo'yicha oraliqlarga ega)
    function textileItemPrice(item, qty) {
        if (!item) return 0;
        let t = findTierForQty(item.tiers, qty);
        return t ? t.basePrice : 0;
    }

    // Rang ustamasi — doimiy, tirajga bog'liq emas
    function textileColorSurcharge(color) {
        return color ? (parseFloat(color.surcharge) || 0) : 0;
    }

    // --- Admin muharriri ---

    function loadTextileEditState(key) {
        let cfg = getTextileConfig(key);
        textileEditState = {
            materials: JSON.parse(JSON.stringify(cfg.materials)),
            colors: JSON.parse(JSON.stringify(cfg.colors))
        };
        renderTextileEditor('materials');
        renderTextileEditor('colors');
        renderTextileDtfConfigAdmin();
    }

    function textileEditorContainer(kind) {
        return document.getElementById(kind === 'materials' ? 'textileMaterialsEditor' : 'textileColorsEditor');
    }

    function renderTextileEditor(kind) {
        if (kind === 'colors') { renderTextileColorsEditor(); return; }
        const box = textileEditorContainer(kind);
        if (!box) return;
        const list = textileEditState[kind] || [];

        if (list.length === 0) {
            box.innerHTML = `<div class="tx-empty">Hali qo'shilmagan. Pastdagi tugmani bosing.</div>`;
            return;
        }

        box.innerHTML = list.map((it, i) => `
            <div class="tx-item">
                <div class="tx-item-head">
                    <div class="form-group">
                        <label>Material nomi:</label>
                        <input type="text" value="${(it.name || '').replace(/"/g, '&quot;')}" placeholder="Masalan: Paxta 100%"
                               oninput="updateTextileItemName('${kind}', ${i}, this.value)">
                    </div>
                    <div class="tx-item-actions">
                        <button type="button" class="tx-btn" onclick="addTextileTier('${kind}', ${i})">+ Oraliq</button>
                        <button type="button" class="tx-btn" onclick="fillTextileDefaultTiers('${kind}', ${i})">⚡ Namuna oraliqlar</button>
                        <button type="button" class="tx-btn danger" onclick="removeTextileItem('${kind}', ${i})">🗑️ O'chirish</button>
                    </div>
                </div>
                <div style="overflow-x:auto;">
                    <table class="tier-table">
                        <thead><tr>
                            <th style="width:90px;">Dan (dona)</th>
                            <th style="width:90px;">Gacha</th>
                            <th style="width:140px;">Narxi (so'm)</th>
                            <th style="width:70px;"></th>
                        </tr></thead>
                        <tbody>
                            ${(it.tiers || []).length === 0
                                ? `<tr><td colspan="4" style="padding:10px 4px; color:#b45309; font-size:0.8rem;">Oraliq yo'q — narx 0 bo'lib qoladi. "+ Oraliq" tugmasini bosing.</td></tr>`
                                : it.tiers.map((t, ti) => `
                                    <tr>
                                        <td><input type="number" min="1" value="${t.from}" oninput="updateTextileTier('${kind}', ${i}, ${ti}, 'from', this.value)"></td>
                                        <td><input type="number" min="0" value="${t.to}" placeholder="∞" oninput="updateTextileTier('${kind}', ${i}, ${ti}, 'to', this.value)"></td>
                                        <td><input type="number" min="0" value="${t.basePrice}" oninput="updateTextileTier('${kind}', ${i}, ${ti}, 'basePrice', this.value)"></td>
                                        <td><button type="button" class="tier-remove" onclick="removeTextileTier('${kind}', ${i}, ${ti})">✕</button></td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
                ${(() => {
                    let msgs = tierValidationMessages(it.tiers);
                    return msgs.length === 0 ? '' : `<div class="tier-warning">⚠️ ${msgs.map(m => `<div>• ${m}</div>`).join('')}</div>`;
                })()}
            </div>
        `).join('');
    }

    // Ranglar — kompakt bitta qatorli ko'rinish: tusi, nomi va DOIMIY ustama (bitta son), tiraj
    // jadvali yo'q. Har bir mahsulotda odatda 3-7 ta rang bo'ladi — shuning uchun bu ancha
    // ixchamroq va qulayroq, avvalgi (har birida 6 qatorli to'liq jadval) ko'rinishga qaraganda.
    function renderTextileColorsEditor() {
        const box = textileEditorContainer('colors');
        if (!box) return;
        const list = textileEditState.colors || [];

        if (list.length === 0) {
            box.innerHTML = `<div class="tx-empty">Hali qo'shilmagan. Pastdagi tugmani bosing.</div>`;
            return;
        }

        box.innerHTML = list.map((it, i) => `
            <div class="tx-color-row">
                <input type="color" class="tx-color-row-swatch" value="${it.hex || '#94a3b8'}" oninput="updateTextileItemHex(${i}, this.value)">
                <div class="form-group tx-color-row-name">
                    <label>Rang nomi</label>
                    <input type="text" value="${(it.name || '').replace(/"/g, '&quot;')}" placeholder="Masalan: Qora"
                           oninput="updateTextileItemName('colors', ${i}, this.value)">
                </div>
                <div class="form-group tx-color-row-surcharge">
                    <label>Ustama (so'm)</label>
                    <input type="number" min="0" value="${parseFloat(it.surcharge) || 0}" placeholder="0"
                           oninput="updateTextileColorSurcharge(${i}, this.value)">
                </div>
                <button type="button" class="tx-btn danger" onclick="removeTextileItem('colors', ${i})">🗑️</button>
            </div>
        `).join('');
    }

    function updateTextileColorSurcharge(idx, value) {
        if (!textileEditState.colors[idx]) return;
        textileEditState.colors[idx].surcharge = parseFloat(value) || 0;
    }

    function addTextileItem(kind) {
        let isColor = (kind === 'colors');
        if (isColor) {
            textileEditState.colors.push({ id: txId('CLR'), name: '', hex: '#94a3b8', surcharge: 0 });
        } else {
            let base = defaultPrices[currentManagingProduct] || 45000;
            textileEditState.materials.push({ id: txId('MAT'), name: '', tiers: txDefaultTiers(base) });
        }
        renderTextileEditor(kind);
    }

    function updateTextileItemHex(idx, value) {
        if (!textileEditState.colors[idx]) return;
        textileEditState.colors[idx].hex = value;
    }

    function removeTextileItem(kind, idx) {
        let it = textileEditState[kind][idx];
        if (it && !confirm(`"${it.name || 'Nomsiz'}" o'chirilsinmi?`)) return;
        textileEditState[kind].splice(idx, 1);
        renderTextileEditor(kind);
    }

    function updateTextileItemName(kind, idx, value) {
        if (!textileEditState[kind][idx]) return;
        textileEditState[kind][idx].name = value;
    }

    function addTextileTier(kind, idx) {
        let it = textileEditState[kind][idx];
        if (!it) return;
        let sorted = normalizeTierList(it.tiers);
        let last = sorted.slice(-1)[0];
        it.tiers = sorted;
        it.tiers.push({
            from: last ? (tierUpper(last) === Infinity ? last.from + 1 : tierUpper(last) + 1) : 1,
            to: 0,
            basePrice: last ? last.basePrice : 0,
            printPrices: { uv: 0, sifravoy: 0, dtf: 0, gravirovka: 0 }
        });
        renderTextileEditor(kind);
    }

    function removeTextileTier(kind, idx, tIdx) {
        let it = textileEditState[kind][idx];
        if (!it) return;
        it.tiers.splice(tIdx, 1);
        renderTextileEditor(kind);
    }

    function updateTextileTier(kind, idx, tIdx, field, value) {
        let it = textileEditState[kind][idx];
        if (!it || !it.tiers[tIdx]) return;
        it.tiers[tIdx][field] = (field === 'basePrice') ? (parseFloat(value) || 0) : (parseInt(value) || 0);
        // Faqat ogohlantirishlarni yangilaymiz — butun jadvalni qayta chizsak, kursor sakraydi
        renderTextileWarningsOnly(kind, idx);
    }

    function renderTextileWarningsOnly(kind, idx) {
        const box = textileEditorContainer(kind);
        if (!box) return;
        const card = box.querySelectorAll('.tx-item')[idx];
        if (!card) return;
        let old = card.querySelector('.tier-warning');
        let msgs = tierValidationMessages(textileEditState[kind][idx].tiers);
        if (old) old.remove();
        if (msgs.length > 0) {
            let div = document.createElement('div');
            div.className = 'tier-warning';
            div.innerHTML = `⚠️ ${msgs.map(m => `<div>• ${m}</div>`).join('')}`;
            card.appendChild(div);
        }
    }

    // Faqat materiallar uchun ishlatiladi (ranglarda endi oraliq jadvali yo'q)
    function fillTextileDefaultTiers(kind, idx) {
        let it = textileEditState[kind][idx];
        if (!it) return;
        if ((it.tiers || []).length > 0 && !confirm("Mavjud oraliqlar o'chib, o'rniga namuna oraliqlar qo'yiladi. Davom etamizmi?")) return;
        let first = normalizeTierList(it.tiers)[0];
        let base = first ? first.basePrice : (defaultPrices[currentManagingProduct] || 45000);
        it.tiers = txDefaultTiers(base);
        renderTextileEditor(kind);
    }

    function saveTextileConfig() {
        if (!currentManagingProduct) return;

        for (let it of textileEditState.materials) {
            if (!it.name || !it.name.trim()) {
                showToast("⚠️ Har bir materialning nomi bo'lishi kerak!");
                return;
            }
            if (normalizeTierList(it.tiers).length === 0) {
                showToast(`⚠️ "${it.name}" uchun kamida bitta oraliq kiriting!`);
                return;
            }
        }
        for (let it of textileEditState.colors) {
            if (!it.name || !it.name.trim()) {
                showToast("⚠️ Har bir rangning nomi bo'lishi kerak!");
                return;
            }
        }
        if (textileEditState.materials.length === 0) {
            showToast("⚠️ Kamida bitta material qo'shing!");
            return;
        }
        textileDatabase[currentManagingProduct] = {
            materials: textileEditState.materials.map(m => normalizeTextileItem(m, 'MAT')),
            colors: textileEditState.colors.map(normalizeTextileColor)
        };
        localStorage.setItem('erp_textile_db', JSON.stringify(textileDatabase));
        if (typeof logAudit === 'function') logAudit("Textile narxlari o'zgartirildi", `Mahsulot: ${currentManagingProduct}`);
        loadTextileEditState(currentManagingProduct);
        showToast("💾 Textile sozlamalari saqlandi!");
    }

    // --- Kalkulyator uchun jadval ko'rinishi ---
    // Material va o'lchamlarning oraliq chegaralari har xil bo'lishi mumkin,
    // shuning uchun barcha chegaralarni birlashtirib chiqaramiz.
    function renderTextileTierPreview(mat, color, front, back, qty, marginPercent) {
        const box = document.getElementById('tierPreviewBox');
        if (!box) return;

        // Material oraliq chegaralari asosida jadval qatorlari chiqariladi. DTF va Taxi narxi
        // endi tirajga qarab uzluksiz o'zgaradi (umumiy summa dona soniga bo'linadi), shuning
        // uchun ular alohida "nuqta" qo'shmaydi — faqat unitAt(t) ichida hisoblab chiqiladi.
        // Rang doimiy ustama (tirajga bog'liq emas), shuning uchun bu yerga kirmaydi.
        let points = new Set();
        [mat].filter(Boolean).forEach(it => normalizeTierList(it.tiers).forEach(t => points.add(t.from)));

        let sorted = [...points].sort((a, b) => a - b);
        if (sorted.length <= 1) { box.style.display = 'none'; box.innerHTML = ''; return; }

        let m = 1 + ((parseFloat(marginPercent) || 0) / 100);
        let n = parseInt(qty) || 1;
        let colorSurcharge = textileColorSurcharge(color);
        let bosishPerUnit = textileBosishNarxi(activeProductType, front, back, textileDtfConfig);

        const unitAt = (t) => {
            let dtfRes = textileDtfTotal(front, back, t, textileDtfConfig);
            return Math.round((
                textileItemPrice(mat, t) +
                colorSurcharge +
                bosishPerUnit +
                (dtfRes.cost / t) +
                (textileDtfConfig.taxiFee / t)
            ) * m);
        };

        box.style.display = 'block';
        box.innerHTML = `
            <div style="font-size:0.85rem; font-weight:700; color:var(--primary); margin-bottom:4px;">📊 Miqdor bo'yicha narx jadvali</div>
            <div style="font-size:0.76rem; color:var(--text-muted);">Material, rang va pechat narxi birgalikda hisoblangan.</div>
            <table class="tier-preview-table">
                <thead><tr><th>Miqdor</th><th style="text-align:right;">Dona narxi</th><th style="text-align:right;">Eng kam miqdorda jami</th></tr></thead>
                <tbody>
                    ${sorted.map((from, i) => {
                        let to = (i < sorted.length - 1) ? sorted[i + 1] - 1 : 0;
                        let unit = unitAt(from);
                        let isActive = n >= from && (to === 0 || n <= to);
                        return `
                            <tr class="${isActive ? 'tier-active' : ''}">
                                <td>${tierLabel({ from, to })}${isActive ? ' ✓' : ''}</td>
                                <td style="text-align:right;">${unit.toLocaleString()} so'm</td>
                                <td style="text-align:right;">${(unit * from).toLocaleString()} so'm</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    // --- Kalkulyatordagi material / rang tugmachalari ---

    function renderTextilePickers(type) {
        let cfg = getTextileConfig(type);

        const matBox = document.getElementById('textileMaterialButtons');
        if (matBox) {
            if (!cfg.materials.some(m => m.id === selectedTextileMaterial)) {
                selectedTextileMaterial = cfg.materials[0] ? cfg.materials[0].id : '';
            }
            matBox.innerHTML = cfg.materials.length === 0
                ? `<span class="tx-empty">Admin panelda material qo'shilmagan.</span>`
                : cfg.materials.map(m => `
                    <button type="button" class="color-swatch-btn ${selectedTextileMaterial === m.id ? 'active' : ''}"
                            style="padding:6px 14px;" onclick="selectTextileMaterial('${m.id}')">${m.name}</button>
                `).join('');
        }

        const colorGroup = document.getElementById('textileColorGroup');
        const colorBox = document.getElementById('textileColorButtons');
        if (colorGroup && colorBox) {
            if (cfg.colors.length === 0) {
                colorGroup.style.display = 'none';
                selectedTextileColor = '';
            } else {
                colorGroup.style.display = 'flex';
                if (!cfg.colors.some(c => c.id === selectedTextileColor)) {
                    selectedTextileColor = cfg.colors[0].id;
                }
                colorBox.innerHTML = cfg.colors.map(c => `
                    <button type="button" class="color-swatch-btn ${selectedTextileColor === c.id ? 'active' : ''}"
                            onclick="selectTextileColor('${c.id}')" title="${c.name}">
                        <span class="color-swatch-dot" style="background:${c.hex};"></span>
                        <span>${c.name}</span>
                    </button>
                `).join('');
            }
        }

        calculate();
    }

    function selectTextileMaterial(id) {
        selectedTextileMaterial = id;
        renderTextilePickers(activeProductType);
    }

    function selectTextileColor(id) {
        selectedTextileColor = id;
        renderTextilePickers(activeProductType);
    }

    // Admin ro'yxatida chop narxini "eng qimmatdan → eng arzongacha" ko'rinishida chiqaramiz

function generateFormHtml_textile(type) {
    let html = '';
            let txCfg = getTextileConfig(type);
            selectedTextileMaterial = txCfg.materials[0] ? txCfg.materials[0].id : '';
            selectedTextileColor = txCfg.colors[0] ? txCfg.colors[0].id : '';

            html = `
                <div class="form-group" style="margin-bottom:14px;">
                    <label>Material (mato turi):</label>
                    <div class="tx-pick-row" id="textileMaterialButtons"></div>
                </div>
                <div class="form-group" style="margin-bottom:14px;" id="textileColorGroup">
                    <label>Mato rangi:</label>
                    <div class="tx-pick-row" id="textileColorButtons"></div>
                </div>

                <div class="price-size-box" style="margin-bottom:14px;">
                    <div class="price-size-title">🖨️ Old tomon pechati (sm)</div>
                    <div class="tx-xy-row">
                        <div class="form-group">
                            <label>Eni (X):</label>
                            <input type="number" id="inpFrontX" value="20" min="0" step="0.5" oninput="calculate()">
                        </div>
                        <span class="tx-xy-sep">×</span>
                        <div class="form-group">
                            <label>Bo'yi (Y):</label>
                            <input type="number" id="inpFrontY" value="25" min="0" step="0.5" oninput="calculate()">
                        </div>
                        <div class="tx-area-info" id="frontAreaInfo"></div>
                    </div>
                    <div style="font-size:0.76rem; color:var(--text-muted); margin-top:8px;">Mashina eni max 58 sm — narxga faqat bo'yi (uzunlik) ta'sir qiladi.</div>
                </div>

                <div class="price-size-box" style="margin-bottom:14px;">
                    <div class="price-size-title">🖨️ Orqa tomon pechati (sm)</div>
                    <div class="tx-xy-row">
                        <div class="form-group">
                            <label>Eni (X):</label>
                            <input type="number" id="inpBackX" value="0" min="0" step="0.5" oninput="calculate()">
                        </div>
                        <span class="tx-xy-sep">×</span>
                        <div class="form-group">
                            <label>Bo'yi (Y):</label>
                            <input type="number" id="inpBackY" value="0" min="0" step="0.5" oninput="calculate()">
                        </div>
                        <div class="tx-area-info" id="backAreaInfo"></div>
                    </div>
                    <div style="font-size:0.76rem; color:var(--text-muted); margin-top:8px;">0 qoldirsangiz — orqa tomonga pechat qilinmaydi. Mashina eni max 58 sm — narxga faqat bo'yi (uzunlik) ta'sir qiladi.</div>
                </div>

                <div class="form-group">
                    <label>Adad (dona):</label>
                    <input type="number" id="inpQuantity" value="10" min="1" oninput="calculate()">
                </div>
            `;

    return html;
}

function calculateResult_textile(activeProductTypeParam, qty, marginPercent) {
    let details = activeProductType.toUpperCase();
    let baseUnitPrice = 0;
                let cfg = getTextileConfig(activeProductType);
                let mat = cfg.materials.find(m => m.id === selectedTextileMaterial) || cfg.materials[0] || null;
                let color = cfg.colors.find(c => c.id === selectedTextileColor) || null;

                let front = {
                    x: parseFloat(document.getElementById('inpFrontX')?.value) || 0,
                    y: parseFloat(document.getElementById('inpFrontY')?.value) || 0
                };
                let back = {
                    x: parseFloat(document.getElementById('inpBackX')?.value) || 0,
                    y: parseFloat(document.getElementById('inpBackY')?.value) || 0
                };

                let n = Math.max(1, parseInt(qty) || 1);
                let matCost = textileItemPrice(mat, qty);
                let colorCost = textileColorSurcharge(color);
                let dtfRes = textileDtfTotal(front, back, n, textileDtfConfig);
                let bosishPerUnit = textileBosishNarxi(activeProductType, front, back, textileDtfConfig);
                let dtfPerUnit = dtfRes.cost / n;
                let taxiPerUnit = (parseFloat(textileDtfConfig.taxiFee) || 0) / n;

                baseUnitPrice = matCost + colorCost + bosishPerUnit + dtfPerUnit + taxiPerUnit;

                // Har bir tomon uchun ma'lumot: faqat uzunlik (sm) narxga ta'sir qiladi,
                // eni 58 smdan katta bo'lsa ogohlantirish chiqadi.
                const eniOgohlantirish = (x) => (parseFloat(x) || 0) > (parseFloat(textileDtfConfig.rollWidthCm) || 58)
                    ? ` <span style="color:#dc2626;">(⚠️ mashina eni max ${textileDtfConfig.rollWidthCm}sm!)</span>`
                    : '';
                const yozMaydon = (elId, xy) => {
                    let el = document.getElementById(elId);
                    if (!el) return;
                    let active = (parseFloat(xy.x) > 0) && (parseFloat(xy.y) > 0);
                    el.innerHTML = !active
                        ? `<span style="color:var(--text-muted);">Pechatsiz</span>`
                        : `${xy.y} sm uzunlik${eniOgohlantirish(xy.x)}`;
                };
                yozMaydon('frontAreaInfo', front);
                yozMaydon('backAreaInfo', back);

                let parts = [mat ? mat.name : 'Material tanlanmagan'];
                if (color) parts.push(`Rang: ${color.name}`);
                parts.push(front.x * front.y > 0 ? `Oldi: ${front.x}×${front.y} sm` : 'Oldi: pechatsiz');
                parts.push(back.x * back.y > 0 ? `Orqa: ${back.x}×${back.y} sm` : 'Orqa: pechatsiz');
                if (dtfRes.pieceCount > 0) {
                    parts.push(`DTF: ${dtfRes.cost.toLocaleString()} so'm${dtfRes.minQollandi ? ' (eng kam)' : ''} / ${n} donaga bo'lingan`);
                }
                if (bosishPerUnit > 0) parts.push(`Bosish: ${bosishPerUnit.toLocaleString()} so'm/dona`);
                if (textileDtfConfig.taxiFee > 0) parts.push(`Taxi: ${textileDtfConfig.taxiFee.toLocaleString()} so'm (${n} donaga bo'lingan)`);
                let activeT = mat ? findTierForQty(mat.tiers, qty) : null;
                if (activeT) parts.push(`Oraliq: ${tierLabel(activeT)}`);
                details = parts.join(' | ');

                renderTextileTierPreview(mat, color, front, back, qty, marginPercent);

    return { details, baseUnitPrice };
}

// ====================== BAYROQLAR (Flags) ======================
// Bu Tekstil bo'limidagi boshqa turlardan (futbolka/kepka/...) TUBDAN farqli, alohida, soddaroq
// dvigatel: mahsulotlar (rasm+narx) ro'yxati + BARCHA mahsulotlarga umumiy bitta bir martalik
// "Taxi" (yetkazib berish) to'lovi, dona soniga bo'linib qo'shiladi. Material/rang tanlovi yo'q,
// miqdor bo'yicha alohida chegirma zinapoyasi ham yo'q — chunki manba jadvalda (Google Sheets
// "Bayroqlar" varag'i) bunday narsalar yo'q edi.
//
// Formula manba jadvaldan aniq chiqarilgan (bir nechta qatorda tekshirilgan):
//   Jami xarajat = Bayroq narxi × Soni + Taxi   (Taxi — HAR BIR qatorda bir xil, 50 000 so'm)
//   Narxi (dona) = Jami xarajat × Marja / Soni  ⇒  Narxi = (Bayroq narxi + Taxi/Soni) × Marja
// Bu xuddi poligrafiyaAdvancedConfig.setupFee bilan bir xil matematik naqsh (rate += setupFee/qty),
// shuning uchun o'sha o'rnatilgan pattern qayta ishlatildi — yangi mexanizm o'ylab topilmadi.
function bqId() { return 'BQ-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }

// Nomlar — mijozning haqiqiy texnik xususiyatlari (o'lcham, mato, pechat turi va h.k.) bo'lgani
// uchun manba jadvaldan VERBATIM (originaldagidek, rus tilida) olingan — tarjima yoki
// qisqartirish xatolik kiritishi mumkin.
function getDefaultBayroqDatabase() {
    return [
        { id: bqId(), price: 1600000, imageUrl: '', name: "Флаг кабинетный пластиковой покрытием:\nРазмер флага: 1,20х2,20 м\nТкань флага: Атлас (сатин)\nПечать изображения: 2 х слоёная\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота стойки: 2.80 м (металлический золотистый)" },
        { id: bqId(), price: 500000, imageUrl: '', name: "Флаг Парус уличный с конструкций\nРазмер флага: 0,60х2,20 м\nТкань флага: Полиэстер 135гр.\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота Парус конструкциии: 2.50 м" },
        { id: bqId(), price: 650000, imageUrl: '', name: "Флаг Парус уличный с конструкций\nРазмер флага: 0,70х3,00 м, 0,70х2,70 м\nТкань флага: Полиэстер 135гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота Парус конструкции: 3.40 м, 3.00 м" },
        { id: bqId(), price: 750000, imageUrl: '', name: "Флаг Парус уличный с конструкций «Г»\nРазмер флага: 0,80х3,00 м\nТкань флага: Полиэстер 200гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота Парус конструкциии: 3.40 м (Made in China)" },
        { id: bqId(), price: 500000, imageUrl: '', name: "Флаг Парус уличный с конструкций\nРазмер флага: 0,70х2,70 м, 0,60х2,20 м\nТкань флага: Полиэстер 135гр.\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота Парус конструкциии: 3.00 м, 2.50 м (Made in China)" },
        { id: bqId(), price: 900000, imageUrl: '', name: "Флаг Парус уличный с конструкций\nРазмер флага: 0,80х3,80 м\nТкань флага: Полиэстер 135гр.\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота Парус конструкциии: 4.00 м (Made in China)" },
        { id: bqId(), price: 55000, imageUrl: '', name: "Настольный флаг с одинарным флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см серибристый" },
        { id: bqId(), price: 110000, imageUrl: '', name: "Настольный флаг с двойной флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см серибристый" },
        { id: bqId(), price: 130000, imageUrl: '', name: "Настольный флаг с тройной флагштоком\nРазмер флага: 0,15х0,25см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см серибристый" },
        { id: bqId(), price: 120000, imageUrl: '', name: "Настольный флаг с одинарным флагштоком\nРазмер флага: 0,20х0,30 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 42 см золотистый" },
        { id: bqId(), price: 160000, imageUrl: '', name: "Настольный флаг с двойной флагштоком\nРазмер флага: 0,20х0,30см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 42 см золотистый" },
        { id: bqId(), price: 220000, imageUrl: '', name: "Настольный флаг с тройной флагштоком\nРазмер флага: 0,20х0,30 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 42 см золотистый" },
        { id: bqId(), price: 130000, imageUrl: '', name: "Настольный флаг с «Т» флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см золотистый" },
        { id: bqId(), price: 70000, imageUrl: '', name: "Настольный флаг с «Т» флагштоком\nРазмер флага: 0,8х0,30 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 33 см золотистый" },
        { id: bqId(), price: 90000, imageUrl: '', name: "Настольный Вымпел с флагштоком (крючком)\nРазмер флага: 0,12х0,24 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 34 см серибристый (Made in Turkey)" },
        { id: bqId(), price: 160000, imageUrl: '', name: "Настольный флаг с четырех рожковый флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см серибристый (Made in Turkey)" },
        { id: bqId(), price: 180000, imageUrl: '', name: "Настольный флаг с пяти рожковый флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см серибристый (Made in Turkey)" },
        { id: bqId(), price: 75000, imageUrl: '', name: "Настольный флаг с «Г» флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150 гр.\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 35 см золотистый" },
        { id: bqId(), price: 80000, imageUrl: '', name: "Флаг Узбекистан уличный\nРазмер флага: 1,00х2,00 м\nТкань флага: Креп (атлас)\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка" },
        { id: bqId(), price: 150000, imageUrl: '', name: "Флаг Узбекистан уличный\nРазмер флага: 1,00х1,50 м\nТкань флага: Полиэстер 135гр.\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка" },
        { id: bqId(), price: 100000, imageUrl: '', name: "Флаг уличный\nРазмер флага: 1,00х1,50 м\nТкань флага: Креп\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка" },
        { id: bqId(), price: 85000, imageUrl: '', name: "Вымпел с бахромой\nРазмер флага: А4 (20х30см)\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка" },
        { id: bqId(), price: 100000, imageUrl: '', name: "Вымпел с бахромой\nРазмер флага: А3 (30х40см)\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка" },
        { id: bqId(), price: 100000, imageUrl: '', name: "Подушка с нанесением логотипа\nРазмер подушка: 35х35см\nТкань: Сатин\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная" },
        { id: bqId(), price: 120000, imageUrl: '', name: "Подушка с нанесением логотипа\nРазмер подушка: 45х45см\nТкань: Сатин\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная" },
        { id: bqId(), price: 150000, imageUrl: '', name: "Чехол для кулера\nРазмер: Стандарт\nТкань флага: Атлас (сатин) 150 гр.\nПечать изображении: 1х сторонняя\nТип печати: Сублимационная" }
    ];
}

let bayroqDatabase = getDefaultBayroqDatabase();
let bayroqDeliveryFee = 50000; // "Taxi" — bir martalik, dona soniga bo'linib qo'shiladi
let selectedBayroqIndex = 0;
let bayroqEditId = null;
let bayroqAdminSearchFilter = '';

function bayroqShortName(item) {
    let first = ((item && item.name) || '').split('\n')[0].trim();
    return first.replace(/[:：]\s*$/, '') || 'Bayroq';
}

// ---------------- MIJOZ (client) tomoni ----------------
function generateFormHtml_bayroq() {
    selectedBayroqIndex = bayroqDatabase.length > 0 ? 0 : -1;
    if (bayroqDatabase.length === 0) {
        return `<p style="color:var(--text-muted); font-size:0.85rem;">⚠️ Hali bayroq turlari kiritilmagan — Admin Panelda kiriting.</p>`;
    }
    return `
        <div class="step-title">1. Mahsulotni tanlang (<span id="bayroqAvailableCount">${bayroqDatabase.length}</span> ta mavjud):</div>
        <div class="bayroq-search-wrap">
            <input type="text" id="bayroqSearchInput" placeholder="🔎 Nomi bo'yicha qidirish..." oninput="renderBayroqPicker()">
        </div>
        <div class="bayroq-grid" id="bayroqGrid"></div>
        <div id="bayroqSpecBox"></div>
        <div class="form-group" style="margin-top:10px;">
            <label>2. Adad (dona):</label>
            <input type="number" id="inpQuantity" value="1" min="1" oninput="calculate()">
        </div>
    `;
}

// Sonlar bazadagi mahsulotlar soniga qarab (5 tadanmi, 100+ tadanmi) o'zgarishi mumkin —
// shuning uchun ICHKI scroll-quti ishlatilmaydi, .bayroq-grid har doim to'liq kengayadi va
// kartochkalar sahifaning umumiy oqimida joylashadi.
function renderBayroqPicker() {
    const grid = document.getElementById('bayroqGrid');
    if (!grid) return;
    let q = (document.getElementById('bayroqSearchInput')?.value || '').toLowerCase();
    let list = bayroqDatabase.filter(it => !q || bayroqShortName(it).toLowerCase().includes(q) || (it.name || '').toLowerCase().includes(q));
    let activeItem = bayroqDatabase[selectedBayroqIndex];
    let countEl = document.getElementById('bayroqAvailableCount');
    if (countEl) countEl.textContent = bayroqDatabase.length;
    grid.innerHTML = list.length > 0 ? list.map(item => `
        <div class="bayroq-card ${activeItem && activeItem.id === item.id ? 'active' : ''}" id="bayroq-card-${item.id}" onclick="selectBayroqItem('${item.id}')">
            <img src="${item.imageUrl || 'https://via.placeholder.com/100x75?text=Bayroq'}" alt="${bayroqShortName(item)}" onerror="this.src='https://via.placeholder.com/100x75?text=No+Img'">
            <div class="bayroq-card-name" title="${(item.name || '').replace(/"/g, '&quot;')}">${bayroqShortName(item)}</div>
            <div class="bayroq-card-price">${(item.price || 0).toLocaleString()} so'm</div>
        </div>
    `).join('') : `<p style="color:var(--text-muted); font-size:0.85rem;">🔍 Hech narsa topilmadi.</p>`;
}

function selectBayroqItem(id) {
    let idx = bayroqDatabase.findIndex(it => it.id === id);
    if (idx < 0) return;
    selectedBayroqIndex = idx;
    document.querySelectorAll('#bayroqGrid .bayroq-card').forEach(c => c.classList.remove('active'));
    document.getElementById(`bayroq-card-${id}`)?.classList.add('active');
    calculate();
}

function renderBayroqSpecBox() {
    let box = document.getElementById('bayroqSpecBox');
    if (!box) return;
    let item = bayroqDatabase[selectedBayroqIndex];
    if (!item) { box.innerHTML = ''; return; }
    let safe = (item.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    box.innerHTML = `<div style="white-space:pre-line; background:rgba(0,0,0,0.03); border:1px solid var(--border); border-radius:8px; padding:10px; margin:8px 0; font-size:0.78rem; color:var(--text-muted); line-height:1.5;">${safe}</div>`;
}

function calculateResult_bayroq(qty) {
    if (bayroqDatabase.length === 0) {
        return { details: "Bayroqlar bazasi bo'sh — Admin Panelda kiriting", baseUnitPrice: 0 };
    }
    if (selectedBayroqIndex < 0 || selectedBayroqIndex >= bayroqDatabase.length) selectedBayroqIndex = 0;
    let item = bayroqDatabase[selectedBayroqIndex];
    renderBayroqSpecBox();
    let n = Math.max(1, parseInt(qty) || 1);
    let baseUnitPrice = item.price || 0;
    let feeLabel = '';
    if (bayroqDeliveryFee > 0) {
        baseUnitPrice += bayroqDeliveryFee / n;
        feeLabel = ` | Taxi (bir martalik): ${bayroqDeliveryFee.toLocaleString()} so'm (${n} donaga bo'lingan)`;
    }
    let details = `${bayroqShortName(item)}${feeLabel}`;
    return { details, baseUnitPrice };
}

// ---------------- ADMIN tomoni ----------------
function renderBayroqAdmin() {
    bayroqAdminSearchFilter = '';
    let searchInput = document.getElementById('bayroqAdminSearchInput');
    if (searchInput) searchInput.value = '';
    let feeInput = document.getElementById('bayroqDeliveryFeeInput');
    if (feeInput) feeInput.value = bayroqDeliveryFee;
    cancelBayroqEdit();
    renderBayroqAdminGrid();
}

function filterBayroqAdminGrid() {
    bayroqAdminSearchFilter = (document.getElementById('bayroqAdminSearchInput')?.value || '').toLowerCase();
    renderBayroqAdminGrid();
}

function renderBayroqAdminGrid() {
    const grid = document.getElementById('bayroqAdminGrid');
    if (!grid) return;
    let countEl = document.getElementById('bayroqAdminCount');
    if (countEl) countEl.textContent = bayroqDatabase.length > 0 ? `${bayroqDatabase.length} ta mahsulot` : '';

    let list = bayroqDatabase.filter(it => !bayroqAdminSearchFilter ||
        bayroqShortName(it).toLowerCase().includes(bayroqAdminSearchFilter) ||
        (it.name || '').toLowerCase().includes(bayroqAdminSearchFilter));

    if (bayroqDatabase.length === 0) {
        grid.innerHTML = `<div class="model-grid-empty">📭 Hozircha hech qanday bayroq qo'shilmagan.<br>Yuqoridagi formadan birinchisini qo'shing.</div>`;
        return;
    }
    if (list.length === 0) {
        grid.innerHTML = `<div class="model-grid-empty">🔍 Qidiruvga mos mahsulot topilmadi.</div>`;
        return;
    }

    grid.innerHTML = list.map(item => `
        <div class="model-card">
            <div class="model-card-top">
                <div class="model-card-thumb">
                    <img src="${item.imageUrl || 'https://via.placeholder.com/80?text=No+Img'}" onerror="this.src='https://via.placeholder.com/80?text=No+Img'">
                </div>
                <div class="model-card-head">
                    <div class="model-card-name" title="${(item.name || '').replace(/"/g, '&quot;')}">${bayroqShortName(item)}</div>
                </div>
                <div class="action-btns model-card-actions">
                    <button class="btn btn-warning" title="Tahrirlash" onclick="editBayroqItem('${item.id}')">✏️</button>
                    <button class="btn btn-danger" title="O'chirish" onclick="deleteBayroqItem('${item.id}')">🗑️</button>
                </div>
            </div>
            <div class="model-card-body">
                <div class="model-card-price">${(item.price || 0).toLocaleString()} so'm</div>
            </div>
        </div>
    `).join('');
}

async function previewBayroqImage(inputEl) {
    const img = document.getElementById('bayroqImagePreview');
    const placeholder = document.getElementById('bayroqImagePreviewPlaceholder');
    if (!img || !inputEl.files || !inputEl.files[0]) return;
    let dataUrl = await convertBase64(inputEl.files[0]);
    img.src = dataUrl;
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
}

function editBayroqItem(id) {
    let item = bayroqDatabase.find(it => it.id === id);
    if (!item) return;
    bayroqEditId = id;
    document.getElementById('bayroqFormTitle').innerText = "✏️ Bayroqni Tahrirlash";
    document.getElementById('bayroqNameInput').value = item.name || '';
    document.getElementById('bayroqPriceInput').value = item.price || 0;
    let img = document.getElementById('bayroqImagePreview');
    let placeholder = document.getElementById('bayroqImagePreviewPlaceholder');
    if (item.imageUrl) {
        img.src = item.imageUrl; img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    } else {
        img.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
    }
    document.getElementById('btnCancelBayroqEdit').style.display = 'inline-flex';
    let nameField = document.getElementById('bayroqNameInput');
    if (nameField && typeof nameField.scrollIntoView === 'function') {
        nameField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function cancelBayroqEdit() {
    bayroqEditId = null;
    let title = document.getElementById('bayroqFormTitle');
    if (title) title.innerText = "➕ Yangi Bayroq Qo'shish";
    let nameEl = document.getElementById('bayroqNameInput');
    let priceEl = document.getElementById('bayroqPriceInput');
    let fileEl = document.getElementById('bayroqFileInput');
    if (nameEl) nameEl.value = '';
    if (priceEl) priceEl.value = '';
    if (fileEl) fileEl.value = '';
    let img = document.getElementById('bayroqImagePreview');
    let placeholder = document.getElementById('bayroqImagePreviewPlaceholder');
    if (img) { img.src = ''; img.style.display = 'none'; }
    if (placeholder) placeholder.style.display = 'block';
    let cancelBtn = document.getElementById('btnCancelBayroqEdit');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function saveBayroqItem() {
    let name = (document.getElementById('bayroqNameInput').value || '').trim();
    let price = parseFloat(document.getElementById('bayroqPriceInput').value) || 0;
    let imageUrl = document.getElementById('bayroqImagePreview').src || '';
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) imageUrl = '';

    if (!name) { showToast("⚠️ Nomini kiriting!"); return; }
    if (price <= 0) { showToast("⚠️ Narxini kiriting!"); return; }

    if (bayroqEditId) {
        let item = bayroqDatabase.find(it => it.id === bayroqEditId);
        if (item) {
            item.name = name; item.price = price;
            if (imageUrl) item.imageUrl = imageUrl;
            if (typeof logAudit === 'function') logAudit("Bayroq tahrirlandi", bayroqShortName(item));
        }
    } else {
        let newItem = { id: bqId(), name, price, imageUrl };
        bayroqDatabase.push(newItem);
        if (typeof logAudit === 'function') logAudit("Yangi bayroq qo'shildi", bayroqShortName(newItem));
    }

    localStorage.setItem('erp_bayroq_db', JSON.stringify(bayroqDatabase));
    cancelBayroqEdit();
    renderBayroqAdminGrid();
    showToast("✅ Saqlandi!");
}

function deleteBayroqItem(id) {
    let item = bayroqDatabase.find(it => it.id === id);
    if (!item) return;
    if (!confirm(`"${bayroqShortName(item)}" o'chirilsinmi?`)) return;
    bayroqDatabase = bayroqDatabase.filter(it => it.id !== id);
    localStorage.setItem('erp_bayroq_db', JSON.stringify(bayroqDatabase));
    if (typeof logAudit === 'function') logAudit("Bayroq o'chirildi", bayroqShortName(item));
    if (bayroqEditId === id) cancelBayroqEdit();
    renderBayroqAdminGrid();
    showToast("🗑️ O'chirildi!");
}

function saveBayroqDeliveryFee() {
    let val = parseFloat(document.getElementById('bayroqDeliveryFeeInput').value) || 0;
    bayroqDeliveryFee = val;
    localStorage.setItem('erp_bayroq_delivery_fee', JSON.stringify(bayroqDeliveryFee));
    if (typeof logAudit === 'function') logAudit("Bayroq Taxi (yetkazib berish) narxi o'zgartirildi", `${val.toLocaleString()} so'm`);
    showToast("✅ Saqlandi!");
}
