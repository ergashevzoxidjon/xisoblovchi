    // ====================== REKLAMA STEND MAHSULOTLARI (Roll Up / Pauk / PopUp / PromoStoyka) ======================
    // Bular reklamaBanTypes'dan (baner/orakal/...) TUBDAN farqli: mijoz eni/bo'yini o'zi kiritmaydi —
    // har bir mahsulotning bir nechta TAYYOR o'lcham-varianti bor va har biri o'zining QAT'IY narxiga
    // ega (admin belgilaydi). Material (Glyans/Matoviy) esa faqat ko'rinish uchun — narxga ta'sir qilmaydi.
    const reklamaStendNames = { rollup: 'Roll Up', pauk: 'Pauk', popup: 'PopUp', promostoyka: 'PromoStoyka' };

    // Miqdor bo'yicha narx oraliqlari — har bir reklama-stend turiga umumiy, o'sha turning
    // BARCHA o'lchamlariga bir xil ustunlar sifatida qo'llaniladi (admin buni jadval ko'rinishida
    // sozlaydi). "to: 0" cheksiz ("va undan yuqori") degani.
    const reklamaStendDefaultQtyRanges = [
        { from: 1,   to: 3 },
        { from: 4,   to: 10 },
        { from: 11,  to: 20 },
        { from: 21,  to: 50 },
        { from: 51,  to: 100 },
        { from: 101, to: 0 }
    ];
    let reklamaStendQtyTiers = {
        rollup: reklamaStendDefaultQtyRanges.map(r => ({ ...r })),
        pauk: reklamaStendDefaultQtyRanges.map(r => ({ ...r })),
        popup: reklamaStendDefaultQtyRanges.map(r => ({ ...r })),
        promostoyka: reklamaStendDefaultQtyRanges.map(r => ({ ...r }))
    };
    // Namuna chegirma koeffitsientlari — faqat boshlang'ich demo narxlarni to'ldirish uchun
    const reklamaStendSampleTierMultipliers = [1.00, 0.94, 0.88, 0.82, 0.77, 0.72];
    function withSampleReklamaStendTierPrices(basePrice) {
        return reklamaStendSampleTierMultipliers.map(m => Math.round((basePrice * m) / 100) * 100);
    }

    // Boshlang'ich (demo) narxlar — admin buni Admin Panel orqali o'ziga moslab o'zgartiradi.
    let reklamaStendSizeDatabase = {
        rollup: [
            { label: '800x2000mm', price: 350000, isDefault: true, tierPrices: withSampleReklamaStendTierPrices(350000) },
            { label: '1250x2000mm', price: 480000, tierPrices: withSampleReklamaStendTierPrices(480000) },
            { label: '1500x2000mm', price: 580000, tierPrices: withSampleReklamaStendTierPrices(580000) }
        ],
        pauk: [
            { label: '600x1600mm', price: 250000, isDefault: true, tierPrices: withSampleReklamaStendTierPrices(250000) },
            { label: '700x1700mm', price: 300000, tierPrices: withSampleReklamaStendTierPrices(300000) }
        ],
        popup: [
            { label: '2000x3000mm', price: 1200000, isDefault: true, tierPrices: withSampleReklamaStendTierPrices(1200000) }
        ],
        promostoyka: [
            { label: 'Standart', price: 400000, isDefault: true, tierPrices: withSampleReklamaStendTierPrices(400000) }
        ]
    };
    let selectedReklamaStendSizeIndex = -1;
    let reklamaStendMaterial = 'Glyans'; // 'Glyans' | 'Matoviy' — faqat ko'rsatish uchun, narxga ta'sir qilmaydi

    function reklamaStendTierUpper(t) { return (t.to && t.to > 0) ? t.to : Infinity; }
    function reklamaStendTierLabel(t) { return (t.to && t.to > 0) ? `${t.from}-${t.to}` : `${t.from}+`; }

    // Berilgan miqdorga mos oraliq indeksini topadi. Aniq mos kelmasa: miqdor eng kichik
    // oraliqdan pastda bo'lsa birinchisi, eng kattasidan yuqorida bo'lsa oxirgisi ishlatiladi.
    function findReklamaStendTierIdx(type, qty) {
        let tiers = reklamaStendQtyTiers[type] || [];
        if (tiers.length === 0) return -1;
        let n = parseInt(qty) || 1;
        for (let i = 0; i < tiers.length; i++) {
            if (n >= tiers[i].from && n <= reklamaStendTierUpper(tiers[i])) return i;
        }
        if (n < tiers[0].from) return 0;
        return tiers.length - 1;
    }

    function generateFormHtml_reklamaStend(type) {
        reklamaStendMaterial = 'Glyans';
        let sizeList = reklamaStendSizeDatabase[type] || [];
        let defaultIdx = sizeList.findIndex(s => s.isDefault);
        selectedReklamaStendSizeIndex = defaultIdx >= 0 ? defaultIdx : 0;

        let sizeHtml = sizeList.length > 0 ? `
            <div class="step-title">O'lcham:</div>
            <div class="options-group" id="reklamaStendSizeGroup"></div>
        ` : `<p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">⚠️ Bu mahsulot uchun hali o'lcham/narx kiritilmagan — Admin Panelda kiriting.</p>`;

        return `
            ${sizeHtml}
            <div class="step-title">Material:</div>
            <div class="options-group" id="reklamaStendMaterialGroup" style="display:flex;">
                <button class="opt-btn active" onclick="setReklamaStendMaterial('Glyans', this)" style="flex:1;">Glyans</button>
                <button class="opt-btn" onclick="setReklamaStendMaterial('Matoviy', this)" style="flex:1;">Matoviy</button>
            </div>
            <div class="form-group" style="margin-top:12px;">
                <label>Adad (dona):</label>
                <input type="number" id="inpQuantity" value="1" min="1" oninput="calculate()">
            </div>
            <div id="reklamaStendTierPreviewBox" style="display:none; margin-top:12px;"></div>
        `;
    }

    // Mijozga tanlangan o'lchamning miqdor bo'yicha to'liq narx jadvalini ko'rsatadi —
    // qaysi oraliqda turgani ajratib beriladi (souvenir tier-preview bilan bir xil uslub).
    function renderReklamaStendTierPreview(type, qty) {
        const box = document.getElementById('reklamaStendTierPreviewBox');
        if (!box) return;
        let sizeList = reklamaStendSizeDatabase[type] || [];
        let size = sizeList[selectedReklamaStendSizeIndex] || sizeList[0];
        let tiers = reklamaStendQtyTiers[type] || [];

        if (!size || tiers.length === 0 || !Array.isArray(size.tierPrices) || size.tierPrices.length === 0) {
            box.style.display = 'none';
            box.innerHTML = '';
            return;
        }

        let activeIdx = findReklamaStendTierIdx(type, qty);
        box.style.display = 'block';
        box.innerHTML = `
            <div style="font-size:0.85rem; font-weight:700; color:var(--primary); margin-bottom:4px;">📊 Miqdor bo'yicha narx jadvali</div>
            <div style="font-size:0.76rem; color:var(--text-muted); margin-bottom:6px;">Ko'proq olsangiz — dona narxi arzonlashadi.</div>
            <table class="tier-preview-table">
                <thead><tr><th>Miqdor</th><th style="text-align:right;">Dona narxi</th></tr></thead>
                <tbody>
                    ${tiers.map((t, idx) => `
                        <tr class="${idx === activeIdx ? 'tier-active' : ''}">
                            <td>${reklamaStendTierLabel(t)} dona${idx === activeIdx ? ' ✓' : ''}</td>
                            <td style="text-align:right;">${(size.tierPrices[idx] || 0).toLocaleString()} so'm</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function renderReklamaStendSizeOptions(type) {
        let group = document.getElementById('reklamaStendSizeGroup');
        if (!group) return;
        let sizeList = reklamaStendSizeDatabase[type] || [];
        group.innerHTML = sizeList.map((s, idx) => `
            <button class="opt-btn ${idx === selectedReklamaStendSizeIndex ? 'active' : ''}" onclick="selectReklamaStendSize(${idx})">${s.label}</button>
        `).join('');
    }

    function selectReklamaStendSize(index) {
        selectedReklamaStendSizeIndex = index;
        document.querySelectorAll('#reklamaStendSizeGroup .opt-btn').forEach((btn, idx) => {
            btn.classList.toggle('active', idx === index);
        });
        calculate();
    }

    function setReklamaStendMaterial(material, btnEl) {
        reklamaStendMaterial = material;
        document.querySelectorAll('#reklamaStendMaterialGroup button').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');
        calculate();
    }

    function calculateResult_reklamaStend(type, qty) {
        renderReklamaStendTierPreview(type, qty);

        let sizeList = reklamaStendSizeDatabase[type] || [];
        let size = sizeList[selectedReklamaStendSizeIndex] || sizeList[0];
        let typeName = reklamaStendNames[type] || type.toUpperCase();
        if (!size) {
            return { details: `${typeName} | Narx kiritilmagan`, baseUnitPrice: 0 };
        }

        // Miqdor oraliqlari sozlangan bo'lsa — narx shundan olinadi, aks holda bazaviy (qat'iy) narx ishlatiladi.
        let unitPrice = size.price;
        let tierNote = '';
        let tiers = reklamaStendQtyTiers[type] || [];
        if (tiers.length > 0 && Array.isArray(size.tierPrices)) {
            let idx = findReklamaStendTierIdx(type, qty);
            if (idx >= 0 && typeof size.tierPrices[idx] === 'number' && size.tierPrices[idx] > 0) {
                unitPrice = size.tierPrices[idx];
                tierNote = ` | Oraliq: ${reklamaStendTierLabel(tiers[idx])} dona`;
            }
        }

        let details = `${typeName} ${size.label} | Material: ${reklamaStendMaterial}${tierNote}`;
        return { details, baseUnitPrice: unitPrice };
    }

    // ---- Admin Panel: miqdor oraliqlari (ranges) mini-muharriri ----
    // Oraliqlar shu turning BARCHA o'lchamlariga umumiy — jadvalning ustunlarini belgilaydi.
    function renderReklamaStendTierRangesEditor(type) {
        const container = document.getElementById('reklamaStendTierRangesEditor');
        if (!container) return;
        let tiers = reklamaStendQtyTiers[type] || [];
        container.innerHTML = tiers.length > 0 ? tiers.map((t, idx) => `
            <div class="tier-range-chip">
                <div class="tier-range-chip-field">
                    <label>Dan</label>
                    <input type="number" min="1" value="${t.from}" oninput="updateReklamaStendTierRange('${type}', ${idx}, 'from', this.value)">
                </div>
                <div class="tier-range-chip-field">
                    <label>Gacha</label>
                    <input type="number" min="0" value="${t.to || ''}" placeholder="∞" oninput="updateReklamaStendTierRange('${type}', ${idx}, 'to', this.value)">
                </div>
                <button type="button" class="tier-range-chip-remove" onclick="removeReklamaStendTierRange('${type}', ${idx})" title="O'chirish">×</button>
            </div>
        `).join('') : `<span style="color:var(--text-muted); font-size:0.82rem;">Hali oraliq qo'shilmagan — narx buyurtma miqdoridan qat'iy nazar bazaviy narxdan olinadi.</span>`;
    }

    function addReklamaStendTierRange() {
        if (!currentManagingProduct || !reklamaStendTypes.includes(currentManagingProduct)) return;
        let type = currentManagingProduct;
        if (!reklamaStendQtyTiers[type]) reklamaStendQtyTiers[type] = [];
        let tiers = reklamaStendQtyTiers[type];
        let last = tiers[tiers.length - 1];
        let nextFrom = last ? ((last.to && last.to > 0) ? last.to + 1 : last.from + 1) : 1;
        tiers.push({ from: nextFrom, to: 0 });
        // Har bir o'lchamning narxlar ro'yxatiga ham yangi ustun (0 narx bilan) qo'shamiz — indekslar mos kelishi shart
        (reklamaStendSizeDatabase[type] || []).forEach(s => {
            if (!Array.isArray(s.tierPrices)) s.tierPrices = [];
            s.tierPrices.push(0);
        });
        renderReklamaStendTierRangesEditor(type);
        renderAdminReklamaStendSizeTable(type);
    }

    function updateReklamaStendTierRange(type, idx, field, value) {
        let tiers = reklamaStendQtyTiers[type];
        if (!tiers || !tiers[idx]) return;
        tiers[idx][field] = (field === 'to') ? (parseInt(value) || 0) : Math.max(1, parseInt(value) || 1);
        renderAdminReklamaStendSizeTable(type); // ustun sarlavhalari (oraliq nomi) yangilanishi kerak
    }

    function removeReklamaStendTierRange(type, idx) {
        let tiers = reklamaStendQtyTiers[type];
        if (!tiers || !tiers[idx]) return;
        tiers.splice(idx, 1);
        (reklamaStendSizeDatabase[type] || []).forEach(s => {
            if (Array.isArray(s.tierPrices)) s.tierPrices.splice(idx, 1);
        });
        renderReklamaStendTierRangesEditor(type);
        renderAdminReklamaStendSizeTable(type);
    }

    function fillDefaultReklamaStendTierRanges() {
        if (!currentManagingProduct || !reklamaStendTypes.includes(currentManagingProduct)) return;
        let type = currentManagingProduct;
        if ((reklamaStendQtyTiers[type] || []).length > 0 && !confirm("Mavjud oraliqlar o'chib, o'rniga namuna oraliqlar qo'yiladi. Davom etamizmi?")) return;

        reklamaStendQtyTiers[type] = reklamaStendDefaultQtyRanges.map(r => ({ ...r }));
        let tierCount = reklamaStendQtyTiers[type].length;
        (reklamaStendSizeDatabase[type] || []).forEach(s => {
            s.tierPrices = withSampleReklamaStendTierPrices(s.price || 0).slice(0, tierCount);
            while (s.tierPrices.length < tierCount) s.tierPrices.push(0);
        });
        renderReklamaStendTierRangesEditor(type);
        renderAdminReklamaStendSizeTable(type);
        showToast("📊 Namuna oraliqlar qo'yildi — narxlarni tekshiring!");
    }

    // ---- Admin Panel: o'lcham/narx jadvali — ustunlar miqdor oraliqlariga qarab dinamik chiqadi ----
    function renderAdminReklamaStendSizeTable(type) {
        let tbody = document.getElementById('adminReklamaStendSizeTableBody');
        let headerRow = document.getElementById('adminReklamaStendTierHeaderRow');
        if (!tbody || !headerRow) return;
        let list = reklamaStendSizeDatabase[type] || [];
        let tiers = reklamaStendQtyTiers[type] || [];

        headerRow.innerHTML = `
            <th style="width: 160px;">O'lcham</th>
            <th style="width: 130px;">Bazaviy narx (so'm)</th>
            ${tiers.map(t => `<th style="width: 110px;">${reklamaStendTierLabel(t)} dona</th>`).join('')}
            <th style="width: 90px; text-align:center;">Standart</th>
            <th style="width: 70px; text-align: right;">Amal</th>
        `;

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${4 + tiers.length}" style="text-align:center; color: var(--text-muted); padding:20px;">Hozircha o'lcham/narx kiritilmagan.</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map((s, index) => {
            let tp = Array.isArray(s.tierPrices) ? s.tierPrices : [];
            return `
            <tr>
                <td><input type="text" id="reklstend_label_${index}" value="${s.label}"></td>
                <td><input type="number" id="reklstend_price_${index}" value="${s.price}"></td>
                ${tiers.map((t, tIdx) => `<td><input type="number" min="0" id="reklstend_tier_${index}_${tIdx}" value="${tp[tIdx] || 0}"></td>`).join('')}
                <td style="text-align:center;"><input type="radio" name="reklstend_default" id="reklstend_default_${index}" ${s.isDefault ? 'checked' : ''} style="width:16px; height:16px; accent-color: var(--primary);"></td>
                <td style="text-align: right;">
                    <div class="action-btns" style="justify-content: flex-end;">
                        <button class="btn btn-danger" title="O'chirish" onclick="deleteReklamaStendSizeRow(${index})">🗑️</button>
                    </div>
                </td>
            </tr>
        `; }).join('');
    }

    function addReklamaStendSizeRow() {
        if (!currentManagingProduct || !reklamaStendTypes.includes(currentManagingProduct)) return;
        if (!reklamaStendSizeDatabase[currentManagingProduct]) reklamaStendSizeDatabase[currentManagingProduct] = [];
        let list = reklamaStendSizeDatabase[currentManagingProduct];
        let tierCount = (reklamaStendQtyTiers[currentManagingProduct] || []).length;
        list.push({ label: "Yangi o'lcham", price: 0, isDefault: list.length === 0, tierPrices: new Array(tierCount).fill(0) });
        renderAdminReklamaStendSizeTable(currentManagingProduct);
    }

    function deleteReklamaStendSizeRow(index) {
        let list = reklamaStendSizeDatabase[currentManagingProduct] || [];
        if (!list[index]) return;
        if (confirm("Ushbu o'lchamni o'chirmoqchimisiz?")) {
            let wasDefault = list[index].isDefault;
            list.splice(index, 1);
            if (wasDefault && list.length > 0) list[0].isDefault = true;
            renderAdminReklamaStendSizeTable(currentManagingProduct);
        }
    }

    function saveAllReklamaStendSizes() {
        if (!currentManagingProduct) return;
        let type = currentManagingProduct;
        let list = reklamaStendSizeDatabase[type] || [];
        let tiers = reklamaStendQtyTiers[type] || [];
        let updated = [];
        for (let index = 0; index < list.length; index++) {
            let labelInput = document.getElementById(`reklstend_label_${index}`);
            if (!labelInput) continue;
            let priceInput = document.getElementById(`reklstend_price_${index}`);
            let defaultInput = document.getElementById(`reklstend_default_${index}`);
            let tierPrices = tiers.map((t, tIdx) => {
                let el = document.getElementById(`reklstend_tier_${index}_${tIdx}`);
                return el ? (parseFloat(el.value) || 0) : 0;
            });
            updated.push({
                label: labelInput.value.trim() || "Nomsiz",
                price: parseFloat(priceInput.value) || 0,
                isDefault: defaultInput.checked,
                tierPrices
            });
        }
        if (updated.length > 0 && !updated.some(s => s.isDefault)) updated[0].isDefault = true;

        reklamaStendSizeDatabase[type] = updated;
        localStorage.setItem('erp_reklama_stend_sizes', JSON.stringify(reklamaStendSizeDatabase));
        localStorage.setItem('erp_reklama_stend_qty_tiers', JSON.stringify(reklamaStendQtyTiers));
        if (typeof logAudit === 'function') logAudit("Reklama stend o'lchamlari o'zgartirildi", `Mahsulot: ${type}, ${updated.length} ta o'lcham, ${tiers.length} ta oraliq`);
        renderAdminReklamaStendSizeTable(type);
        showToast("💾 O'lchamlar va narxlar saqlandi!");
    }

    const reklamaExtraOptionsConfig = {
        baner:         { xalqacha: true,  reyka: true,  ustanovka: true, ploter: false },
        orakal:        { xalqacha: false, reyka: false, ustanovka: true, ploter: true  },
        setka_orakal:  { xalqacha: false, reyka: false, ustanovka: true, ploter: false },
        tumanka:       { xalqacha: false, reyka: false, ustanovka: true, ploter: true  },
        xolst:         { xalqacha: false, reyka: true,  ustanovka: false, ploter: false }
    };
    let reklamaExtraPrices = { xalqacha: 1000, reyka: 5000, ustanovka: 50000, ploter: 3000 };

    // ====================== MAKSIMAL CHOP ENI (stanok cheklovi) ======================
    // Stanok bir bo'lakda (ulanishsiz) shu kenglikkacha chop etadi. Mahsulotning IKKALA tomoni ham
    // shundan katta bo'lsa (ya'ni aylantirib ham sig'dirib bo'lmasa) — kalkulyatorda ogohlantirish
    // chiqadi. 0 yoki yo'q — cheklov yo'q (masalan Xolst). Admin panelda o'zgartiriladi.
    let reklamaMaxEni = { baner: 3.1, orakal: 1.5, setka_orakal: 1.5, tumanka: 1.5 };

    function reklamaEniOgohlantirishi(type, w, h) {
        let box = document.getElementById('reklamaEniOgoh');
        if (!box) return false;
        let max = parseFloat(reklamaMaxEni[type]) || 0;
        let katta = max > 0 && w > max && h > max;
        box.style.display = katta ? 'block' : 'none';
        if (katta) {
            let m = max.toLocaleString('ru-RU');
            box.innerHTML = `⚠️ <b>Siz kiritgan o'lchamni to'liqligicha chop etishning iloji yo'q.</b> Maksimal ulanishsiz ${m} m chop etiladi, `
                + `sizning o'lchamingiz ulanish bilan bo'ladi — shunga e'tiborli bo'ling. Qo'shimcha ma'lumotni mutaxassisdan oling.`;
        }
        return katta;
    }

    function renderAdminReklamaMaxEni(key) {
        let box = document.getElementById('reklamaBanAdminBox');
        if (!box) return;
        let show = reklamaBanTypes.includes(key);
        box.style.display = show ? 'block' : 'none';
        if (show) document.getElementById('reklamaMaxEniInput').value = reklamaMaxEni[key] || 0;
    }

    function saveReklamaMaxEni() {
        let key = currentManagingProduct;
        let v = parseFloat(document.getElementById('reklamaMaxEniInput').value);
        if (isNaN(v) || v < 0) { showToast("⚠️ 0 yoki undan katta son kiriting (metrda)!"); return; }
        let eski = reklamaMaxEni[key] || 0;
        reklamaMaxEni[key] = v;
        localStorage.setItem('erp_reklama_max_eni', JSON.stringify(reklamaMaxEni));
        if (typeof logAudit === 'function') logAudit("Maksimal chop eni o'zgartirildi", `${key}: ${eski} m → ${v} m`);
        showToast("💾 Maksimal chop eni saqlandi!");
    }
    function toggleReklamaExtra(name) {
        if (name === 'xalqacha') {
            let box = document.getElementById('xalqachaCountBox');
            let chk = document.getElementById('chkXalqacha');
            if (box && chk) box.style.display = chk.checked ? 'block' : 'none';
        } else if (name === 'ustanovka') {
            let box = document.getElementById('ustanovkaHeightBox');
            let chk = document.getElementById('chkUstanovka');
            if (box && chk) box.style.display = chk.checked ? 'block' : 'none';
        }
        calculate();
    }

    function syncXalqachaReykaExclusive() {
        let chkX = document.getElementById('chkXalqacha');
        let chkR = document.getElementById('chkReyka');
        if (!chkX || !chkR) return;

        if (chkX.checked) chkR.checked = false;
        if (chkR.checked) chkX.checked = false;

        chkR.disabled = chkX.checked;
        chkX.disabled = chkR.checked;

        let cardX = chkX.closest('.reklama-extra-card');
        let cardR = chkR.closest('.reklama-extra-card');
        if (cardX) cardX.classList.toggle('reklama-extra-card-disabled', chkX.disabled);
        if (cardR) cardR.classList.toggle('reklama-extra-card-disabled', chkR.disabled);

        let box = document.getElementById('xalqachaCountBox');
        if (box) box.style.display = chkX.checked ? 'block' : 'none';
    }

    function editReklamaExtraPrice(field) {
        let labels = { xalqacha: "Xalqacha narxi (so'm/dona)", reyka: "Reyka narxi (so'm/metr)", ustanovka: "Ustanovka narxi (so'm, bir martalik)" };
        let oldPrice = reklamaExtraPrices[field] || 0;
        let newPrice = prompt(`Yangi ${labels[field]} kiriting:`, oldPrice);
        if (newPrice !== null && !isNaN(parseFloat(newPrice))) {
            reklamaExtraPrices[field] = parseFloat(newPrice);
            localStorage.setItem('erp_reklama_extra_prices', JSON.stringify(reklamaExtraPrices));
            if (typeof logAudit === 'function') logAudit("Reklama qo'shimcha narxi o'zgartirildi", `${labels[field]}: ${oldPrice.toLocaleString()} → ${parseFloat(newPrice).toLocaleString()} so'm`);
            renderAdminPensTable();
            showToast("✅ Narx yangilandi!");
        }
    }


function generateFormHtml_reklama(type) {
    let html = '';
            let opt = reklamaExtraOptionsConfig[type] || { xalqacha: false, reyka: false, ustanovka: false, ploter: false };

            let xalqachaCardHtml = opt.xalqacha ? `
                    <div class="reklama-extra-card" style="margin-bottom:10px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:600; font-size:0.88rem; color:var(--text-main);">
                            <input type="checkbox" id="chkXalqacha" onchange="toggleReklamaExtra('xalqacha'); syncXalqachaReykaExclusive();" style="width:17px; height:17px; accent-color:var(--primary); flex-shrink:0; margin:0;">
                            🔘 Xalqacha qo'yib berish
                        </label>
                        <div id="xalqachaCountBox" style="display:none; margin-top:12px; padding-top:12px; border-top:1px dashed var(--border);">
                            <label style="display:block; font-size:0.8rem; color:var(--text-muted); font-weight:600; margin-bottom:6px;">Nechta xalqacha (dona):</label>
                            <input type="number" id="inpXalqachaCount" value="4" min="1" oninput="calculate()" style="width:100%; height:40px; padding:8px 12px; border:1.5px solid var(--border); border-radius:8px; font-size:0.9rem; outline:none; background:#fff; box-sizing:border-box;">
                        </div>
                    </div>` : '';

            let reykaCardHtml = opt.reyka ? `
                    <div class="reklama-extra-card" style="margin-bottom:10px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:600; font-size:0.88rem; color:var(--text-main);">
                            <input type="checkbox" id="chkReyka" onchange="calculate(); syncXalqachaReykaExclusive();" style="width:17px; height:17px; accent-color:var(--primary); flex-shrink:0; margin:0;">
                            📏 Reyka bilan tayyorlash
                        </label>
                    </div>` : '';

            let ploterCardHtml = opt.ploter ? `
                    <div class="reklama-extra-card" style="margin-bottom:10px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:600; font-size:0.88rem; color:var(--text-main);">
                            <input type="checkbox" id="chkPloter" onchange="calculate()" style="width:17px; height:17px; accent-color:var(--primary); flex-shrink:0; margin:0;">
                            ✂️ Ploter qilish
                        </label>
                    </div>` : '';

            let ustanovkaCardHtml = opt.ustanovka ? `
                    <div class="reklama-extra-card">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:600; font-size:0.88rem; color:var(--text-main);">
                            <input type="checkbox" id="chkUstanovka" onchange="toggleReklamaExtra('ustanovka')" style="width:17px; height:17px; accent-color:var(--primary); flex-shrink:0; margin:0;">
                            🛠️ Ustanovka qilish
                        </label>
                        <div id="ustanovkaHeightBox" style="display:none; margin-top:12px; padding-top:12px; border-top:1px dashed var(--border);">
                            <label style="display:block; font-size:0.8rem; color:var(--text-muted); font-weight:600; margin-bottom:6px;">O'rnatish balandligi (metr):</label>
                            <input type="number" id="inpUstanovkaHeight" value="2" min="0.1" step="0.1" oninput="calculate()" style="width:100%; height:40px; padding:8px 12px; border:1.5px solid var(--border); border-radius:8px; font-size:0.9rem; outline:none; background:#fff; box-sizing:border-box;">
                            <div id="ustanovkaWarning" style="display:none; margin-top:10px; padding:10px 12px; background:#fef3c7; color:#92400e; border:1px solid #fde68a; border-radius:8px; font-size:0.8rem; line-height:1.4;">
                                ⚠️ 2 metrdan balandroqqa o'rnatish uchun Xosim bilan kelishib oling.
                            </div>
                        </div>
                    </div>` : '';

            let extrasSectionHtml = (opt.xalqacha || opt.reyka || opt.ustanovka || opt.ploter) ? `
                <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border);">
                    <div class="step-title" style="margin-bottom:10px;">Qo'shimcha xizmatlar:</div>
                    ${xalqachaCardHtml}
                    ${reykaCardHtml}
                    ${ploterCardHtml}
                    ${ustanovkaCardHtml}
                </div>` : '';

            html = `
                <div class="form-group" style="margin-bottom:12px; flex-direction:row; gap:10px;">
                    <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                        <label>Eni (metr):</label>
                        <input type="number" id="inpWidth" value="2" min="0.1" step="0.1" oninput="calculate()">
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                        <label>Bo'yi (metr):</label>
                        <input type="number" id="inpHeight" value="1" min="0.1" step="0.1" oninput="calculate()">
                    </div>
                </div>
                ${(parseFloat(reklamaMaxEni[type]) || 0) > 0 ? `<div class="reklama-eni-hint">Ulanishsiz maksimal chop eni: <b>${reklamaMaxEni[type]} m</b></div>` : ''}
                <div id="reklamaEniOgoh" class="reklama-eni-ogoh" style="display:none;"></div>
                <div class="form-group" style="margin-bottom:12px;">
                    <label>Adad (dona):</label>
                    <input type="number" id="inpQuantity" value="1" min="1" oninput="calculate()">
                </div>
                ${extrasSectionHtml}
            `;

    return html;
}

function calculateResult_reklama(activeProductTypeParam, qty, baseCost) {
    let details = activeProductType.toUpperCase();
    let baseUnitPrice = 0;
                let w = parseFloat(document.getElementById('inpWidth')?.value) || 0;
                let h = parseFloat(document.getElementById('inpHeight')?.value) || 0;
                let sqMetr = w * h;
                baseUnitPrice = sqMetr * baseCost;
                details = `${w}m x ${h}m (${sqMetr.toFixed(2)} kv.m)`;
                if (reklamaEniOgohlantirishi(activeProductType, w, h)) {
                    details += ` | ⚠️ ulanish bilan (maks. ${reklamaMaxEni[activeProductType]} m)`;
                }

                let extraParts = [];

                let chkXalqacha = document.getElementById('chkXalqacha');
                if (chkXalqacha && chkXalqacha.checked) {
                    let xCount = parseInt(document.getElementById('inpXalqachaCount')?.value) || 0;
                    baseUnitPrice += xCount * (reklamaExtraPrices.xalqacha || 0);
                    extraParts.push(`Xalqacha: ${xCount} dona`);
                }

                let chkReyka = document.getElementById('chkReyka');
                if (chkReyka && chkReyka.checked) {
                    baseUnitPrice += w * (reklamaExtraPrices.reyka || 0);
                    extraParts.push(`Reyka bilan tayyorlangan`);
                }

                let chkPloter = document.getElementById('chkPloter');
                if (chkPloter && chkPloter.checked) {
                    baseUnitPrice += sqMetr * (reklamaExtraPrices.ploter || 0);
                    extraParts.push(`Ploter qilingan`);
                }

                let chkUstanovka = document.getElementById('chkUstanovka');
                let ustanovkaWarningBox = document.getElementById('ustanovkaWarning');
                if (chkUstanovka && chkUstanovka.checked) {
                    let uHeight = parseFloat(document.getElementById('inpUstanovkaHeight')?.value) || 0;
                    extraParts.push(`Ustanovka (${uHeight}m balandlik)`);
                    if (ustanovkaWarningBox) {
                        ustanovkaWarningBox.style.display = uHeight > 2 ? 'block' : 'none';
                    }
                } else if (ustanovkaWarningBox) {
                    ustanovkaWarningBox.style.display = 'none';
                }

                if (extraParts.length > 0) details += ` | ${extraParts.join(', ')}`;

    return { details, baseUnitPrice };
}

    // ====================== BO'LIMNI RO'YXATDAN O'TKAZISH ======================
    // Bu chaqiruv fayl OXIRIDA turishi shart: fayl oxirigacha xatosiz yuklangandagina
    // bo'lim "ishlayapti" deb belgilanadi. init() — saqlangan (localStorage) ma'lumotlarni
    // yuklaydi; core.js uni xatolikdan himoyalangan holda chaqiradi, shuning uchun bu yerdagi
    // xato faqat shu bo'limni o'chiradi, qolgan bo'limlar ishlayveradi.
    bolimRoyxatdan('reklama', {
        init: function () {
            let savedMaxEni = localStorage.getItem('erp_reklama_max_eni');
            if (savedMaxEni) {
                try {
                    reklamaMaxEni = { ...reklamaMaxEni, ...JSON.parse(savedMaxEni) };
                } catch (e) {}
            }

            let savedReklamaExtra = localStorage.getItem('erp_reklama_extra_prices');
            if (savedReklamaExtra) {
                reklamaExtraPrices = { ...reklamaExtraPrices, ...JSON.parse(savedReklamaExtra) };
            }

            let savedReklamaStendSizes = localStorage.getItem('erp_reklama_stend_sizes');
            if (savedReklamaStendSizes) {
                try {
                    reklamaStendSizeDatabase = { ...reklamaStendSizeDatabase, ...JSON.parse(savedReklamaStendSizes) };
                } catch (e) {}
            }

            let savedReklamaStendQtyTiers = localStorage.getItem('erp_reklama_stend_qty_tiers');
            if (savedReklamaStendQtyTiers) {
                try {
                    reklamaStendQtyTiers = { ...reklamaStendQtyTiers, ...JSON.parse(savedReklamaStendQtyTiers) };
                } catch (e) {}
            }
        }
    });
