# Xisoblovchi — statik sayt. cPanel "Setup Python App" (Passenger) uchun minimal WSGI ilova.
# Faqat index.html, umumiy/ va bolimlar/ papkalaridagi sayt fayllarini beradi;
# .git, .htaccess, *.ps1, *.bat, CLAUDE.md va boshqa xizmat fayllari berilmaydi.
import mimetypes
import os
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.abspath(__file__))
RUXSAT_PAPKALAR = ('umumiy', 'bolimlar')
RUXSAT_KENGAYTMALAR = {'.html', '.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico', '.json', '.woff', '.woff2', '.ttf'}


def _yol(path_info):
    nisbiy = unquote(path_info).lstrip('/') or 'index.html'
    toliq = os.path.realpath(os.path.join(ROOT, nisbiy))
    if os.path.commonpath([toliq, ROOT]) != ROOT:  # papkadan tashqariga chiqish ("..") taqiqlanadi
        return None
    nisbiy = os.path.relpath(toliq, ROOT).replace(os.sep, '/')
    if nisbiy != 'index.html' and nisbiy.split('/')[0] not in RUXSAT_PAPKALAR:
        return None
    if os.path.splitext(toliq)[1].lower() not in RUXSAT_KENGAYTMALAR:
        return None
    return toliq if os.path.isfile(toliq) else None


def application(environ, start_response):
    if environ.get('REQUEST_METHOD') not in ('GET', 'HEAD'):
        start_response('405 Method Not Allowed', [('Allow', 'GET, HEAD'), ('Content-Type', 'text/plain; charset=utf-8')])
        return [b'405']
    fayl = _yol(environ.get('PATH_INFO', '/'))
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
    return [] if environ['REQUEST_METHOD'] == 'HEAD' else [data]
