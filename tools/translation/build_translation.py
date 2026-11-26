"""Builds the Translation: data2/<work>/NN.en.json for every Book, from the Perseus English in sources/.

Each Perseus `card` becomes one block: {"from": <first Line it translates>, "text": ...}. A block covers its
Lines up to the Line before the next block's start. See README.md, and .scratch/translation/spec.md for the
decisions behind it. Run fetch_sources.sh first.
"""
import csv
import json
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
DATA = ROOT / 'data2'
TEI = '{http://www.tei-c.org/ns/1.0}'

GREEK = 'https://github.com/PerseusDL/canonical-greekLit/blob/6d7829caf172d43a109e89f918dfb18fbf48e3d1/data/tlg0012'
LATIN = 'https://github.com/PerseusDL/canonical-latinLit/blob/73723c273e0a3da6189d0fe09c0e6d724d87376b/data/phi0690'

WORKS = {
    'iliad': {
        'file': 'tlg0012.tlg001.perseus-eng3.xml', 'url': f'{GREEK}/tlg001/tlg0012.tlg001.perseus-eng3.xml',
        'books': 24, 'verse': False,
        'credit': 'A. T. Murray (Loeb Classical Library, 1924–25), Perseus Digital Library (CC BY-SA 4.0)',
    },
    'odyssey': {
        'file': 'tlg0012.tlg002.perseus-eng3.xml', 'url': f'{GREEK}/tlg002/tlg0012.tlg002.perseus-eng3.xml',
        'books': 24, 'verse': False,
        'credit': 'A. T. Murray (Loeb Classical Library, 1919), Perseus Digital Library (CC BY-SA 4.0)',
    },
    'aeneid': {
        'file': 'phi0690.phi003.perseus-eng2.xml', 'url': f'{LATIN}/phi003/phi0690.phi003.perseus-eng2.xml',
        'books': 12, 'verse': True,
        'credit': 'Theodore C. Williams (Houghton Mifflin, 1910), Perseus Digital Library (CC BY-SA 4.0)',
    },
}

QUOTES = ('“', '”'), ('‘', '’')   # outer speech, speech inside speech


def tag(e):
    return e.tag.replace(TEI, '')


def flat(e, depth=0):
    """The text of an element with its markup taken out. Loeb footnotes are dropped (their tail is kept), a
    <choice> keeps the printed spelling (<orig>), and a <quote> gets the quotation marks the print has and
    Perseus moved into markup."""
    out = [e.text or '']
    for c in e:
        t = tag(c)
        if t == 'note':
            pass
        elif t == 'choice':
            orig = c.find(TEI + 'orig')
            out.append(flat(orig if orig is not None else c, depth))
        elif t == 'quote':
            o, cl = QUOTES[depth % 2]
            out.append(o + flat(c, depth + 1).strip() + cl)
        elif t in ('milestone', 'lb'):
            out.append(' ')
        else:
            out.append(flat(c, depth))
        out.append(c.tail or '')
    return ''.join(out)


def tidy(s):
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r' ([,;:.!?])', r'\1', s)   # a space left where a footnote was taken out before punctuation
    return unicodedata.normalize('NFC', s)


def block_text(card, verse):
    if verse:
        lines = [tidy(flat(l)) for l in card.iter(TEI + 'l')]
        return '\n'.join(l for l in lines if l)
    paras = [tidy(flat(p)) for p in card.iter(TEI + 'p')]
    return '\n\n'.join(p for p in paras if p)


def load_corrections():
    fixes = {}
    with open(HERE / 'corrections.csv', encoding='utf-8', newline='') as f:
        for row in csv.DictReader(f):
            key = (row['work'], int(row['book']), int(row['from']))
            fixes.setdefault(key, []).append((row['find'], row['replace']))
    return fixes


def build_work(work, cfg, fixes, used):
    src = HERE / 'sources' / cfg['file']
    if not src.exists():
        sys.exit(f'Missing {src}. Run fetch_sources.sh first.')
    body = ET.parse(src).getroot().find(f'.//{TEI}body')
    books = [d for d in body.iter(TEI + 'div') if d.get('subtype') == 'book']
    if len(books) != cfg['books']:
        sys.exit(f'{work}: expected {cfg["books"]} Books, found {len(books)}')
    for bdiv in books:
        n = int(bdiv.get('n'))
        blocks = []
        for card in bdiv:
            if tag(card) != 'div' or card.get('subtype') != 'card':
                sys.exit(f'{work} {n}: unexpected <{tag(card)}> in a Book')
            start = int(card.get('n'))
            text = block_text(card, cfg['verse'])
            for find, replace in fixes.get((work, n, start), []):
                if find not in text:
                    sys.exit(f'corrections.csv: "{find}" not found in {work} {n}, block from {start}')
                text = text.replace(find, replace)
                used.add((work, n, start, find))
            blocks.append({'from': start, 'text': text})
        out = {'work': work, 'book': n, 'source': f'{cfg["credit"]}: {cfg["url"]}', 'blocks': blocks}
        write_json(DATA / work / f'{n:02d}.en.json', out)
        add_book_source(DATA / work / f'{n:02d}.json', cfg['credit'])


def write_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))


def add_book_source(path, credit):
    """Adds sources.translation to a Book file, leaving the rest of it byte for byte as it was."""
    raw = path.read_text(encoding='utf-8')
    data = json.loads(raw)
    if json.dumps(data, ensure_ascii=False, separators=(',', ':')) != raw:
        sys.exit(f'{path} is not in the compact form this script rewrites; not touching it')
    if data['sources'].get('translation') == credit:
        return
    data['sources']['translation'] = credit
    write_json(path, data)


def main():
    fixes = load_corrections()
    used = set()
    for work, cfg in WORKS.items():
        build_work(work, cfg, fixes, used)
    unused = [k for k, v in fixes.items() for find, _ in v if (*k, find) not in used]
    if unused:
        sys.exit(f'corrections.csv names blocks that do not exist: {unused}')
    print('Built the Translation for', ', '.join(WORKS))


if __name__ == '__main__':
    main()
