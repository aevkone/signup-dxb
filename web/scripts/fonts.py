"""
Шрифты сайта в public/fonts. Запуск из папки web: python3 scripts/fonts.py
Нужен fontTools: pip3 install --user fonttools brotli

1. Montserrat Variable (normal) — копии файлов @fontsource-variable/montserrat
   с постоянными именами: их можно указать в <link rel="preload"> и кешировать
   навсегда (public/_headers). @font-face — в src/layouts/Base.astro.
2. Caveat 600 — только буквы слов, которые на сайте пишутся от руки
   (CAVEAT_TEXT ниже), с контекстными вариантами букв (calt). Поменялось
   рукописное слово — допишите буквы и перезапустите.
3. Печатает size-adjust для запасного Arial под ширину Montserrat — значения
   стоят в Base.astro (@font-face 'Montserrat'). Нужен macOS с Arial.

Имена файлов в /fonts/ кешируются навсегда: заменили содержимое шрифта
Montserrat — меняйте и имя файла (и ссылки в Base.astro).
"""
import shutil
from pathlib import Path

from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'fonts'
MONT = ROOT / 'node_modules' / '@fontsource-variable' / 'montserrat' / 'files'
CAV = ROOT / 'node_modules' / '@fontsource' / 'caveat' / 'files'

# Всё, что рисуется Caveat: «под ключ» / «Turnkey» в заголовке главной,
# «работаем» / «work» в «Как мы работаем», «под ключ» / «turnkey» на текстурах
# 3D-стенда, «signup» на неоновой вывеске запасного варианта первого экрана.
# Обе регистра букв, пробел и простая пунктуация.
WORDS = 'под ключ turnkey работаем work signup'
CAVEAT_TEXT = ''.join(sorted(set(WORDS.lower() + WORDS.upper()))) + ' .,!?-–—’\'"«»:;()'

MONT_SUBSETS = ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext']


def montserrat():
    for s in MONT_SUBSETS:
        name = f'montserrat-{s}-wght-normal.woff2'
        shutil.copyfile(MONT / name, OUT / name)
        print(f'{name}: {(OUT / name).stat().st_size} Б')


def caveat():
    tmp = []
    for script in ('latin', 'cyrillic'):
        src = CAV / f'caveat-{script}-600-normal.woff2'
        dst = OUT / f'.caveat-{script}.ttf'
        subset.main([
            str(src),
            f'--text={CAVEAT_TEXT}',
            '--layout-features=calt,liga,kern,mark,mkmk',
            '--flavor=',
            f'--output-file={dst}',
        ])
        tmp.append(str(dst))
    merged = Merger().merge(tmp)
    merged.flavor = 'woff2'
    out = OUT / 'caveat-600-subset.woff2'
    merged.save(out)
    for t in tmp:
        Path(t).unlink()
    print(f'caveat-600-subset.woff2: {out.stat().st_size} Б, глифов {len(TTFont(out).getGlyphOrder())}')


def fallback():
    """Отношение ширины текста Montserrat к Arial → size-adjust запасного шрифта."""
    from fontTools.varLib.instancer import instantiateVariableFont

    ru = 'Организуем участие в выставках в Дубае под ключ. От контракта с организатором до демонтажа после выставки.'
    en = 'Turnkey exhibitions in Dubai. From the organiser contract to breakdown after the show, one team.'
    arial = {
        400: TTFont('/System/Library/Fonts/Supplemental/Arial.ttf'),
        800: TTFont('/System/Library/Fonts/Supplemental/Arial Bold.ttf'),
    }

    def width(fonts, text):
        total = 0.0
        for ch in text:
            for f in fonts:
                g = f.getBestCmap().get(ord(ch))
                if g:
                    total += f['hmtx'][g][0] / f['head'].unitsPerEm
                    break
        return total

    for w, a in arial.items():
        m = [instantiateVariableFont(TTFont(MONT / f'montserrat-{s}-wght-normal.woff2'), {'wght': w}) for s in ('latin', 'cyrillic')]
        r = [width(m, t) / width([a], t) for t in (ru, en)]
        adj = sum(r) / len(r)
        # Montserrat: typo ascender 968, descender 251, lineGap 0 при 1000 единиц на кегль.
        print(f'wght {w}: size-adjust {adj * 100:.2f}%  ascent-override {96.8 / adj:.2f}%  descent-override {25.1 / adj:.2f}%')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    montserrat()
    caveat()
    fallback()
