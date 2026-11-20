"""Genera index.html (sitio estático) a partir de Main.dc.html.

Uso:  python tools/build.py            -> index.html para la web (GitHub Pages)
      python tools/build.py --artifact -> fragmento para Claude Artifacts
"""
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
artifact = '--artifact' in sys.argv

src = (root / 'Main.dc.html').read_text(encoding='utf-8')
runtime = (root / 'tools' / 'runtime.js').read_text(encoding='utf-8')

helmet = re.search(r'<helmet>(.*?)</helmet>', src, re.S).group(1)
helmet = re.sub(r'<meta name="viewport"[^>]*>\n?', '', helmet)
body = re.search(r'</helmet>(.*?)</x-dc>', src, re.S).group(1)
comp = re.search(r'data-dc-script[^>]*>(.*?)</script>', src, re.S).group(1)

extra = """
/* zona segura del teléfono */
.th-header{top:env(safe-area-inset-top, 0px)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top, 0px);z-index:31;background:#F5F7FB}
"""
helmet = helmet.replace('</style>', extra + '</style>')

app = ('<div id="app"></div>\n'
       '<template id="tpl">' + body + '</template>\n'
       '<script>\n' + runtime + '\n</script>\n'
       '<script>\n' + comp.strip() + '\nwindow.__dcBoot(Component);\n</script>\n')

if artifact:
    out = '<title>Tiny House</title>\n' + helmet.strip() + '\n' + app
    dest = root / 'tiny-house.artifact.html'
else:
    out = ('<!doctype html>\n<html lang="es">\n<head>\n'
           '<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
           '<title>Tiny House · Casas modulares</title>\n'
           '<meta name="description" content="Configura tu casa modular Tiny House: elige medidas, distribución y terminaciones.">\n'
           '<link rel="icon" type="image/png" href="logo.png">\n'
           + helmet.strip() + '\n</head>\n<body>\n' + app + '</body>\n</html>\n')
    dest = root / 'index.html'

dest.write_text(out, encoding='utf-8')
print(dest.name, len(out.encode('utf-8')), 'bytes')
