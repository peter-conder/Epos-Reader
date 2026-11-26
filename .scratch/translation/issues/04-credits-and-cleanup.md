# Credit the Translation and remove the samples

Status: resolved
Blocked by: 02

## What

See `../spec.md`, decisions 12 and 13.

## Done when

- The `translations` arrays are gone from `WORKS` in `js/data.js`, along with every reader of them, and the "English is available for lines…" / "No English translation of this book yet." messages are gone.
- `SOURCES` in `js/data.js` and the README's Sources table carry the credit, with the three GitHub file links at the pinned commits. They match each other, as the README requires.
- The README's status line no longer says the Translation covers only Aeneid I.1–16, and the Licence paragraph mentions that the Translation is CC BY-SA 4.0.
- `CONTEXT.md` **Translation** reads: "The English of a Work, taken from Perseus: A. T. Murray for Homer, Theodore C. Williams for Vergil."
- [peter-conder/Epos-Reader#5](https://github.com/peter-conder/Epos-Reader/issues/5) is closed by the commit, with a footer.

## Comments

**2026-11-26 (from issue 02):** The "English is available for lines…" / "No English translation of this book yet." messages are already gone (issue 02 replaced that code). `WORKS[work].translations` is still read by `englishFor` in `js/english.js` until issue 03 lands.

**2026-11-26:** Resolved. The author is closing peter-conder/Epos-Reader#5 on GitHub themselves.

- `js/data.js`: the three sample `translations` arrays are gone (nothing read them after issue 03). `WORKS[work].lines` stays, since `js/bookmarks.js` and `js/tab-grid.js` still use it as a fallback. `SOURCES` has an English group with one item per Translation, each linking to its Perseus file at the pinned commit (`PERSEUS_GREEK`, `PERSEUS_LATIN`), marked CC BY-SA 4.0, with a note about `corrections.csv` on the Iliad and Aeneid (where the fixes are). `LICENCE_NOTES` counts the Translation as share-alike.
- `README.md`: the status line, the Licence paragraph and the share-alike paragraph now include the Translation. The Sources table has one row per Translation, and the file layout lists the `NN.en.json` files and `tools/translation/`. The module table drops "the Translation" from `js/data.js` and adds `js/parallel.js`. The data format section documents `sources.translation` and the `NN.en.json` shape.
- `CONTEXT.md`: **Translation** now reads "The English of a Work, taken from Perseus: A. T. Murray for Homer, Theodore C. Williams for Vergil."
- Checked: the Settings & Sources page renders the three items with their licence links, with no page errors.
