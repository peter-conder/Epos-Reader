export const ROMANS = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
  'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV'
];
const GREEK_UPPER = [...'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'];   // Iliad Books
const GREEK_LOWER = [...'αβγδεζηθικλμνξοπρστυφχψω'];   // Odyssey Books



export const WORKS = {
  aeneid: {
    title: 'The Aeneid',
    abbr: 'Aen.',
    numerals: ROMANS,   // how its Books are shown (see BOOK NUMBERS below)
    poet: 'Vergil',
    language: 'Classical Latin',
    shortLanguage: 'Latin',
    formLabel: 'Classical Latin Form',
    lexicon: 'latin',   // data2/lexicon/<name>.json
    bookCount: 12,
    lines: [
      'Arma virumque cano, Troiae qui primus ab oris',
      'Italiam, fato profugus, Laviniaque venit',
      'litora, multum ille et terris iactatus et alto',
      'vi superum saevae memorem Iunonis ob iram;',
      'multa quoque et bello passus, dum conderet urbem,',
      'inferretque deos Latio, genus unde Latinum,',
      'Albanique patres, atque altae moenia Romae.',
      'Musa, mihi causas memora, quo numine laeso,',
      'quidve dolens, regina deum tot volvere casus',
      'insignem pietate virum, tot adire labores',
      'impulerit. Tantaene animis caelestibus irae?',
      'Urbs antiqua fuit, Tyrii tenuere coloni,',
      'Karthago, Italiam contra Tiberinaque longe',
      'ostia, dives opum studiisque asperrima belli;',
      'quam Iuno fertur terris magis omnibus unam',
      'posthabita coluisse Samo; hic illius arma.'
    ],
    translations: [
      'I sing of arms and the man, who first from the shores of Troy',
      'driven by fate, came to Italy and the Lavinian shores,',
      'much tossed about both on land and on the deep',
      'by the power of the gods, on account of the mindful anger of savage Juno;',
      'and having suffered many hardships also in war, until he could found a city,',
      'and bring his gods to Latium; whence came the Latin race,',
      'and the Alban fathers, and the walls of lofty Rome.',
      'O Muse, recount to me the causes, by what divine majesty wounded,',
      'or grieving at what, the queen of the gods compelled a man renowned for piety',
      'to undergo so many misfortunes, to enter into so many trials.',
      'Can there be such resentful fury in heavenly minds?',
      'An ancient city once stood, settled by Tyrian colonists,',
      'Carthage, facing Italy and the Tiber mouths from afar,',
      'rich in resources and fierce in the pursuits of war;',
      'which alone, they say, Juno cherished more than all other lands,',
      'holding even Samos second; here were her arms and armor.'
    ]
  },
  iliad: {
    title: 'The Iliad',
    abbr: 'Il.',
    numerals: GREEK_UPPER,
    poet: 'Homer',
    language: 'Ancient Greek',
    shortLanguage: 'Greek',
    formLabel: 'Homeric Greek Form',
    lexicon: 'greek',
    bookCount: 24,
    lines: [
      'Μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος',
      'οὐλομένην, ἣ μυρί᾽ Ἀχαιοῖς ἄλγε᾽ ἔθηκε,',
      'πολλὰς δ᾽ ἰφθίμους ψυχὰς Ἄϊδι προΐαψεν',
      'ἡρώων, αὐτοὺς δὲ ἑλώρια τεῦχε κύνεσσιν',
      'οἰωνοῖσί τε πᾶσι, Διὸς δ᾽ ἐτελείετο βουλή,',
      'ἐξ οὗ δὴ τὰ πρῶτα διαστήτην ἐρίσαντε',
      'Ἀτρεΐδης τε ἄναξ ἀνδρῶν καὶ δῖος Ἀχιλλεύς.',
      'Τίς τ᾽ ἄρ σφωε θεῶν ἔριδι ξυνέηκε μάχεσθαι;',
      'Λητοῦς καὶ Διὸς υἱός· ὃ γὰρ βασιλῆϊ χολωθεὶς',
      'νοῦσον ἀνὰ στρατὸν ὦρσε κακήν, ὀλέκοντο δὲ λαοί,',
      'οὕνεκα τὸν Χρύσην ἠτίμασεν ἀρητῆρα',
      'Ἀτρεΐδης· ὃ γὰρ ἦλθε θοὰς ἐπὶ νῆας Ἀχαιῶν',
      'λυσόμενός τε θύγατρα φέρων τ᾽ ἀπερείσι᾽ ἄποινα,',
      'στέμματ᾽ ἔχων ἐν χερσὶν ἑκηβόλου Ἀπόλλωνος',
      'χρυσέῳ ἀνὰ σκήπτρῳ, καὶ λίσσετο πάντας Ἀχαιούς,',
      'Ἀτρεΐδα δὲ μάλιστα δύω, κοσμήτορε λαῶν.'
    ],
    translations: [
      'Sing, goddess, the wrath of Achilles, son of Peleus,',
      'destructive, which brought countless woes upon the Achaeans,',
      'and hurled down to Hades many valiant souls',
      'of heroes, and made them prey for dogs',
      'and all birds of prey, while the will of Zeus was fulfilled,',
      'from the day when first they stood divided in strife,',
      'the son of Atreus, lord of men, and godlike Achilles.',
      'Which of the gods then provoked them to clash in bitter conflict?',
      'The son of Leto and Zeus; for in anger at the king',
      'he stirred up a foul plague throughout the army, and the people perished,',
      'because the son of Atreus had dishonored Chryses the priest;',
      'for he had come to the swift ships of the Achaeans',
      'to ransom his daughter, bearing boundless ransom,',
      'holding in his hands the fillets of far-shooting Apollo',
      'upon a golden staff, and beseeched all the Achaeans,',
      'and chief of all the two sons of Atreus, marshals of the host.'
    ]
  },
  odyssey: {
    title: 'The Odyssey',
    abbr: 'Od.',
    numerals: GREEK_LOWER,
    poet: 'Homer',
    language: 'Ancient Greek',
    shortLanguage: 'Greek',
    formLabel: 'Homeric Greek Form',
    lexicon: 'greek',
    bookCount: 24,
    lines: [
      'Ἄνδρα μοι ἔννεπε, Μοῦσα, πολύτροπον, ὃς μάλα πολλὰ',
      'πλάγχθη, ἐπεὶ Τροίης ἱερὸν πτολίεθρον ἔπερσε·',
      'πολλῶν δ᾽ ἀνθρώπων ἴδεν ἄστεα καὶ νόον ἔγνω,',
      'πολλὰ δ᾽ ὅ γ᾽ ἐν πόντῳ πάθεν ἄλγεα ὃν κατὰ θυμόν,',
      'ἀρνύμενος ἥν τε ψυχὴν καὶ νόστον ἑταίρων.',
      'Ἀλλ᾽ οὐδ᾽ ὣς ἑτάρους ἐρρύσατο, ἱέμενός περ·',
      'αὐτῶν γὰρ σφετέρῃσιν ἀτασθαλίῃσιν ὄλοντο,',
      'νήπιοι, οἳ κατὰ βοῦς Ὑπερίονος Ἠελίοιο',
      'ἤσθιον· αὐτὰρ ὁ τοῖσιν ἀφείλετο νόστιμον ἦμαρ.',
      'Τῶν ἁμόθεν γε, θεά, θύγατερ Διός, εἰπὲ καὶ ἡμῖν.',
      'Ἔνθ᾽ ἄλλοι μὲν πάντες, ὅσοι φύγον αἰπὺν ὄλεθρον,',
      'οἴκοι ἔσαν, πόλεμόν τε πεφευγότες ἠδὲ θάλασσαν·',
      'τὸν δ᾽ οἶον νόστου κεχρημένον ἠδὲ γυναικὸς',
      'νύμφη πότνι᾽ ἔρυκε Καλυψὼ δῖα θεάων',
      'ἐν σπέσσι γλαφυροῖσι, λιλαιομένη πόσιν εἶναι.',
      'Ἀλλ᾽ ὅτε δὴ ἔτος ἦλθε περιπλομένων ἐνιαυτῶν.'
    ],
    translations: [
      'Tell me, O Muse, of the man of many turns, who wander\'d far',
      'and wide, after he sacked the sacred citadel of Troy;',
      'he saw the cities of many men and learned their minds,',
      'and suffered many griefs upon the deep within his heart,',
      'striving to preserve his own life and the homecoming of his companions.',
      'Yet even so he could not save his comrades, eager though he was;',
      'for by their own recklessness they were destroyed,',
      'fools, who devoured the cattle of Hyperion the Sun God;',
      'and he took away the day of their homecoming.',
      'Of these things, goddess, daughter of Zeus, speak also to us.',
      'Now all the rest, as many as fled steep destruction,',
      'were at home, having escaped both war and sea;',
      'him alone, yearning for his homeland and for his wife,',
      'the queenly nymph Calypso, bright among goddesses, detained',
      'within hollow caves, longing that he should be her husband.',
      'Yet when the year came round in the circling courses of time.'
    ]
  }
};

/* ==========================================================
   BOOK NUMBERS AND CITATIONS
   A tab, Note or Bookmark stores its Book as a Roman numeral ('I'…'XXIV'), and data files are numbered
   01.json…24.json. What the reader sees follows each Work's own tradition (CONTEXT.md, "Book"):
   Roman for the Aeneid, Greek capitals for the Iliad, Greek lower case for the Odyssey.
   ========================================================== */
export const RANGE_DASH = '–';   // between the first and last Line of a range, as in "I.1–25"

/* The Book number as the reader sees it, e.g. bookLabel('iliad', 'I') → 'Α' */
export const bookLabel = (workKey, roman) => WORKS[workKey].numerals[ROMANS.indexOf(roman)];

/* The Work's name without "The", e.g. "Aeneid" */
export const workName = (workKey) => WORKS[workKey].title.replace(/^The /, '');

/* A Book named in full, e.g. "Iliad · Book Α" */
export const bookTitle = (workKey, roman) => `${workName(workKey)} · Book ${bookLabel(workKey, roman)}`;

/* The part of a Citation after the Work, e.g. "Α.1–25"; lines is optional */
export const bookRef = (workKey, roman, lines = '') => `${bookLabel(workKey, roman)}${lines ? `.${lines}` : ''}`;

/* A Citation (CONTEXT.md): "Aeneid I.1–25", or "Aen. I.1–25" with short: true */
export const citation = (workKey, roman, lines = '', { short = false } = {}) =>
  `${short ? WORKS[workKey].abbr : workName(workKey)} ${bookRef(workKey, roman, lines)}`;

/* ==========================================================
   SOURCES AND CREDITS (the Settings & Sources page)
   A Source (CONTEXT.md) is an outside project Epos Reader takes text, Translation, Lemmas, definitions or Scansion
   from. Credits are everything else the app uses: the Home paintings, the fonts and hand-written glosses.
   The README's "Sources and credits" is a hand-kept copy of these lists: change both together.
   ========================================================== */
const PERSEUS = { name: 'Perseus Digital Library', url: 'https://www.perseus.tufts.edu', by: 'Tufts University' };
const HYPOTACTIC = { name: 'Hypotactic', url: 'https://hypotactic.com', by: 'David Chamberlain' };
const LICENCES = {
  'CC BY-NC-SA 4.0': 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/'
};
export const licenceUrl = (licence) => LICENCES[licence];

/* Each item: what it supplies, the Source (name, link, who made it), a note, and its licence where one is stated */
export const SOURCES = [
  { language: 'Latin', works: 'Aeneid', items: [
    { what: 'Text', ...PERSEUS },
    { what: 'Lemmas and Morphology', name: 'LASLA corpus', url: 'https://lila-erc.eu', by: 'via LiLa: Linking Latin', licence: 'CC BY-NC-SA 4.0' },
    { what: 'Definitions', name: "Whitaker's Words", url: 'https://archives.nd.edu/words.html', by: 'William Whitaker' },
    { what: 'Scansion', ...HYPOTACTIC }
  ] },
  { language: 'Greek', works: 'Iliad and Odyssey', items: [
    { what: 'Text', ...HYPOTACTIC, note: 'Checked against the Perseus Digital Library text in the Ancient Greek Dependency Treebank' },
    { what: 'Lemmas and Morphology', name: 'Ancient Greek Dependency Treebank 2.1', url: 'https://github.com/PerseusDL/treebank_data', by: 'Perseus Digital Library', licence: 'CC BY-SA 3.0' },
    { what: 'Definitions', name: 'A Greek-English Lexicon', url: 'https://github.com/PerseusDL/lexica', by: 'Liddell, Scott, Jones (Perseus Digital Library)', licence: 'CC BY-SA 4.0' },
    { what: 'Scansion', ...HYPOTACTIC }
  ] },
  { language: 'English', works: 'Parallel translation', items: [
    { what: 'Translation', name: 'Credit to be added', url: 'https://github.com/peter-conder/Epos-Reader/issues/5',
      note: 'The English so far covers Aeneid I.1–16 and a few sample Lines. The full Translation, and its credit, are coming.' }
  ] }
];

/* What the share-alike and non-commercial licences above mean for Epos Reader */
export const LICENCE_NOTES = [
  'The Latin Lemma data is CC BY-NC-SA 4.0, so Epos Reader is non-commercial, and anything built from that data must be shared under the same licence.',
  'The Greek Lemma data and the Lexicon definitions are share-alike (CC BY-SA), so anything built from them must be shared under the same terms.',
  "The code is released under the MIT Licence. The data keeps its Sources' own licences."
];

export const CREDITS = [
  { group: 'Paintings on Home', items: [
    { what: 'Aeneid', name: 'Aeneas Carrying Anchises', by: 'Carle van Loo, 1729 · Musée du Louvre, Paris',
      url: 'https://smartify.org/artworks/charles-andre-known-as-carle-vanloo-aeneas-carrying-anchises' },
    { what: 'Iliad', name: "Priam Begging Achilles for the Return of Hector's Body", by: 'Alexander Ivanov, 1824',
      url: 'https://en.wikipedia.org/wiki/A._A._Ivanov' },
    { what: 'Odyssey', name: "Ulysses deriding Polyphemus – Homer's Odyssey", by: 'J. M. W. Turner, 1829 · The National Gallery, London',
      url: 'https://www.nationalgallery.org.uk/paintings/joseph-mallord-william-turner-ulysses-deriding-polyphemus-homer-s-odyssey' }
  ] },
  { group: 'Fonts', items: [
    { what: 'Interface & default reading', name: 'Roboto', url: 'https://fonts.google.com/specimen/Roboto', by: 'Google Fonts' },
    { what: 'Serif reading option (Latin & Greek)', name: 'Gentium Plus', url: 'https://software.sil.org/gentium/', by: 'SIL International, served by Google Fonts' }
  ] },
  { group: 'Hand-written glosses', items: [
    { what: 'Greek definitions', name: 'Short glosses for some Homeric Lemmas', by: 'written by the author',
      note: 'Where there is one, it is shown in place of the LSJ definition.' }
  ] }
];
