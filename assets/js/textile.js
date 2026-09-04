    let textileDatabase = {};
    let textileEditState = { materials: [], colors: [], printRate: { tiers: [] } };
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

    // Pechat narxi: 1 kv.sm narxi + eng kam summa, ikkalasi ham tirajga bog'liq.
    // A4 ≈ 21x29.7 sm ≈ 624 sm². 40 so'm/sm² ≈ 25 000 so'm — eski A4 narxiga mos.
    function txDefaultPrintRateTiers() {
        return [
            { from: 1, to: 10, basePrice: 40, minPrice: 8000 },
            { from: 11, to: 50, basePrice: 37, minPrice: 7000 },
            { from: 51, to: 100, basePrice: 34, minPrice: 6000 },
            { from: 101, to: 200, basePrice: 32, minPrice: 5500 },
            { from: 201, to: 500, basePrice: 30, minPrice: 5000 },
            { from: 501, to: 0, basePrice: 28, minPrice: 4500 }
        ].map(r => ({ ...r, printPrices: { uv: 0, sifravoy: 0, dtf: 0, gravirovka: 0 } }));
    }

    // Rang — ustama sifatida qo'shiladi. Standart ranglar 0, qiyin ranglar qimmatroq.
    function txDefaultColorTiers(base) {
        if (!base) {
            return [{ from: 1, to: 0, basePrice: 0, minPrice: 0, printPrices: { uv: 0, sifravoy: 0, dtf: 0, gravirovka: 0 } }];
        }
        return txDefaultTiers(base);
    }

    function getDefaultTextileDb() {
        const db = {};
        textileKeys.forEach(key => {
            let base = defaultPrices[key] || 45000;
            db[key] = {
                materials: [
                    { id: txId('MAT'), name: 'Paxta 100% (standart)', tiers: txDefaultTiers(base) },
                    { id: txId('MAT'), name: 'Paxta/Polyester (peniye)', tiers: txDefaultTiers(base * 1.15) },
                    { id: txId('MAT'), name: 'Polyester (sport)', tiers: txDefaultTiers(base * 0.9) }
                ],
                printRate: { tiers: txDefaultPrintRateTiers() },
                colors: [
                    { id: txId('CLR'), name: 'Oq', hex: '#ffffff', tiers: txDefaultColorTiers(0) },
                    { id: txId('CLR'), name: 'Qora', hex: '#111827', tiers: txDefaultColorTiers(5000) },
                    { id: txId('CLR'), name: "Ko'k", hex: '#1d4ed8', tiers: txDefaultColorTiers(3000) },
                    { id: txId('CLR'), name: 'Qizil', hex: '#dc2626', tiers: txDefaultColorTiers(3000) }
                ]
            };
        });
        return db;
    }

    function normalizeTextileItem(it, prefix) {
        it = it || {};
        return {
            id: it.id || txId(prefix),
            name: (it.name || '').toString(),
            hex: (it.hex || '#94a3b8').toString(),
            tiers: normalizeTierList(it.tiers)
        };
    }

    function getTextileConfig(key) {
        let cfg = textileDatabase[key] || {};
        return {
            materials: (cfg.materials || []).map(m => normalizeTextileItem(m, 'MAT')),
            colors: (cfg.colors || []).map(c => normalizeTextileItem(c, 'CLR')),
            printRate: { tiers: normalizeTierList((cfg.printRate || {}).tiers) }
        };
    }

    // Element (material yoki rang) uchun berilgan tirajdagi narxi
    function textileItemPrice(item, qty) {
        if (!item) return 0;
        let t = findTierForQty(item.tiers, qty);
        return t ? t.basePrice : 0;
    }

    // Pechat narxi: maydon (sm²) × 1 sm² narxi, lekin eng kam summadan past emas.
    // Maydon 0 bo'lsa — pechatsiz, narx ham 0.
    function textilePrintCost(printRate, xSm, ySm, qty) {
        let x = parseFloat(xSm) || 0;
        let y = parseFloat(ySm) || 0;
        let maydon = x * y;
        if (maydon <= 0) return { cost: 0, maydon: 0, rate: 0, minPrice: 0, minQollandi: false };

        let t = findTierForQty(printRate && printRate.tiers, qty);
        let rate = t ? t.basePrice : 0;
        let minPrice = t ? t.minPrice : 0;

        let xom = maydon * rate;
        let minQollandi = xom < minPrice;
        return {
            cost: Math.round(minQollandi ? minPrice : xom),
            maydon, rate, minPrice, minQollandi
        };
    }

    // --- Admin muharriri ---

    function loadTextileEditState(key) {
        let cfg = getTextileConfig(key);
        textileEditState = {
            materials: JSON.parse(JSON.stringify(cfg.materials)),
            colors: JSON.parse(JSON.stringify(cfg.colors)),
            printRate: JSON.parse(JSON.stringify(cfg.printRate))
        };
        renderTextileEditor('materials');
        renderTextileEditor('colors');
        renderTextilePrintRateEditor();
    }

    function textileEditorContainer(kind) {
        return document.getElementById(kind === 'materials' ? 'textileMaterialsEditor' : 'textileColorsEditor');
    }

    function renderTextileEditor(kind) {
        const box = textileEditorContainer(kind);
        if (!box) return;
        const list = textileEditState[kind] || [];
        const isColor = (kind === 'colors');
        const nomi = isColor ? 'Rang nomi' : 'Material nomi';
        const placeholder = isColor ? 'Masalan: Qora' : 'Masalan: Paxta 100%';
        const narxUstuni = isColor ? "Ustama (so'm)" : "Narxi (so'm)";

        if (list.length === 0) {
            box.innerHTML = `<div class="tx-empty">Hali qo'shilmagan. Pastdagi tugmani bosing.</div>`;
            return;
        }

        box.innerHTML = list.map((it, i) => `
            <div class="tx-item">
                <div class="tx-item-head">
                    ${isColor ? `
                    <div class="form-group" style="flex:0 0 90px; min-width:90px;">
                        <label>Tusi:</label>
                        <input type="color" value="${it.hex || '#94a3b8'}" style="height:42px; padding:4px;"
                               oninput="updateTextileItemHex(${i}, this.value)">
                    </div>` : ''}
                    <div class="form-group">
                        <label>${nomi}:</label>
                        <input type="text" value="${(it.name || '').replace(/"/g, '&quot;')}" placeholder="${placeholder}"
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
                            <th style="width:140px;">${narxUstuni}</th>
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

    // Pechat narxi — bitta jadval: 1 kv.sm narxi va eng kam summa
    function renderTextilePrintRateEditor() {
        const box = document.getElementById('textilePrintRateEditor');
        if (!box) return;
        let tiers = (textileEditState.printRate && textileEditState.printRate.tiers) || [];

        box.innerHTML = `
            <div class="tx-item">
                <div class="tx-item-head" style="justify-content:flex-end;">
                    <div class="tx-item-actions">
                        <button type="button" class="tx-btn" onclick="addPrintRateTier()">+ Oraliq</button>
                        <button type="button" class="tx-btn" onclick="fillPrintRateDefaults()">⚡ Namuna oraliqlar</button>
                    </div>
                </div>
                <div style="overflow-x:auto;">
                    <table class="tier-table">
                        <thead><tr>
                            <th style="width:90px;">Dan (dona)</th>
                            <th style="width:90px;">Gacha</th>
                            <th style="width:150px;">1 kv.sm narxi (so'm)</th>
                            <th style="width:170px;">Eng kam pechat summasi</th>
                            <th style="width:70px;"></th>
                        </tr></thead>
                        <tbody>
                            ${tiers.length === 0
                                ? `<tr><td colspan="5" style="padding:10px 4px; color:#b45309; font-size:0.8rem;">Oraliq yo'q — pechat narxi 0 bo'lib qoladi.</td></tr>`
                                : tiers.map((t, ti) => `
                                    <tr>
                                        <td><input type="number" min="1" value="${t.from}" oninput="updatePrintRateTier(${ti}, 'from', this.value)"></td>
                                        <td><input type="number" min="0" value="${t.to}" placeholder="∞" oninput="updatePrintRateTier(${ti}, 'to', this.value)"></td>
                                        <td><input type="number" min="0" step="0.5" value="${t.basePrice}" oninput="updatePrintRateTier(${ti}, 'basePrice', this.value)"></td>
                                        <td><input type="number" min="0" value="${t.minPrice}" oninput="updatePrintRateTier(${ti}, 'minPrice', this.value)"></td>
                                        <td><button type="button" class="tier-remove" onclick="removePrintRateTier(${ti})">✕</button></td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
                <div id="printRateWarnings"></div>
            </div>
        `;
        renderPrintRateWarnings();
    }

    function renderPrintRateWarnings() {
        const w = document.getElementById('printRateWarnings');
        if (!w) return;
        let msgs = tierValidationMessages((textileEditState.printRate || {}).tiers);
        w.innerHTML = msgs.length === 0 ? '' : `<div class="tier-warning">⚠️ ${msgs.map(m => `<div>• ${m}</div>`).join('')}</div>`;
    }

    function addPrintRateTier() {
        let list = normalizeTierList(textileEditState.printRate.tiers);
        let last = list.slice(-1)[0];
        list.push({
            from: last ? (tierUpper(last) === Infinity ? last.from + 1 : tierUpper(last) + 1) : 1,
            to: 0,
            basePrice: last ? last.basePrice : 40,
            minPrice: last ? last.minPrice : 8000,
            printPrices: { uv: 0, sifravoy: 0, dtf: 0, gravirovka: 0 }
        });
        textileEditState.printRate.tiers = list;
        renderTextilePrintRateEditor();
    }

    function removePrintRateTier(ti) {
        textileEditState.printRate.tiers.splice(ti, 1);
        renderTextilePrintRateEditor();
    }

    function updatePrintRateTier(ti, field, value) {
        let t = textileEditState.printRate.tiers[ti];
        if (!t) return;
        t[field] = (field === 'from' || field === 'to') ? (parseInt(value) || 0) : (parseFloat(value) || 0);
        renderPrintRateWarnings();
    }

    function fillPrintRateDefaults() {
        if ((textileEditState.printRate.tiers || []).length > 0 &&
            !confirm("Mavjud oraliqlar o'chib, o'rniga namuna oraliqlar qo'yiladi. Davom etamizmi?")) return;
        textileEditState.printRate.tiers = txDefaultPrintRateTiers();
        renderTextilePrintRateEditor();
    }

    function addTextileItem(kind) {
        let isColor = (kind === 'colors');
        let base = isColor ? 0 : (defaultPrices[currentManagingProduct] || 45000);
        textileEditState[kind].push({
            id: txId(isColor ? 'CLR' : 'MAT'),
            name: '',
            hex: '#94a3b8',
            tiers: isColor ? txDefaultColorTiers(0) : txDefaultTiers(base)
        });
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

    function fillTextileDefaultTiers(kind, idx) {
        let it = textileEditState[kind][idx];
        if (!it) return;
        if ((it.tiers || []).length > 0 && !confirm("Mavjud oraliqlar o'chib, o'rniga namuna oraliqlar qo'yiladi. Davom etamizmi?")) return;
        let first = normalizeTierList(it.tiers)[0];
        let base = first ? first.basePrice : (kind === 'materials' ? (defaultPrices[currentManagingProduct] || 45000) : 0);
        it.tiers = (kind === 'colors' && !base) ? txDefaultColorTiers(0) : txDefaultTiers(base);
        renderTextileEditor(kind);
    }

    function saveTextileConfig() {
        if (!currentManagingProduct) return;

        for (let kind of ['materials', 'colors']) {
            for (let it of textileEditState[kind]) {
                if (!it.name || !it.name.trim()) {
                    showToast(kind === 'materials' ? "⚠️ Har bir materialning nomi bo'lishi kerak!" : "⚠️ Har bir rangning nomi bo'lishi kerak!");
                    return;
                }
                if (normalizeTierList(it.tiers).length === 0) {
                    showToast(`⚠️ "${it.name}" uchun kamida bitta oraliq kiriting!`);
                    return;
                }
            }
        }
        if (textileEditState.materials.length === 0) {
            showToast("⚠️ Kamida bitta material qo'shing!");
            return;
        }
        if (normalizeTierList(textileEditState.printRate.tiers).length === 0) {
            showToast("⚠️ Pechat narxi uchun kamida bitta oraliq kiriting!");
            return;
        }

        textileDatabase[currentManagingProduct] = {
            materials: textileEditState.materials.map(m => normalizeTextileItem(m, 'MAT')),
            colors: textileEditState.colors.map(c => normalizeTextileItem(c, 'CLR')),
            printRate: { tiers: normalizeTierList(textileEditState.printRate.tiers) }
        };
        localStorage.setItem('erp_textile_db', JSON.stringify(textileDatabase));
        if (typeof logAudit === 'function') logAudit("Textile narxlari o'zgartirildi", `Mahsulot: ${currentManagingProduct}`);
        loadTextileEditState(currentManagingProduct);
        showToast("💾 Textile sozlamalari saqlandi!");
    }

    // --- Kalkulyator uchun jadval ko'rinishi ---
    // Material va o'lchamlarning oraliq chegaralari har xil bo'lishi mumkin,
    // shuning uchun barcha chegaralarni birlashtirib chiqaramiz.
    function renderTextileTierPreview(mat, color, printRate, front, back, qty, marginPercent) {
        const box = document.getElementById('tierPreviewBox');
        if (!box) return;

        // Material, rang va pechat narxining oraliq chegaralari har xil bo'lishi mumkin —
        // hammasini birlashtirib chiqaramiz, shunda har bir qator haqiqiy narxni beradi.
        let points = new Set();
        [mat, color].filter(Boolean).forEach(it => normalizeTierList(it.tiers).forEach(t => points.add(t.from)));
        let borPechat = (front.x * front.y > 0) || (back.x * back.y > 0);
        if (borPechat) normalizeTierList(printRate && printRate.tiers).forEach(t => points.add(t.from));

        let sorted = [...points].sort((a, b) => a - b);
        if (sorted.length <= 1) { box.style.display = 'none'; box.innerHTML = ''; return; }

        let m = 1 + ((parseFloat(marginPercent) || 0) / 100);
        let n = parseInt(qty) || 1;

        const unitAt = (t) => Math.round((
            textileItemPrice(mat, t) +
            textileItemPrice(color, t) +
            textilePrintCost(printRate, front.x, front.y, t).cost +
            textilePrintCost(printRate, back.x, back.y, t).cost
        ) * m);

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
                    <div style="font-size:0.76rem; color:var(--text-muted); margin-top:8px;">0 qoldirsangiz — orqa tomonga pechat qilinmaydi.</div>
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

                let matCost = textileItemPrice(mat, qty);
                let colorCost = textileItemPrice(color, qty);
                let frontRes = textilePrintCost(cfg.printRate, front.x, front.y, qty);
                let backRes = textilePrintCost(cfg.printRate, back.x, back.y, qty);

                baseUnitPrice = matCost + colorCost + frontRes.cost + backRes.cost;

                // Maydon ma'lumotini foydalanuvchiga ko'rsatamiz
                const yozMaydon = (elId, res) => {
                    let el = document.getElementById(elId);
                    if (!el) return;
                    el.innerHTML = res.maydon <= 0
                        ? `<span style="color:var(--text-muted);">Pechatsiz</span>`
                        : `${res.maydon.toLocaleString()} sm² → <strong>${res.cost.toLocaleString()} so'm</strong>` +
                          (res.minQollandi ? ` <span style="color:#b45309;">(eng kam summa)</span>` : '');
                };
                yozMaydon('frontAreaInfo', frontRes);
                yozMaydon('backAreaInfo', backRes);

                let parts = [mat ? mat.name : 'Material tanlanmagan'];
                if (color) parts.push(`Rang: ${color.name}`);
                parts.push(front.x * front.y > 0 ? `Oldi: ${front.x}×${front.y} sm` : 'Oldi: pechatsiz');
                parts.push(back.x * back.y > 0 ? `Orqa: ${back.x}×${back.y} sm` : 'Orqa: pechatsiz');
                let activeT = mat ? findTierForQty(mat.tiers, qty) : null;
                if (activeT) parts.push(`Oraliq: ${tierLabel(activeT)}`);
                details = parts.join(' | ');

                renderTextileTierPreview(mat, color, cfg.printRate, front, back, qty, marginPercent);

    return { details, baseUnitPrice };
}
