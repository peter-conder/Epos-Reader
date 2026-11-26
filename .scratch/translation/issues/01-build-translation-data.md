# Build the Translation data from Perseus

Status: ready-for-agent

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
