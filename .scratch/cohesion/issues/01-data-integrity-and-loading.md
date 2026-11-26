# Phase 1: Data integrity and resilient loading

Status: resolved

## What

- Fix `fix_lemma` in `tools/homer/build_homer.py` to strip combining/modifier breathing marks (`U+0313`, `U+0314`, `U+02BD`), repairing 29 corrupted Greek Lemmas (e.g. `̓ἀχιλλεύς`, `̓ὀδυσσεύς`, `̓ἀπόλλων`, `ʽἑρμῆς`) and matching proper names properly.
- Stop storing standalone punctuation tokens as clickable `.word` spans (8 in Aeneid, 466 in Iliad, 521 in Odyssey) by merging them onto the adjacent word in `build_homer.py` and in `data2/`.
- Unify Greek and Latin Lexicons on `def: null` (compact JSON) so proper nouns display `"Proper name."` and other missing definitions display `"No definition yet."`. Update `README.md` / `tools/homer/README.md` where `"Coming soon."` was mentioned.
- Remove the hardcoded Aeneid I.1–7 `LEXICON` fallback and `"Epic gloss and grammatical analysis for …"` prototype string from `js/word-card.js`; show `"No analysis for this word yet."` for unanalysed words.
- Make `loadLexicon`, `loadBook`, and `availableWorks` evict failed promises so transient errors are not cached forever; show an honest error state instead of Book I sample Lines when a Book fails to load; add an LRU cap on `bookCache`; preload the Lexicon matching the active Work rather than always downloading `latin.json` first.

## Done when

- `tools/homer/check_homer.py` passes with 0 errors.
- 0 Greek Lemmas start with non-letter characters; 0 standalone punctuation words remain in `data2/`.
- Greek and Latin Lexicons both use `def: null` and compact JSON.
- Unanalysed words show `"No analysis for this word yet."` with no prototype Aeneid I bleed-through.
- Failed fetches retry cleanly and `bookCache` evicts old non-open Books.

## Comments

**2026-11-26:** Resolved.
- Fixed `fix_lemma` and elision-splitting in `tools/homer/build_homer.py`, unified Greek missing definitions on `null`, and wrote `greek.json` and `latin.json` compactly (-158 KB combined).
- Repaired all 27 corrupted leading-breathing Greek Lemmas (remapping 54 references in Iliad/Odyssey) and merged all 995 standalone punctuation tokens (8 Aeneid, 466 Iliad, 521 Odyssey) onto their adjacent words while preserving Scansion flags. `check_homer.py` passes with 0 errors.
- Removed the prototype `LEXICON` fallback from `js/data.js` and `js/word-card.js`; unanalysed words now show `"No analysis for this word yet."`.
- Added failed-fetch eviction in `js/book-data.js` and `js/chapters.js`, an 8-Book LRU cap in `bookCache`, a retryable `.load-error` state in `js/reader.js`, and active-Work Lexicon preloading in `js/main.js`.
- Verified in headless Chromium at 1280×800, 768×1024, and 390×844 (including simulated Book fetch failure + retry) with no errors.
