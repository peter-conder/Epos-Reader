# Epos — Homeric lemma glosses from LSJ: run report

Run date: 2026-11-24. Output: `epos_homer_lsj_glosses.csv` (UTF-8).

## Totals

| measure | value |
|---|---|
| Unique lemmas (Iliad + Odyssey) | 8,824 |
| Matched an LSJ entry | 7,700 |
| Glossed (candidate chosen) | 6,780 |
| NONE chosen | 492 |
| No LSJ entry (no_entry) | 1,124 |
| LSJ entry but no usable candidate (no_candidate) | 428 |
| Matched >1 LSJ entry (homograph) | 594 |
| Capitalised lemmas (name) | 1,427 |
| Chosen gloss has a Homeric citation | 5,126 |
| Words with empty lemma (set aside) | 3,937 |
| Punctuation tokens skipped | 31,970 |
| Lemmatised word tokens | 200,184 |
| Tokens whose lemma got a gloss | 168,287 |

Token coverage: 84.1% of lemmatised words in the two poems have a gloss.

## 50 most frequent lemmas needing hand-written glosses

NONE, no_entry and no_candidate together, by frequency.

| lemma | count | flags |
|---|---|---|
| καί | 5272 | NONE_chosen homograph |
| τε | 4302 | NONE_chosen homograph |
| ἐγώ | 2865 | NONE_chosen |
| ἄν | 1446 | NONE_chosen homograph |
| γάρ | 1399 | NONE_chosen |
| ἕ | 962 | NONE_chosen homograph |
| εἰ | 804 | NONE_chosen homograph |
| Ζεύς | 696 | NONE_chosen name |
| ἠδέ | 523 | no_candidate |
| Ἕκτωρ | 442 | NONE_chosen name |
| εἶδον | 439 | no_entry |
| Ἀχιλλεύς | 382 | no_candidate name |
| Ἀθήνη | 310 | NONE_chosen name |
| οἶδα | 303 | no_candidate |
| ὦ | 258 | NONE_chosen homograph |
| Τηλέμαχος | 244 | NONE_chosen name |
| πρῶτος | 237 | NONE_chosen homograph |
| Αἴας | 198 | no_candidate name |
| ἕπομαι | 195 | no_candidate |
| Μενέλαος | 190 | NONE_chosen name |
| Ἄρης | 163 | NONE_chosen name |
| Ἀπόλλων | 157 | no_candidate name |
| Πάτροκλος | 145 | no_candidate name |
| Ἥρα | 127 | NONE_chosen homograph name |
| ἠέλιος | 125 | no_entry |
| μέμαα | 115 | no_candidate |
| κίω | 107 | no_candidate |
| ἤτοι | 105 | no_candidate |
| Ὄλυμπος | 97 | NONE_chosen name |
| ἕνεκα | 92 | NONE_chosen |
| μάλιστα | 85 | no_entry |
| Πηνελόπεια | 83 | no_candidate name |
| Διομήδης | 81 | NONE_chosen name |
| μίγνυμι | 81 | no_entry |
| Ποσειδεών | 79 | no_candidate name |
| Αἰνείας | 78 | no_candidate name |
| Ἰθάκη | 78 | NONE_chosen name |
| Ἰδομενεύς | 77 | no_entry name |
| ἆρα | 77 | NONE_chosen homograph |
| Ἀλκίνοος | 70 | no_entry name |
| Πηλεύς | 68 | NONE_chosen name |
| κεῖνος | 67 | no_candidate |
| μᾶλλον | 65 | no_candidate |
| Τυδείδης | 62 | no_entry name |
| Ἀντίλοχος | 61 | no_entry name |
| ἠέ | 60 | no_candidate |
| Ἥφαιστος | 60 | NONE_chosen name |
| Ἑλένη | 59 | NONE_chosen name |
| Μηριόνης | 57 | NONE_chosen name |
| Ἀντίνοος | 56 | NONE_chosen name |

## Random sample of 50 choices for spot-checking (seed 20261124)

| lemma | count | # | HOM | gloss |
|---|---|---|---|---|
| προστίθημι | 1 | 1 | yes | put to |
| ἐπιχθόνιος | 14 | 1 | yes | upon the earth, earthly, |
| πρόσωθεν | 1 | 1 | no | from afar |
| θυμός | 757 | 8 | yes | heart |
| Τροία | 72 | 1 | no | Troy, |
| πλανάω | 1 | 1 | no | cause to wander |
| προσθέω | 1 | 1 | no | run towards |
| ἔρυμα | 1 | 1 | yes | fence, guard, |
| ἀφύσσω | 19 | 1 | yes | draw |
| Μηδεσικάστη | 1 | 1 | yes | adorned with prudence |
| κατακείρω | 3 | 1 | no | shear, clip close |
| ἠπεροπευτής | 2 | 1 | yes | a cheat, deceiver |
| δίκη | 16 | 6 | no | order, right, |
| ἀποπροαιρέω | 1 | 1 | no | take away from, |
| κολούω | 3 | 1 | no | cut short, dock, curtail |
| ἀειγενέτης | 3 | 1 | yes | everlasting |
| Ἔρεβόσδε | 1 | 1 | yes | into Erebos, |
| λακτίζω | 2 | 1 | no | kick with the heel |
| ἐριδαίνω | 8 | 1 | yes | wrangle, quarrel, |
| φοβέω | 39 | 1 | yes | put to flight, |
| ἀμφίδυμος | 1 | 1 | yes | two-fold, double, |
| τίμιος | 1 | 1 | no | valued |
| μέν | 1872 | 1 | yes | indeed, of a truth |
| κρήγυος | 1 | 2 | yes | agreeable |
| ἐπιπέλομαι | 2 | 1 | no | come to |
| περικαλλής | 54 | 1 | yes | very beautiful |
| μυχός | 19 | 1 | yes | innermost part, nook, corner |
| δαφοινεός | 1 | 1 | yes | dark |
| μάσταξ | 3 | 1 | no | that with which one chews, mouth, jaws |
| ἐρινεός | 6 | 1 | yes | wild fig-tree, Ficus Caprificus, |
| ὀφθαλμός | 118 | 1 | yes | eye |
| δείπνηστος | 1 | 1 | yes | meal-time, |
| πεντακόσιοι | 1 | 1 | yes | five hundred |
| χίμαιρα | 1 | 1 | yes | she-goat, |
| ὀκρυόεις | 2 | 1 | yes | chilling, horrible, |
| σκαιός | 4 | 1 | no | left, on the left hand |
| θη~λυς | 1 | 1 | yes | female |
| κοίρανος | 8 | 1 | no | king, |
| Ἀφροδίτη | 41 | 1 | no | Aphrodite, |
| ἐμβάλλω | 39 | 1 | yes | throw in |
| ἐκκυλίνδω | 2 | 1 | no | roll out, |
| ἀσφαλής | 8 | 1 | yes | not liable to fall, immovable, steadfast, |
| ἰλαδόν | 1 | 1 | yes | in troops |
| ἀγανός | 16 | 1 | yes | mild, gentle, |
| θύος | 3 | 1 | yes | burnt sacrifice |
| πολυπενθής | 2 | 1 | yes | much-mourning, |
| στερέω | 1 | 1 | yes | deprive, bereave, rob |
| ἀγοστός | 5 | 1 | yes | flat of the hand |
| μολπή | 9 | 3 | yes | song |
| ἑκάστοθι | 1 | 2 | yes | every one, |

## Method notes and known limits

- Matching strips accents and breathings, so accent pairs merge (εἰμί/εἶμι, τίς/τις, ἅλς). Candidates stay in LSJ order; where the merge put the wrong headword first, the choice was taken from the right entry where one existed (e.g. εἶμι → "go, depart").
- Glosses are copied exactly, so LSJ's trailing commas and full stops remain ("ship,"). Strip them in a separate script step if wanted.
- For the choice step each lemma showed up to 25 unique candidates; long texts and long rows were cut for display, and in the low-frequency tail (count ≤ ~10) only the first one to three candidates were fully visible. Most tail choices are candidate 1. Spot-check the sample and the `name` flag first.
- Several high-frequency verbs and adverbs got no candidate because LSJ files them under another headword or gives glosses without <tr> tags (εἶδον, οἶδα, ἕπομαι, μίγνυμι, ἠέλιος, μάλιστα). They are in the hand-gloss list above.
- Some capitalised lemmas were glossed with LSJ's etymology rather than the name (e.g. Μηδεσικάστη "adorned with prudence"). Filter on `name` to review these.
- All 27 LSJ files and both treebank files downloaded without error (no 404s).

## Attribution

Glosses from A Greek-English Lexicon (Liddell, Scott, Jones), Perseus Digital Library, CC BY-SA 4.0, https://github.com/PerseusDL/lexica ; lemmas from the Ancient Greek Dependency Treebank 2.1, CC BY-SA 3.0, https://github.com/PerseusDL/treebank_data
