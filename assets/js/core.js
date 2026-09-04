    let defaultPrices = {
        flayer: 300, listovka: 250, doorhanger: 450, buklet: 800, bloknot: 6000, paket: 4000, kalendar: 12000, papka: 7000, kubarik: 15000,
        futbolka: 45000, kepka: 25000, svitshot: 75000, xudi: 95000, jiletka: 85000, shoper: 20000,
        ruchka: 3000, yejidnevnik: 35000, termos: 60000, brelok: 8000, bakal: 25000, suv_idishlar: 30000, naborlar: 150000, beyjik: 12000, plagetkalar: 70000, powerbanklar: 90000,
        baner: 35000, orakal: 45000, setka_orakal: 50000, tumanka: 40000, xolst: 85000,
        ofset_pechat: 150, sifravoy_pechat: 800
    };

    const allCategories = {
        poligrafiya: [
            { key: 'flayer', name: 'Flayer', icon: '📄' },
            { key: 'listovka', name: 'Listovka', icon: '📑' },
            { key: 'doorhanger', name: 'Doorhanger', icon: '🏷️' },
            { key: 'buklet', name: 'Buklet', icon: '📖' },
            { key: 'bloknot', name: 'Bloknot', icon: '📓' },
            { key: 'paket', name: 'Paket', icon: '🛍️' },
            { key: 'kalendar', name: 'Kalendar', icon: '📅' },
            { key: 'papka', name: 'Papka', icon: '📁' },
            { key: 'kubarik', name: 'Kubarik', icon: '🧊' }
        ],
        textile: [
            { key: 'futbolka', name: 'Futbolka', icon: '👕' },
            { key: 'kepka', name: 'Kepka', icon: '🧢' },
            { key: 'svitshot', name: 'Svitshot', icon: '👔' },
            { key: 'xudi', name: 'Xudi', icon: '🧥' },
            { key: 'jiletka', name: 'Jiletka', icon: '🥼' },
            { key: 'shoper', name: 'Shoper', icon: '👜' }
        ],
        souvenir: [
            { key: 'ruchka', name: 'Ruchka', icon: '🖊️' },
            { key: 'yejidnevnik', name: 'Yejidnevnik', icon: '📘' },
            { key: 'termos', name: 'Termos', icon: '🥤' },
            { key: 'brelok', name: 'Brelok', icon: '🔑' },
            { key: 'bakal', name: 'Bakal', icon: '☕' },
            { key: 'suv_idishlar', name: 'Suv idishlar', icon: '🍾' },
            { key: 'naborlar', name: 'Naborlar', icon: '🎁' },
            { key: 'beyjik', name: 'Beyjik', icon: '🪪' },
            { key: 'plagetkalar', name: 'Plagetkalar', icon: '🏆' },
            { key: 'powerbanklar', name: 'Powerbanklar', icon: '🔋' },
            { key: 'fleshka', name: 'Fleshka', icon: '💾' },
            { key: 'statuetka', name: 'Statuetka', icon: '🏅' },
            { key: 'kardxolder', name: 'Kardxolder', icon: '💳' },
            { key: 'soat', name: 'Soat', icon: '⌚' },
            { key: 'zontik', name: 'Zontik', icon: '☂️' }
        ],
        reklama: [
            { key: 'baner', name: 'Baner', icon: '🖼️' },
            { key: 'orakal', name: 'Orakal', icon: '🌆' },
            { key: 'setka_orakal', name: 'Setka Orakal', icon: '🏁' },
            { key: 'tumanka', name: 'Tumanka', icon: '🌫️' },
            { key: 'xolst', name: 'Xolst', icon: '🎨' }
        ],
        ofset: [
            { key: 'ofset_pechat', name: 'Ofset pechat kalkulyatori', icon: '🖨️' }
        ],
        sifravoy: [
            { key: 'sifravoy_pechat', name: 'Raqamli Pechat Kalkulyatori', icon: '🖨️' }
        ]
    };

    const souvenirKeys = allCategories.souvenir.map(item => item.key);
    const textileKeys = allCategories.textile.map(item => item.key);
    const reklamaBanTypes = ['baner', 'orakal', 'setka_orakal', 'tumanka', 'xolst'];
    const hasSizesTypes = []; // razmerlar (Kichik/O'rta/Katta) bo'yicha ustama qo'llaniladigan turlar (hozircha hech biri ishlatmaydi)
    const oneSidedOnlySouvenirs = ['plagetkalar', 'naborlar', 'statuetka', 'soat', 'kardxolder', 'zontik']; // faqat bir tomonlama pechat qilinadigan turlar (ikki tomonlama variant ko'rsatilmaydi)
    // Standart "UF Pechat / Sifravoy Pechat" juftligi o'rniga boshqacha chop turlari to'plamidan foydalanadigan suvenir turlari.
    // Ichki holatda 'uv' | 'dtf' | 'gravirovka' kalitlaridan foydalaniladi (narxlar ham shu nomlar bilan saqlanadi),
    // faqat mijoz/admin ko'radigan yorliq matni har xil bo'lishi mumkin. 'uv' kaliti yo'q bo'lsa, UF Pechat varianti umuman ko'rsatilmaydi.
    const poligrafiyaKeys = allCategories.poligrafiya.map(item => item.key);

    let activeProductType = '';
    let currentManagingProduct = null;
    let currentCalcResult = {};
    let quoteCart = [];
    let usersDb = [];
    let currentUser = null;
    let auditLog = [];
    let quoteArchive = [];
    let activeQuoteArchiveId = null;

    function init() {
        loadQuoteCart();
        let savedPens = localStorage.getItem('erp_pens_db_v3');
        pensDatabase = savedPens ? JSON.parse(savedPens) : getDefaultPensDatabase();

        // Eski (avvalroq saqlangan) bazalarda hali mavjud bo'lmagan yangi suvenir turlari uchun
        // namuna modellarni to'ldirib qo'yish (masalan keyinroq qo'shilgan Fleshka, Statuetka va h.k.)
        let missingSouvenirKeys = souvenirKeys.filter(key => !pensDatabase[key] || pensDatabase[key].length === 0);
        if (missingSouvenirKeys.length > 0) {
            let defaultDb = getDefaultPensDatabase();
            missingSouvenirKeys.forEach(key => {
                pensDatabase[key] = defaultDb[key] || [];
            });
            localStorage.setItem('erp_pens_db_v3', JSON.stringify(pensDatabase));
        }

        // Eski modellarni miqdor oraliqlari jadvaliga ko'chiramiz (bir martalik)
        migrateLegacySouvenirPrices();

        let savedPrices = localStorage.getItem('erp_default_prices');
        if (savedPrices) {
            defaultPrices = { ...defaultPrices, ...JSON.parse(savedPrices) };
        }

        // Textile bazasi: material va pechat o'lchamlari.
        // defaultPrices yuklangandan KEYIN turishi shart — namuna narxlar shundan olinadi.
        let savedTextile = localStorage.getItem('erp_textile_db');
        textileDatabase = savedTextile ? JSON.parse(savedTextile) : {};
        let txChanged = false;
        let defTx = null;
        textileKeys.forEach(k => {
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
        if (txChanged) localStorage.setItem('erp_textile_db', JSON.stringify(textileDatabase));

        let savedReklamaExtra = localStorage.getItem('erp_reklama_extra_prices');
        if (savedReklamaExtra) {
            reklamaExtraPrices = { ...reklamaExtraPrices, ...JSON.parse(savedReklamaExtra) };
        }

        let savedDigitalPapers = localStorage.getItem('erp_digital_papers_db');
        if (savedDigitalPapers) {
            digitalPapersDatabase = JSON.parse(savedDigitalPapers);
        }
        if (digitalPapersDatabase.length > 0) {
            currentPaper = digitalPapersDatabase[0];
        }

        let savedOfsetRawPapers = localStorage.getItem('erp_ofset_raw_papers');
        if (savedOfsetRawPapers) {
            ofsetRawPapers = JSON.parse(savedOfsetRawPapers);
        }

        let savedOfsetMachineSettings = localStorage.getItem('erp_ofset_machine_settings');
        if (savedOfsetMachineSettings) {
            ofsetMachineSettings = { ...ofsetMachineSettings, ...JSON.parse(savedOfsetMachineSettings) };
        }

        let savedPoligrafiyaSizeLabels = localStorage.getItem('erp_poligrafiya_size_labels');
        if (savedPoligrafiyaSizeLabels) {
            poligrafiyaSizeLabels = { ...poligrafiyaSizeLabels, ...JSON.parse(savedPoligrafiyaSizeLabels) };
        }

        let savedPoligrafiyaGsm = localStorage.getItem('erp_poligrafiya_gsm_db');
        if (savedPoligrafiyaGsm) {
            poligrafiyaGsmDatabase = { ...poligrafiyaGsmDatabase, ...JSON.parse(savedPoligrafiyaGsm) };
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

        try {
            let savedUsers = localStorage.getItem('erp_users_db');
            usersDb = savedUsers ? JSON.parse(savedUsers) : getDefaultUsersDb();
            if (!Array.isArray(usersDb) || usersDb.length === 0) usersDb = getDefaultUsersDb();
        } catch (e) { usersDb = getDefaultUsersDb(); }

        try {
            let savedAudit = localStorage.getItem('erp_audit_log');
            auditLog = savedAudit ? JSON.parse(savedAudit) : [];
        } catch (e) { auditLog = []; }

        try {
            let savedArchive = localStorage.getItem('erp_quote_archive');
            quoteArchive = savedArchive ? JSON.parse(savedArchive) : [];
        } catch (e) { quoteArchive = []; }

        try {
            let savedPolAdv = localStorage.getItem('erp_poligrafiya_advanced_config');
            if (savedPolAdv) poligrafiyaAdvancedConfig = { ...poligrafiyaAdvancedConfig, ...JSON.parse(savedPolAdv) };
        } catch (e) {}

        renderAdminCategoryGrid();
    }

    function showToast(text) {
        let t = document.getElementById("toast");
        t.innerText = text;
        t.className = "show";
        setTimeout(() => { t.className = t.className.replace("show", ""); }, 3000);
    }

    function showScreen(screenId) {
        document.querySelectorAll('.screen, #selectionScreen').forEach(el => el.style.display = 'none');
        document.getElementById(screenId).style.display = 'block';
    }

    // ====================== FOYDALANUVCHILAR VA ROLLAR ======================
    function getDefaultUsersDb() {
        return [
            { id: 'u_admin', name: 'Administrator', pin: '1234', role: 'admin' }
        ];
    }

    function requireLogin(allowedRoles, onSuccess) {
        // Agar shu sessiyada allaqachon mos rol bilan kirilgan bo'lsa, qayta so'ramaymiz
        if (currentUser && allowedRoles.includes(currentUser.role)) {
            onSuccess(currentUser);
            return;
        }
        let pin = prompt("Kirish PIN kodini kiriting:", "");
        if (pin === null) return;
        let user = usersDb.find(u => u.pin === pin);
        if (!user) {
            showToast("⚠️ Noto'g'ri PIN kod!");
            return;
        }
        if (!allowedRoles.includes(user.role)) {
            showToast("⚠️ Sizda bu bo'limga kirish huquqi yo'q!");
            return;
        }
        currentUser = user;
        updateCurrentUserBadge();
        onSuccess(user);
    }

    function logoutUser() {
        currentUser = null;
        updateCurrentUserBadge();
        showToast("Tizimdan chiqildi.");
        showScreen('selectionScreen');
    }

    function updateCurrentUserBadge() {
        let el = document.getElementById('currentUserBadge');
        if (!el) return;
        if (currentUser) {
            el.style.display = 'inline-flex';
            el.innerText = `👤 ${currentUser.name} (${currentUser.role === 'admin' ? 'Admin' : 'Menejer'}) ✕`;
        } else {
            el.style.display = 'none';
        }
    }

    function renderUsersTable() {
        let tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        tbody.innerHTML = usersDb.map((u, idx) => `
            <tr>
                <td><input type="text" class="usr-name" value="${u.name}" style="width:100%;"></td>
                <td><input type="text" class="usr-pin" value="${u.pin}" style="width:100%;" maxlength="12"></td>
                <td>
                    <select class="usr-role" style="width:100%; height:36px; border-radius:6px; border:1.5px solid var(--border); padding:0 8px;">
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="menejer" ${u.role === 'menejer' ? 'selected' : ''}>Menejer</option>
                    </select>
                </td>
                <td style="text-align:right;"><button class="btn btn-danger" onclick="deleteUser(${idx})">🗑️</button></td>
            </tr>
        `).join('');
    }

    function addUserRow() {
        usersDb.push({ id: 'u_' + Date.now(), name: 'Yangi foydalanuvchi', pin: '0000', role: 'menejer' });
        renderUsersTable();
    }

    function deleteUser(idx) {
        if (usersDb.length <= 1) {
            showToast("⚠️ Kamida bitta foydalanuvchi qolishi kerak!");
            return;
        }
        if (!confirm("Foydalanuvchini o'chirmoqchimisiz?")) return;
        usersDb.splice(idx, 1);
        renderUsersTable();
    }

    function saveUsers() {
        let names = document.querySelectorAll('.usr-name');
        let pins = document.querySelectorAll('.usr-pin');
        let roles = document.querySelectorAll('.usr-role');
        let updated = [];
        names.forEach((el, i) => {
            updated.push({
                id: usersDb[i]?.id || ('u_' + Date.now() + i),
                name: (el.value || '').trim() || 'Foydalanuvchi',
                pin: (pins[i]?.value || '').trim() || '0000',
                role: roles[i]?.value || 'menejer'
            });
        });
        if (!updated.some(u => u.role === 'admin')) {
            showToast("⚠️ Kamida bitta admin bo'lishi kerak!");
            return;
        }
        usersDb = updated;
        localStorage.setItem('erp_users_db', JSON.stringify(usersDb));
        logAudit('Foydalanuvchilar yangilandi', `${usersDb.length} ta foydalanuvchi`);
        renderUsersTable();
        showToast("💾 Foydalanuvchilar saqlandi!");
    }

    // ====================== O'ZGARISHLAR TARIXI (AUDIT LOG) ======================
    function logAudit(action, details) {
        auditLog.unshift({
            id: 'a_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            timestamp: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Noma\'lum',
            action,
            details: details || ''
        });
        if (auditLog.length > 500) auditLog = auditLog.slice(0, 500);
        try { localStorage.setItem('erp_audit_log', JSON.stringify(auditLog)); } catch (e) {}
        renderAuditLogTable();
    }

    function renderAuditLogTable() {
        let tbody = document.getElementById('auditLogTableBody');
        if (!tbody) return;
        if (auditLog.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">Hozircha o'zgarish tarixi yo'q.</td></tr>`;
            return;
        }
        tbody.innerHTML = auditLog.slice(0, 200).map(a => `
            <tr>
                <td style="font-family:var(--font-mono); font-size:0.78rem; white-space:nowrap;">${new Date(a.timestamp).toLocaleString('uz-UZ')}</td>
                <td>${a.user}</td>
                <td>${a.action}</td>
                <td style="color:var(--text-muted); font-size:0.82rem;">${a.details}</td>
            </tr>
        `).join('');
    }

    // ====================== TIJORIY TAKLIF (SAVATCHA) ======================
    function loadQuoteCart() {
        try {
            let saved = localStorage.getItem('erp_quote_cart');
            quoteCart = saved ? JSON.parse(saved) : [];
        } catch (e) {
            quoteCart = [];
        }
        updateQuoteCartBadge();
    }

    function saveQuoteCart() {
        try { localStorage.setItem('erp_quote_cart', JSON.stringify(quoteCart)); } catch (e) {}
    }

    function updateQuoteCartBadge() {
        let badge = document.getElementById('quoteCartBadge');
        if (!badge) return;
        if (quoteCart.length > 0) {
            badge.style.display = 'inline-flex';
            badge.innerText = quoteCart.length;
        } else {
            badge.style.display = 'none';
        }
    }

    function getProductDisplayName(type) {
        for (let cat in allCategories) {
            let found = allCategories[cat].find(p => p.key === type);
            if (found) return { name: found.name, icon: found.icon };
        }
        return { name: (currentCalcResult && currentCalcResult.name) || type, icon: '📦' };
    }

    function handleQuoteButtonClick() {
        let calcEl = document.getElementById('calcScreen');
        let onCalcScreen = calcEl && calcEl.style.display !== 'none';
        if (onCalcScreen && currentCalcResult && currentCalcResult.totalPrice > 0) {
            addToQuoteCart();
        }
        openQuoteCart();
    }

    function addToQuoteCart() {
        if (!currentCalcResult || !currentCalcResult.totalPrice) {
            showToast("⚠️ Avval mahsulotni hisoblang!");
            return;
        }
        let info = getProductDisplayName(activeProductType);
        quoteCart.push({
            cartId: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            type: activeProductType,
            name: info.name,
            icon: info.icon,
            details: currentCalcResult.details,
            qty: currentCalcResult.qty,
            unitPrice: currentCalcResult.unitPrice,
            totalPrice: currentCalcResult.totalPrice
        });
        saveQuoteCart();
        updateQuoteCartBadge();
        renderQuoteCartItems();
        showToast("✅ Tijoriy taklifga qo'shildi: " + info.name);
    }

    function removeFromQuoteCart(cartId) {
        quoteCart = quoteCart.filter(item => item.cartId !== cartId);
        saveQuoteCart();
        updateQuoteCartBadge();
        renderQuoteCartItems();
    }

    function clearQuoteCart() {
        if (quoteCart.length === 0) return;
        if (!confirm("Savatchani butunlay tozalashni tasdiqlaysizmi?")) return;
        quoteCart = [];
        saveQuoteCart();
        updateQuoteCartBadge();
        renderQuoteCartItems();
    }

    function renderQuoteCartItems() {
        let container = document.getElementById('quoteCartItems');
        if (!container) return;

        if (quoteCart.length === 0) {
            container.innerHTML = `<div class="quote-cart-empty">Savatcha bo'sh.<br>Mahsulotni hisoblab, "🧾 Tijoriy taklif" tugmasini bosing.</div>`;
        } else {
            container.innerHTML = quoteCart.map(item => `
                <div class="quote-cart-item">
                    <div class="quote-cart-item-icon">${item.icon}</div>
                    <div class="quote-cart-item-info">
                        <div class="quote-cart-item-name">${item.name}</div>
                        <div class="quote-cart-item-details">${item.details}</div>
                        <div class="quote-cart-item-meta">${item.qty.toLocaleString()} dona × ${item.unitPrice.toLocaleString()} so'm</div>
                    </div>
                    <div class="quote-cart-item-total">${item.totalPrice.toLocaleString()} so'm</div>
                    <button class="quote-cart-item-remove" onclick="removeFromQuoteCart('${item.cartId}')">✕</button>
                </div>
            `).join('');
        }

        let grandTotal = quoteCart.reduce((sum, item) => sum + item.totalPrice, 0);
        let totalEl = document.getElementById('quoteCartGrandTotal');
        if (totalEl) totalEl.innerText = grandTotal.toLocaleString() + " so'm";

        let genBtn = document.getElementById('quoteGenerateBtn');
        if (genBtn) genBtn.disabled = quoteCart.length === 0;
    }

    function openQuoteCart() {
        renderQuoteCartItems();
        let panel = document.getElementById('quoteCartPanel');
        let overlay = document.getElementById('quoteCartOverlay');
        if (panel) panel.classList.add('open');
        if (overlay) overlay.classList.add('open');
    }

    function closeQuoteCart() {
        let panel = document.getElementById('quoteCartPanel');
        let overlay = document.getElementById('quoteCartOverlay');
        if (panel) panel.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    }

    function generateQuoteOffer() {
        if (quoteCart.length === 0) {
            showToast("⚠️ Savatcha bo'sh!");
            return;
        }

        let grandTotal = quoteCart.reduce((sum, item) => sum + item.totalPrice, 0);
        let todayStr = new Date().toLocaleDateString('uz-UZ');

        let rowsHtml = quoteCart.map((item, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${item.icon} ${item.name}<div class="quote-offer-details">${item.details}</div></td>
                <td>${item.qty.toLocaleString()} dona</td>
                <td>${item.unitPrice.toLocaleString()} so'm</td>
                <td>${item.totalPrice.toLocaleString()} so'm</td>
            </tr>
        `).join('');

        document.getElementById('quoteOfferContent').innerHTML = `
            <div class="quote-offer-doc">
                <div class="quote-offer-header">
                    <div>
                        <div class="quote-offer-brand">Poligrafiya & Suvenir ERP</div>
                        <div class="quote-offer-sub">Tijoriy taklif</div>
                    </div>
                    <div class="quote-offer-date">${todayStr}</div>
                </div>
                <div class="quote-offer-client">
                    <label>Mijoz nomi:</label>
                    <input type="text" id="quoteClientName" placeholder="Kompaniya yoki mijoz nomini kiriting (ixtiyoriy)" oninput="updateActiveQuoteClientName(this.value)">
                </div>
                <table class="quote-offer-table">
                    <thead>
                        <tr><th>#</th><th>Mahsulot</th><th>Miqdor</th><th>Birlik narxi</th><th>Summa</th></tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                    <tfoot>
                        <tr class="quote-offer-grand-total-row">
                            <td colspan="4">Umumiy summa:</td>
                            <td>${grandTotal.toLocaleString()} so'm</td>
                        </tr>
                    </tfoot>
                </table>
                <div class="quote-offer-footer">
                    Taklif amal qilish muddati: 7 kun. Narxlar bahoga qarab o'zgarishi mumkin.
                </div>
            </div>
        `;

        showScreen('quoteScreen');
        closeQuoteCart();
    }

    function openAdminModal() {
        requireLogin(['admin'], () => {
            closeProductManager();
            showScreen('adminScreen');
        });
    }

    function openReportsScreen() {
        requireLogin(['admin', 'menejer'], () => {
            showScreen('reportsScreen');
            renderReportsScreen();
        });
    }

    function renderAdminCategoryGrid() {
        let container = document.getElementById('adminCategoryGridContainer');
        
        const renderSection = (title, items) => `
            <div class="section-title">${title}</div>
            <div class="product-grid">
                ${items.map(item => `
                    <div class="product-card" onclick="openProductManager('${item.key}', '${item.name}')">
                        <div class="icon">${item.icon}</div>
                        <h3>${item.name}</h3>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = `
            ${renderSection('1. POLIGRAFIYA MAHSULOTLARI BAZASI', allCategories.poligrafiya)}
            ${renderSection('2. TEXTILE MAHSULOTLARI BAZASI', allCategories.textile)}
            ${renderSection('3. SUVENIR MAHSULOTLARI BAZASI', allCategories.souvenir)}
            ${renderSection('4. REKLAMA MAHSULOTLARI BAZASI', allCategories.reklama)}
            ${renderSection('5. OFSET PECHAT BAZASI', allCategories.ofset)}
            ${renderSection('6. SIFRAVOY PECHAT BAZASI', allCategories.sifravoy)}
        `;
    }

    function openProductManager(key, name) {
        currentManagingProduct = key;
        document.getElementById('adminCategorySelection').style.display = 'none';
        document.getElementById('adminSpecificProductManager').style.display = 'block';
        document.getElementById('currentManagingTitle').innerText = `${name} — Bazasini Boshqarish`;

        let isDigital = (key === 'sifravoy_pechat');
        let isOfset = (key === 'ofset_pechat');
        let isBloknot = (key === 'bloknot');
        let isPoligrafiya = poligrafiyaKeys.includes(key) && !isBloknot;
        let isTextile = textileKeys.includes(key);

        document.getElementById('ofsetAdminPanelBox').style.display = isOfset ? 'block' : 'none';
        document.getElementById('digitalAdminPanelBox').style.display = isDigital ? 'block' : 'none';
        document.getElementById('poligrafiyaSizeAdminBox').style.display = isPoligrafiya ? 'block' : 'none';
        document.getElementById('bloknotAdminBox').style.display = isBloknot ? 'block' : 'none';
        document.getElementById('adminTextileBox').style.display = isTextile ? 'block' : 'none';

        let maxsusBolim = isDigital || isOfset || isPoligrafiya || isBloknot || isTextile;
        document.getElementById('adminModelAddForm').style.display = maxsusBolim ? 'none' : 'block';
        document.getElementById('adminModelTableCard').style.display = maxsusBolim ? 'none' : 'block';

        if (isTextile) {
            loadTextileEditState(key);
            return;
        }
        if (isOfset) {
            renderAdminOfsetPapersMatrix();
            loadOfsetMachineSettingsToUI();
            return;
        }
        if (isDigital) {
            renderAdminDigitalPaperTable();
            return;
        }
        if (isBloknot) {
            renderAdminBloknotTables();
            return;
        }
        if (isPoligrafiya) {
            renderAdminPoligrafiyaGsmTable();
            renderPoligrafiyaAdvancedConfigUI();
            return;
        }

        document.getElementById('tableListTitle').innerText = `📋 ${name} Bazasidagi Modellar Ro'yxati`;

        let isSouvenir = souvenirKeys.includes(key);
        document.getElementById('souvenirFieldsRow').style.display = isSouvenir ? 'grid' : 'none';
        document.getElementById('colorsBox').style.display = isSouvenir ? 'block' : 'none';
        document.getElementById('lentaBox').style.display = (key === 'beyjik') ? 'block' : 'none';
        document.getElementById('detailsBox').style.display = (key === 'naborlar') ? 'block' : 'none';
        // Suvenirlarda mahsulot narxi ham, chop narxlari ham faqat miqdor oraliqlari jadvalidan olinadi —
        // shuning uchun bitta qat'iy narx maydonlari umuman ko'rsatilmaydi.
        document.getElementById('printPricesBox').style.display = isSouvenir ? 'none' : 'block';
        document.getElementById('basePriceGroup').style.display = isSouvenir ? 'none' : 'flex';

        let isNaborType = (key === 'naborlar');
        let printScheme = printTypeSchemes[key] || null;

        // Sxemada aynan qaysi kalitlar borligiga qarab ko'rsatamiz.
        // Masalan kardxolder sxemasida gravirovka yo'q — u umuman chiqmaydi.
        let showUv    = !printScheme || !!printScheme.uv;
        let showDtf   = isNaborType || (printScheme && !!printScheme.dtf);
        let showGrav  = isNaborType || (printScheme && !!printScheme.gravirovka);
        let showSifra = !isNaborType && !printScheme;

        document.getElementById('uvCheckLabel').style.display         = showUv    ? 'flex' : 'none';
        document.getElementById('sifravoyCheckLabel').style.display   = showSifra ? 'flex' : 'none';
        document.getElementById('dtfCheckLabel').style.display        = showDtf   ? 'flex' : 'none';
        document.getElementById('gravirovkaCheckLabel').style.display = showGrav  ? 'flex' : 'none';
        document.getElementById('dtfCheckLabelText').innerText = (printScheme && printScheme.dtf) || 'UF DTF';
        document.getElementById('gravirovkaCheckLabelText').innerText = (printScheme && printScheme.gravirovka) || 'Gravirovka';

        document.getElementById('uvPriceGroup').style.display         = showUv    ? 'flex' : 'none';
        document.getElementById('sifravoyPriceGroup').style.display   = showSifra ? 'flex' : 'none';
        document.getElementById('dtfPriceGroup').style.display        = showDtf   ? 'flex' : 'none';
        document.getElementById('gravirovkaPriceGroup').style.display = showGrav  ? 'flex' : 'none';
        document.getElementById('dtfPriceLabelText').innerText = (printScheme && printScheme.dtf) || 'UF DTF';
        document.getElementById('gravirovkaPriceLabelText').innerText = (printScheme && printScheme.gravirovka) || 'Gravirovka';

        let hasSizes = hasSizesTypes.includes(key);
        document.getElementById('sizePricesBox').style.display = hasSizes ? 'block' : 'none';

        // Miqdor oraliqlari jadvali: faqat suvenir turlarida.
        // Naborlarda chop narxi tarkibdagi detallardan olinadi, shuning uchun u yerda faqat mahsulot narxi ustuni chiqadi.
        currentPrintColumns = {
            uv: isNaborType ? false : showUv,
            sifravoy: isNaborType ? false : showSifra,
            dtf: isNaborType ? false : showDtf,
            gravirovka: isNaborType ? false : showGrav,
            labels: {
                uv: 'UF Pechat',
                sifravoy: 'Sifravoy',
                dtf: (printScheme && printScheme.dtf) || 'UF DTF',
                gravirovka: (printScheme && printScheme.gravirovka) || 'Gravirovka'
            }
        };
        document.getElementById('tiersBox').style.display = isSouvenir ? 'block' : 'none';

        cancelPenEdit();
        renderAdminPensTable();
    }

    function closeProductManager() {
        document.getElementById('adminCategorySelection').style.display = 'block';
        document.getElementById('adminSpecificProductManager').style.display = 'none';
    }

    function editBasePrice() {
        let oldPrice = defaultPrices[currentManagingProduct] || 0;
        let newPrice = prompt("Yangi tan narxini (baza narxini) kiriting (so'mda):", oldPrice);
        if (newPrice !== null && !isNaN(parseFloat(newPrice))) {
            defaultPrices[currentManagingProduct] = parseFloat(newPrice);
            localStorage.setItem('erp_default_prices', JSON.stringify(defaultPrices));
            if (typeof logAudit === 'function') logAudit("Baza narxi o'zgartirildi", `${currentManagingProduct}: ${oldPrice.toLocaleString()} → ${parseFloat(newPrice).toLocaleString()} so'm`);
            renderAdminPensTable();
            showToast("✅ Baza narxi yangilandi!");
        }
    }

    function filterProducts() {
        let input = document.getElementById('searchInput').value.toLowerCase();
        let cards = document.getElementsByClassName('product-card');
        for (let card of cards) {
            let title = card.innerText.toLowerCase();
            card.style.display = title.includes(input) ? "flex" : "none";
        }
    }

    function openCalc(type, name) {
        activeProductType = type;
        document.getElementById('currentProductName').innerText = type === 'sifravoy_pechat' ? 'Raqamli Pechat Kalkulyatori' : (type === 'ofset_pechat' ? 'Ofset Pechat Kalkulyatori' : (name + " — Hisoblash Moduli"));
        generateForm(type);
        showScreen('calcScreen');
        calculate();
    }

    async function copyResult() {
        let text = `${currentCalcResult.name}\n\n`;
        text += `ℹ️ Tafsilot: ${currentCalcResult.details}\n`;
        text += `🔹 Miqdori: ${currentCalcResult.qty} dona\n`;
        text += `🔹 Birlik narxi: ${currentCalcResult.unitPrice.toLocaleString()} so'm\n`;
        text += `💰 Jami Summa: ${currentCalcResult.totalPrice.toLocaleString()} so'm`;

        if (currentCalcResult.imageUrl && currentCalcResult.imageUrl.startsWith('data:image')) {
            try {
                let response = await fetch(currentCalcResult.imageUrl);
                let blob = await response.blob();
                
                if (navigator.clipboard && window.ClipboardItem) {
                    let data = [new ClipboardItem({ 
                        [blob.type]: blob,
                        "text/plain": new Blob([text], { type: "text/plain" })
                    })];
                    await navigator.clipboard.write(data);
                    showToast("📋 Rasm va matn nusxalandi! Telegramga paste (Ctrl+V) qiling.");
                    return;
                }
            } catch (e) {
                console.log("Clipboard rasm xatosi:", e);
            }
        }

        navigator.clipboard.writeText(text);
        showToast("📋 Matn nusxalandi!");
    }


function generateForm(type) {
    const form = document.getElementById('dynamicForm');
    const rightCol = document.getElementById('rightPanelColumn');
    let html = '';

    if (souvenirKeys.includes(type)) {
        generateForm_suvenir(type, form, rightCol);
        return;
    }

    if (type === 'ofset_pechat') {
        generateForm_ofset(type, form, rightCol);
        return;
    }

    if (type === 'sifravoy_pechat') {
        generateForm_raqamli(type, form, rightCol);
        return;
    } else {
        let tableContainerId = document.getElementById('digitalTableContainer');
        if (tableContainerId) tableContainerId.style.display = 'none';
        let ofsetContainerId = document.getElementById('ofsetTableContainer');
        if (ofsetContainerId) ofsetContainerId.style.display = 'none';
        document.querySelector('.calc-grid').style.gridTemplateColumns = "1.3fr 0.7fr";
    }

        rightCol.className = "right-panel-col";
        rightCol.style.display = "flex";
        rightCol.innerHTML = `
            <div class="margin-card">
                <div class="form-group">
                    <label>Ishxona Marjasi (%):</label>
                    <input type="number" id="inpMargin" value="65" min="0" step="1" oninput="calculate()">
                </div>
            </div>
            <div class="result-box">
                <div>
                    <h3 style="margin-bottom: 12px; color: var(--text-main); font-size: 1rem;">Hisob-kitob Natijasi</h3>
                    <div class="result-item"><span>Tafsilot:</span> <strong id="resDetails" style="text-align: right; max-width: 60%;">-</strong></div>
                    <div class="result-item"><span>Miqdor / Hajm:</span> <strong id="resQuantity">0 dona</strong></div>
                    <div class="result-item"><span>Birlik narxi:</span> <strong id="resUnitPrice">0 so'm</strong></div>
                    <div class="result-item result-total"><span>Jami summa:</span> <span id="resTotalPrice">0 so'm</span></div>
                </div>
                <div id="priceSuggestionBox" style="display:none;"></div>
                <div id="tierPreviewBox" style="display:none; margin-top:16px;"></div>
                <div style="margin-top: 20px;">
                    <button class="btn" style="width: 100%;" onclick="copyResult()">📋 Natijani nusxalash</button>
                </div>
            </div>
        `;

    if (textileKeys.includes(type)) {
        html = generateFormHtml_textile(type);
    }
    else if (reklamaBanTypes.includes(type)) {
        html = generateFormHtml_reklama(type);
    }
    else if (type === 'bloknot') {
        html = buildBloknotForm();
    }
    else {
        html = generateFormHtml_poligrafiya(type);
    }

    form.innerHTML = html;

    if (textileKeys.includes(type)) {
        renderTextilePickers(type);
    }

    if (type === 'bloknot') {
        renderBloknotOptions();
        return;
    }

    let gsmListForRender = poligrafiyaGsmDatabase[type] || [];
    if (gsmListForRender.length > 0 && document.getElementById('poligrafiyaGsmGroup')) {
        renderPoligrafiyaGsmOptions(gsmListForRender);
    }
}

function calculate() {
    let qty = parseInt(document.getElementById('inpQuantity')?.value) || 1;
    let baseCost = defaultPrices[activeProductType] || 1000;
    let baseUnitPrice = 0;
    let details = activeProductType.toUpperCase();
    let previewImgUrl = '';
    let previewNameText = activeProductType.toUpperCase();

    if (activeProductType === 'ofset_pechat') {
        calculate_ofset();
        return;
    }

    if (activeProductType === 'sifravoy_pechat') {
        calculate_raqamli();
        return;
    }

    let previewBox = document.getElementById('previewCardBox');
    let marginPercent = parseFloat(document.getElementById('inpMargin')?.value) || 65;

    if (souvenirKeys.includes(activeProductType)) {
        let r = calculateResult_suvenir(qty, baseCost, marginPercent, previewBox);
        details = r.details; baseUnitPrice = r.baseUnitPrice;
        previewImgUrl = r.previewImgUrl; previewNameText = r.previewNameText;
    }
    else {
        if(previewBox) previewBox.style.display = 'none';
        renderTierPreview(null, qty, marginPercent);
        if (reklamaBanTypes.includes(activeProductType)) {
            let r = calculateResult_reklama(activeProductType, qty, baseCost);
            details = r.details; baseUnitPrice = r.baseUnitPrice;
        }
        else if (textileKeys.includes(activeProductType)) {
            let r = calculateResult_textile(activeProductType, qty, marginPercent);
            details = r.details; baseUnitPrice = r.baseUnitPrice;
        }
        else if (activeProductType === 'bloknot') {
            let res = calculateBloknot(qty);
            baseUnitPrice = res.unitPrice;
            details = res.details;
        }
        else {
            let r = calculateResult_poligrafiya(activeProductType, qty, baseCost);
            details = r.details; baseUnitPrice = r.baseUnitPrice;

            // Minimal buyurtma summasi — jami narx (marja qo'shilgandan keyin) shundan kam bo'lmasin
            let minAmt = poligrafiyaAdvancedConfig.minOrderAmount || 0;
            if (minAmt > 0 && qty > 0) {
                let taxminiyJami = Math.round(baseUnitPrice * (1 + marginPercent / 100)) * qty;
                if (taxminiyJami < minAmt) {
                    baseUnitPrice = (minAmt / qty) / (1 + marginPercent / 100);
                    details += ` | (minimal buyurtma qiymati: ${minAmt.toLocaleString()} so'm qo'llanildi)`;
                }
            }
        }
    }

    if (document.getElementById('previewProductImg')) {
        document.getElementById('previewProductImg').src = previewImgUrl;
        document.getElementById('previewProductName').innerText = previewNameText;
    }

    let unitPrice = Math.round(baseUnitPrice * (1 + marginPercent / 100));
    let totalPrice = unitPrice * qty;

    if (reklamaBanTypes.includes(activeProductType)) {
        let chkUstanovka = document.getElementById('chkUstanovka');
        if (chkUstanovka && chkUstanovka.checked) {
            totalPrice += Math.round((reklamaExtraPrices.ustanovka || 0) * (1 + marginPercent / 100));
        }
    }

    document.getElementById('resDetails').innerText = details;
    document.getElementById('resQuantity').innerText = qty.toLocaleString() + " dona";
    document.getElementById('resUnitPrice').innerText = unitPrice.toLocaleString() + " so'm";
    document.getElementById('resTotalPrice').innerText = totalPrice.toLocaleString() + " so'm";

    currentCalcResult = { details, qty, unitPrice, totalPrice, name: previewNameText, imageUrl: previewImgUrl };
    if (typeof renderPriceSuggestion === 'function') renderPriceSuggestion(activeProductType, unitPrice);
}

// ====================== STATISTIK NARX TAVSIYASI ======================
// Avvalgi tijoriy takliflar arxividagi shu mahsulot turi bo'yicha
// min/o'rtacha/maks birlik narxlarini ko'rsatadi — haqiqiy AI emas, oddiy statistika.
function renderPriceSuggestion(type, unitPrice) {
    let box = document.getElementById('priceSuggestionBox');
    if (!box) return;

    let history = (typeof quoteArchive !== 'undefined' ? quoteArchive : [])
        .flatMap(q => (q.items || []).filter(i => i.type === type))
        .map(i => i.unitPrice)
        .filter(p => typeof p === 'number' && p > 0);

    if (history.length < 2) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }

    let min = Math.min(...history);
    let max = Math.max(...history);
    let avg = Math.round(history.reduce((s, p) => s + p, 0) / history.length);

    let hint = '';
    if (unitPrice < min) hint = "⚠️ Joriy narx tarixiy minimaldan past.";
    else if (unitPrice > max) hint = "⚠️ Joriy narx tarixiy maksimaldan yuqori.";

    box.style.display = 'block';
    box.innerHTML = `
        <div class="price-suggestion-box">
            <div class="price-suggestion-title">📊 Tarixiy narx tavsiyasi (${history.length} ta oldingi buyurtma asosida)</div>
            <div class="price-suggestion-range">
                <span>Min: <strong>${min.toLocaleString()} so'm</strong></span>
                <span>O'rtacha: <strong>${avg.toLocaleString()} so'm</strong></span>
                <span>Maks: <strong>${max.toLocaleString()} so'm</strong></span>
            </div>
            ${hint ? `<div class="price-suggestion-hint">${hint}</div>` : ''}
        </div>
    `;
}

init();
