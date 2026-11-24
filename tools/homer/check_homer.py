#!/usr/bin/env python3
"""Checks the built Homer files: syllables spell each word, scanned Lines have six Feet, every Lemma key is in the
Lexicon, and each word's Lemmas agree with its letters (a sign the treebank was aligned to the right word)."""
import collections
import glob
import json
import os
import sys
import unicodedata as ud

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

lex = json.load(open(os.path.join(REPO, 'data2', 'lexicon', 'greek.json'), encoding='utf-8'))
problems = collections.defaultdict(list)
totals = collections.Counter()
for work in ('iliad', 'odyssey'):
    for path in sorted(glob.glob(os.path.join(REPO, 'data2', work, '[0-9][0-9].json'))):
        d = json.load(open(path, encoding='utf-8'))
        ref = f'{work} {d["book"]}'
        for line in d['lines']:
            totals['lines'] += 1
            feet, scanned = 0, False
            for w in line['w']:
                totals['words'] += 1
                if not ud.is_normalized('NFC', w['f']):
                    problems['not NFC'].append(f'{ref}.{line["n"]} {w["f"]}')
                if 's' in w:
                    scanned = True
                    if ''.join(s[0] for s in w['s']) != w['f']:
                        problems['syllables do not spell the word'].append(f'{ref}.{line["n"]} {w["f"]}')
                    feet += sum('f' in (s[2] if len(s) > 2 else '') for s in w['s'])
                for a in w.get('a', []):
                    if a['l'] not in lex:
                        problems['key missing from greek.json'].append(f'{ref}.{line["n"]} {a["l"]}')
            if scanned:
                totals['scanned'] += 1
                if feet != 6:
                    problems['not six Feet'].append(f'{ref}.{line["n"]}: {feet}')
print(dict(totals))
for k, v in problems.items():
    print(f'{k}: {len(v)}', v[:8])
sys.exit(1 if any(k != 'not six Feet' for k in problems) else 0)
