# Full English Translation (Murray and Williams)

Agreed in a design review on 2026-11-26. Each section is a decision, not a proposal. There is one ticket per area under `issues/`, to be done in order.

## Sources

| Work | Translator | Perseus file | Pinned commit |
|---|---|---|---|
| Iliad | A. T. Murray (Loeb, 1924–25) | [`tlg0012.tlg001.perseus-eng3.xml`](https://github.com/PerseusDL/canonical-greekLit/blob/6d7829caf172d43a109e89f918dfb18fbf48e3d1/data/tlg0012/tlg001/tlg0012.tlg001.perseus-eng3.xml) | `PerseusDL/canonical-greekLit@6d7829c` |
| Odyssey | A. T. Murray (Loeb, 1919) | [`tlg0012.tlg002.perseus-eng3.xml`](https://github.com/PerseusDL/canonical-greekLit/blob/6d7829caf172d43a109e89f918dfb18fbf48e3d1/data/tlg0012/tlg002/tlg0012.tlg002.perseus-eng3.xml) | `PerseusDL/canonical-greekLit@6d7829c` |
| Aeneid | Theodore C. Williams (Houghton Mifflin, 1910) | [`phi0690.phi003.perseus-eng2.xml`](https://github.com/PerseusDL/canonical-latinLit/blob/73723c273e0a3da6189d0fe09c0e6d724d87376b/data/phi0690/phi003/phi0690.phi003.perseus-eng2.xml) | `PerseusDL/canonical-latinLit@73723c2` |

All three are CC BY-SA 4.0. The Homer files say so in their TEI header. The Aeneid file has no licence line of its own, so it falls under its repository's README: "Unless otherwise indicated, all contents of this repository are licensed under a Creative Commons Attribution-ShareAlike 4.0 International License." Reuse must credit the Perseus Digital Library with a link to https://www.perseus.tufts.edu/, identify each text and link it to its GitHub repository, and offer corrections back to Perseus.

## Decisions

1. **Alignment is by passage.** Each Perseus `card` becomes one English block, and its `n` is the first Line it translates. A block covers its Lines up to the Line before the next block's start (the last block runs to the end of the Book). This is the same in all three Works. Murray's every-5-Lines `milestone`s are not used.
2. **No markers inside a block.** The Parallel translation shows no range headings and no margin Line numbers.
3. **Murray's Loeb footnotes are dropped.** Showing them is out of scope.
4. **Williams keeps his verse line breaks** inside a block. Murray's prose is shown as prose.
5. **Data lives in per-Book files**, `data2/<work>/NN.en.json`, next to the existing Book files. They load only when the English is first shown in a tab.
6. **The build** is `tools/translation/`: it fetches the files at the pinned commits, writes the per-Book files (committed), and checks them: every Book is present, block starts only go up, the first block starts at Line 1, and no block starts past the Book's last Line.
7. **Corrections.** The text stays exactly as Perseus has it. Any fix goes in `tools/translation/corrections.csv`, is applied at build time and is offered upstream to Perseus.
8. **Parallel translation (desktop and tablet): linked scrolling.** The English pane shows the block containing the Line at the top of the original, scrolled through the block in proportion to how far the top Line is through the block's Lines. Scrolling the English moves the original by the inverse mapping. Both directions are exact at block edges.
   *Amended 2026-11-26:* the panes are now aligned block for block (`js/align.js`): each passage of the original starts level with its English block, the shorter side padded, and the panes scroll together pixel for pixel. The proportional mapping is kept for the phone swap (decision 9).
9. **Phone EN/LA swap** uses the same Line-to-block mapping. If you swap back without scrolling the English, you return exactly where you were (as today).
10. **Phone "Show its English" (line tap)** opens the whole block under the tapped Line, headed with its range (for example *Lines 34–49*). Tapping again closes it. Only one is open at a time. The heading is shown here only, never in the Parallel translation.
11. **The English is read-only.** It has no Word cards, Notes, Bookmarks or Copy.
12. **The current samples go.** The `translations` arrays in `js/data.js` (16 Lines per Work, source unknown) and the "English is available for lines…" message are deleted. [peter-conder/Epos-Reader#5](https://github.com/peter-conder/Epos-Reader/issues/5) closes when the new credit lands.
13. **The credit**, in `SOURCES` (`js/data.js`), the README's Sources table and each Book's `sources.translation`:

    > **Translation:** Homer, *Iliad*, tr. A. T. Murray (Loeb, 1924–25) and *Odyssey*, tr. A. T. Murray (Loeb, 1919); Vergil, *Aeneid*, tr. Theodore C. Williams (1910). Perseus Digital Library, Tufts University, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

    Each text links to its Perseus file on GitHub at the pinned commit.

## Out of scope

Murray's footnotes, Butler's translations, a choice of translator, and Word cards, Notes or Bookmarks on the English.
