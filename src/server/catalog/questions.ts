import { Question } from '../types.js';

export const QUESTION_CATALOG: Question[] = [
  // 1. TEBAK_JUDUL (Normal 100)
  {
    id: 'Q001',
    category: 'TEBAK_JUDUL',
    difficulty: 'NORMAL',
    prompt: 'Lagu hits 2012 tentang seseorang yang merasa hampa dan jiwanya tertinggal bersama sang kekasih.',
    hint: 'Dibawakan oleh Ariel bersama band barunya setelah berganti nama dari Peterpan.',
    expectedTitle: 'Separuh Aku',
    expectedArtist: 'Noah',
    titleAliases: ['Separuh Aku', 'Separuhku'],
    artistAliases: ['Noah', 'Noa', 'Peterpan'],
    year: 2012,
    releaseEra: '2010s',
    points: 100
  },
  {
    id: 'Q002',
    category: 'TEBAK_JUDUL',
    difficulty: 'NORMAL',
    prompt: 'Lagu cinta legendaris 1999 tentang kerinduan mendalam saat melintasi jalanan kota Jogja.',
    hint: 'Band asal Yogyakarta beranggotakan Duta dan Eross.',
    expectedTitle: 'Dan',
    expectedArtist: 'Sheila on 7',
    titleAliases: ['Dan'],
    artistAliases: ['Sheila on 7', 'Sheila on Seven', 'SO7'],
    year: 1999,
    releaseEra: '1990s',
    points: 100
  },
  {
    id: 'Q003',
    category: 'TEBAK_JUDUL',
    difficulty: 'NORMAL',
    prompt: 'Lagu balada cinta abadi ciptaan Ahmad Dhani dengan intro piano megah yang dirilis pada album Bintang Lima (2000).',
    hint: 'Vokal Once Mekel dengan lirik "Bila cinta tak terbalas..."',
    expectedTitle: 'Pupus',
    expectedArtist: 'Dewa 19',
    titleAliases: ['Pupus'],
    artistAliases: ['Dewa 19', 'Dewa', 'Dewa19'],
    year: 2000,
    releaseEra: '2000s',
    points: 100
  },

  // 2. TEBAK_PENYANYI (Normal 100)
  {
    id: 'Q004',
    category: 'TEBAK_PENYANYI',
    difficulty: 'NORMAL',
    prompt: 'Siapakah penyanyi solo legendaris di balik lagu mahakarya "Kala Cinta Menggoda" dan "Pergilah Kasih"?',
    hint: 'Penyanyi legendaris Indonesia berjuluk The Living Legend yang wafat tahun 2007.',
    expectedTitle: 'Pergilah Kasih',
    expectedArtist: 'Chrisye',
    titleAliases: ['Pergilah Kasih', 'Kala Cinta Menggoda'],
    artistAliases: ['Chrisye', 'Krisye'],
    year: 1989,
    releaseEra: '1980s',
    points: 100
  },
  {
    id: 'Q005',
    category: 'TEBAK_PENYANYI',
    difficulty: 'NORMAL',
    prompt: 'Lady Rocker legendaris era 90-an yang mempopulerkan tembang "Bintang Kehidupan" dan "Seberkas Sinar".',
    hint: 'Penyanyi muda asal Ciamis yang wafat di puncak popularitas pada usia 19 tahun.',
    expectedTitle: 'Bintang Kehidupan',
    expectedArtist: 'Nike Ardilla',
    titleAliases: ['Bintang Kehidupan', 'Seberkas Sinar'],
    artistAliases: ['Nike Ardilla', 'Nike Ardila'],
    year: 1990,
    releaseEra: '1990s',
    points: 100
  },

  // 3. TEKA_TEKI (Hard 200)
  {
    id: 'Q006',
    category: 'TEKA_TEKI',
    difficulty: 'HARD',
    prompt: 'Bukan bunga mawar, bukan melati. Bunga apa dalam lagu Slank yang mekar di tepi jalanan ibu kota?',
    hint: 'Tembang akustik manis dari album Generasi Biru (1994).',
    expectedTitle: 'Terbunuh Sepi',
    expectedArtist: 'Slank',
    titleAliases: ['Bunga Terakhir', 'Terbunuh Sepi', 'Bunga'],
    artistAliases: ['Slank'],
    year: 1994,
    releaseEra: '1990s',
    points: 200
  },
  {
    id: 'Q007',
    category: 'TEKA_TEKI',
    difficulty: 'HARD',
    prompt: 'Nama serangga malam bercahaya dijadikan judul lagu cinta syahdu oleh grup musik Padi di album Sesuatu yang Tertunda.',
    hint: 'Serangga yang bersinar dalam kegelapan malam.',
    expectedTitle: 'Menanti Sebuah Jawaban',
    expectedArtist: 'Padi',
    titleAliases: ['Menanti Sebuah Jawaban', 'Kasih Tak Sampai'],
    artistAliases: ['Padi', 'Padi Reborn'],
    year: 2001,
    releaseEra: '2000s',
    points: 200
  },

  // 4. TRIVIA (Hard 200)
  {
    id: 'Q008',
    category: 'TRIVIA',
    difficulty: 'HARD',
    prompt: 'Lagu rock legendaris God Bless tahun 1988 yang mengingatkan manusia bahwa dunia ini hanya pentas sandiwara panggung belaka.',
    hint: 'Ciptaan Ian Antono dan Taufik Ismail.',
    expectedTitle: 'Panggung Sandiwara',
    expectedArtist: 'God Bless',
    titleAliases: ['Panggung Sandiwara', 'Dunia Panggung Sandiwara'],
    artistAliases: ['God Bless', 'Godbless'],
    year: 1988,
    releaseEra: '1980s',
    points: 200
  },
  {
    id: 'Q009',
    category: 'TRIVIA',
    difficulty: 'HARD',
    prompt: 'Lagu puitis KLa Project rilisan 1992 yang melukiskan kenangan romantis bersama secangkir kopi di stasiun Tugu.',
    hint: 'Judulnya merupakan nama kawasan jalan paling terkenal di Yogyakarta.',
    expectedTitle: 'Yogyakarta',
    expectedArtist: 'KLa Project',
    titleAliases: ['Yogyakarta', 'Jogja'],
    artistAliases: ['KLa Project', 'Kla Project', 'KLA'],
    year: 1990,
    releaseEra: '1990s',
    points: 200
  },

  // 5. TEBAK_ERA (Expert 300)
  {
    id: 'Q010',
    category: 'TEBAK_ERA',
    difficulty: 'EXPERT',
    prompt: 'Tahun 1979 Ebiet G. Ade merilis balada alam legendaris terinspirasi bencana letusan Kawah Sinila & gas beracun di Dieng.',
    hint: 'Lirik bertutur dialog dengan rumput yang bergoyang.',
    expectedTitle: 'Berita Kepada Kawan',
    expectedArtist: 'Ebiet G. Ade',
    titleAliases: ['Berita Kepada Kawan', 'Kepada Kawan'],
    artistAliases: ['Ebiet G. Ade', 'Ebiet G Ade', 'Ebiet'],
    year: 1979,
    releaseEra: '1970s',
    points: 300
  },

  // 6. EMOJI_PUZZLE (Normal 100)
  {
    id: 'Q011',
    category: 'EMOJI_PUZZLE',
    difficulty: 'NORMAL',
    prompt: 'Tebak lagu dari emoji berikut: 🌧️ 🎸 💔 ➡️ Lagu cinta galau legendaris Jamrud di album Ningrat.',
    hint: 'Lagu pelipur lara saat malam minggu hujan dan sepi.',
    expectedTitle: 'Pelangi di Matamu',
    expectedArtist: 'Jamrud',
    titleAliases: ['Pelangi di Matamu', 'Pelangi Dimatamu'],
    artistAliases: ['Jamrud'],
    year: 2000,
    releaseEra: '2000s',
    points: 100
  },
  {
    id: 'Q012',
    category: 'EMOJI_PUZZLE',
    difficulty: 'NORMAL',
    prompt: 'Tebak lagu dari emoji: ✈️ 💌 😢 ➡️ Lagu perpisahan Dewa 19 saat Ari Lasso pamit pergi jauh melintasi samudra.',
    hint: 'Tembang dari album Pandawa Lima (1997).',
    expectedTitle: 'Kangen',
    expectedArtist: 'Dewa 19',
    titleAliases: ['Kangen', 'Ku Ingin Kau Datang'],
    artistAliases: ['Dewa 19', 'Dewa'],
    year: 1992,
    releaseEra: '1990s',
    points: 100
  },

  // 7. NOSTALGIA_80S (Normal 100)
  {
    id: 'Q013',
    category: 'NOSTALGIA_80S',
    difficulty: 'NORMAL',
    prompt: 'Tembang pop manis era 1987 yang dinyanyikan Betharia Sonata tentang hati wanita yang terluka dan enggan menangis lagi.',
    hint: 'Lirik khas: "Jangan sebut namaku lagi..."',
    expectedTitle: 'Hati yang Luka',
    expectedArtist: 'Betharia Sonata',
    titleAliases: ['Hati yang Luka', 'Hati Yang Terluka'],
    artistAliases: ['Betharia Sonata', 'Betharia'],
    year: 1987,
    releaseEra: '1980s',
    points: 100
  },

  // 8. NOSTALGIA_90S (Normal 100)
  {
    id: 'Q014',
    category: 'NOSTALGIA_90S',
    difficulty: 'NORMAL',
    prompt: 'Slow rock melayu 1996 asal Malaysia yang meledak di radio-radio Indonesia dibawakan oleh grup band Slam.',
    hint: 'Vokalis Zamani dengan judul tentang rintik hujan.',
    expectedTitle: 'Gerimis Mengundang',
    expectedArtist: 'Slam',
    titleAliases: ['Gerimis Mengundang'],
    artistAliases: ['Slam', 'Kumpulan Slam'],
    year: 1996,
    releaseEra: '1990s',
    points: 100
  },

  // 9. NOSTALGIA_2000S (Normal 100)
  {
    id: 'Q015',
    category: 'NOSTALGIA_2000S',
    difficulty: 'NORMAL',
    prompt: 'Lagu pop akustik 2006 tentang cinta sejati yang tak menuntut kesempurnaan ciptaan band Letto.',
    hint: 'Vokal Noe dengan nuansa keyboard hangat dan petikan gitar.',
    expectedTitle: 'Ruang Rindu',
    expectedArtist: 'Letto',
    titleAliases: ['Ruang Rindu'],
    artistAliases: ['Letto'],
    year: 2005,
    releaseEra: '2000s',
    points: 100
  },

  // 10. PILIHAN_GANDA (Normal 100)
  {
    id: 'Q016',
    category: 'PILIHAN_GANDA',
    difficulty: 'NORMAL',
    prompt: 'Manakah lagu hits Iwan Fals yang bercerita tentang pengorbanan supir truk dan penderitaan rakyat kecil? A. Bento | B. Bongkar | C. Sore Tugu Pancoran | D. Galang Rambu Anarki',
    hint: 'Lagu sendu tentang anak kecil yang menjual koran di bawah terik matahari.',
    expectedTitle: 'Sore Tugu Pancoran',
    expectedArtist: 'Iwan Fals',
    titleAliases: ['Sore Tugu Pancoran', 'Tugu Pancoran', 'C'],
    artistAliases: ['Iwan Fals', 'Iwan'],
    options: ['Bento', 'Bongkar', 'Sore Tugu Pancoran', 'Galang Rambu Anarki'],
    year: 1985,
    releaseEra: '1980s',
    points: 100
  },

  // 11. SPECIAL_CHALLENGE (Special 250)
  {
    id: 'Q017',
    category: 'SPECIAL_CHALLENGE',
    difficulty: 'SPECIAL',
    prompt: '🔥 SPECIAL CHALLENGE (+250 VP): Kolaborasi akbar 2004 antara Chrisye dan band pop asal Bandung dalam album Senyawa!',
    hint: 'Lagu megah tentang menari bersama bidadari di bawah gemintang.',
    expectedTitle: 'Menari Bersama',
    expectedArtist: 'Chrisye',
    titleAliases: ['Menari Bersama', 'Menari Bersamaku'],
    artistAliases: ['Chrisye', 'Chrisye feat Peterpan'],
    year: 2004,
    releaseEra: '2000s',
    points: 250
  },
  {
    id: 'Q018',
    category: 'SPECIAL_CHALLENGE',
    difficulty: 'SPECIAL',
    prompt: '🔥 SPECIAL CHALLENGE (+250 VP): Lagu rock progresif legendaris 1975 karya Benny Soebardja & Shark Move / Giant Step dengan solo gitar epik.',
    hint: 'Salah satu pelopor psych-rock Indonesia era 70-an.',
    expectedTitle: 'Apatis',
    expectedArtist: 'Benny Soebardja',
    titleAliases: ['Apatis', 'My Life'],
    artistAliases: ['Benny Soebardja', 'Giant Step'],
    year: 1975,
    releaseEra: '1970s',
    points: 250
  }
];

