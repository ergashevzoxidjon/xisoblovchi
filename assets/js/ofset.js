    const ofsetAvailablePaperTypes = ["Karton", "Melovka", "Dizayn qog'ozi"];

    let ofsetRawPapers = [
        { name: "Ofset", gsm: 80, prices: { "620x880": 85000, "620x940": 0, "700x1000": 0 }, isDefaultOffset: true },
        { name: "Melovka", gsm: 80, prices: { "620x880": 90000, "620x940": 95000, "700x1000": 110000 } },
        { name: "Melovka", gsm: 115, prices: { "620x880": 115000, "620x940": 120000, "700x1000": 140000 } },
        { name: "Karton", gsm: 250, prices: { "620x880": 240000, "620x940": 255000, "700x1000": 280000 } },
        { name: "Dizayn qog'ozi", gsm: 200, prices: { "620x880": 300000, "620x940": 320000, "700x1000": 350000 } }
    ];

    let ofsetMachineSettings = {
        plateA3: 22000, plateA2: 44000, plateA1: 88000,
        printA3Base: 170000, printA3Step: 70000,
        printA2Base: 350000, printA2Step: 80000,
        printA1Base: 1000000, printA1Step: 150000
    };

    let selectedOfsetPaperType = 'Ofset';
    let selectedOfsetGsm = 80;
    let selectedOfsetMachine = 'AUTO';
    let printSidesOfset = 1;
    let lastOfsetCalc = null;

    function loadOfsetMachineSettingsToUI() {
        document.getElementById('setPlateA3').value = ofsetMachineSettings.plateA3;
        document.getElementById('setPlateA2').value = ofsetMachineSettings.plateA2;
        document.getElementById('setPlateA1').value = ofsetMachineSettings.plateA1;
        document.getElementById('setPrintA3Base').value = ofsetMachineSettings.printA3Base;
        document.getElementById('setPrintA3Step').value = ofsetMachineSettings.printA3Step;
        document.getElementById('setPrintA2Base').value = ofsetMachineSettings.printA2Base;
        document.getElementById('setPrintA2Step').value = ofsetMachineSettings.printA2Step;
        document.getElementById('setPrintA1Base').value = ofsetMachineSettings.printA1Base;
        document.getElementById('setPrintA1Step').value = ofsetMachineSettings.printA1Step;
    }

    function renderAdminOfsetPapersMatrix() {
        let tbody = document.getElementById('adminOfsetPaperTableBody');
        if (!tbody) return;

        tbody.innerHTML = ofsetRawPapers.map((item, index) => {
            let isOffset = (item.name === "Ofset");
            let nameFieldHtml = isOffset
                ? `<input type="text" value="Ofset" readonly style="background:#f1f5f9; font-weight:600;" id="ofset_mtx_name_${index}">`
                : `<select id="ofset_mtx_name_${index}">${ofsetAvailablePaperTypes.map(t => `<option value="${t}" ${item.name === t ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
            return `
            <tr>
                <td>${nameFieldHtml}</td>
                <td><input type="number" id="ofset_mtx_gsm_${index}" value="${item.gsm}" ${isOffset ? 'readonly style="background:#f1f5f9;"' : ''}></td>
                <td><input type="number" id="ofset_mtx_p880_${index}" value="${item.prices['620x880'] || 0}"></td>
                <td><input type="number" id="ofset_mtx_p940_${index}" value="${item.prices['620x940'] || 0}" ${isOffset ? 'disabled style="background:#f1f5f9;"' : ''}></td>
                <td><input type="number" id="ofset_mtx_p1000_${index}" value="${item.prices['700x1000'] || 0}" ${isOffset ? 'disabled style="background:#f1f5f9;"' : ''}></td>
                <td style="text-align: right;">
                    <div class="action-btns" style="justify-content: flex-end;">
                        <button class="btn btn-danger" title="O'chirish" ${isOffset ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="deleteOfsetPaperRow(${index})">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');
    }

    function addOfsetPaperRow() {
        ofsetRawPapers.push({ name: "Melovka", gsm: 200, prices: { "620x880": 200000, "620x940": 210000, "700x1000": 230000 } });
        renderAdminOfsetPapersMatrix();
    }

    function deleteOfsetPaperRow(index) {
        if (ofsetRawPapers[index] && ofsetRawPapers[index].name === "Ofset") {
            showToast("⚠️ 'Ofset' qatorini o'chirib bo'lmaydi!");
            return;
        }
        if (ofsetRawPapers.length <= 1) {
            showToast("⚠️ Kamida bitta xom ashyo qolishi kerak!");
            return;
        }
        if (confirm("Ushbu qog'oz turini o'chirmoqchimisiz?")) {
            ofsetRawPapers.splice(index, 1);
            renderAdminOfsetPapersMatrix();
        }
    }

    function saveAllOfsetPapers() {
        let updated = [];
        let offsetItem = ofsetRawPapers.find(p => p.name === "Ofset");
        let offsetIndex = ofsetRawPapers.findIndex(p => p.name === "Ofset");
        if (offsetItem) {
            let p880Input = document.getElementById(`ofset_mtx_p880_${offsetIndex}`);
            if (p880Input) offsetItem.prices["620x880"] = parseFloat(p880Input.value) || 0;
            updated.push(offsetItem);
        } else {
            updated.push({ name: "Ofset", gsm: 80, prices: { "620x880": 85000, "620x940": 0, "700x1000": 0 }, isDefaultOffset: true });
        }

        for (let index = 0; index < ofsetRawPapers.length; index++) {
            let nameField = document.getElementById(`ofset_mtx_name_${index}`);
            if (!nameField || nameField.value === "Ofset") continue;

            let gsmInput = document.getElementById(`ofset_mtx_gsm_${index}`);
            let p880Input = document.getElementById(`ofset_mtx_p880_${index}`);
            let p940Input = document.getElementById(`ofset_mtx_p940_${index}`);
            let p1000Input = document.getElementById(`ofset_mtx_p1000_${index}`);

            updated.push({
                name: nameField.value || "Melovka",
                gsm: parseInt(gsmInput.value) || 80,
                prices: {
                    "620x880": parseFloat(p880Input.value) || 0,
                    "620x940": parseFloat(p940Input.value) || 0,
                    "700x1000": parseFloat(p1000Input.value) || 0
                }
            });
        }

        ofsetRawPapers = updated;
        localStorage.setItem('erp_ofset_raw_papers', JSON.stringify(ofsetRawPapers));

        ofsetMachineSettings = {
            plateA3: parseFloat(document.getElementById('setPlateA3').value) || 0,
            plateA2: parseFloat(document.getElementById('setPlateA2').value) || 0,
            plateA1: parseFloat(document.getElementById('setPlateA1').value) || 0,
            printA3Base: parseFloat(document.getElementById('setPrintA3Base').value) || 0,
            printA3Step: parseFloat(document.getElementById('setPrintA3Step').value) || 0,
            printA2Base: parseFloat(document.getElementById('setPrintA2Base').value) || 0,
            printA2Step: parseFloat(document.getElementById('setPrintA2Step').value) || 0,
            printA1Base: parseFloat(document.getElementById('setPrintA1Base').value) || 0,
            printA1Step: parseFloat(document.getElementById('setPrintA1Step').value) || 0
        };
        localStorage.setItem('erp_ofset_machine_settings', JSON.stringify(ofsetMachineSettings));

        renderAdminOfsetPapersMatrix();
        loadOfsetMachineSettingsToUI();
        showToast("💾 Barcha ofset o'zgarishlar saqlandi!");
    }

    function renderOfsetPublicTable() {
        let tbody = document.getElementById('ofsetPublicTableBody');
        if (!tbody) return;
        tbody.innerHTML = ofsetRawPapers.map(item => `
            <tr>
                <td style="font-weight:600;">${item.name} ${item.gsm}g</td>
                <td>${(item.prices['620x880'] || 0).toLocaleString()} so'm</td>
                <td>${(item.prices['620x940'] || 0).toLocaleString()} so'm</td>
                <td>${(item.prices['700x1000'] || 0).toLocaleString()} so'm</td>
            </tr>
        `).join('');
    }

    function renderOfsetPaperTypeChips() {
        let group = document.getElementById('ofsetPaperTypeGroup');
        if (!group) return;
        let uniqueTypes = ["Ofset", ...new Set(ofsetRawPapers.filter(p => p.name !== "Ofset").map(p => p.name))];
        group.innerHTML = uniqueTypes.map(typeName => `
            <button class="opt-btn ${typeName === selectedOfsetPaperType ? 'active' : ''}" onclick="setOfsetPaperType('${typeName}')">${typeName}</button>
        `).join('');
    }

    function renderOfsetGsmChips() {
        let group = document.getElementById('ofsetGsmGroup');
        if (!group) return;
        let filtered = ofsetRawPapers.filter(p => p.name === selectedOfsetPaperType);
        let uniqueGsms = [...new Set(filtered.map(p => p.gsm))].sort((a, b) => a - b);
        group.innerHTML = uniqueGsms.map(gsm => `
            <button class="opt-btn ${gsm === selectedOfsetGsm ? 'active' : ''}" onclick="setOfsetGsm(${gsm})">${gsm}g</button>
        `).join('');
    }

    function setOfsetPaperType(typeName) {
        selectedOfsetPaperType = typeName;
        let filtered = ofsetRawPapers.filter(p => p.name === selectedOfsetPaperType);
        if (filtered.length > 0) selectedOfsetGsm = filtered[0].gsm;
        renderOfsetPaperTypeChips();
        renderOfsetGsmChips();
        calculate();
    }

    function setOfsetGsm(gsm) {
        selectedOfsetGsm = gsm;
        renderOfsetGsmChips();
        calculate();
    }

    function setOfsetMachineMode(mode, btnEl) {
        selectedOfsetMachine = mode;
        document.querySelectorAll('#ofsetMachineGroup button').forEach(btn => btn.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');
        calculate();
    }

    function onOfsetCustomSize() {
        document.querySelectorAll('#standardOfsetSizeGroup button').forEach(btn => btn.classList.remove('active'));
        calculate();
    }

    function setOfsetSize(w, h, btnId) {
        document.getElementById('ofsetWidthX').value = w;
        document.getElementById('ofsetHeightY').value = h;
        
        let sizeBtns = document.querySelectorAll('#standardOfsetSizeGroup button');
        sizeBtns.forEach(btn => {
            if (btn.id === btnId) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        calculate();
    }

    function setPrintTypeOfset(sides) {
        printSidesOfset = sides;
        let btns = document.querySelectorAll('#printTypeGroupOfset button');
        btns.forEach((btn, idx) => {
            if ((idx + 1) === sides) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        calculate();
    }

    function updatePreviewOfset(cols, rows) {
        const previewBox = document.getElementById('previewOfsetBox');
        if (!previewBox) return;
        previewBox.innerHTML = '';
        
        previewBox.style.display = 'grid';
        previewBox.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        previewBox.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        previewBox.style.gap = '3px';
        previewBox.style.padding = '6px';
        previewBox.style.boxSizing = 'border-box';
        
        previewBox.style.width = '100%';
        previewBox.style.maxWidth = '310px';
        previewBox.style.height = '440px';
        previewBox.style.margin = '0 auto';
        previewBox.style.border = '2px dashed #05966e';
        previewBox.style.backgroundColor = '#ecfdf5';
        previewBox.style.borderRadius = '6px';

        let totalItems = cols * rows;
        for (let i = 0; i < totalItems; i++) {
            let div = document.createElement('div');
            div.className = 'preview-item';
            div.textContent = i + 1;
            div.style.background = '#10b981';
            div.style.border = '1px solid #05966e';
            div.style.borderRadius = '3px';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.fontSize = '12px';
            div.style.fontWeight = '900';
            div.style.color = '#fff';
            previewBox.appendChild(div);
        }
    }

    function getOfsetWorkingSheets(machName) {
        if (machName === 'A3') {
            return [
                { w: 297, h: 420, rawKey: "620x880", divisor: 4 },
                { w: 310, h: 440, rawKey: "620x880", divisor: 4 },
                { w: 310, h: 470, rawKey: "620x940", divisor: 4 },
                { w: 350, h: 500, rawKey: "700x1000", divisor: 4 }
            ];
        } else if (machName === 'A2') {
            return [
                { w: 620, h: 440, rawKey: "620x880", divisor: 2 },
                { w: 620, h: 470, rawKey: "620x940", divisor: 2 },
                { w: 500, h: 700, rawKey: "700x1000", divisor: 2 }
            ];
        } else if (machName === 'A1') {
            return [
                { w: 620, h: 880, rawKey: "620x880", divisor: 1 },
                { w: 620, h: 940, rawKey: "620x940", divisor: 1 },
                { w: 700, h: 1000, rawKey: "700x1000", divisor: 1 }
            ];
        }
        return [];
    }

    function calculateOfsetGridFitting(usableW, usableH, reqW, reqH) {
        const EPS = 1e-6;
        let effectiveW = reqW + 2;
        let effectiveH = reqH + 2;

        let cols1 = Math.floor((usableW + 2) / effectiveW + EPS);
        let rows1 = Math.floor((usableH + 2) / effectiveH + EPS);
        let count1 = (cols1 > 0 && rows1 > 0) ? (cols1 * rows1) : 0;

        let cols2 = Math.floor((usableW + 2) / (reqH + 2) + EPS);
        let rows2 = Math.floor((usableH + 2) / (reqW + 2) + EPS);
        let count2 = (cols2 > 0 && rows2 > 0) ? (cols2 * rows2) : 0;

        if (count2 > count1) {
            return { cols: cols2, rows: rows2, count: count2, itemW: reqH, itemH: reqW, isRotated: true };
        } else {
            return { cols: cols1, rows: rows1, count: count1, itemW: reqW, itemH: reqH, isRotated: false };
        }
    }

    function calculateOfsetForMachine(machName, w, h, tiraj, side, paperType, gsm) {
        let bestVariant = null;
        let minPerPieceCost = Infinity;

        let availablePapersForSelection = ofsetRawPapers.filter(p => p.name === paperType && p.gsm === gsm);
        let isOffsetType = (paperType === "Ofset");
        let workingSheets = getOfsetWorkingSheets(machName);

        let platePrices = { 'A3': ofsetMachineSettings.plateA3, 'A2': ofsetMachineSettings.plateA2, 'A1': ofsetMachineSettings.plateA1 };

        for (let paperObj of availablePapersForSelection) {
            for (let ws of workingSheets) {
                let price = paperObj.prices[ws.rawKey];
                if (!price || price <= 0) continue;

                let usableW = ws.w - 10;
                let usableH = ws.h - 10;

                let fit = calculateOfsetGridFitting(usableW, usableH, w, h);
                if (fit.count <= 0) continue;

                let itemsPerSheet = fit.count;
                let totalItemsPerFullBase = itemsPerSheet * ws.divisor;

                let baseSheets = Math.ceil(tiraj / totalItemsPerFullBase);
                let reserve = (side === 2) ? 200 : 100;
                let totalBaseSheets = baseSheets + reserve;
                let totalPaperCost = totalBaseSheets * price;

                let basePrintCost = 0, stepPrintCost = 0;
                if (machName === 'A3') { basePrintCost = ofsetMachineSettings.printA3Base; stepPrintCost = ofsetMachineSettings.printA3Step; }
                else if (machName === 'A2') { basePrintCost = ofsetMachineSettings.printA2Base; stepPrintCost = ofsetMachineSettings.printA2Step; }
                else if (machName === 'A1') { basePrintCost = ofsetMachineSettings.printA1Base; stepPrintCost = ofsetMachineSettings.printA1Step; }

                let oborotType = "STANDART";
                let totalPlates = 4;
                let totalPrintCost = 0;
                let totalWorkingSheets = baseSheets;

                if (side === 1) {
                    oborotType = "1_SIDE";
                    totalPlates = 4;
                    let thousandsUnits = Math.ceil(totalWorkingSheets / 1000);
                    let multiplier = Math.max(0, thousandsUnits - 1);
                    totalPrintCost = basePrintCost + (multiplier * stepPrintCost);
                } else {
                    if (fit.count >= 2 && fit.count % 2 === 0) {
                        oborotType = "SVOY";
                        totalPlates = 4;
                        let totalImpressions = totalWorkingSheets * 2;
                        let thousandsUnits = Math.ceil(totalImpressions / 1000);
                        let multiplier = Math.max(0, thousandsUnits - 1);
                        totalPrintCost = basePrintCost + (multiplier * stepPrintCost);
                    } else {
                        oborotType = "CHUJOY";
                        totalPlates = 8;
                        let thousandsUnits = Math.ceil(totalWorkingSheets / 1000);
                        let multiplier = Math.max(0, thousandsUnits - 1);
                        let singlePassCost = basePrintCost + (multiplier * stepPrintCost);
                        totalPrintCost = singlePassCost * 2;
                    }
                }

                let totalPlateCost = totalPlates * platePrices[machName];
                let baseTotalCost = totalPaperCost + totalPlateCost + totalPrintCost;
                let perPieceCostRaw = tiraj > 0 ? (baseTotalCost / tiraj) : 0;

                if (perPieceCostRaw < minPerPieceCost) {
                    minPerPieceCost = perPieceCostRaw;
                    bestVariant = {
                        machine: machName,
                        rawName: isOffsetType ? `${w}x${h} mm (Ofset)` : `${ws.rawKey} mm (${paperObj.name} ${gsm}g) - ${ws.w}x${ws.h}`,
                        workW: ws.w, workH: ws.h,
                        itemsPerSheet, totalSheets: totalBaseSheets,
                        baseTotalCost, perPieceCostRaw,
                        fitData: fit, oborotType, totalPlates
                    };
                }
            }
        }

        return bestVariant;
    }


function generateForm_ofset(type, form, rightCol) {
            form.className = "";
            let parentGrid = document.querySelector('.calc-grid');
            parentGrid.style.gridTemplateColumns = "1.2fr 1fr";

            printSidesOfset = 1;
            selectedOfsetMachine = 'AUTO';

            if (!ofsetRawPapers.some(p => p.name === selectedOfsetPaperType)) {
                selectedOfsetPaperType = ofsetRawPapers.length > 0 ? ofsetRawPapers[0].name : 'Ofset';
            }
            let gsmOptionsInit = ofsetRawPapers.filter(p => p.name === selectedOfsetPaperType);
            if (gsmOptionsInit.length > 0 && !gsmOptionsInit.some(p => p.gsm === selectedOfsetGsm)) {
                selectedOfsetGsm = gsmOptionsInit[0].gsm;
            }

            form.innerHTML = `
                <div class="step-title">Ofset qog'oz turi:</div>
                <div class="options-group" id="ofsetPaperTypeGroup"></div>

                <div class="step-title">Qog'oz zichligi (g/m²):</div>
                <div class="options-group" id="ofsetGsmGroup"></div>

                <div class="step-title">Standart formatlar (tezkor tanlash):</div>
                <div class="options-group" id="standardOfsetSizeGroup">
                    <button class="opt-btn" id="btnOfsetA1" onclick="setOfsetSize(594, 841, 'btnOfsetA1')">A1</button>
                    <button class="opt-btn" id="btnOfsetA2" onclick="setOfsetSize(420, 594, 'btnOfsetA2')">A2</button>
                    <button class="opt-btn active" id="btnOfsetA3" onclick="setOfsetSize(297, 420, 'btnOfsetA3')">A3</button>
                    <button class="opt-btn" id="btnOfsetA4" onclick="setOfsetSize(210, 297, 'btnOfsetA4')">A4</button>
                    <button class="opt-btn" id="btnOfsetA5" onclick="setOfsetSize(148, 210, 'btnOfsetA5')">A5</button>
                    <button class="opt-btn" id="btnOfsetA6" onclick="setOfsetSize(105, 148, 'btnOfsetA6')">A6</button>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Mahsulot eni X (mm):</label>
                        <input type="number" id="ofsetWidthX" value="297" oninput="onOfsetCustomSize()">
                    </div>
                    <div class="form-group">
                        <label>Mahsulot bo'yi Y (mm):</label>
                        <input type="number" id="ofsetHeightY" value="420" oninput="onOfsetCustomSize()">
                    </div>
                </div>

                <div class="step-title">Bosma turi (tomonlari):</div>
                <div class="options-group" id="printTypeGroupOfset" style="display:flex;">
                    <button class="opt-btn active" onclick="setPrintTypeOfset(1)" style="flex:1;">Bir tomonlama</button>
                    <button class="opt-btn" onclick="setPrintTypeOfset(2)" style="flex:1;">Ikki tomonlama</button>
                </div>

                <div class="step-title">Mashina tanlash rejimi:</div>
                <div class="options-group" id="ofsetMachineGroup">
                    <button class="opt-btn active" onclick="setOfsetMachineMode('AUTO', this)">🤖 Avtomatik (Eng arzoni)</button>
                    <button class="opt-btn" onclick="setOfsetMachineMode('A3', this)">A3 Ofset</button>
                    <button class="opt-btn" onclick="setOfsetMachineMode('A2', this)">A2 Ofset</button>
                    <button class="opt-btn" onclick="setOfsetMachineMode('A1', this)">A1 Ofset</button>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Tiraj (Miqdori - dona):</label>
                        <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate()">
                    </div>
                    <div class="form-group">
                        <label>Kompaniya ustama foizi (Marja %):</label>
                        <input type="number" id="ofsetMargin" value="30" min="0" oninput="calculate()">
                    </div>
                </div>

                <div id="ofsetRecommendationBanner" style="display:none; background:#eef2ff; border:1.5px solid #c7d2fe; color:#3730a3; padding:12px 14px; border-radius:10px; margin-bottom:16px; font-size:0.82rem; font-weight:600;">
                    <div id="ofsetRecommendationText"></div>
                    <div id="ofsetOborotAlert" style="margin-top:6px;"></div>
                </div>

                <div class="result-box" style="margin-top: 16px;">
                    <div>
                        <h3 style="margin-bottom: 8px; color: var(--text-main); font-size: 0.95rem;">Ofset hisob-kitob natijasi:</h3>
                        <div style="font-size: 0.88rem; color: var(--text-main); display: flex; flex-direction: column; gap: 4px;">
                            <div id="resOfsetMachine">Tanlangan ofset: -</div>
                            <div id="resOfsetRawFormat">Qog'oz formati: -</div>
                            <div id="resOfsetSheetInfo">1 ta bosma qog'ozga sig'adigan mahsulot: 0 dona</div>
                            <div id="resOfsetTotalSheets">Jami kerakli qog'oz: 0 ta</div>
                            <div id="resOfsetFormsCount">Forma (Klishe/Plastina) soni: 0 ta</div>
                            <div id="resOfsetBaseCost">Asosiy tannarx: 0 so'm</div>
                            <div id="resOfsetTotal" style="font-weight: 700; color: var(--primary); margin-top: 4px;">Umumiy narx: 0 so'm</div>
                        </div>
                        <div class="table-card" style="margin-top: 12px; padding: 10px; background: var(--bg-main);">
                            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Mashinalar bo'yicha 1 dona narxi:</div>
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem;"><span>A3 Ofset:</span><strong id="compOfsetA3">-</strong></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem;"><span>A2 Ofset:</span><strong id="compOfsetA2">-</strong></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem;"><span>A1 Ofset:</span><strong id="compOfsetA1">-</strong></div>
                        </div>
                    </div>
                    <div style="margin-top: 14px;">
                        <button class="btn" style="width: 100%; height: 36px; font-size: 0.82rem;" onclick="copyResult()">📋 Natijani nusxalash</button>
                    </div>
                </div>
            `;

            rightCol.className = "";
            rightCol.style.display = "block";
            rightCol.innerHTML = `
                <div class="step-title" style="margin-top:0;">Qog'ozdagi joylashuvi (5mm otstup, 2mm oraliq):</div>
                <div id="previewOfsetBox" style="width: 100%; height: 350px; border: 2px dashed #05966e; background: #ecfdf5; border-radius: 8px; display: grid; gap: 4px; padding: 6px; box-sizing: border-box; overflow: hidden;"></div>
            `;

            let tableContainerId = document.getElementById('ofsetTableContainer');
            if (!tableContainerId) {
                let tableDiv = document.createElement('div');
                tableDiv.id = 'ofsetTableContainer';
                tableDiv.style.marginTop = "30px";
                tableDiv.innerHTML = `
                    <div class="section-title">Ofset xom ashyo (qog'oz) narxlar matrixi</div>
                    <div class="table-card">
                        <div class="table-scroll">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Qog'oz turi / Grammi</th>
                                    <th style="width: 150px;">620x880</th>
                                    <th style="width: 150px;">620x940</th>
                                    <th style="width: 150px;">700x1000</th>
                                </tr>
                            </thead>
                            <tbody id="ofsetPublicTableBody"></tbody>
                        </table>
                        </div>
                    </div>
                `;
                document.getElementById('calcScreen').appendChild(tableDiv);
            } else {
                tableContainerId.style.display = 'block';
            }
            renderOfsetPublicTable();
            renderOfsetPaperTypeChips();
            renderOfsetGsmChips();

            calculate();
            return;
}

function calculate_ofset() {
    let qty = parseInt(document.getElementById('inpQuantity')?.value) || 1;
            let w = parseFloat(document.getElementById('ofsetWidthX')?.value) || 0;
            let h = parseFloat(document.getElementById('ofsetHeightY')?.value) || 0;
            let tiraj = qty;
            let marginPercent = parseFloat(document.getElementById('ofsetMargin')?.value) || 0;

            if (w <= 0 || h <= 0) return;

            let resA3 = calculateOfsetForMachine('A3', w, h, tiraj, printSidesOfset, selectedOfsetPaperType, selectedOfsetGsm);
            let resA2 = calculateOfsetForMachine('A2', w, h, tiraj, printSidesOfset, selectedOfsetPaperType, selectedOfsetGsm);
            let resA1 = calculateOfsetForMachine('A1', w, h, tiraj, printSidesOfset, selectedOfsetPaperType, selectedOfsetGsm);

            let compA3El = document.getElementById('compOfsetA3');
            let compA2El = document.getElementById('compOfsetA2');
            let compA1El = document.getElementById('compOfsetA1');
            if (compA3El) compA3El.innerHTML = resA3 ? (Math.round(resA3.perPieceCostRaw * (1 + marginPercent / 100)).toLocaleString() + " so'm") : '<span style="color:#e31c79;">Sig\'maydi</span>';
            if (compA2El) compA2El.innerHTML = resA2 ? (Math.round(resA2.perPieceCostRaw * (1 + marginPercent / 100)).toLocaleString() + " so'm") : '<span style="color:#e31c79;">Sig\'maydi</span>';
            if (compA1El) compA1El.innerHTML = resA1 ? (Math.round(resA1.perPieceCostRaw * (1 + marginPercent / 100)).toLocaleString() + " so'm") : '<span style="color:#e31c79;">Sig\'maydi</span>';

            let validResults = [resA3, resA2, resA1].filter(Boolean);
            let activeRes = null;
            let banner = document.getElementById('ofsetRecommendationBanner');
            let recText = document.getElementById('ofsetRecommendationText');
            let oborotAlert = document.getElementById('ofsetOborotAlert');

            if (selectedOfsetMachine === 'AUTO') {
                if (validResults.length > 0) {
                    validResults.sort((a, b) => a.perPieceCostRaw - b.perPieceCostRaw);
                    activeRes = validResults[0];
                    if (recText) recText.innerText = `💡 Eng tejamkor: [${activeRes.machine} Ofset (${activeRes.workW}x${activeRes.workH})] formatidagi qog'ozga chop etish tavsiya etiladi.`;
                }
            } else {
                if (selectedOfsetMachine === 'A3') activeRes = resA3;
                if (selectedOfsetMachine === 'A2') activeRes = resA2;
                if (selectedOfsetMachine === 'A1') activeRes = resA1;
                if (recText) recText.innerText = `Tanlangan rejim: [${selectedOfsetMachine} Ofset]`;
            }

            if (!activeRes) {
                if (banner) banner.style.display = 'block';
                if (recText) recText.innerText = "⚠️ Bu mahsulot o'lchami tanlangan mashinaga sig'maydi yoki bu gramajda mos xom ashyo topilmadi!";
                if (oborotAlert) oborotAlert.innerHTML = '';
                document.getElementById('resOfsetMachine').innerText = `Tanlangan ofset: -`;
                document.getElementById('resOfsetRawFormat').innerText = `Qog'oz formati: -`;
                document.getElementById('resOfsetSheetInfo').innerText = `1 ta bosma qog'ozga sig'adigan mahsulot: 0 dona`;
                document.getElementById('resOfsetTotalSheets').innerText = `Jami kerakli qog'oz: 0 ta`;
                document.getElementById('resOfsetFormsCount').innerText = `Forma (Klishe/Plastina) soni: 0 ta`;
                document.getElementById('resOfsetBaseCost').innerText = `Asosiy tannarx: 0 so'm`;
                document.getElementById('resOfsetTotal').innerText = `Umumiy narx: 0 so'm`;
                let previewBox = document.getElementById('previewOfsetBox');
                if (previewBox) previewBox.innerHTML = '<span style="color:#e31c79; font-weight:700; font-size:0.8rem; text-align:center; padding: 20px;">Bu o\'lcham tanlangan mashinaga sig\'maydi!</span>';
                currentCalcResult = { details: "Sig'maydi", qty, unitPrice: 0, totalPrice: 0, name: "Ofset Pechat", imageUrl: '' };
                return;
            }

            if (banner) banner.style.display = 'block';

            if (printSidesOfset === 2) {
                if (activeRes.oborotType === "SVOY") {
                    oborotAlert.innerHTML = `<div style="background:#dcfce7; color:#14532d; border:1px solid #86efac; padding:6px 10px; border-radius:8px; font-size:0.78rem; font-weight:700;">⚠️ Ikki tomonlama <strong>SVOY OBOROT</strong> holatida chop etiladi (1 komplekt forma).</div>`;
                } else {
                    oborotAlert.innerHTML = `<div style="background:#fef2f2; color:#991b1b; border:1px solid #fca5a5; padding:6px 10px; border-radius:8px; font-size:0.78rem; font-weight:700;">⚠️ Ikki tomonlama <strong>CHUJOY OBOROT</strong> holatida chop etiladi (2 komplekt forma).</div>`;
                }
            } else {
                oborotAlert.innerHTML = `<div style="font-size:0.76rem; color:var(--text-muted);">ℹ️ Bir tomonlama standart chop etish rejimi.</div>`;
            }

            let grandTotal = Math.round(activeRes.baseTotalCost * (1 + marginPercent / 100));
            let unitPrice = tiraj > 0 ? Math.round(grandTotal / tiraj) : 0;

            details = `${activeRes.rawName} | (${w}x${h}mm) | ${printSidesOfset === 1 ? 'Bir tomonlama' : 'Ikki tomonlama'} [${activeRes.machine}]`;
            previewNameText = "Ofset Pechat";

            updatePreviewOfset(activeRes.fitData.cols, activeRes.fitData.rows);

            document.getElementById('resOfsetMachine').innerText = `Tanlangan ofset: ${activeRes.machine} (${activeRes.workW}x${activeRes.workH})`;
            document.getElementById('resOfsetRawFormat').innerText = `Qog'oz formati: ${activeRes.rawName}`;
            document.getElementById('resOfsetSheetInfo').innerText = `1 ta bosma qog'ozga sig'adigan mahsulot: ${activeRes.itemsPerSheet} dona`;
            document.getElementById('resOfsetTotalSheets').innerText = `Jami kerakli qog'oz: ${activeRes.totalSheets} ta`;
            document.getElementById('resOfsetFormsCount').innerText = `Forma (Klishe/Plastina) soni: ${activeRes.totalPlates} ta (${activeRes.totalPlates / 4} kamplekt)`;
            document.getElementById('resOfsetBaseCost').innerText = `Asosiy tannarx: ${Math.round(activeRes.baseTotalCost).toLocaleString()} so'm`;
            document.getElementById('resOfsetTotal').innerText = `Umumiy narx: ${grandTotal.toLocaleString()} so'm`;

            currentCalcResult = { details, qty, unitPrice, totalPrice: grandTotal, name: previewNameText, imageUrl: '' };
            return;
}
