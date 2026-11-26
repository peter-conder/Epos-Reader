# Build the Translation data from Perseus

Status: resolved

## What

Add `tools/translation/`, which builds `data2/<work>/NN.en.json` for every Book of all three Works from the pinned Perseus files (see `../spec.md`, Sources and decisions 1, 3–7).

## Shape

`{"work":"iliad","book":1,"source":"<credit + file URL>","blocks":[{"from":1,"text":"…"},{"from":33,"text":"…"}]}`. For Williams, `text` keeps his line breaks as `\n`. All markup (`placeName`, `persName`, `milestone`, `note`) is stripped. Notes are dropped with their content. Whitespace is normalised and the text is NFC.

## Done when

- A `fetch` step downloads the three files at the pinned commits into an uncommitted `sources/` directory. A `build` step writes 60 files (12 + 24 + 24). A `check` step confirms decision 6 against each Book's Line count in `data2/<work>/NN.json`, and fails loudly.
- `tools/translation/corrections.csv` exists (`work,book,from,find,replace`), is applied at build time, and the build fails if a `find` doesn't match.
- `tools/translation/README.md` follows `tools/homer/README.md`: the commands, the inputs with their source and licence, and how it works.
- Each Book JSON's `sources` gains a `translation` entry (decision 13).

## Comments

**2026-11-26:** Resolved.

- `tools/translation/`: `fetch_sources.sh` downloads the three files at the pinned commits into `sources/` (git-ignored). `build_translation.py` writes the 60 `data2/<work>/NN.en.json` files and adds `sources.translation` to each Book file, leaving the rest of it byte for byte as it was. `check_translation.py` checks them. `README.md` follows `tools/homer/README.md`.
- Blocks: Aeneid 327, Iliad 425, Odyssey 288 (2.3 MB in all). The longest is Aeneid V.604, at 115 Lines. Issue 02's proportional mapping has to work with blocks that tall.
- Two things the spec didn't cover:
  - The Iliad file has Murray's speeches in `<quote>` with the print's quotation marks taken out (the Odyssey and Aeneid files keep them in the text), so the build puts them back as “…” and ‘…’.
  - `<choice>` keeps the printed spelling (*Pasiphaë*).
- Aeneid X prints Lines 717–718 before 714. The check uses reading order, and so must the reader (noted in the README).
- `corrections.csv` starts with five quotation-mark typos found in the Perseus source: Aeneid II.205, II.314, X.598 and XII.591 (Williams's line numbers), and Iliad XXII "sons\" wives". These are to be offered to Perseus.
- The check passes on every Book. It was also tested to fail on blocks out of order, leftover markup and a missing Book.
