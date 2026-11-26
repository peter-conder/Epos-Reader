"""Checks the built Translation (data2/<work>/NN.en.json) against the Book files. Exits non-zero on any problem.

- Every Book of every Work has its English, and the file names its Work and Book.
- Every block starts at a Line the Book has, the first at the Book's first Line, and block starts only go up in
  reading order. (Reading order, not number order: Aeneid X prints Lines 717–718 before 714.)
- No block is empty, and no markup, stray straight double quote, double space or replacement character is left.
- Each Book file credits the Translation in sources.translation.
"""
import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent.parent / 'data2'
BOOKS = {'aeneid': 12, 'iliad': 24, 'odyssey': 24}


def check():
    problems = []
    say = problems.append
    for work, count in BOOKS.items():
        blocks_total = 0
        longest = (0, None)
        for n in range(1, count + 1):
            book_path = DATA / work / f'{n:02d}.json'
            en_path = DATA / work / f'{n:02d}.en.json'
            where = f'{work} {n}'
            if not en_path.exists():
                say(f'{where}: no {en_path.name}')
                continue
            book = json.loads(book_path.read_text(encoding='utf-8'))
            en = json.loads(en_path.read_text(encoding='utf-8'))
            if en.get('work') != work or en.get('book') != n:
                say(f'{where}: {en_path.name} says it is {en.get("work")} {en.get("book")}')
            if not book['sources'].get('translation'):
                say(f'{where}: {book_path.name} has no sources.translation')
            order = [line['n'] for line in book['lines']]
            row = {ln: i for i, ln in enumerate(order)}
            blocks = en.get('blocks') or []
            if not blocks:
                say(f'{where}: no blocks')
                continue
            if blocks[0]['from'] != order[0]:
                say(f'{where}: the first block starts at Line {blocks[0]["from"]}, not {order[0]}')
            prev = -1
            for i, b in enumerate(blocks):
                start, text = b['from'], b['text']
                if start not in row:
                    say(f'{where}: a block starts at Line {start}, which the Book does not have')
                    continue
                if row[start] <= prev:
                    say(f'{where}: the block from Line {start} does not come after the one before it')
                prev = row[start]
                end = row[blocks[i + 1]['from']] if i + 1 < len(blocks) and blocks[i + 1]['from'] in row else len(order)
                if end - row[start] > longest[0]:
                    longest = (end - row[start], f'{n}.{start}')
                if not text.strip():
                    say(f'{where}: the block from Line {start} is empty')
                for bad, what in (('<', 'markup'), ('>', 'markup'), ('"', 'a straight double quote'),
                                  ('  ', 'a double space'), ('�', 'a replacement character')):
                    if bad in text:
                        say(f'{where}: the block from Line {start} has {what}')
            blocks_total += len(blocks)
        print(f'{work}: {blocks_total} blocks; the longest covers {longest[0]} Lines (from {longest[1]})')
    return problems


if __name__ == '__main__':
    problems = check()
    for p in problems:
        print('PROBLEM:', p)
    if problems:
        sys.exit(1)
    print('All Books check out.')
