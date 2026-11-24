#!/usr/bin/env python3
"""Builds the Iliad and Odyssey Book files and the Greek Lexicon.

Reads (see README.md in this folder):
  input/iliad_scansion/iliadN.csv, input/odyssey_scansion.csv   Scansion, Hypotactic
  sources/tlg0012.tlg00{1,2}.perseus-grc1.tb.xml                 Lemmas and Morphology, AGDT 2.1
  input/epos_homer_lsj_glosses.csv                               one LSJ gloss per Lemma
  input/hand_glosses.csv                                         hand-written glosses (override LSJ)
  sources/lsj/*.xml                                              LSJ, only for hints in the to-do list

Writes:
  data2/iliad/NN.json, data2/odyssey/NN.json   (plus NN.mismatches.txt beside each)
  data2/lexicon/greek.json
  tools/homer/hand_glosses_todo.csv            Lemmas still waiting for a gloss

Python 3 standard library only. Run fetch_sources.sh first.
"""
import collections
import csv
import difflib
import glob
import json
import os
import re
import sys
import unicodedata as ud
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
INPUT = os.path.join(HERE, 'input')
SOURCES = os.path.join(HERE, 'sources')
DATA = os.path.join(REPO, 'data2')

COMING_SOON = 'Coming soon.'
APOS = '\u1FBD'   # ᾽ Greek koronis, the elision mark used in the printed text
SOURCES_FIELD = {
    'text': 'Hypotactic.com, David Chamberlain; checked against the Perseus Digital Library text in the Ancient Greek Dependency Treebank 2.1',
    'lemmas': 'Ancient Greek Dependency Treebank 2.1, Perseus Digital Library (CC BY-SA 3.0)',
    'definitions': 'A Greek-English Lexicon (Liddell, Scott, Jones), Perseus Digital Library (CC BY-SA 4.0)',
    'scansion': 'Hypotactic.com, David Chamberlain',
}
WORKS = {'iliad': 'tlg0012.tlg001.perseus-grc1.tb.xml', 'odyssey': 'tlg0012.tlg002.perseus-grc1.tb.xml'}


# ---------------------------------------------------------------- text helpers
def letters(s):
    """Letters only, without accents or breathings, lower case, one sigma: for matching texts"""
    s = ud.normalize('NFD', s.lower())
    return ''.join(c for c in s if ud.category(c).startswith('L')).replace('ς', 'σ')


VOWELS = set('αεηιουωAΕΗΙΟΥΩ'.lower())


def has_vowel(s):
    return any(c in VOWELS for c in letters(s))


JUNK = re.compile(r'&?(?:nb)*nbsp;|&[a-z]+;')


def clean_text(t):
    t = ud.normalize('NFC', JUNK.sub('', t).replace('\u00a0', '').strip())   # NFC also turns ano teleia into ·
    return t.replace('’', APOS).replace("'", APOS).replace('\u0313', APOS) if t else t


# ---------------------------------------------------------------- Scansion
def num(x):
    return int(x) if x.strip().isdigit() else None


def read_scansion(work):
    """{book: {line: [(word number, text, quantity, foot, hemi)]}}"""
    books = collections.defaultdict(lambda: collections.defaultdict(list))
    if work == 'iliad':
        for path in glob.glob(os.path.join(INPUT, 'iliad_scansion', 'iliad*.csv')):
            book = int(re.search(r'iliad(\d+)\.csv$', path)[1])
            with open(path, encoding='utf-8-sig', newline='') as f:
                for r in csv.reader(f):
                    if not r or not r[0].strip().isdigit():
                        continue
                    books[book][int(r[0])].append((int(r[3]), r[1], r[2].strip(), num(r[4]), r[5].strip()))
    else:
        with open(os.path.join(INPUT, 'odyssey_scansion.csv'), encoding='utf-8-sig', newline='') as f:
            for r in csv.reader(f):
                if not r or not r[0].strip().isdigit():
                    continue
                books[int(r[0])][int(r[1])].append((int(r[4]), r[2], r[3].strip(), num(r[5]), r[6].strip()))
    return books


def scansion_words(sylls):
    """A Line's syllables as display words: [{'f': text, 's': [[text, q, marks]]}]. Words joined by elision in the
    Scansion (δ’ἀνθρώπων) are split after the elision mark; the elided consonant becomes its own Elided syllable."""
    out = []
    # A Line with a blank Foot, or Feet that don't run to six (Il. 8.211 has Foot 1 throughout), is left unscanned
    scanned = all(x[3] is not None for x in sylls) and max(x[3] for x in sylls) == 6
    prev_word, prev_foot = None, None
    for idx, (wn, text, q, foot, hemi) in enumerate(sylls):
        starts_foot = foot != prev_foot
        prev_foot = foot
        caesura = idx + 1 < len(sylls) and hemi == 'hemi1' and sylls[idx + 1][4] == 'hemi2'
        text = clean_text(text)
        if not text:
            continue
        quantity = 'L' if q.startswith('l') else 'S'
        pieces = [p for p in re.split(f'(?<={APOS})(?=\\S)', text) if p]
        spoken = [k for k, p in enumerate(pieces) if has_vowel(p)] or [len(pieces) - 1]
        for k, piece in enumerate(pieces):
            if wn != prev_word or k > 0:
                out.append({'f': '', 's': []})
            prev_word = wn
            marks = ('f' if starts_foot and k == spoken[0] else '') + ('c' if caesura and k == len(pieces) - 1 else '')
            out[-1]['f'] += piece
            out[-1]['s'].append([piece, quantity if k in spoken else 'E', marks])
    if not scanned:
        for w in out:
            w['s'] = None
    return out


# ---------------------------------------------------------------- treebank
BETA_FIX = {'ει´κω': 'εἴκω', '"': '', '???': ''}


def fix_lemma(lemma):
    if lemma is None:
        return ''
    lemma = ud.normalize('NFC', lemma.strip())
    if lemma in BETA_FIX:
        return BETA_FIX[lemma]
    # Betacode leftovers: a circumflex written as "~" after its vowel
    if '~' in lemma:
        lemma = ud.normalize('NFC', ud.normalize('NFD', lemma).replace('~', '\u0342'))
        lemma = ud.normalize('NFC', re.sub(r'([\u0313\u0314])\u0342', '\\1\u0342', ud.normalize('NFD', lemma)))
    # "῎ἄρης": a capital's breathing and accent written before it
    if lemma[:1] in '\u1FCD\u1FCE\u1FCF\u1FDD\u1FDE\u1FDF\u1FBF\u1FFE':
        rest = lemma[1:]
        lemma = rest[:1].upper() + rest[1:]
    if not any(ud.category(c).startswith('L') for c in lemma):
        return ''
    return lemma


def read_treebank(work):
    """Tokens in text order: {form, lemma, postag, book, line}. Punctuation and artificial nodes are left out."""
    root = ET.parse(os.path.join(SOURCES, WORKS[work])).getroot()
    toks = []
    for w in root.iter('word'):
        if w.get('artificial'):
            continue
        tag = w.get('postag') or '---------'
        form = w.get('form') or ''
        if tag[0] == 'u' or not letters(form):
            continue
        m = re.search(r':(\d+)\.(\d+)$', w.get('cite') or '')
        book, line = (int(m[1]), int(m[2])) if m else (toks[-1]['book'], toks[-1]['line']) if toks else (1, 1)
        toks.append({'form': form, 'lemma': fix_lemma(w.get('lemma')), 'raw_lemma': w.get('lemma') or '',
                     'postag': tag.ljust(9, '-'), 'book': book, 'line': line})
    # The file does not keep the Books in order (the Iliad's runs 1…19, 2…, 24, 3…): sort by Book, stably
    return sorted(toks, key=lambda t: t['book'])


# ---------------------------------------------------------------- Morphology
POS = {  # postag[0] -> (key suffix, Lexicon part of speech, label when nothing else is known)
    'n': ('noun', 'noun', 'Noun'), 'v': ('verb', 'verb', 'Verb'), 'a': ('adj', 'adjective', 'Adjective'),
    'd': ('adv', 'adverb', 'Adverb'), 'l': ('det', 'article', 'Article'), 'g': ('part', 'particle', 'Particle'),
    'c': ('cconj', 'conjunction', 'Conjunction'), 'r': ('adp', 'preposition', 'Preposition'),
    'p': ('pron', 'pronoun', 'Pronoun'), 'm': ('num', 'numeral', 'Numeral'), 'i': ('intj', 'interjection', 'Interjection'),
    'e': ('intj', 'interjection', 'Interjection'), 'x': ('x', 'other', ''), '-': ('x', 'other', ''),
}
PERSON = {'1': '1st', '2': '2nd', '3': '3rd'}
NUMBER = {'s': 'Sing.', 'p': 'Pl.', 'd': 'Du.'}
TENSE = {'p': 'Pres.', 'i': 'Imperf.', 'r': 'Perf.', 'l': 'Pluperf.', 't': 'Fut. Perf.', 'f': 'Fut.', 'a': 'Aor.'}
MOOD = {'i': 'Ind.', 's': 'Subj.', 'o': 'Opt.', 'n': 'Inf.', 'm': 'Imper.', 'p': 'Part.'}
VOICE = {'a': 'Act.', 'p': 'Pass.', 'm': 'Mid.', 'e': 'Mid./Pass.'}
GENDER = {'m': 'Masc.', 'f': 'Fem.', 'n': 'Neut.'}
CASE = {'n': 'Nom.', 'g': 'Gen.', 'd': 'Dat.', 'a': 'Acc.', 'v': 'Voc.', 'l': 'Loc.'}
DEGREE = {'c': 'Comp.', 's': 'Superl.'}


def morphology(tag):
    p, per, num, ten, mood, voi, gen, cas, deg = tag[:9]
    g = lambda table, k: table.get(k, '')
    if p == 'v' or mood in MOOD:
        head = [g(TENSE, ten), g(VOICE, voi), g(MOOD, mood)]
        tail = [g(GENDER, gen), g(NUMBER, num), g(CASE, cas)] if mood == 'p' else \
            [] if mood == 'n' else [g(PERSON, per), g(NUMBER, num)]
        parts = head + tail
    else:
        parts = [g(GENDER, gen), g(NUMBER, num), g(CASE, cas)]
        if not any(parts):
            parts = [POS.get(p, POS['-'])[2]]
        parts.append(g(DEGREE, deg))
    return ' '.join(x for x in parts if x)


def is_name(lemma):
    return lemma[:1].isupper()


def lex_key(lemma, tag):
    suffix = POS.get(tag[0], POS['-'])[0]
    if suffix == 'noun' and is_name(lemma):
        suffix = 'propn'
    return f'{lemma}:{suffix}'


# ---------------------------------------------------------------- alignment
def align(words, toks):
    """Maps each treebank token to a display word. words: [(book, line, word index, letters)], toks: [letters].
    Returns {token index: word index in `words`}."""
    a = [w[3] for w in words]
    b = toks
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    out = {}
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal':
            for k in range(i2 - i1):
                out[j1 + k] = i1 + k
        elif op == 'replace':
            # Different word division (οὐδέ / οὐ δέ, crasis…) or a variant reading: match letter by letter
            sa, owner = '', []
            for i in range(i1, i2):
                sa += a[i]
                owner += [i] * len(a[i])
            sb, tok_of = '', []
            for j in range(j1, j2):
                sb += b[j]
                tok_of += [j] * len(b[j])
            votes = collections.defaultdict(collections.Counter)
            for blk in difflib.SequenceMatcher(None, sa, sb, autojunk=False).get_matching_blocks():
                for k in range(blk.size):
                    votes[tok_of[blk.b + k]][owner[blk.a + k]] += 1
            for j in range(j1, j2):
                if votes[j] and votes[j].most_common(1)[0][1] * 2 >= len(b[j]):
                    out[j] = votes[j].most_common(1)[0][0]
    return out


# ---------------------------------------------------------------- glosses
def read_glosses():
    rows = {}
    with open(os.path.join(INPUT, 'epos_homer_lsj_glosses.csv'), encoding='utf-8', newline='') as f:
        for r in csv.DictReader(f):
            rows[ud.normalize('NFC', r['lemma'])] = r
    return rows


def read_hand_glosses():
    out = {}
    for name in ('hand_glosses.csv',):
        path = os.path.join(INPUT, name)
        if not os.path.exists(path):
            continue
        with open(path, encoding='utf-8', newline='') as f:
            for r in csv.DictReader(f):
                if (r.get('gloss') or '').strip():
                    out[ud.normalize('NFC', r['lemma'].strip())] = r['gloss'].strip()
    return out


def clean_gloss(g):
    return re.sub(r'[\s,;:.]+$', '', (g or '').strip())


def lsj_gloss(row):
    """The CSV's gloss, or None when it has none we can use"""
    if not row:
        return None
    g = clean_gloss(row.get('gloss'))
    if not g:
        return None
    # A name glossed by the name alone in lower case ("priam") gets its capital back. Glosses like "son of Atreus"
    # or "the Achaeans" stay as they are; a few names carry LSJ's etymology (Μηδεσικάστη "adorned with prudence").
    if 'name' in (row.get('flags') or '') and re.fullmatch(r'[a-z][a-z-]*', g):
        g = g[:1].upper() + g[1:]
    return g


# ---------------------------------------------------------------- LSJ hints (for the to-do list only)
BETA = {'a': 'α', 'b': 'β', 'g': 'γ', 'd': 'δ', 'e': 'ε', 'z': 'ζ', 'h': 'η', 'q': 'θ', 'i': 'ι', 'k': 'κ', 'l': 'λ',
        'm': 'μ', 'n': 'ν', 'c': 'ξ', 'o': 'ο', 'p': 'π', 'r': 'ρ', 's': 'σ', 't': 'τ', 'u': 'υ', 'f': 'φ', 'x': 'χ',
        'y': 'ψ', 'w': 'ω', 'v': 'ϝ'}
BETA_MARK = {')': '\u0313', '(': '\u0314', '/': '\u0301', '\\': '\u0300', '=': '\u0342', '+': '\u0308', '|': '\u0345'}


def beta_to_greek(s):
    out, cap, pend = [], False, []
    for ch in s:
        c = ch.lower()
        if ch == '*':
            cap, pend = True, []
        elif c in BETA:
            g = BETA[c].upper() if cap else BETA[c]
            out.append(g + ''.join(pend))
            cap, pend = False, []
        elif ch in BETA_MARK:
            (pend if cap else out).append(BETA_MARK[ch])
        elif ch.isdigit():
            continue
        else:
            out.append(ch)
    t = ud.normalize('NFC', ''.join(out))
    return re.sub(r'σ(?=$|[^\w\u0300-\u036f])', 'ς', t)


def lsj_hints(lemmas):
    """{lemma: short hint from LSJ}: the entry's <tr> glosses, or the start of its text (cross-references)"""
    want = collections.defaultdict(list)
    for lem in lemmas:
        want[letters(lem)].append(lem)
    found = {}
    for path in sorted(glob.glob(os.path.join(SOURCES, 'lsj', '*.xml'))):
        for _, e in ET.iterparse(path):
            if e.tag != 'entryFree':
                continue
            head = beta_to_greek(e.get('key') or '')
            k = letters(head)
            if k in want:
                trs = [clean_gloss(''.join(t.itertext())) for t in e.iter('tr')]
                trs = [t for t in trs if t][:3]
                text = '; '.join(trs) if trs else ' '.join(beta_text(e).split())[:140]
                for lem in want[k]:
                    exact = ud.normalize('NFC', head) == lem
                    if text and (lem not in found or (exact and not found[lem][0])):
                        found[lem] = (exact, f'{head}: {text}')
            e.clear()
    return {k: v[1] for k, v in found.items()}


def beta_text(e):
    """An entry's text with its Greek converted from betacode"""
    parts = []

    def walk(n):
        greek = n.get('lang') == 'greek'
        if n.text:
            parts.append(beta_to_greek(n.text) if greek else n.text)
        for c in n:
            walk(c)
            if c.tail:
                parts.append(c.tail)
    walk(e)
    return ''.join(parts)


# ---------------------------------------------------------------- build
def build_work(work, glosses, hand, lex, missing):
    scan = read_scansion(work)
    toks = read_treebank(work)
    words = []   # (book, line, word index, letters)
    lines = {}   # (book, line) -> display words
    for book in sorted(scan):
        for n in sorted(scan[book]):
            sylls = scan[book][n]
            ws = scansion_words(sylls)
            lines[(book, n)] = ws
            for i, w in enumerate(ws):
                words.append((book, n, i, letters(w['f'])))
    # Align Book by Book: faster, and a Book's words can't be matched into another Book
    where = {}
    for book in sorted(scan):
        wi = [i for i, w in enumerate(words) if w[0] == book]
        ti = [j for j, t in enumerate(toks) if t['book'] == book]
        part = align([words[i] for i in wi], [letters(toks[j]['form']) for j in ti])
        where.update({ti[j]: wi[i] for j, i in part.items()})

    for w in lines.values():
        for x in w:
            x['tokens'] = []
    stray = collections.defaultdict(list)   # treebank tokens with no display word, by their cited Line
    for j, t in enumerate(toks):
        if j in where:
            b, n, i, _ = words[where[j]]
            lines[(b, n)][i]['tokens'].append(t)
        else:
            stray[(t['book'], t['line'])].append(t)
    # Lines only the treebank has get its words, without Scansion
    added = []
    for key, ts in stray.items():
        if key[0] is not None and key not in lines and key[0] in scan:
            lines[key] = [{'f': clean_text(t['form']), 's': None, 'tokens': [t]} for t in ts]
            added.append(key)

    os.makedirs(os.path.join(DATA, work), exist_ok=True)
    stats = collections.Counter()
    for book in sorted(scan):
        report = collections.defaultdict(list)
        out_lines = []
        for n in sorted(k[1] for k in lines if k[0] == book):
            ws = []
            for x in lines[(book, n)]:
                w = {'f': x['f']}
                analysed = [t for t in x['tokens'] if t['lemma']]
                if x['tokens'] and letters(x['f']) != ''.join(letters(t['form']) for t in x['tokens']):
                    report['respelt'].append(f'{n}: {x["f"]} = {" ".join(t["form"] for t in x["tokens"])}')
                    stats['respelt'] += 1
                if analysed:
                    w['a'] = []
                    for t in analysed:
                        key = lex_key(t['lemma'], t['postag'])
                        w['a'].append({'l': key, 'm': morphology(t['postag'])})
                        if key not in lex:
                            row = glosses.get(t['lemma']) or glosses.get(ud.normalize('NFC', t['raw_lemma']))
                            gloss = hand.get(t['lemma']) or lsj_gloss(row)
                            lex[key] = {'head': t['lemma'], 'pos': 'proper noun' if key.endswith(':propn')
                                        else POS.get(t['postag'][0], POS['-'])[1], 'def': gloss or COMING_SOON}
                            if not gloss:
                                missing[t['lemma']]['flags'] = (row or {}).get('flags', 'not in CSV')
                        if lex[key]['def'] == COMING_SOON:
                            missing[t['lemma']]['count'] += 1
                            report['missing'].append(key)
                    stats['analysed'] += 1
                    if all(lex[a['l']]['def'] != COMING_SOON for a in w['a']):
                        stats['defined'] += 1
                else:
                    report['unanalysed'].append(f'{n}: {x["f"]}')
                if x.get('s'):
                    w['s'] = [[s[0], s[1], s[2]] if s[2] else [s[0], s[1]] for s in x['s']]
                ws.append(w)
                stats['words'] += 1
            out_lines.append({'n': n, 'w': ws})
            stats['lines'] += 1
            if (book, n) in added:
                report['treebank_only'].append(str(n))
            feet = sum('f' in s[2] for x in lines[(book, n)] if x.get('s') for s in x['s'])
            if lines[(book, n)][0].get('s') is None:
                report['unscanned'].append(str(n))
            elif feet != 6:
                report['feet'].append(f'{n}: {feet} feet')
        unplaced = [f'{k[1]}: {" ".join(t["form"] for t in ts)}' for k, ts in stray.items()
                    if k[0] == book and k not in added]
        data = {'work': work, 'book': book, 'sources': SOURCES_FIELD, 'lines': out_lines}
        with open(os.path.join(DATA, work, f'{book:02d}.json'), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        with open(os.path.join(DATA, work, f'{book:02d}.mismatches.txt'), 'w', encoding='utf-8') as f:
            def section(title, items):
                f.write(f'{title}\n')
                f.writelines(f'{x}\n' for x in items)
                f.write('\n')
            section(f'Lemmas with no definition yet (shown as "{COMING_SOON}"; add them to '
                    'tools/homer/input/hand_glosses.csv):', sorted(set(report['missing'])))
            section('Words the treebank does not analyse (Line: word):', report['unanalysed'])
            section('Treebank words with no match in the Scansion text (cited Line: words):', unplaced)
            section('Words matched to a treebank word spelled differently (Line: printed = treebank):', report['respelt'])
            section('Lines only the treebank has (no Scansion):', report['treebank_only'])
            section('Lines with no Scansion (missing from the Scansion files, or with blank Feet):', report['unscanned'])
            section('Lines whose Scansion does not have six Feet:', report['feet'])
        stats['unplaced'] += sum(len(ts) for k, ts in stray.items() if k[0] == book and k not in added)
    stats['tokens'] = len(toks)
    stats['tokens_placed'] = len(where)
    return stats


def main():
    if not os.path.exists(os.path.join(SOURCES, WORKS['iliad'])):
        sys.exit('Run tools/homer/fetch_sources.sh first.')
    glosses = read_glosses()
    hand = read_hand_glosses()
    lex, missing = {}, collections.defaultdict(lambda: {'count': 0, 'flags': ''})
    for work in WORKS:
        s = build_work(work, glosses, hand, lex, missing)
        print(f'{work}: {s["lines"]} Lines, {s["words"]} words, {s["analysed"]} with Lemma and Morphology, '
              f'{s["defined"]} with a definition ({100 * s["defined"] / max(1, s["analysed"]):.1f}% of analysed); '
              f'treebank tokens placed {s["tokens_placed"]}/{s["tokens"]}, {s["respelt"]} words matched to a different spelling')
    with open(os.path.join(DATA, 'lexicon', 'greek.json'), 'w', encoding='utf-8') as f:
        json.dump(dict(sorted(lex.items())), f, ensure_ascii=False, indent=0)
    print(f'greek.json: {len(lex)} entries, {sum(v["def"] == COMING_SOON for v in lex.values())} "{COMING_SOON}"')

    todo = sorted(missing.items(), key=lambda kv: (-kv[1]['count'], kv[0]))
    hints = lsj_hints([k for k, _ in todo]) if glob.glob(os.path.join(SOURCES, 'lsj', '*.xml')) else {}
    with open(os.path.join(HERE, 'hand_glosses_todo.csv'), 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['lemma', 'count', 'flags', 'lsj_hint', 'gloss'])
        for lem, v in todo:
            w.writerow([lem, v['count'], v['flags'], hints.get(lem, ''), ''])
    print(f'hand_glosses_todo.csv: {len(todo)} Lemmas, {len(hints)} with an LSJ hint')


if __name__ == '__main__':
    main()
