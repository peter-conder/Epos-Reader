# Credit the Translation and remove the samples

Status: ready-for-agent
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
