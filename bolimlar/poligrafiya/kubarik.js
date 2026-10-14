// Poligrafiya bo'limi — Kubarik.
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

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
        // Har bir tur: ichki varaqlar (paperType/gsm/varaqSoni, a3dagiBolak — 1 A3 varaqqa nechta ichki bo'lak
        // sig'ishi) va QUTI/IDISH (idishPaperType/idishGsm — qog'oz, idishMashina — A3/A2/A1 format,
        // idishBolak — 1 varaqqa nechta quti sig'ishi). Quti uchun laminatsiya va visochka MAJBURIY
        // (ofsetFinishingServices dan), yig'ish xarajati ham har kubarikka qo'shiladi.
        turlar: [
            { key: 'oq',       name: 'Oq',       idishPaperType: 'Karton', idishGsm: 300, idishMashina: 'A3', idishBolak: 4, a3dagiBolak: 12, paperType: 'Ofset', gsm: 80, varaqSoni: 900, pechatli: false, qoshimchaNomi: '',                       qoshimchaNarx: 0,    yigishNarxi: 3000, isDefault: true },
            { key: 'rangli',   name: 'Rangli',   idishPaperType: 'Karton', idishGsm: 300, idishMashina: 'A3', idishBolak: 4, a3dagiBolak: 12, paperType: 'Ofset', gsm: 80, varaqSoni: 900, pechatli: false, qoshimchaNomi: "Rangli qog'oz ustamasi", qoshimchaNarx: 4000, yigishNarxi: 3000, isDefault: false },
            { key: 'kleyli',   name: 'Kleyli',   idishPaperType: 'Karton', idishGsm: 300, idishMashina: 'A3', idishBolak: 4, a3dagiBolak: 12, paperType: 'Ofset', gsm: 80, varaqSoni: 500, pechatli: false, qoshimchaNomi: 'Yelim (kley) qatlami',   qoshimchaNarx: 5000, yigishNarxi: 3500, isDefault: false },
            { key: 'pechatli', name: 'Pechatli', idishPaperType: 'Karton', idishGsm: 300, idishMashina: 'A3', idishBolak: 4, a3dagiBolak: 12, paperType: 'Ofset', gsm: 80, varaqSoni: 900, pechatli: true,  qoshimchaNomi: '',                       qoshimchaNarx: 0,    yigishNarxi: 3000, isDefault: false }
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
        let bolak = Math.max(1, parseInt(t.a3dagiBolak) || parseInt(kubarikConfig.a3dagiBolak) || 1);
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

        // 1b) Quti (idish): admin kiritgan qog'oz va format (A3/A2/A1), 1 varaqqa sig'adigan quti soni;
        // pechat — Ofset (1+0). Laminatsiya va visochka — MAJBURIY, umumiy pardozlash narxlaridan.
        let mashina = ['A3', 'A2', 'A1'].includes(t.idishMashina) ? t.idishMashina : 'A3';
        let mKey = mashina.toLowerCase();
        let qutiPaper = t.idishPaperType || 'Karton';
        let qutiGsm = parseInt(t.idishGsm) || 300;
        let qutiBolak = Math.max(1, parseInt(t.idishBolak) || 1);
        let qutiVaraq = Math.ceil(qty / qutiBolak);
        let rq = calculateOfsetJobFixedSheets(mashina, qty, 1, qutiPaper, qutiGsm, qutiVaraq, false);
        if (rq) {
            unit += (rq.totalPaperCost + rq.totalPlateCost + rq.totalPrintCost) / qty;
            costItems.push({ label: `Quti qog'ozi (${qutiPaper} ${qutiGsm}gr, ${rq.rawName})`, qty: `${rq.totalSheets} xom varoq (${qutiVaraq} ${mashina})`, total: Math.round(rq.totalPaperCost) });
            costItems.push({ label: 'Quti formasi (klishe)', qty: `${rq.totalPlates} plastina`, total: Math.round(rq.totalPlateCost) });
            costItems.push({ label: `Quti bosmasi (pechat 1+0, ${mashina})`, qty: `${rq.totalWorkingSheets} ta ${mashina} varoq`, total: Math.round(rq.totalPrintCost) });
            qismlar.push(`quti: ${qutiPaper} ${qutiGsm}gr (${mashina})`);
        } else {
            qismlar.push(`⚠️ Quti uchun ${qutiPaper} ${qutiGsm}gr Ofset ${mashina} bazasida narx topilmadi — admin panelda tekshiring`);
        }
        let lamNarx = parseFloat(ofsetFinishingServices.laminatsiya[mKey]) || 0;
        if (lamNarx > 0) {
            unit += (qutiVaraq * lamNarx) / qty;
            costItems.push({ label: `Quti laminatsiyasi (${mashina})`, qty: `${qutiVaraq} varaq`, total: Math.round(qutiVaraq * lamNarx) });
        }
        let visTotal = papkaTieredTotal(qutiVaraq, ofsetFinishingServices.visochka[mKey]);
        if (visTotal > 0) {
            unit += visTotal / qty;
            costItems.push({ label: `Quti visochkasi (${mashina})`, qty: `${qutiVaraq} varaq`, total: Math.round(visTotal) });
        }
        qismlar.push('laminatsiya + visochka');

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
            ? `<tr><td colspan="15" style="text-align:center; color:var(--text-muted); padding:16px;">Hozircha tur yo'q — "+ Yangi tur" tugmasini bosing.</td></tr>`
            : kubarikConfig.turlar.map((t, i) => `
            <tr>
                <td><input type="text" id="kubTur_name_${i}" value="${esc(t.name)}"></td>
                <td><select id="kubTur_paper_${i}">${POLIGRAFIYA_PAPER_TYPES.map(p => `<option value="${p}" ${t.paperType === p ? 'selected' : ''}>${p}</option>`).join('')}</select></td>
                <td><input type="number" id="kubTur_gsm_${i}" value="${t.gsm}" min="1"></td>
                <td><input type="number" id="kubTur_varaq_${i}" value="${t.varaqSoni}" min="1"></td>
                <td><input type="number" id="kubTur_bolak_${i}" value="${t.a3dagiBolak || kubarikConfig.a3dagiBolak}" min="1"></td>
                <td><select id="kubTur_ipaper_${i}">${POLIGRAFIYA_PAPER_TYPES.map(p => `<option value="${p}" ${(t.idishPaperType || 'Karton') === p ? 'selected' : ''}>${p}</option>`).join('')}</select></td>
                <td><input type="number" id="kubTur_igsm_${i}" value="${t.idishGsm || 300}" min="1"></td>
                <td><select id="kubTur_imash_${i}">${['A3', 'A2', 'A1'].map(m => `<option value="${m}" ${(t.idishMashina || 'A3') === m ? 'selected' : ''}>${m}</option>`).join('')}</select></td>
                <td><input type="number" id="kubTur_ibolak_${i}" value="${t.idishBolak || 1}" min="1"></td>
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
                a3dagiBolak: Math.max(1, parseInt(q(`kubTur_bolak_${i}`).value) || 1),
                idishPaperType: q(`kubTur_ipaper_${i}`).value,
                idishGsm: Math.max(1, parseInt(q(`kubTur_igsm_${i}`).value) || 300),
                idishMashina: q(`kubTur_imash_${i}`).value,
                idishBolak: Math.max(1, parseInt(q(`kubTur_ibolak_${i}`).value) || 1),
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
            a3dagiBolak: kubarikConfig.a3dagiBolak, idishPaperType: 'Karton', idishGsm: 300, idishMashina: 'A3', idishBolak: 4,
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

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('kubarik');
