# Homer data build

Builds the Iliad and Odyssey Book files (`data2/iliad/NN.json`, `data2/odyssey/NN.json`) and the Greek Lexicon (`data2/lexicon/greek.json`). The site itself has no build step. This is only for regenerating the data.

```bash
tools/homer/fetch_sources.sh
```

```bash
python3 tools/homer/build_homer.py
```

```bash
python3 tools/homer/check_homer.py
```

## Inputs

| File | What | Source |
|---|---|---|
| `input/iliad_scansion/iliadN.csv`, `input/odyssey_scansion.csv` | Scansion: one row per syllable, with its word, Foot and half-line | [Hypotactic](https://hypotactic.com), David Chamberlain |
| `sources/tlg0012.tlg00{1,2}.perseus-grc1.tb.xml` (downloaded, not committed) | Lemma and Morphology of every word | [Ancient Greek Dependency Treebank 2.1](https://github.com/PerseusDL/treebank_data), CC BY-SA 3.0 |
| `input/epos_homer_lsj_glosses.csv` + `input/lsj_glosses_report.md` | One short gloss per Lemma, chosen from LSJ | [LSJ](https://github.com/PerseusDL/lexica), Perseus Digital Library, CC BY-SA 4.0 |
| `sources/lsj/*.xml` (downloaded, not committed) | LSJ itself, used only for the hints in the to-do list | as above |
| `input/hand_glosses.csv` | Hand-written glosses (`lemma,gloss`). These override LSJ | the author |

## How it works

1. **Lines and printed text come from the Scansion.** Its syllables are grouped into words. A new Foot number marks the start of a Foot (`f`), and the last syllable before the half-line changes from `hemi1` to `hemi2` gets the Caesura (`c`).
2. **Elision.** Hypotactic joins an elided word to the next one (`δ’ἀνθρώπων`, with the syllable `δ’ἀν`). The build splits it after the elision mark into two words, `δ᾽` and `ἀνθρώπων`. A piece with no vowel becomes an Elided (`E`) syllable. Elision marks are printed as `᾽` (U+1FBD), and all text is NFC.
3. **Treebank alignment.** Treebank words are matched to the printed words Book by Book. The match runs word by word, falling back to letter by letter where word division or readings differ (for example, `οὐδέ` is one printed word but two treebank words, so it gets two analyses). The treebank's own Line numbers aren't used: they slip at sentence boundaries. Its Books are also stored out of order.
4. **Morphology** is spelled out from the treebank's 9-character `postag` in the Aeneid's style (`Aor. Act. Ind. 3rd Sing.`, `Pres. Mid./Pass. Part. Masc. Sing. Nom.`, `Fem. Du. Acc.`).
5. **Lexicon keys** are `lemma:pos`, as in `latin.json`. A capitalised noun is `propn`. Lemmas left as betacode in the treebank (`πα~ς`, `῎ἄρης`) are repaired first.
6. **Definitions.** The hand gloss is used first, then the LSJ gloss with LSJ's trailing punctuation trimmed. Anything still without a gloss shows **"Coming soon."** and is listed in `hand_glosses_todo.csv`.

## Outputs to look at

- `hand_glosses_todo.csv` lists every Lemma still showing "Coming soon.", by how often it occurs, with an LSJ hint where one was found. To add a gloss, copy the row's `lemma` and your gloss into `input/hand_glosses.csv` and rebuild.
- `data2/<work>/NN.mismatches.txt` lists, for each Book:
  - Lemmas without a definition;
  - words the treebank leaves unanalysed;
  - words matched to a differently spelled treebank word (variant readings);
  - Lines with no Scansion.

  Il. 8.211, 8.217 and 8.235 have no Scansion because the source file gives every syllable Foot 1. A few Odyssey Lines have blank Feet.
