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
/* The Translation's Perseus files, at the versions tools/translation builds from */
const PERSEUS_GREEK = 'https://github.com/PerseusDL/canonical-greekLit/blob/6d7829caf172d43a109e89f918dfb18fbf48e3d1/data/tlg0012';
const PERSEUS_LATIN = 'https://github.com/PerseusDL/canonical-latinLit/blob/73723c273e0a3da6189d0fe09c0e6d724d87376b/data/phi0690';
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
  { language: 'English', works: 'Translation', items: [
    { what: 'Iliad', name: 'The Iliad, tr. A. T. Murray', url: `${PERSEUS_GREEK}/tlg001/tlg0012.tlg001.perseus-eng3.xml`,
      by: 'Loeb Classical Library, 1924–25 · Perseus Digital Library', licence: 'CC BY-SA 4.0',
      note: 'Typos fixed in the Perseus text are listed in tools/translation/corrections.csv.' },
    { what: 'Odyssey', name: 'The Odyssey, tr. A. T. Murray', url: `${PERSEUS_GREEK}/tlg002/tlg0012.tlg002.perseus-eng3.xml`,
      by: 'Loeb Classical Library, 1919 · Perseus Digital Library', licence: 'CC BY-SA 4.0' },
    { what: 'Aeneid', name: 'The Aeneid of Virgil, tr. Theodore C. Williams', url: `${PERSEUS_LATIN}/phi003/phi0690.phi003.perseus-eng2.xml`,
      by: 'Houghton Mifflin, 1910 · Perseus Digital Library', licence: 'CC BY-SA 4.0',
      note: 'Typos fixed in the Perseus text are listed in tools/translation/corrections.csv.' }
  ] }
];

/* What the share-alike and non-commercial licences above mean for Epos Reader */
export const LICENCE_NOTES = [
  'The Latin Lemma data is CC BY-NC-SA 4.0, so Epos Reader is non-commercial, and anything built from that data must be shared under the same licence.',
  'The Greek Lemma data, the Lexicon definitions and the Translation are share-alike (CC BY-SA), so anything built from them must be shared under the same terms.',
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
    { what: 'Latin and Greek', name: 'Gentium Plus', url: 'https://software.sil.org/gentium/', by: 'SIL International, served by Google Fonts' },
    { what: 'Everything else', name: 'Roboto', url: 'https://fonts.google.com/specimen/Roboto', by: 'Google Fonts' }
  ] },
  { group: 'Hand-written glosses', items: [
    { what: 'Greek definitions', name: 'Short glosses for some Homeric Lemmas', by: 'written by the author',
      note: 'Where there is one, it is shown in place of the LSJ definition.' }
  ] }
];
