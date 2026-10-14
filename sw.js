// Service worker: ilova internet uzilganda ham ochiladi. Ma'lumotlar (narxlar, buyurtmalar) brauzer
// localStorage'ida turadi, shuning uchun kod fayllarini keshlash kifoya.
//
// Strategiya:
//  - sahifa (index.html) — avval tarmoq, tarmoq yo'q bo'lsa keshdagi nusxa (yangi versiya doim ustun);
//  - JS/CSS — fayl mazmunidan versiya (?v=...) qo'shilgani uchun kesh-birinchi (URL o'zgarsa yangisi yuklanadi);
//  - rasm va shriftlar — keshdan darhol, orqada yangilanadi (stale-while-revalidate).
// Yangi versiya chiqarishda KESH_NOMI ni o'zgartirish shart emas: sahifa tarmoqdan yangilanadi, eski keshlar esa
// quyida kesh nomi o'zgarganda tozalanadi.
const KESH_NOMI = 'myprint-erp-v1';
const OLDINDAN = ['./', 'manifest.webmanifest', 'umumiy/logo.png', 'umumiy/icons/icon-192.png', 'umumiy/icons/icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(KESH_NOMI).then(c => c.addAll(OLDINDAN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(nomlar => Promise.all(nomlar.filter(n => n !== KESH_NOMI).map(n => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

async function tarmoqBirinchi(req) {
    const kesh = await caches.open(KESH_NOMI);
    try {
        const javob = await fetch(req);
        if (javob && javob.ok) kesh.put(req, javob.clone());
        return javob;
    } catch (e) {
        const eski = await kesh.match(req) || (req.mode === 'navigate' ? await kesh.match('./') : null);
        if (eski) return eski;
        throw e;
    }
}

async function keshBirinchi(req) {
    const kesh = await caches.open(KESH_NOMI);
    const bor = await kesh.match(req);
    if (bor) return bor;
    const javob = await fetch(req);
    if (javob && (javob.ok || javob.type === 'opaque')) kesh.put(req, javob.clone());
    return javob;
}

async function eskiBirinchiYangilab(req) {
    const kesh = await caches.open(KESH_NOMI);
    const bor = await kesh.match(req);
    const yangilash = fetch(req).then(j => { if (j && (j.ok || j.type === 'opaque')) kesh.put(req, j.clone()); return j; }).catch(() => null);
    return bor || (await yangilash) || Response.error();
}

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    const shrift = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
    if (url.origin !== location.origin && !shrift) return;

    if (shrift) { e.respondWith(eskiBirinchiYangilab(req)); return; }
    if (url.pathname.startsWith('/testlar/')) return; // sinov sahifalari keshlanmaydi

    if (req.mode === 'navigate' || /\.html?$/.test(url.pathname) || url.pathname.endsWith('/')) {
        e.respondWith(tarmoqBirinchi(req));
    } else if (/\.(js|css)$/.test(url.pathname) && url.searchParams.has('v')) {
        e.respondWith(keshBirinchi(req));
    } else if (/\.(png|jpe?g|webp|svg|ico|woff2?|webmanifest)$/.test(url.pathname)) {
        e.respondWith(eskiBirinchiYangilab(req));
    } else {
        e.respondWith(tarmoqBirinchi(req));
    }
});
