export const MASTERY_LEVELS = [
  { id: 0, name: 'New',       color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  { id: 1, name: 'Learning',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  { id: 2, name: 'Familiar',  color: '#eab308', bg: 'rgba(234,179,8,0.12)'   },
  { id: 3, name: 'Practiced', color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  { id: 4, name: 'Mastered',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
];

export const QUIZ_MODES = [
  { id: 0, label: 'Hanzi → Meaning', question: 'What does this mean?',         show: 'hanzi',   answer: 'meaning' },
  { id: 1, label: 'Meaning → Hanzi', question: 'Which character is this?',     show: 'meaning', answer: 'hanzi'   },
  { id: 2, label: 'Pinyin → Hanzi',  question: 'Which character matches?',     show: 'pinyin',  answer: 'hanzi'   },
  { id: 3, label: 'Hanzi → Pinyin',  question: 'What is the pinyin?',          show: 'hanzi',   answer: 'pinyin'  },
];

export const QUIZ_TYPE_OPTIONS = [
  { id: 'mix', label: 'Mix',             short: 'Mix'   },
  { id: '0',   label: 'Hanzi → Meaning', short: 'H→M'   },
  { id: '3',   label: 'Hanzi → Pinyin',  short: 'H→Pin' },
  { id: '1',   label: 'Meaning → Hanzi', short: 'M→H'   },
  { id: '2',   label: 'Pinyin → Hanzi',  short: 'Pin→H' },
];
