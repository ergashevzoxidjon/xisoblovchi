    const reklamaExtraOptionsConfig = {
        baner:         { xalqacha: true,  reyka: true,  ustanovka: true, ploter: false },
        orakal:        { xalqacha: false, reyka: false, ustanovka: true, ploter: true  },
        setka_orakal:  { xalqacha: false, reyka: false, ustanovka: true, ploter: false },
        tumanka:       { xalqacha: false, reyka: false, ustanovka: true, ploter: true  },
        xolst:         { xalqacha: false, reyka: true,  ustanovka: false, ploter: false }
    };
    let reklamaExtraPrices = { xalqacha: 1000, reyka: 5000, ustanovka: 50000, ploter: 3000 };
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
