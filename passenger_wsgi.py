# Xisoblovchi — cPanel "Setup Python App" (Passenger) uchun minimal WSGI ilova.
#  1) Statik sayt: index.html, sw.js, manifest.webmanifest, umumiy/ va bolimlar/ fayllarini beradi;
#     .git, .htaccess, *.ps1, *.bat, CLAUDE.md va boshqa xizmat fayllari berilmaydi.
#  2) Rasmlar ombori (ixtiyoriy): admin rasmni brauzer xotirasi o'rniga serverda saqlaydi.
#       POST /api/rasm   — rasm yuklash (maxfiy kalit bilan), javob: {"url": "uploads/<nom>"}
#       GET  /api/holat  — kalit to'g'riligini tekshirish
#       GET  /uploads/<nom> — yuklangan rasmni berish
#     Maxfiy kalit serverdagi git'dan TASHQARIDA turgan fayldan o'qiladi (standart: ../.xisoblovchi_token,
#     ya'ni /home/mylogo/.xisoblovchi_token; XISOBLOVCHI_TOKEN_FAYL muhit o'zgaruvchisi bilan o'zgartiriladi).
#     Kalit fayli yo'q bo'lsa — yuklash butunlay o'chiq (503).
import hashlib
import hmac
import json
import mimetypes
import os
import re
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.abspath(__file__))
RUXSAT_PAPKALAR = ('umumiy', 'bolimlar')
RUXSAT_KENGAYTMALAR = {'.html', '.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico', '.json', '.webmanifest', '.woff', '.woff2', '.ttf'}
RUXSAT_ILDIZ_FAYLLAR = ('index.html', 'sw.js', 'manifest.webmanifest')  # papkasiz, to'g'ridan-to'g'ri beriladigan fayllar

YUKLAMALAR = os.path.join(ROOT, 'uploads')
TOKEN_FAYL = os.environ.get('XISOBLOVCHI_TOKEN_FAYL') or os.path.join(os.path.dirname(ROOT), '.xisoblovchi_token')
RASM_MAX_BAYT = 4 * 1024 * 1024
RASM_NOMI = re.compile(r'^[0-9a-f]{32}\.(webp|png|jpg|gif)$')


def _yol(path_info):
    nisbiy = unquote(path_info).lstrip('/') or 'index.html'
    toliq = os.path.realpath(os.path.join(ROOT, nisbiy))
    if os.path.commonpath([toliq, ROOT]) != ROOT:  # papkadan tashqariga chiqish ("..") taqiqlanadi
        return None
    nisbiy = os.path.relpath(toliq, ROOT).replace(os.sep, '/')
    if nisbiy not in RUXSAT_ILDIZ_FAYLLAR and nisbiy.split('/')[0] not in RUXSAT_PAPKALAR:
        return None
    if os.path.splitext(toliq)[1].lower() not in RUXSAT_KENGAYTMALAR:
        return None
    return toliq if os.path.isfile(toliq) else None


def _javob(start_response, kod, tana, tur='application/json; charset=utf-8', qoshimcha=None):
    if isinstance(tana, (dict, list)):
        tana = json.dumps(tana, ensure_ascii=False).encode('utf-8')
    elif isinstance(tana, str):
        tana = tana.encode('utf-8')
    sarlavhalar = [('Content-Type', tur), ('Content-Length', str(len(tana))), ('Cache-Control', 'no-store')]
    sarlavhalar += qoshimcha or []
    start_response(kod, sarlavhalar)
    return [tana]


def _server_tokeni():
    try:
        with open(TOKEN_FAYL, encoding='utf-8') as f:
            t = f.read().strip()
        return t if len(t) >= 16 else None  # juda qisqa kalit qabul qilinmaydi
    except OSError:
        return None


def _kalit_tekshir(environ):
    """None — kalit to'g'ri; aks holda (kod, xabar)."""
    server = _server_tokeni()
    if not server:
        return '503 Service Unavailable', 'Server kaliti sozlanmagan (.xisoblovchi_token fayli yo\'q yoki juda qisqa)'
    kelgan = environ.get('HTTP_X_TOKEN', '')
    if not hmac.compare_digest(kelgan.encode('utf-8'), server.encode('utf-8')):
        return '401 Unauthorized', "Kalit noto'g'ri"
    return None


def _rasm_turi(bayt):
    """Rasm turini birinchi baytlardan aniqlaydi (Content-Type'ga ishonilmaydi)."""
    if bayt[:8] == b'\x89PNG\r\n\x1a\n':
        return '.png'
    if bayt[:3] == b'\xff\xd8\xff':
        return '.jpg'
    if bayt[:4] == b'RIFF' and bayt[8:12] == b'WEBP':
        return '.webp'
    if bayt[:6] in (b'GIF87a', b'GIF89a'):
        return '.gif'
    return None


def _api(environ, start_response, yol):
    xato = _kalit_tekshir(environ)
    if xato:
        return _javob(start_response, xato[0], {'xato': xato[1]})
    metod = environ.get('REQUEST_METHOD')
    if yol == '/api/holat' and metod == 'GET':
        soni = len(os.listdir(YUKLAMALAR)) if os.path.isdir(YUKLAMALAR) else 0
        return _javob(start_response, '200 OK', {'ok': True, 'rasmlar': soni})
    if yol == '/api/rasm' and metod == 'POST':
        try:
            uzunlik = int(environ.get('CONTENT_LENGTH') or 0)
        except ValueError:
            uzunlik = 0
        if uzunlik <= 0 or uzunlik > RASM_MAX_BAYT:
            return _javob(start_response, '413 Payload Too Large', {'xato': f'Rasm hajmi 1 baytdan {RASM_MAX_BAYT // 1048576} MB gacha bo\'lishi kerak'})
        bayt = environ['wsgi.input'].read(uzunlik)
        kengaytma = _rasm_turi(bayt)
        if not kengaytma:
            return _javob(start_response, '415 Unsupported Media Type', {'xato': 'Faqat WebP, PNG, JPEG yoki GIF rasm qabul qilinadi'})
        nom = hashlib.sha256(bayt).hexdigest()[:32] + kengaytma  # bir xil rasm bir marta saqlanadi
        os.makedirs(YUKLAMALAR, exist_ok=True)
        fayl = os.path.join(YUKLAMALAR, nom)
        if not os.path.exists(fayl):
            with open(fayl, 'wb') as f:
                f.write(bayt)
        return _javob(start_response, '200 OK', {'url': 'uploads/' + nom})
    return _javob(start_response, '404 Not Found', {'xato': 'Topilmadi'})


def application(environ, start_response):
    yol = environ.get('PATH_INFO', '/')
    metod = environ.get('REQUEST_METHOD')

    if yol.startswith('/api/'):
        return _api(environ, start_response, yol)

    if metod not in ('GET', 'HEAD'):
        start_response('405 Method Not Allowed', [('Allow', 'GET, HEAD'), ('Content-Type', 'text/plain; charset=utf-8')])
        return [b'405']

    if yol.startswith('/uploads/'):
        nom = yol[len('/uploads/'):]
        fayl = os.path.join(YUKLAMALAR, nom)
        if not RASM_NOMI.match(nom) or not os.path.isfile(fayl):
            start_response('404 Not Found', [('Content-Type', 'text/plain; charset=utf-8')])
            return [b'404 Topilmadi']
        with open(fayl, 'rb') as f:
            data = f.read()
        tur = mimetypes.guess_type(fayl)[0] or 'application/octet-stream'
        start_response('200 OK', [('Content-Type', tur), ('Content-Length', str(len(data))), ('Cache-Control', 'public, max-age=31536000, immutable')])
        return [] if metod == 'HEAD' else [data]

    fayl = _yol(yol)
    if not fayl:
        start_response('404 Not Found', [('Content-Type', 'text/plain; charset=utf-8')])
        return [b'404 Topilmadi']
    tur = mimetypes.guess_type(fayl)[0] or 'application/octet-stream'
    if tur.startswith('text/') or tur in ('application/javascript', 'application/json'):
        tur += '; charset=utf-8'
    with open(fayl, 'rb') as f:
        data = f.read()
    # HTML — har safar yangi (versiyalangan JS/CSS havolalari ?v=... bilan keshlanadi)
    kesh = 'no-cache' if fayl.endswith('.html') else 'public, max-age=3600'
    start_response('200 OK', [('Content-Type', tur), ('Content-Length', str(len(data))), ('Cache-Control', kesh)])
    return [] if metod == 'HEAD' else [data]
