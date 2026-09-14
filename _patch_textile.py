#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import io, sys, os

BASE = os.path.expanduser("~/mnt/Xisoblovchi")

def load(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def save(path, content):
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

def apply_one(content, old, new, label):
    n = content.count(old)
    if n != 1:
        sys.stderr.write("MISMATCH [%s]: found %d occurrences (expected 1)\n" % (label, n))
        # dump a bit of context to help debug
        idx = content.find(old[:40])
        sys.stderr.write("context near first-40-chars match: ...%s...\n" % content[max(0,idx-80):idx+200])
        raise SystemExit(1)
    return content.replace(old, new, 1)

# ------------------------------------------------------------------
# textile.js
# ------------------------------------------------------------------
tx_path = os.path.join(BASE, "assets/js/textile.js")
tx = load(tx_path)

# --- Edit 1: replace txDefaultPrintRateTiers() with the new global DTF config + helpers
old1 = """    // Pechat narxi: 1 kv.sm narxi + eng kam summa, ikkalasi ham tirajga bog'liq.
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
"""
new1 = """    // ====================== DTF Pechat narxi (avtomatik, BARCHA tekstil turlariga umumiy) ======================
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
"""
tx = apply_one(tx, old1, new1, "edit1-dtfconfig")

# --- Edit 2: remove printRate from getDefaultTextileDb()
old2 = """                colors: [
                    { id: txId('CLR'), name: 'Oq', hex: '#ffffff', surcharge: 0 },
                    { id: txId('CLR'), name: 'Qora', hex: '#111827', surcharge: 5000 },
                    { id: txId('CLR'), name: "Ko'k", hex: '#1d4ed8', surcharge: 3000 },
                    { id: txId('CLR'), name: 'Qizil', hex: '#dc2626', surcharge: 3000 }
                ]
            };
        });
        return db;
    }"""
new2 = """                colors: [
                    { id: txId('CLR'), name: 'Oq', hex: '#ffffff', surcharge: 0 },
                    { id: txId('CLR'), name: 'Qora', hex: '#111827', surcharge: 5000 },
                    { id: txId('CLR'), name: "Ko'k", hex: '#1d4ed8', surcharge: 3000 },
                    { id: txId('CLR'), name: 'Qizil', hex: '#dc2626', surcharge: 3000 }
                ]
            };
        });
        return db;
    }
    // (Eslatma: DTF pechat narxi endi bu yerda emas — textileDtfConfig orqali BARCHA turlarga umumiy.)"""
tx = apply_one(tx, old2, new2, "edit2-dropcomment")

old2b = """                materials: [
                    { id: txId('MAT'), name: 'Paxta 100% (standart)', tiers: txDefaultTiers(base) },
                    { id: txId('MAT'), name: 'Paxta/Polyester (peniye)', tiers: txDefaultTiers(base * 1.15) },
                    { id: txId('MAT'), name: 'Polyester (sport)', tiers: txDefaultTiers(base * 0.9) }
                ],
                printRate: { tiers: txDefaultPrintRateTiers() },
                // Rang — doimiy ustama sifatida qo'shiladi (tirajdan qat'iy nazar bir xil).
                // Standart ranglar 0, qiyin ranglar qimmatroq.
"""
new2b = """                materials: [
                    { id: txId('MAT'), name: 'Paxta 100% (standart)', tiers: txDefaultTiers(base) },
                    { id: txId('MAT'), name: 'Paxta/Polyester (peniye)', tiers: txDefaultTiers(base * 1.15) },
                    { id: txId('MAT'), name: 'Polyester (sport)', tiers: txDefaultTiers(base * 0.9) }
                ],
                // Rang — doimiy ustama sifatida qo'shiladi (tirajdan qat'iy nazar bir xil).
                // Standart ranglar 0, qiyin ranglar qimmatroq.
"""
tx = apply_one(tx, old2b, new2b, "edit2b-removeprintrate-field")

# --- Edit 3: remove old textilePrintCost()
old3 = """    // Pechat narxi: maydon (sm²) × 1 sm² narxi, lekin eng kam summadan past emas.
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

"""
new3 = ""
tx = apply_one(tx, old3, new3, "edit3-removeprintcost")

# --- Edit 4: getTextileConfig() drop printRate
old4 = """    function getTextileConfig(key) {
        let cfg = textileDatabase[key] || {};
        return {
            materials: (cfg.materials || []).map(m => normalizeTextileItem(m, 'MAT')),
            colors: (cfg.colors || []).map(normalizeTextileColor),
            printRate: { tiers: normalizeTierList((cfg.printRate || {}).tiers) }
        };
    }"""
new4 = """    function getTextileConfig(key) {
        let cfg = textileDatabase[key] || {};
        return {
            materials: (cfg.materials || []).map(m => normalizeTextileItem(m, 'MAT')),
            colors: (cfg.colors || []).map(normalizeTextileColor)
        };
    }"""
tx = apply_one(tx, old4, new4, "edit4-gettextileconfig")

# --- Edit 5: loadTextileEditState()
old5 = """    function loadTextileEditState(key) {
        let cfg = getTextileConfig(key);
        textileEditState = {
            materials: JSON.parse(JSON.stringify(cfg.materials)),
            colors: JSON.parse(JSON.stringify(cfg.colors)),
            printRate: JSON.parse(JSON.stringify(cfg.printRate))
        };
        renderTextileEditor('materials');
        renderTextileEditor('colors');
        renderTextilePrintRateEditor();
    }"""
new5 = """    function loadTextileEditState(key) {
        let cfg = getTextileConfig(key);
        textileEditState = {
            materials: JSON.parse(JSON.stringify(cfg.materials)),
            colors: JSON.parse(JSON.stringify(cfg.colors))
        };
        renderTextileEditor('materials');
        renderTextileEditor('colors');
        renderTextileDtfConfigAdmin();
    }"""
tx = apply_one(tx, old5, new5, "edit5-loadTextileEditState")

# --- Edit 6: remove the whole print-rate admin editor block
old6 = """    // Pechat narxi — bitta jadval: 1 kv.sm narxi va eng kam summa
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

"""
new6 = ""
tx = apply_one(tx, old6, new6, "edit6-removeprintrateeditor")

# --- Edit 7: saveTextileConfig() drop printRate validation + field
old7 = """        if (normalizeTierList(textileEditState.printRate.tiers).length === 0) {
            showToast("⚠️ Pechat narxi uchun kamida bitta oraliq kiriting!");
            return;
        }

        textileDatabase[currentManagingProduct] = {
            materials: textileEditState.materials.map(m => normalizeTextileItem(m, 'MAT')),
            colors: textileEditState.colors.map(normalizeTextileColor),
            printRate: { tiers: normalizeTierList(textileEditState.printRate.tiers) }
        };"""
new7 = """        textileDatabase[currentManagingProduct] = {
            materials: textileEditState.materials.map(m => normalizeTextileItem(m, 'MAT')),
            colors: textileEditState.colors.map(normalizeTextileColor)
        };"""
tx = apply_one(tx, old7, new7, "edit7-saveTextileConfig")

# --- Edit 8: renderTextileTierPreview signature + body
old8 = """    function renderTextileTierPreview(mat, color, printRate, front, back, qty, marginPercent) {
        const box = document.getElementById('tierPreviewBox');
        if (!box) return;

        // Material va pechat narxining oraliq chegaralari har xil bo'lishi mumkin —
        // hammasini birlashtirib chiqaramiz, shunda har bir qator haqiqiy narxni beradi.
        // Rang endi doimiy ustama (tirajga bog'liq emas), shuning uchun bu yerga kirmaydi.
        let points = new Set();
        [mat].filter(Boolean).forEach(it => normalizeTierList(it.tiers).forEach(t => points.add(t.from)));
        let borPechat = (front.x * front.y > 0) || (back.x * back.y > 0);
        if (borPechat) normalizeTierList(printRate && printRate.tiers).forEach(t => points.add(t.from));

        let sorted = [...points].sort((a, b) => a - b);
        if (sorted.length <= 1) { box.style.display = 'none'; box.innerHTML = ''; return; }

        let m = 1 + ((parseFloat(marginPercent) || 0) / 100);
        let n = parseInt(qty) || 1;
        let colorSurcharge = textileColorSurcharge(color);

        const unitAt = (t) => Math.round((
            textileItemPrice(mat, t) +
            colorSurcharge +
            textilePrintCost(printRate, front.x, front.y, t).cost +
            textilePrintCost(printRate, back.x, back.y, t).cost
        ) * m);"""
new8 = """    function renderTextileTierPreview(mat, color, front, back, qty, marginPercent) {
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
        };"""
tx = apply_one(tx, old8, new8, "edit8-tierpreview")

# --- Edit 9: generateFormHtml_textile front/back box notes
old9a = """                <div class="price-size-box" style="margin-bottom:14px;">
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
                </div>"""
new9a = """                <div class="price-size-box" style="margin-bottom:14px;">
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
                </div>"""
tx = apply_one(tx, old9a, new9a, "edit9a-frontbox")

old9b = """                    <div style="font-size:0.76rem; color:var(--text-muted); margin-top:8px;">0 qoldirsangiz — orqa tomonga pechat qilinmaydi.</div>
                </div>"""
new9b = """                    <div style="font-size:0.76rem; color:var(--text-muted); margin-top:8px;">0 qoldirsangiz — orqa tomonga pechat qilinmaydi. Mashina eni max 58 sm — narxga faqat bo'yi (uzunlik) ta'sir qiladi.</div>
                </div>"""
tx = apply_one(tx, old9b, new9b, "edit9b-backbox")

# --- Edit 10: calculateResult_textile() full rewrite
old10 = """function calculateResult_textile(activeProductTypeParam, qty, marginPercent) {
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
                let colorCost = textileColorSurcharge(color);
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
}"""
new10 = """function calculateResult_textile(activeProductTypeParam, qty, marginPercent) {
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
}"""
tx = apply_one(tx, old10, new10, "edit10-calculateResult")

save(tx_path, tx)
print("textile.js patched OK, length=%d" % len(tx))

# ------------------------------------------------------------------
# core.js
# ------------------------------------------------------------------
core_path = os.path.join(BASE, "assets/js/core.js")
core = load(core_path)

old_core = """        let savedTextile = localStorage.getItem('erp_textile_db');
        textileDatabase = savedTextile ? JSON.parse(savedTextile) : {};
        let txChanged = false;
        let defTx = null;
        textileKeys.forEach(k => {
            if (k === 'bayroqlar') return; // o'z alohida bazasi bor, quyida alohida yuklanadi
            let cur = textileDatabase[k];
            if (!cur || !(cur.materials || []).length) {
                defTx = defTx || getDefaultTextileDb();
                textileDatabase[k] = defTx[k];
                txChanged = true;
                return;
            }
            // Avvalgi versiyada pechat "tayyor o'lchamlar ro'yxati" edi (printSizes).
            // Endi u 1 kv.sm narxiga almashdi — yetishmayotgan qismlarni to'ldiramiz.
            if (!cur.printRate || !(cur.printRate.tiers || []).length) {
                defTx = defTx || getDefaultTextileDb();
                cur.printRate = defTx[k].printRate;
                delete cur.printSizes;
                txChanged = true;
            }
            if (!Array.isArray(cur.colors) || cur.colors.length === 0) {
                defTx = defTx || getDefaultTextileDb();
                cur.colors = defTx[k].colors;
                txChanged = true;
            }
        });
        if (txChanged) localStorage.setItem('erp_textile_db', JSON.stringify(textileDatabase));"""
new_core = """        let savedTextile = localStorage.getItem('erp_textile_db');
        textileDatabase = savedTextile ? JSON.parse(savedTextile) : {};
        let txChanged = false;
        let defTx = null;
        textileKeys.forEach(k => {
            if (k === 'bayroqlar') return; // o'z alohida bazasi bor, quyida alohida yuklanadi
            let cur = textileDatabase[k];
            if (!cur || !(cur.materials || []).length) {
                defTx = defTx || getDefaultTextileDb();
                textileDatabase[k] = defTx[k];
                txChanged = true;
                return;
            }
            // Eski versiyada har mahsulot turi o'z pechat narxi jadvaliga (printRate) ega edi —
            // endi bu BUTUN tekstil bo'limiga umumiy DTF/Taxi sozlamasiga (textileDtfConfig)
            // almashtirildi. Eski saqlangan `printRate`/`printSizes` maydonlari (agar bo'lsa)
            // shunchaki e'tiborsiz qoldiriladi — o'chirilmaydi, lekin zarari ham yo'q.
            if (!Array.isArray(cur.colors) || cur.colors.length === 0) {
                defTx = defTx || getDefaultTextileDb();
                cur.colors = defTx[k].colors;
                txChanged = true;
            }
        });
        if (txChanged) localStorage.setItem('erp_textile_db', JSON.stringify(textileDatabase));

        // Textile DTF/Taxi narxi — BARCHA tekstil turlariga umumiy (Bayroq Taxi bilan bir xil naqsh)
        let savedTextileDtf = localStorage.getItem('erp_textile_dtf_config');
        if (savedTextileDtf) {
            try {
                let parsedDtf = JSON.parse(savedTextileDtf);
                if (parsedDtf && typeof parsedDtf === 'object') {
                    textileDtfConfig = { ...textileDtfConfig, ...parsedDtf };
                }
            } catch (e) {}
        }"""
core = apply_one(core, old_core, new_core, "core-init-textile")

save(core_path, core)
print("core.js patched OK, length=%d" % len(core))

# ------------------------------------------------------------------
# index.html
# ------------------------------------------------------------------
html_path = os.path.join(BASE, "index.html")
html = load(html_path)

old_html = """                <div class="add-pen-card" style="margin-bottom: 16px;">
                    <div class="add-pen-card-title">🖨️ Pechat narxi (o'lchamga qarab)</div>
                    <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px; line-height:1.5;">
                        Mijoz pechatning <strong>eni va bo'yini santimetrda</strong> kiritadi, narx maydonga qarab hisoblanadi:
                        <strong>maydon (sm²) × 1 kv.sm narxi</strong>. Agar natija "eng kam summa"dan past chiqsa,
                        eng kam summa olinadi — shunda kichkina logotip ham arzonga tushib ketmaydi.<br>
                        Ma'lumot uchun: A4 ≈ 21×29.7 sm ≈ 624 sm², A5 ≈ 312 sm², A3 ≈ 1248 sm².
                    </p>
                    <div id="textilePrintRateEditor"></div>
                </div>

                <div style="display:flex; justify-content:flex-end;">
                    <button class="btn btn-success" onclick="saveTextileConfig()">💾 Textile sozlamalarini saqlash</button>
                </div>
            </div>"""
new_html = """                <div class="add-pen-card" style="margin-bottom: 16px;">
                    <div class="add-pen-card-title">🖨️ DTF Pechat narxi (avtomatik hisoblanadi)</div>
                    <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px; line-height:1.5;">
                        Bu sozlama <strong>barcha Tekstil turlariga umumiy</strong> (Futbolka, Kepka, Svitshot, Xudi, Jiletka, Shoper).
                        Mashina eni maksimal <strong>58 sm</strong>, uzunligi rulon hisoblanadi — narx faqat
                        <strong>uzunlikka (bo'yi, sm)</strong> bog'liq, eni 58 smgacha narxga ta'sir qilmaydi.
                        Bir nechta dona/tomon bo'lsa, ular orasiga oraliq qo'yib umumiy rulon uzunligi topiladi,
                        shu uzunlikka narx hisoblanadi (eng kamida — bitta bo'lak narxi).
                    </p>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Mashina eni (sm):</label>
                            <input type="number" min="1" id="txDtfRollWidth" value="58">
                        </div>
                        <div class="form-group">
                            <label>Bo'lak uzunligi (sm):</label>
                            <input type="number" min="1" id="txDtfRollLength" value="100">
                        </div>
                        <div class="form-group">
                            <label>Shu bo'lakning DTF narxi (so'm):</label>
                            <input type="number" min="0" id="txDtfRollPrice" value="90000">
                        </div>
                        <div class="form-group">
                            <label>Detallar orasi (sm):</label>
                            <input type="number" min="0" step="0.1" id="txDtfGap" value="0.5">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Bosish narxi — oldiga (so'm/dona):</label>
                            <input type="number" min="0" id="txDtfFrontFee" value="2000">
                        </div>
                        <div class="form-group">
                            <label>Bosish narxi — orqaga (so'm/dona):</label>
                            <input type="number" min="0" id="txDtfBackFee" value="5000">
                        </div>
                        <div class="form-group">
                            <label>Kepkaga bosish narxi (so'm/dona):</label>
                            <input type="number" min="0" id="txDtfKepkaFee" value="1000">
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; margin-top:10px;">
                        <button class="btn" onclick="saveTextileDtfConfig()">💾 DTF sozlamalarini saqlash</button>
                    </div>
                </div>

                <div class="add-pen-card" style="margin-bottom: 16px;">
                    <div class="add-pen-card-title">🚚 Taxi (yetkazib berish) narxi</div>
                    <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px; line-height:1.5;">
                        Barcha Tekstil turlariga umumiy, <strong>bir martalik</strong> yetkazib berish to'lovi — buyurtma
                        qancha bo'lmasin bir marta olinadi, dona soniga bo'linib qo'shiladi.
                    </p>
                    <div class="form-row" style="align-items:flex-end; margin-bottom:0;">
                        <div class="form-group">
                            <label>Taxi narxi (so'm):</label>
                            <input type="number" id="txDtfTaxiFee" min="0" value="50000">
                        </div>
                        <div class="form-group" style="justify-content:flex-end;">
                            <button class="btn" onclick="saveTextileDtfConfig()">💾 Saqlash</button>
                        </div>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end;">
                    <button class="btn btn-success" onclick="saveTextileConfig()">💾 Material/Rang sozlamalarini saqlash</button>
                </div>
            </div>"""
html = apply_one(html, old_html, new_html, "html-admin-box")

save(html_path, html)
print("index.html patched OK, length=%d" % len(html))

print("ALL PATCHES APPLIED SUCCESSFULLY")
