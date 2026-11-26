# Translation data build

Builds the Translation for all three Works: `data2/<work>/NN.en.json` for every Book. It also adds a `translation` credit to each Book file's `sources`. The site itself has no build step. This is only for regenerating the data. The decisions behind it are in `.scratch/translation/spec.md`.

```bash
tools/translation/fetch_sources.sh
```

```bash
python3 tools/translation/build_translation.py
```

```bash
python3 tools/translation/check_translation.py
```

## Inputs

| File | What | Source |
|---|---|---|
| `sources/tlg0012.tlg001.perseus-eng3.xml` (downloaded, not committed) | Iliad, tr. A. T. Murray (Loeb, 1924–25) | [Perseus Digital Library](https://github.com/PerseusDL/canonical-greekLit/blob/6d7829caf172d43a109e89f918dfb18fbf48e3d1/data/tlg0012/tlg001/tlg0012.tlg001.perseus-eng3.xml), CC BY-SA 4.0 |
| `sources/tlg0012.tlg002.perseus-eng3.xml` (downloaded, not committed) | Odyssey, tr. A. T. Murray (Loeb, 1919) | [Perseus Digital Library](https://github.com/PerseusDL/canonical-greekLit/blob/6d7829caf172d43a109e89f918dfb18fbf48e3d1/data/tlg0012/tlg002/tlg0012.tlg002.perseus-eng3.xml), CC BY-SA 4.0 |
| `sources/phi0690.phi003.perseus-eng2.xml` (downloaded, not committed) | Aeneid, tr. Theodore C. Williams (1910) | [Perseus Digital Library](https://github.com/PerseusDL/canonical-latinLit/blob/73723c273e0a3da6189d0fe09c0e6d724d87376b/data/phi0690/phi003/phi0690.phi003.perseus-eng2.xml), CC BY-SA 4.0 (by its repository's README; the file has no licence line of its own) |
| `corrections.csv` | Fixes to typos in the Perseus text (`work,book,from,find,replace`) | the author; to be offered back to Perseus |

The Perseus files are pinned to one commit each, in `fetch_sources.sh` and `build_translation.py`. To move to a newer Perseus version, change both, rebuild and check.

## Output

```json
{"work":"iliad","book":1,"source":"<credit>: <GitHub URL>","form":"prose","blocks":[{"from":1,"text":"…"},{"from":33,"text":"…"}]}
```

`form` is `verse` (Williams: `text` has one verse line per `\n`) or `prose` (Murray: paragraphs separated by a blank line). A block covers its Lines from `from` up to the Line before the next block's `from` (the last block runs to the end of the Book). "Before" means in reading order, which is what the Book file lists. Aeneid X prints Lines 717–718 before 714, so don't compare Line numbers to find a Line's block.

## How it works

1. **Blocks are Perseus `card`s.** Each Book `div` holds `card` divs, and a card's `n` is the first Line it translates. Murray's every-5-Lines `milestone`s are ignored.
2. **Text.**
   - **Markup** is stripped (`placeName`, `persName`, `milestone`, `corr`), keeping its text.
   - **Loeb footnotes** (`note`) are dropped.
   - **`<choice>`** keeps the printed spelling (`<orig>`, e.g. *Pasiphaë*) over the regularised one.
   - **Whitespace** is collapsed, and the text is NFC.
3. **Quotation marks.** In the Iliad, Perseus moved Murray's speeches into `<quote>` and dropped the quotation marks the print has, so the build puts them back as “…”, with ‘…’ for a speech inside a speech. The Odyssey and Aeneid files keep their quotation marks in the text and have no `<quote>`.
4. **Line breaks.** Williams is verse: each `<l>` is one line of the block, joined with `\n`. Murray is prose: each `<p>` is one paragraph, joined with a blank line (in practice every card has one). Williams's 12 paragraph `milestone`s are ignored.
5. **Corrections** from `corrections.csv` are applied to a block's finished text. The build fails if a `find` isn't in its block, or a row names a block that doesn't exist.
6. **Book files** get `sources.translation` added. The rest of each file is left as it was, byte for byte. The build refuses to rewrite a file that isn't in the compact form it writes.

## Checks

`check_translation.py` fails if:
- a Book has no English, or its file names the wrong Work or Book;
- a block starts at a Line the Book doesn't have;
- the first block doesn't start at the Book's first Line;
- the block starts don't go up in reading order;
- a block is empty, or has markup, a straight double quote, a double space or a replacement character left in it;
- a Book file has no `sources.translation`.

It also prints each Work's block count and its longest block.
