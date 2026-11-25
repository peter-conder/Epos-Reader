# Epos Reader

Read the great classical epics in the original language: Vergil's **Aeneid**, and Homer's **Iliad** and **Odyssey**. Every word has its Lemma, Morphology and a definition. Any Line can be scanned. The Translation can sit next to the original, and you can keep Notes and Bookmarks as you read.

Epos Reader is for students reading epic with a class, self-taught readers reading for pleasure, and the author's own study. It is free, it's a plain website (no accounts, no build step), and it credits every Source it draws on.

> **Status:** All three Works are in, with Lemmas, Morphology and Scansion: the Aeneid (12 Books, 9,896 Lines), the Iliad (24 Books, 15,682 Lines) and the Odyssey (24 Books, 12,110 Lines). About 2,100 Homeric Lemmas still show "Coming soon." in place of a definition. The Translation covers Aeneid I.1–16 so far.

## What you can do

- **Pick a word** to open its **Word card**: the Lemma (e.g. *arma* for "armis"), its Morphology in this Line, and the Lexicon's definition.
- **Turn on Scansion** to see each syllable marked Long, Short or Elided, with Feet and the Caesuras that Hypotactic marks. Rarer marks (Hiatus, Synizesis, Consonantal i, Lengthened and Hypermetric syllables) are explained when you pick them.
- **Read with a Parallel translation:** the English beside the original, passage by passage.
- **Open several tabs**, each on its own Work and Book, and show two side by side as a **Split**.
- **Write Notes** on any word, and **Bookmark Lines** to come back to. The **Notebook** tab gathers both.
- **Read on a phone or tablet.** Smaller screens get their own layout, with a bottom bar, a tab grid and sheets for Word cards and text formatting (see [`docs/mobile-layout-plan.md`](docs/mobile-layout-plan.md)).
- **Make it yours:** text size, colour palette, and light or dark mode.
- **See where it all comes from:** the **Settings & Sources** page (also "About Epos Reader" in the menu) credits every Source, painting and font.

Notes, Bookmarks, settings, and your reading session (open tabs and Splits, your place in each Book, text size and Scansion) are saved in your browser (`localStorage`), so the app reopens where you left it, including as a Home Screen app on a phone. They never leave your device.

## Run it locally

Epos Reader loads its data with `fetch` and its code as ES modules, so it has to be served over HTTP. Opening `index.html` straight from disk won't work. Any static file server will do. With Python:

```bash
git clone https://github.com/peter-conder/Epos-Reader.git
```

```bash
cd Epos-Reader
```

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. There is nothing to install and nothing to build.

To deploy, publish the repository as-is to any static host, such as GitHub Pages.

## How it's organised

```
index.html        The single page
css/styles.css    All styles, including the phone and tablet layouts
js/               ES modules; main.js is the entry point
data2/
  aeneid/         One file per Book: 01.json … 12.json
  iliad/          01.json … 24.json
  odyssey/        01.json … 24.json
  lexicon/        One Lexicon per language: latin.json, greek.json
assets/           Icons and Home carousel images
docs/             Design notes (mobile layout plan)
tools/homer/      The script that builds the Homer data (see its README)
CONTEXT.md        The glossary: what every term in this project means
```

A few modules to start from:

| Module | What it does |
|---|---|
| `js/book-data.js` | Loads a Book's file and its language's Lexicon, and looks up a word's Lemma, Morphology and definition |
| `js/data.js` | The list of Works, the Translation, and the Sources and credits shown on the Settings & Sources page |
| `js/reader.js`, `js/chunks.js` | Draw a Book's Lines, a chunk at a time, with Scansion |
| `js/state.js` | Open tabs, Splits, Notes, Bookmarks and settings |
| `js/session.js` | Saves the reading session when the page is hidden, and reopens it on launch |
| `js/viewport.js` | The width tiers (phone, tablet, desktop). Keep its breakpoints in step with the media queries in `css/styles.css` |

## Data format

Adding a Work means adding one JSON file per Book under `data2/<work>/`, plus a Lexicon for the language if it doesn't have one yet (named by `lexicon` in the Work's entry in `js/data.js`). A Work with no data files is hidden on phones and tablets.

**A Book** (`data2/aeneid/01.json`):

```json
{
  "work": "aeneid",
  "book": 1,
  "sources": { "text": "…", "lemmas": "…", "scansion": "…", "definitions": "…" },
  "lines": [
    { "n": 1, "w": [
      { "f": "Arma",
        "a": [{ "l": "arma:noun", "m": "Neut. Pl. Acc." }],
        "s": [["Ar", "L", "f"], ["ma", "S"]] }
    ] }
  ]
}
```

- `n`: the Line number.
- `w`: the Line's words, in order. For each word:
  - `f`: the form as printed.
  - `a`: its analysis. One entry per Lemma, so *virumque* has two: *uir* and *-que*. `l` is the Lexicon key (`lemma:part-of-speech`) and `m` is the Morphology.
  - `s`: its syllables as `[text, quantity, marks]`. The quantity is `L`, `S` or `E` (Long, Short, Elided). The marks are `f` (a Foot starts here), `c` (Caesura after), `h` (Hiatus), `z` (Synizesis), `r` (Consonantal i), `d` (Lengthened syllable) and `m` (Hypermetric syllable).

**A Lexicon** (`data2/lexicon/latin.json`) maps each key to an entry:

```json
{ "arma:noun": { "head": "Arma", "pos": "noun", "def": "arms (pl.), weapons, armor, shield; …" } }
```

A missing or `null` definition shows as "No definition yet." (or "Proper name." for proper nouns). Each `NN.mismatches.txt` beside a Book lists the Lemmas that still need a definition.

The Greek Lexicon (`data2/lexicon/greek.json`) has the same shape, keyed by the Greek Lemma, e.g. `"θυμός:noun"`. Homer's Book files are built by [`tools/homer/`](tools/homer/README.md). In them, an elided word is its own word with one Elided syllable (`δ᾽`), and a word the treebank analyses as two (`οὐδέ`) has two entries in `a`.

## Words we use

This project keeps a strict vocabulary: **Work** (not poem), **Book** (not chapter), **Line**, **Citation** (*Aeneid I.1–25*, or *Aen. I.1–25* where space is short), **Word card** (not gloss), **Split** versus **Parallel translation**, and so on. Every term is defined in [`CONTEXT.md`](CONTEXT.md). Please use those words in code, issues and commit messages.

## Contributing

- **Issues** are markdown files under `.scratch/<feature>/issues/`, one per ticket, with a `Status:` line (see [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md)).
- **Agents** working on this repo should start from [`CLAUDE.md`](CLAUDE.md).
- Before opening a pull request, check the change on a phone size (390×844), a tablet (768×1024) and a desktop (1280×800).

## Licence

The code is released under the [MIT Licence](LICENSE). The data in `data2/` is not covered by it. Each Source keeps its own licence (below): the Latin Lemma data is CC BY-NC-SA 4.0, and the Greek Lemma data and definitions are CC BY-SA.

## Sources and credits

Epos Reader is built on the work of these projects:

| What | Source | Licence |
|---|---|---|
| Latin text | [Perseus Digital Library](https://www.perseus.tufts.edu), Tufts University | See Perseus for each text |
| Latin Lemmas and Morphology | LASLA corpus, via [LiLa: Linking Latin](https://lila-erc.eu) | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| Greek Lemmas and Morphology | [Ancient Greek Dependency Treebank 2.1](https://github.com/PerseusDL/treebank_data), Perseus Digital Library | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Greek definitions | [A Greek-English Lexicon](https://github.com/PerseusDL/lexica) (Liddell, Scott, Jones), Perseus Digital Library | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| Scansion (and the printed Greek text) | [Hypotactic](https://hypotactic.com), David Chamberlain | See Hypotactic |
| Latin definitions | [Whitaker's Words](https://archives.nd.edu/words.html), William Whitaker | See Whitaker's Words |
| English Translation | Credit to be added: the English so far covers Aeneid I.1–16 and a few sample Lines ([peter-conder/Epos-Reader#5](https://github.com/peter-conder/Epos-Reader/issues/5)) | |

Because the Latin Lemma data is CC BY-NC-SA 4.0, Epos Reader is non-commercial, and anything built from that data must be shared under the same licence. The Greek Lemma data and LSJ definitions are share-alike too (CC BY-SA), so anything built from them must be shared under the same terms.

The app also uses:

| What | Credit |
|---|---|
| Aeneid card on Home | *Aeneas Carrying Anchises*, Carle van Loo, 1729, Musée du Louvre, Paris ([Louvre listing on Smartify](https://smartify.org/artworks/charles-andre-known-as-carle-vanloo-aeneas-carrying-anchises)) |
| Iliad card on Home | *Priam Begging Achilles for the Return of Hector's Body*, Alexander Ivanov, 1824 ([Ivanov on Wikipedia](https://en.wikipedia.org/wiki/A._A._Ivanov)) |
| Odyssey card on Home | *Ulysses deriding Polyphemus – Homer's Odyssey*, J. M. W. Turner, 1829, The National Gallery, London ([NG508](https://www.nationalgallery.org.uk/paintings/joseph-mallord-william-turner-ulysses-deriding-polyphemus-homer-s-odyssey)) |
| Fonts | [Gentium Plus](https://software.sil.org/gentium/) (SIL International) and [Roboto](https://fonts.google.com/specimen/Roboto), loaded from Google Fonts |
| Hand-written glosses | Short glosses for some Homeric Lemmas, written by the author (`tools/homer/input/hand_glosses.csv`). Where there is one, it is shown in place of the LSJ definition |

These lists are copied from `SOURCES` and `CREDITS` in `js/data.js`, which the Settings & Sources page shows. Change both together.
