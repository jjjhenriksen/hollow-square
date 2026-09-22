'use strict';

/*
 * Hollow Square is intentionally a small static game. The tune list and page
 * references are inherited from the prototype. Each playable line remains a
 * short opening, while the optional harmony layer is sourced from the actual
 * four-part opening so the class can be heard as an ensemble.
 */
const SCALE = [0, 2, 4, 5, 7, 9, 11];
const SYLLABLES = ['fa', 'sol', 'la', 'fa', 'sol', 'la', 'mi'];
const SHAPES = {
  fa: { key: 'F', label: 'fa', className: 'fa' },
  sol: { key: 'S', label: 'sol', className: 'sol' },
  la: { key: 'L', label: 'la', className: 'la' },
  mi: { key: 'M', label: 'mi', className: 'mi' },
  rest: { key: 'SPACE', label: 'keep silent', className: 'rest' }
};
const ATLAS_BASE_URL = 'https://shapenote.jacquelinehenriksen.com/atlas/';

function mod7(value) { return ((value % 7) + 7) % 7; }
function syllableOf(degree) { return SYLLABLES[mod7(degree)]; }
const DIATONIC_STEP_BY_PITCH_CLASS = { 0: 0, 1: 0, 2: 1, 3: 1, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 6, 11: 6 };
function staffStepFromMidi(midi) {
  if (midi === null || midi === undefined) return 0;
  const octave = Math.floor(midi / 12) - 1;
  return octave * 7 + DIATONIC_STEP_BY_PITCH_CLASS[((midi % 12) + 12) % 12];
}
function phraseFrom(incipit, mode = 'major', silentAt = []) {
  const offset = mode === 'minor' ? -3 : -1;
  const notes = [];
  incipit.trim().split(/\s+/).forEach((group, groupIndex) => {
    [...group.replace(/\D/g, '')].forEach((digit, groupNoteIndex) => {
      const index = notes.length;
      notes.push({
        degree: Number(digit) + offset,
        silent: silentAt.includes(index),
        barBefore: groupIndex > 0 && groupNoteIndex === 0
      });
    });
  });
  notes[notes.length - 1].held = true;
  return notes;
}

// keySignature is the written source signature. It is not the same as the
// practical pitch a Sacred Harp class may choose when keying a song.
const TUNES = [
  { num: '45 t', sourceId: '45t', atlasId: 'sh 45t — New Britain', name: 'NEW BRITAIN.', meter: 'C. M.', timeSignature: '3/4', keySignature: 'C Major', attr: 'Arr. The Southern Harmony, 1835.', mode: 'major', lyric: 'Amazing grace! how sweet the sound, That saved a wretch like me!', session: 'morning session', incipit: '51313 21655 13132', smudge: [], storyAsset: 'story-01-meetinghouse.jpg', scene: 'The first page is clean. The class sounds the line once, and the room settles around it.', illustrationAlt: 'A hand-inked meetinghouse with four benches gathered around an empty square.' },
  { num: '59', sourceId: '59', atlasId: 'sh 59 — Holy Manna', name: 'HOLY MANNA.', meter: '8s & 7s D.', timeSignature: '4/4', keySignature: 'C Major', attr: 'Arr. William Moore, 1825.', mode: 'major', lyric: 'Brethren, we have met to worship, And adore the Lord our God.', session: 'late morning', incipit: '55611 22132 11656', smudge: [], storyAsset: 'story-02-wrong-pages.jpg', scene: 'No one turns a page. Still, every book is open to a different song.', illustrationAlt: 'Several worn songbooks open to different pages on a long singing-school bench.' },
  { num: '38 b', sourceId: '38bd', atlasId: 'sh 38b — Windham', name: 'WINDHAM.', meter: 'L. M.', timeSignature: '4/4', keySignature: 'E Minor', attr: 'Daniel Read, 1785.', mode: 'minor', lyric: 'Broad is the road that leads to death, And thousands walk together there.', session: 'dinner on the grounds', incipit: '13455 32113 23543', smudge: [3], storyAsset: 'story-03-thumbprint.jpg', scene: 'A dark thumbprint lies where the fourth note ought to be. The chairman does not look at it.', illustrationAlt: 'A dark thumbprint obscures a line of music in a worn ink illustration.' },
  { num: '155', sourceId: '155', atlasId: 'sh 155 — Northfield', name: 'NORTHFIELD.', meter: 'C. M.', timeSignature: '4/4', keySignature: 'B♭ Major', attr: 'Jeremiah Ingalls, 1800.', mode: 'major', lyric: 'How long, dear Savior, O how long Shall this bright hour delay?', session: 'memorial lesson', incipit: '15435 13223 32121', smudge: [3], storyAsset: 'story-04-empty-chair.jpg', scene: 'The empty chair has moved closer. Its varnish is warm, as if someone has just left it.', illustrationAlt: 'An empty wooden chair pulled close to a hollow square of benches.' },
  { num: '47 b', sourceId: '47bd', atlasId: 'sh 47b — Idumea', name: 'IDUMEA.', meter: 'S. M.', timeSignature: '3/2', keySignature: 'A Minor', attr: 'Ananias Davisson, 1816.', mode: 'minor', lyric: 'And am I born to die? To lay this body down?', session: 'for the departed', incipit: '11713 43157 54345', smudge: [3, 6], storyAsset: 'story-05-pencil-note.jpg', scene: 'The pencil note in the margin says: sing the shape you remember. The handwriting is yours.', illustrationAlt: 'A worn pencil note in a songbook margin beside a darkened music line.' },
  { num: '163 b', sourceId: '163b', atlasId: 'sh 163b — China', name: 'CHINA.', meter: 'C. M.', timeSignature: '3/2', keySignature: 'D Major', attr: 'Timothy Swan, 1801.', mode: 'major', lyric: 'Why do we mourn departing friends, Or shake at death’s alarms?', session: 'afternoon session', incipit: '32211 36635 55667', smudge: [2, 7], storyAsset: 'story-06-floorboards.jpg', scene: 'A voice joins the class from the floorboards. It is almost, but not quite, on the note.', illustrationAlt: 'Dark floorboards beneath a singing-school bench, with a listening presence below.' },
  { num: '159', sourceId: '159d', atlasId: 'sh 159 — Wondrous Love', name: 'WONDROUS LOVE.', meter: '12, 9, 6, 6, 12, 9.', timeSignature: '4/4', keySignature: 'F Minor', attr: 'Mead’s General Selection, 1811; arr. James Christopher, 1840.', mode: 'minor', lyric: 'What wondrous love is this, O my soul, O my soul!', session: 'afternoon session', incipit: '11724 54211 72576', smudge: [2, 6, 11], silentAt: [6], storyAsset: 'story-07-heavy-book.jpg', scene: 'The book has become heavier. Somewhere beyond the wall, the class begins the line before you.', illustrationAlt: 'A heavy closed songbook pressing into an old wooden tabletop while a distant class sings.' },
  { num: '162', sourceId: '162', atlasId: 'sh 162 — Plenary', name: 'PLENARY.', meter: 'C. M.', timeSignature: '4/4', keySignature: 'G Major', attr: 'Arr. A. C. Clark, 1839.', mode: 'major', lyric: 'Hark! from the tombs a doleful sound, My ears attend the cry.', session: 'evening session', incipit: '51113 21231 13561', smudge: [1, 5, 9, 12], silentAt: [5], storyAsset: 'story-08-three-benches.jpg', scene: 'There are only three benches now. No one acknowledges the missing voice.', illustrationAlt: 'Three old benches surround a hollow square, with one place conspicuously missing.' },
  { num: '268', sourceId: '268d', atlasId: 'sh 268 — Davids Lamentation', name: 'DAVID’S LAMENTATION.', meter: '', timeSignature: '2/4', keySignature: 'A Minor', attr: 'William Billings, 1778.', mode: 'minor', lyric: 'David the king was grieved and moved, He went to his chamber, and wept.', session: 'night session', incipit: '11232 32342 77112', smudge: [1, 5, 10, 14], silentAt: [5, 10], storyAsset: 'story-09-closed-leader-book.jpg', scene: 'The leader closes his book. The singing does not stop.', illustrationAlt: 'A closed songbook on the leader’s stand while unseen voices continue singing.' },
  { num: '332', sourceId: '332d', atlasId: 'sh 332 — Sons of Sorrow', name: 'SONS OF SORROW.', meter: '8s, 7s Double', timeSignature: '2/4', keySignature: 'E Minor', attr: 'Arr. William Houser, 1848.', mode: 'minor', lyric: 'Hail ye sighing sons of sorrow; Learn with me, your certain doom.', session: 'the late gathering', incipit: '11713 43157 54345', smudge: [2, 6, 9], silentAt: [6], storyAsset: 'story-07-heavy-book.jpg', scene: 'The number is 332: Sons of Sorrow. The class sings the first line as if it has been waiting in the walls.', illustrationAlt: 'A heavy closed songbook pressing into an old wooden tabletop while a distant class sings.' },
  { num: '209', sourceId: '209d', atlasId: 'sh 209 — Evening Shade', name: 'EVENING SHADE.', meter: 'S. M.', timeSignature: '4/4', keySignature: 'E Minor', attr: 'Stephen Jenks, 1805.', mode: 'minor', lyric: 'The day is past and gone — The night of death draws near.', session: 'night session', incipit: '13457 17154 44345', smudge: [1, 4, 9, 13], silentAt: [5, 10], storyAsset: 'story-10-wrong-shadow.jpg', scene: 'The candle is burning without a flame. Your shadow is the only one facing the square.', illustrationAlt: 'A candle without a visible flame and a lone shadow turned toward the singing square.' },
  { num: '62', sourceId: '62', atlasId: 'sh 62 — Parting Hand', name: 'PARTING HAND.', meter: 'L. M.', timeSignature: '6/4', keySignature: 'G Major', attr: 'Arr. William Walker, 1835.', mode: 'major', lyric: 'My Christian friends, in bonds of love, Whose hearts in sweetest union prove —', session: 'closing', incipit: '13211 12123 53553', smudge: [2, 5, 9, 14], silentAt: [5, 11], storyAsset: 'story-11-place-in-square.jpg', scene: 'At the last page, the class leaves a place for you. It is not the empty chair.', illustrationAlt: 'An empty place in the center of a hollow square, waiting beneath a dim candle.' }
].map(tune => {
  const harmony = HARMONY_DATA[tune.sourceId] || null;
  const tenor = harmony?.parts.find(part => part.name === 'tenor');
  let sungNoteIndex = 0;
  const realNotes = tenor?.events.map((event, index, sourceEvents) => {
    const [beat, duration, midi, shape] = event;
    const writtenRest = midi === null;
    const noteIndex = writtenRest ? null : sungNoteIndex++;
    return {
      degree: 0,
      staffDegree: midi,
      staffStep: midi === null ? 0 : staffStepFromMidi(midi),
      beat,
      duration,
      midi,
      syllable: shape || 'rest',
      silent: writtenRest || (noteIndex !== null && (tune.silentAt || []).includes(noteIndex)),
      barBefore: beat > 0 && Math.abs(beat % harmonyMeasureBeats(tune)) < .001,
      held: index === sourceEvents.length - 1
    };
  }) || null;
  return { ...tune, harmony, notes: phraseFrom(tune.incipit, tune.mode, tune.silentAt || []), realNotes };
});

const state = {
  mode: 'campaign', screen: 'title', songIndex: 0, cursor: 0, phase: 'idle',
  mistakes: 0, totalMistakes: 0, wrongHere: 0, lost: [], playToken: 0, notationToken: 0,
  settings: loadSettings(), hideAt: 0, referenceUnlocked: false, harmonyUnlocked: false, harmonyPreviewToken: 0, audio: null
};

function loadSettings() {
  try {
    return { visibility: localStorage.getItem('hollow-square-visibility') || 'standard', mercy: localStorage.getItem('hollow-square-mercy') || '3', hints: localStorage.getItem('hollow-square-hints') === 'true', reducedMemory: localStorage.getItem('hollow-square-reduced-memory') === 'true' };
  } catch (_) {
    return { visibility: 'standard', mercy: '3', hints: false, reducedMemory: false };
  }
}

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const screens = { title: $('#title'), story: $('#story'), practice: $('#practice'), game: $('#game'), end: $('#end') };

function currentTune() { return TUNES[state.songIndex]; }
function referenceAvailable() { return state.mode === 'practice' || state.songIndex > 0 || state.referenceUnlocked; }
function harmonyAvailable() { return state.mode === 'practice' || state.songIndex > 0 || state.harmonyUnlocked; }
function sourceTenorNotes(tune) {
  if (tune.realNotes?.length) return tune.realNotes;
  const tenor = harmonyParts(tune).find(part => part.name === 'tenor');
  if (!tenor) return tune.notes;
  let sungNoteIndex = 0;
  const notes = tenor.events.map((event, index, sourceEvents) => {
    const [beat, duration, midi, shape] = event;
    const writtenRest = midi === null;
    const noteIndex = writtenRest ? null : sungNoteIndex++;
    return {
      degree: 0,
      staffDegree: midi,
      staffStep: midi === null ? 0 : staffStepFromMidi(midi),
      beat,
      duration,
      midi,
      syllable: shape || 'rest',
      silent: writtenRest || (noteIndex !== null && (tune.silentAt || []).includes(noteIndex)),
      barBefore: beat > 0 && Math.abs(beat % harmonyMeasureBeats(tune)) < .001,
      held: index === sourceEvents.length - 1
    };
  });
  return notes.length ? notes : tune.notes;
}
function notesFor(tune) {
  const notes = sourceTenorNotes(tune);
  return state.settings.reducedMemory && state.mode === 'campaign' ? notes.slice(0, 10) : notes;
}
function noteSyllable(note) { return note.syllable || syllableOf(note.degree); }
function harmonyParts(tune) { return tune.harmony?.parts || []; }
function firstSungIndex(notes) {
  const index = notes.findIndex(note => note.midi !== null && note.midi !== undefined);
  return index === -1 ? 0 : index;
}
function activeHarmonyParts(tune) { return harmonyParts(tune).filter(part => !state.lost.includes(part.name)); }
function showScreen(name) {
  Object.entries(screens).forEach(([key, node]) => { node.hidden = key !== name; node.classList.toggle('is-active', key === name); });
  state.screen = name;
  document.body.classList.toggle('on-title', name === 'title');
  const heading = screens[name]?.querySelector('h1, h2');
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  } else {
    $('#app').focus({ preventScroll: true });
  }
}

function storyFor(index) {
  if (index === 0) return '<p>The meetinghouse stands where the road gives up. Four benches face inward, leaving a hollow square in the middle. The class has been singing since before you arrived.</p><p>The chairman places an old book in your hands. <em>“We sing the notes before the words,”</em> he says. Then the class begins.</p>';
  const tune = TUNES[index];
  return `<p>${tune.scene}</p><p>The next number is called. The ink waits for your memory.</p>`;
}

function showStory(index) {
  state.songIndex = index;
  if (index > 0 || state.mode === 'practice') {
    state.referenceUnlocked = true;
    state.harmonyUnlocked = true;
  }
  const tune = currentTune();
  $('#story-kicker').textContent = `providence chapel · ${tune.session}`;
  $('#story-heading').textContent = index === 0 ? 'The class is waiting.' : `Page ${tune.num.replace(/\s/g, '')}.`;
  const illustration = $('#story-illustration');
  illustration.src = `assets/${tune.storyAsset}`;
  illustration.alt = tune.illustrationAlt;
  $('#story-reference-button').hidden = index === 0;
  $('#story-text').innerHTML = storyFor(index);
  showScreen('story');
}

function setPrompt(message, isError = false) {
  const prompt = $('#prompt');
  prompt.innerHTML = message;
  prompt.classList.toggle('is-error', isError);
}

function populatePractice() {
  const list = $('#practice-list');
  list.innerHTML = TUNES.map((tune, index) => `<button class="practice-card" type="button" data-practice-index="${index}"><span class="practice-name">${tune.num} · ${tune.name}</span><span class="practice-meta">${tune.mode} · ${tune.meter || 'anthem'}<br>hear and repeat</span></button>`).join('');
}

function updateSettingsForm() {
  const form = $('#settings-form');
  form.elements.visibility.value = state.settings.visibility;
  form.elements.mercy.value = state.settings.mercy;
  form.elements.hints.checked = state.settings.hints;
  form.elements.reducedMemory.checked = state.settings.reducedMemory;
}

function saveSettings() {
  const form = $('#settings-form');
  state.settings = { visibility: form.elements.visibility.value, mercy: form.elements.mercy.value, hints: form.elements.hints.checked, reducedMemory: form.elements.reducedMemory.checked };
  try {
    localStorage.setItem('hollow-square-visibility', state.settings.visibility);
    localStorage.setItem('hollow-square-mercy', state.settings.mercy);
    localStorage.setItem('hollow-square-hints', String(state.settings.hints));
    localStorage.setItem('hollow-square-reduced-memory', String(state.settings.reducedMemory));
  } catch (_) { /* settings are still active for this visit */ }
  renderStaff();
}

let activeDialog = null;
const dialogInvokers = new Map();
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function setPageModalState(isModal) {
  const app = $('#app');
  const masthead = $('.masthead');
  [app, masthead].forEach(node => {
    if (!node) return;
    node.inert = isModal;
    node.setAttribute('aria-hidden', isModal ? 'true' : 'false');
  });
}

function openDrawer(id) {
  updateSettingsForm();
  const invoker = document.activeElement;
  if (invoker && invoker !== document.body) dialogInvokers.set(id, invoker);
  $(id).hidden = false;
  activeDialog = id;
  setPageModalState(true);
  const close = $(id).querySelector('.close-button');
  if (close) close.focus();
}
function closeDrawer(id) {
  const dialog = $(id);
  if (!dialog || dialog.hidden) return;
  dialog.hidden = true;
  if (activeDialog === id) activeDialog = null;
  setPageModalState(false);
  const invoker = dialogInvokers.get(id);
  dialogInvokers.delete(id);
  if (invoker?.isConnected) invoker.focus({ preventScroll: true });
}

function updateReference() {
  const tune = currentTune();
  $('#reference-tune').textContent = `${tune.num} · ${tune.name}`;
  $('#reference-body').innerHTML = `Look for <strong>${tune.name}</strong> on page <strong>${tune.num.replace(/\s/g, '')}</strong> in your own Sacred Harp. This game gives you the place; the printed book gives you the line.`;
  $('#reference-details').textContent = `${tune.timeSignature || 'time not listed'} · ${tune.meter || 'meter not listed'} · ${tune.keySignature || 'key not listed'}`;
  const atlasLink = $('#reference-atlas-link');
  const atlasUrl = new URL(ATLAS_BASE_URL);
  atlasUrl.searchParams.set('book', 'sh1991');
  atlasUrl.searchParams.set('tune', tune.atlasId);
  atlasLink.href = atlasUrl.href;
}

function openReference() { updateReference(); openDrawer('#reference-card'); }

function buildShapeKeys() {
  const wrap = $('#shape-keys');
  wrap.innerHTML = Object.entries(SHAPES).map(([id, shape]) => `<button class="shape-key" type="button" data-shape="${id}" disabled><span class="shape-mark ${shape.className}" aria-hidden="true"></span><span class="key-name">${shape.label}</span><span class="key-shortcut">${shape.key}</span></button>`).join('');
}
function setKeysEnabled(enabled) { $$('.shape-key').forEach(button => { button.disabled = !enabled; }); }

function renderBenches() {
  const parts = harmonyParts(currentTune());
  const voices = parts.length ? parts.map(part => part.name) : ['tenor', 'bass', 'treble', 'alto'];
  const lostCount = state.lost.filter(part => voices.includes(part)).length;
  const positions = { treble: 'north', alto: 'east', tenor: 'south', bass: 'west' };
  $('#bench-dots').innerHTML = voices.map(part => {
    const lost = state.lost.includes(part);
    const position = positions[part] || 'north';
    return `<span class="square-bench square-bench-${position} ${lost ? 'lost' : ''}" aria-label="${part}${lost ? ', silent' : ', present'}"><span class="bench-seat" aria-hidden="true"></span><span class="bench-empty-mark" aria-hidden="true"></span></span>`;
  }).join('');
  const risk = $('#bench-risk');
  const benchState = document.querySelector('.bench-state');
  if (!risk) return;
  if (state.mode === 'practice') {
    risk.textContent = 'practice · no benches at risk';
  } else if (lostCount >= voices.length) {
    risk.textContent = 'the square has gone quiet';
  } else {
    const remaining = Math.max(1, Number(state.settings.mercy) - state.wrongHere);
    risk.textContent = `${remaining} more miss${remaining === 1 ? '' : 'es'} before a bench falls`;
  }
  if (benchState) benchState.setAttribute('aria-label', `Voices remaining. ${risk.textContent}`);
}

const CLEF_PATHS = {
  treble: 'M 27 99 C 12 98 8 84 15 75 C 21 67 32 68 34 76 C 36 84 29 89 23 85 C 16 80 22 64 32 51 C 43 37 46 23 40 12 C 35 3 25 7 23 18 C 21 29 30 37 39 43 C 50 50 53 65 50 80 C 47 96 37 104 25 100 C 14 96 9 83 14 74 M 29 37 L 29 89',
  bass: 'M 11 38 C 22 31 37 32 42 40 C 46 47 40 54 31 54 C 20 54 13 48 11 38'
};

function engravedClef(kind, x, y, scale = 1) {
  if (kind === 'bass') {
    return `<g class="svg-clef-path bass-clef" transform="translate(${x} ${y}) scale(${scale})"><path d="${CLEF_PATHS.bass}"/><circle cx="18" cy="51" r="2.4"/><circle cx="39" cy="51" r="2.4"/></g>`;
  }
  return `<g class="svg-clef-path" transform="translate(${x} ${y}) scale(${scale})"><path d="${CLEF_PATHS.treble}"/></g>`;
}

function harmonyMeasureBeats(tune) {
  const [numerator, denominator] = (tune.timeSignature || '4/4').split('/').map(Number);
  return numerator && denominator ? numerator * (4 / denominator) : 4;
}

function renderHarmonyPlate(tune) {
  const parts = harmonyParts(tune);
  if (!parts.length) return '<p class="quiet-note">The source opening is not available in four-part form.</p>';
  const width = 1000;
  const left = 154;
  const right = 978;
  const rowHeight = 86;
  const top = 18;
  const staffTop = 27;
  const staffBottom = 59;
  const beatWidth = (right - left) / tune.harmony.beats;
  const measure = harmonyMeasureBeats(tune);
  const bars = [];
  for (let beat = measure; beat < tune.harmony.beats - .01; beat += measure) {
    const x = left + beat * beatWidth;
    bars.push(`<line class="mini-bar" x1="${x}" y1="${staffTop}" x2="${x}" y2="${staffBottom}"/>`);
  }
  const rows = parts.map((part, rowIndex) => {
    const rowTop = top + rowIndex * rowHeight;
    const pitches = part.events.filter(event => event[2] !== null).map(event => staffStepFromMidi(event[2]));
    const center = pitches.reduce((sum, step) => sum + step, 0) / Math.max(1, pitches.length);
    const lines = [0, 1, 2, 3, 4].map(line => `<line class="mini-lines" x1="${left}" y1="${rowTop + staffTop + line * 8}" x2="${right}" y2="${rowTop + staffTop + line * 8}"/>`).join('');
    const marks = part.events.filter(event => event[2] !== null).map(event => {
      const x = left + event[0] * beatWidth;
      const y = rowTop + 43 - (staffStepFromMidi(event[2]) - center) * 4.2;
      const stemUp = y > rowTop + 43;
      const stemX = stemUp ? x + 6 : x - 6;
      const stemY = stemUp ? y - 22 : y + 22;
      return `<g class="mini-note-group"><line class="mini-stem" x1="${stemX}" y1="${y}" x2="${stemX}" y2="${stemY}"/><ellipse class="mini-note" cx="${x}" cy="${y}" rx="6.5" ry="4.5" transform="rotate(-16 ${x} ${y})"/></g>`;
    }).join('');
    const clef = engravedClef(part.name === 'bass' ? 'bass' : 'treble', part.name === 'bass' ? 104 : 102, rowTop + (part.name === 'bass' ? 22 : 5), part.name === 'bass' ? .54 : .43);
    return `<g class="harmony-row"><text class="mini-label" x="8" y="${rowTop + 48}">${part.name}</text>${clef}${lines}${bars.map(bar => bar.replace(/y1="(\d+(?:\.\d+)?)" y2="(\d+(?:\.\d+)?)"/g, (_, y1, y2) => `y1="${Number(y1) + rowTop}" y2="${Number(y2) + rowTop}"`)).join('')}${marks}</g>`;
  }).join('');
  const height = top + parts.length * rowHeight;
  return `<svg class="harmony-engraving" viewBox="0 0 ${width} ${height}" role="img" aria-label="The first four measures in ${parts.map(part => part.name).join(', ')} parts"><text class="mini-time" x="126" y="${top + 15}">${tune.timeSignature || ''}</text>${rows}</svg>`;
}

const XML_PITCHES = [
  ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
  ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0]
];

function musicXmlPitch(midi) {
  const [step, alter] = XML_PITCHES[((midi % 12) + 12) % 12];
  return `<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${Math.floor(midi / 12) - 1}</octave></pitch>`;
}

function musicXmlDuration(beats) {
  const durations = [[4, 'whole', false], [3, 'half', true], [2, 'half', false], [1.5, 'quarter', true], [1, 'quarter', false], [.75, 'eighth', true], [.5, 'eighth', false], [.25, '16th', false], [.125, '32nd', false]];
  return durations.find(([value]) => Math.abs(value - beats) < .001) || [1, 'quarter', false];
}

function musicXmlKey(tune) {
  const root = (tune.keySignature || 'C').split(/\s+/)[0].replace('♯', '#').replace('♭', 'b');
  const majorKeys = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7 };
  const minorKeys = { A: 0, E: 1, B: 2, 'F#': 3, 'C#': 4, 'G#': 5, 'D#': 6, 'A#': 7, D: -1, G: -2, C: -3, F: -4, Bb: -5, Eb: -6, Ab: -7 };
  return (tune.mode === 'minor' ? minorKeys : majorKeys)[root] ?? 0;
}

function musicXmlHead(shape, beats) {
  const value = { fa: 'triangle', sol: 'normal', la: 'square', mi: 'diamond' }[shape];
  return value && value !== 'rest' ? `<notehead filled="${beats < 2 ? 'yes' : 'no'}">${value}</notehead>` : '';
}

function musicXmlNote(note, index, tune) {
  const isRest = note.midi === null || note.midi === undefined;
  const [duration, type, dotted] = musicXmlDuration(note.duration || 1);
  return `<note>${isRest ? '<rest/>' : musicXmlPitch(note.midi)}<duration>${Math.round((note.duration || 1) * 4)}</duration><voice>1</voice><type>${type}</type>${dotted ? '<dot/>' : ''}${musicXmlHead(isRest ? 'rest' : noteSyllable(note), note.duration || 1)}</note>`;
}

function musicXmlPartAttributes(tune, partName) {
  const [beats, beatType] = (tune.timeSignature || '4/4').split('/');
  const clef = partName === 'bass' ? '<clef><sign>F</sign><line>4</line></clef>' : '<clef><sign>G</sign><line>2</line></clef>';
  return `<attributes><divisions>4</divisions><key><fifths>${musicXmlKey(tune)}</fifths><mode>${tune.mode}</mode></key><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>${clef}</attributes>`;
}

function musicXmlSegmentNote(segment) {
  const { duration, midi, shape, tieStart, tieStop } = segment;
  const isRest = midi === null || midi === undefined;
  const [, type, dotted] = musicXmlDuration(duration);
  const ties = !isRest && (tieStart || tieStop)
    ? `${tieStart ? '<tie type="start"/>' : ''}${tieStop ? '<tie type="stop"/>' : ''}`
    : '';
  const tiedNotation = !isRest && (tieStart || tieStop)
    ? `<notations>${tieStart ? '<tied type="start"/>' : ''}${tieStop ? '<tied type="stop"/>' : ''}</notations>`
    : '';
  return `<note>${isRest ? '<rest/>' : musicXmlPitch(midi)}<duration>${Math.round(duration * 4)}</duration><voice>1</voice><type>${type}</type>${dotted ? '<dot/>' : ''}${musicXmlHead(isRest ? 'rest' : shape, duration)}${ties}${tiedNotation}</note>`;
}

function musicXmlSegmentsForMeasure(part, measureIndex, measureBeats, totalBeats) {
  const start = measureIndex * measureBeats;
  const end = Math.min(totalBeats, start + measureBeats);
  const sourceEvents = [...part.events].sort((a, b) => a[0] - b[0]);
  const segments = [];
  let cursor = start;
  sourceEvents.forEach(event => {
    const [beat, duration, midi, shape] = event;
    const eventEnd = beat + duration;
    const overlapStart = Math.max(start, beat);
    const overlapEnd = Math.min(end, eventEnd);
    if (overlapEnd <= overlapStart) return;
    if (overlapStart > cursor + .001) segments.push({ duration: overlapStart - cursor, midi: null, shape: null });
    segments.push({
      duration: overlapEnd - overlapStart,
      midi,
      shape,
      tieStart: midi !== null && beat < start - .001,
      tieStop: midi !== null && eventEnd > end + .001
    });
    cursor = overlapEnd;
  });
  if (cursor < end - .001) segments.push({ duration: end - cursor, midi: null, shape: null });
  return segments;
}

function musicXmlPart(part, partIndex, tune, measureCount, measureBeats, totalBeats) {
  const measures = [];
  for (let measureIndex = 0; measureIndex < measureCount; measureIndex++) {
    const segments = musicXmlSegmentsForMeasure(part, measureIndex, measureBeats, totalBeats);
    const attributes = measureIndex === 0 ? musicXmlPartAttributes(tune, part.name) : '';
    measures.push(`<measure number="${measureIndex + 1}">${attributes}${segments.map(musicXmlSegmentNote).join('')}</measure>`);
  }
  return `<part id="P${partIndex + 1}">${measures.join('')}</part>`;
}

function musicXmlForTune(notes, tune) {
  const measureBeats = harmonyMeasureBeats(tune);
  const parts = harmonyParts(tune);
  const sourceParts = parts.length ? parts : [{ name: 'tenor', events: notes.map(note => [note.beat || 0, note.duration || 1, note.midi ?? null, noteSyllable(note)]) }];
  const totalBeats = Math.max(1, tune.harmony?.beats || sourceParts.reduce((end, part) => Math.max(end, ...part.events.map(event => event[0] + event[1])), 0));
  const measureCount = Math.max(1, Math.ceil(totalBeats / measureBeats));
  const partList = sourceParts.map((part, index) => `<score-part id="P${index + 1}"><part-name>${part.name[0].toUpperCase()}${part.name.slice(1)}</part-name></score-part>`).join('');
  const partXml = sourceParts.map((part, index) => musicXmlPart(part, index, tune, measureCount, measureBeats, totalBeats)).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>${tune.name.replace(/\.$/, '')}</work-title></work><part-list>${partList}</part-list>${partXml}</score-partwise>`;
}

function blotPath(x, y, width, height, seed = 0) {
  const lean = (seed % 3 - 1) * width * .08;
  return `M ${x - width * .52} ${y + height * .06} C ${x - width * .55} ${y - height * .38}, ${x - width * .22 + lean} ${y - height * .58}, ${x + width * .04} ${y - height * .5} C ${x + width * .4} ${y - height * .6}, ${x + width * .57} ${y - height * .2}, ${x + width * .48} ${y + height * .18} C ${x + width * .4} ${y + height * .56}, ${x + width * .1} ${y + height * .52}, ${x - width * .18} ${y + height * .56} C ${x - width * .4} ${y + height * .55}, ${x - width * .58} ${y + height * .34}, ${x - width * .52} ${y + height * .06} Z`;
}

function renderCursedEye(group, x, y, width, height, active) {
  const namespace = 'http://www.w3.org/2000/svg';
  const eye = document.createElementNS(namespace, 'g');
  eye.setAttribute('class', `note-eye${active ? ' is-open' : ''}`);
  eye.setAttribute('aria-hidden', 'true');
  const outer = document.createElementNS(namespace, 'ellipse');
  outer.setAttribute('cx', x); outer.setAttribute('cy', y);
  outer.setAttribute('rx', width / 2); outer.setAttribute('ry', height / 2);
  outer.setAttribute('class', 'eye-outer');
  eye.appendChild(outer);
  if (active) {
    const iris = document.createElementNS(namespace, 'ellipse');
    iris.setAttribute('cx', x); iris.setAttribute('cy', y);
    iris.setAttribute('rx', width * .27); iris.setAttribute('ry', height * .31);
    iris.setAttribute('class', 'eye-iris');
    const pupil = document.createElementNS(namespace, 'ellipse');
    pupil.setAttribute('cx', x); pupil.setAttribute('cy', y);
    pupil.setAttribute('rx', width * .09); pupil.setAttribute('ry', height * .24);
    pupil.setAttribute('class', 'eye-pupil');
    eye.append(iris, pupil);
  } else {
    const lid = document.createElementNS(namespace, 'path');
    lid.setAttribute('d', `M ${x - width * .39} ${y} Q ${x} ${y + height * .55} ${x + width * .39} ${y}`);
    lid.setAttribute('class', 'eye-lid');
    eye.appendChild(lid);
  }
  group.appendChild(eye);
}

function renderInkBlots(container, notes, tune, shouldShow) {
  if (state.mode !== 'campaign') return;
  const svg = container.querySelector('svg');
  if (!svg) return;
  const staves = [...svg.querySelectorAll('.staffline')];
  const tenorStave = staves[Math.min(2, Math.max(0, staves.length - 1))] || svg;
  const noteGroups = [...tenorStave.querySelectorAll('.vf-stavenote')];
  const svgRect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox?.baseVal;
  const viewWidth = viewBox?.width || Number(svg.getAttribute('width')) || 760;
  const viewHeight = viewBox?.height || Number(svg.getAttribute('height')) || 190;
  if (!svgRect.width || !svgRect.height) return;
  const scaleX = viewWidth / svgRect.width;
  const scaleY = viewHeight / svgRect.height;
  const namespace = 'http://www.w3.org/2000/svg';
  let sungIndex = -1;
  notes.forEach((note, index) => {
    const hasPitch = note.midi !== null && note.midi !== undefined;
    if (hasPitch) sungIndex++;
    const group = noteGroups[index];
    const head = group?.querySelector('.vf-notehead');
    if (!head) return;
    const headRect = head.getBoundingClientRect();
    const x = (headRect.left + headRect.width / 2 - svgRect.left) * scaleX;
    const y = (headRect.top + headRect.height / 2 - svgRect.top) * scaleY;
    const width = Math.max(15, headRect.width * scaleX * 1.8);
    const height = Math.max(13, headRect.height * scaleY * 2.15);
    const cursed = hasPitch && (tune.silentAt || []).includes(sungIndex);
    const hidden = tune.smudge.includes(index) && !note.revealed && !shouldShow;
    if (hidden) {
      const blot = document.createElementNS(namespace, 'g');
      blot.setAttribute('class', 'note-blot');
      blot.setAttribute('aria-hidden', 'true');
      const main = document.createElementNS(namespace, 'path');
      main.setAttribute('d', blotPath(x, y, width, height, index));
      const edge = document.createElementNS(namespace, 'path');
      edge.setAttribute('class', 'blot-edge');
      edge.setAttribute('d', blotPath(x - width * .06, y + height * .08, width * .68, height * .7, index + 1));
      const scratch = document.createElementNS(namespace, 'path');
      scratch.setAttribute('class', 'blot-scratch');
      scratch.setAttribute('d', `M ${x - width * .38} ${y - height * .12} L ${x + width * .34} ${y + height * .18} M ${x - width * .27} ${y + height * .28} L ${x + width * .22} ${y - height * .3}`);
      blot.append(main, edge, scratch);
      group.appendChild(blot);
    }
    if (cursed) renderCursedEye(group, x, y, Math.max(25, width * 1.25), Math.max(15, height * .95), state.cursor === index);
  });
}

async function renderOsmdStaff(container, notes, tune, shouldShow, renderToken) {
  if (!window.opensheetmusicdisplay?.OpenSheetMusicDisplay) return false;
  const osmd = new window.opensheetmusicdisplay.OpenSheetMusicDisplay(container);
  osmd.setOptions({ backend: 'svg', drawTitle: false, drawComposer: false, drawPartNames: true, drawMeasureNumbers: false, drawLyrics: false, drawingParameters: 'compacttight', pageFormat: 'Endless' });
  await osmd.load(musicXmlForTune(notes, tune));
  if (renderToken !== state.notationToken) return true;
  osmd.render();
  renderInkBlots(container, notes, tune, shouldShow);
  return true;
}

function updateHarmonyControls() {
  const tune = currentTune();
  const parts = harmonyParts(tune);
  const playButton = $('#harmony-play-button');
  const viewButton = $('#harmony-view-button');
  const status = $('#harmony-status');
  if (!playButton || !viewButton || !status) return;
  const tools = $('#harmony-tools');
  if (tools) tools.hidden = !harmonyAvailable();
  if (!harmonyAvailable()) return;
  const names = parts.map(part => part.name);
  playButton.textContent = names.length ? `hear ${names.join(' · ')}` : 'hear the class';
  const remaining = activeHarmonyParts(tune).length;
  status.textContent = names.length ? `${remaining} of ${names.length} parts sounding` : 'the class is unaccompanied';
  if (!$('#harmony-plate').hidden) $('#harmony-plate').innerHTML = renderHarmonyPlate(tune);
}

function renderStaff() {
  const tune = currentTune();
  const notes = notesFor(tune);
  const shouldShow = state.mode === 'practice' || state.settings.visibility === 'always' || Date.now() < state.hideAt || state.phase !== 'sing';
  const accessibility = notes.map((note, index) => {
    const syllable = note.silent ? 'rest' : noteSyllable(note);
    const hidden = state.mode === 'campaign' && tune.smudge.includes(index) && !note.revealed && !shouldShow;
    const label = note.silent ? 'unwritten note — keep silent' : hidden ? 'obscured note' : `${syllable}, note ${index + 1}`;
    return `<span class="staff-note-label" role="img" aria-label="${label}"></span>`;
  }).join('');
  $('#staff').style.setProperty('--note-count', notes.length);
  const staff = $('#staff');
  const renderToken = ++state.notationToken;
  staff.innerHTML = '<div class="osmd-staff" aria-hidden="true"></div>';
  renderOsmdStaff(staff.querySelector('.osmd-staff'), notes, tune, shouldShow, renderToken).then(rendered => {
    if (!rendered) throw new Error('OSMD is unavailable');
  }).catch(error => {
    if (renderToken !== state.notationToken) return;
    console.warn('OSMD notation fallback:', error);
    staff.innerHTML = '<p class="quiet-note">The notation plate could not be set.</p>';
  }).finally(() => {
    if (renderToken === state.notationToken) staff.insertAdjacentHTML('beforeend', `<span class="staff-accessibility">${accessibility}</span>`);
  });
  $('#lyric').textContent = tune.lyric;
  $('#game-page').textContent = tune.num.replace(/\s/g, '');
  $('#game-heading').textContent = tune.name;
  $('#game-meta').textContent = `${tune.keySignature || 'key not listed'} · ${tune.timeSignature || 'time not listed'} · ${tune.meter || 'meter not listed'} · ${tune.attr}`;
  $('#game-session').textContent = state.mode === 'practice' ? 'singing school · practice' : tune.session;
  $('#game-progress').textContent = `page ${tune.num.replace(/\s/g, '')} · ${state.songIndex + 1} / ${TUNES.length}`;
  $('#game-reference-button').hidden = !referenceAvailable();
  const firstPlayCue = $('#first-play-cue');
  if (firstPlayCue) firstPlayCue.hidden = !(state.mode === 'campaign' && state.songIndex === 0 && state.phase === 'sing' && state.totalMistakes === 0);
  const hasSilentNotes = notes.some(note => note.silent);
  const restKey = $('.shape-key[data-shape="rest"]');
  if (restKey) restKey.hidden = !hasSilentNotes;
  const silenceHint = $('#silence-hint');
  if (silenceHint) silenceHint.hidden = !hasSilentNotes;
  const gameFooter = $('.game-footer');
  if (gameFooter) gameFooter.hidden = !hasSilentNotes;
  renderBenches();
  updateHarmonyControls();
}

function initAudio() {
  const status = $('#audio-status');
  const setStatus = (message, stateName) => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = stateName;
  };
  if (!window.AudioContext && !window.webkitAudioContext) {
    setStatus('sound unavailable · use the on-screen cues', 'unavailable');
    return false;
  }
  try {
    if (!state.audio) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      state.audio = new AudioCtor();
    }
    if (state.audio.state === 'suspended') {
      const resume = state.audio.resume();
      if (resume?.catch) resume.catch(() => setStatus('sound blocked · use the on-screen cues', 'blocked'));
    }
    if (state.audio.state === 'running') setStatus('sound ready · optional', 'ready');
    else if (state.audio.state === 'suspended') setStatus('sound blocked · use the on-screen cues', 'blocked');
    return true;
  } catch (_) {
    setStatus('sound unavailable · use the on-screen cues', 'unavailable');
    return false;
  }
}
const ORGAN_PARTIALS = [[.5, .34, 'sine'], [1, .52, 'sine'], [2, .18, 'sine'], [3, .1, 'triangle'], [4, .06, 'sine']];
function organTone(frequency, duration, offset = 0, gain = .035) {
  if (!state.audio || !Number.isFinite(frequency)) return;
  const now = state.audio.currentTime + offset;
  const master = state.audio.createGain();
  const attack = Math.min(.08, Math.max(.02, duration * .16));
  const release = Math.min(.26, Math.max(.08, duration * .34));
  master.gain.setValueAtTime(.0001, now);
  master.gain.exponentialRampToValueAtTime(gain, now + attack);
  master.gain.setValueAtTime(gain * .7, now + Math.max(attack, duration - release));
  master.gain.exponentialRampToValueAtTime(.0001, now + duration);
  master.connect(state.audio.destination);
  ORGAN_PARTIALS.forEach(([ratio, level, type]) => {
    const oscillator = state.audio.createOscillator();
    const partialGain = state.audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency * ratio;
    partialGain.gain.value = level;
    oscillator.connect(partialGain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + .06);
  });
}

function midiFrequency(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
function noteFrequency(note, tune) {
  if (Number.isFinite(note?.midi)) return midiFrequency(note.midi);
  const base = tune.mode === 'minor' ? 196 : 220;
  return base * Math.pow(2, mod7(note?.degree || 0) / 7);
}
function playPressedNote(note, tune) {
  if (!note?.silent) organTone(noteFrequency(note, tune), .34, 0, .034);
}
function playBenchLossSound() {
  organTone(98, 1.12, 0, .052);
  organTone(103.8, .96, .02, .042);
  organTone(146.8, .68, .05, .025);
}
function playCompletionChord(tune) {
  const parts = activeHarmonyParts(tune);
  if (!parts.length) return;
  parts.forEach(part => {
    const finalEvent = [...part.events].reverse().find(event => event[2] !== null && event[2] !== undefined);
    if (!finalEvent) return;
    const gain = part.name === 'bass' ? .034 : .022;
    organTone(midiFrequency(finalEvent[2]), 1.35, 0, gain);
  });
}
function scheduleHarmony(tune, step, startOffset = .36) {
  activeHarmonyParts(tune).forEach(part => {
    part.events.forEach(event => {
      const [beat, duration, midi] = event;
      if (midi === null) return;
      const voiceGain = part.name === 'bass' ? .024 : .015;
      organTone(midiFrequency(midi), Math.max(.12, duration * step / 1000 - .04), startOffset + beat * step / 1000, voiceGain);
    });
  });
}

function playHarmonyPreview() {
  const tune = currentTune();
  if (!harmonyParts(tune).length) return;
  initAudio();
  const previewToken = (state.harmonyPreviewToken || 0) + 1;
  state.harmonyPreviewToken = previewToken;
  const playButton = $('#harmony-play-button');
  if (playButton) { playButton.disabled = true; playButton.textContent = 'the class is singing…'; }
  const step = state.settings.reducedMemory ? 280 : 360;
  scheduleHarmony(tune, step, .05);
  setPrompt(`<em>${activeHarmonyParts(tune).map(part => part.name).join(', ')} enter together.</em>`);
  window.setTimeout(() => {
    if (state.harmonyPreviewToken === previewToken && state.phase !== 'done') {
      if (playButton) playButton.disabled = false;
      renderStaff();
    }
  }, tune.harmony.beats * step + 180);
}

function playPhrase() {
  const tune = currentTune();
  const notes = notesFor(tune);
  const token = ++state.playToken;
  state.phase = 'listen';
  setKeysEnabled(false);
  setPrompt(state.mode === 'practice' ? 'Listen. The syllables will stay with you here.' : 'The class sings first. Hold the line in your mind.');
  const step = state.settings.reducedMemory ? 260 : 360;
  const harmonyDuration = tune.harmony ? tune.harmony.beats * step : notes.length * step;
  if (tune.harmony) scheduleHarmony(tune, step);
  notes.forEach((note, index) => {
    window.setTimeout(() => {
      if (token !== state.playToken) return;
      state.cursor = index;
      renderStaff();
      if (note.silent) setPrompt('<em>…the class leaves this one empty.</em>');
      else if (!tune.harmony) { organTone(noteFrequency(note, tune), step / 1000 + .12, 0, .028); setPrompt(`<span>${noteSyllable(note)}</span>`); }
      else setPrompt(`<span>${noteSyllable(note)}</span>`);
    }, 360 + (tune.harmony ? (note.beat ?? index) * step : index * step));
  });
  window.setTimeout(() => {
    if (token !== state.playToken) return;
    state.phase = 'sing'; state.cursor = firstSungIndex(notes); state.wrongHere = 0;
    const visibilityWindow = state.settings.visibility === 'longer' ? 5000 : 900;
    state.hideAt = state.mode === 'practice' ? Infinity : Date.now() + visibilityWindow;
    setKeysEnabled(true);
    setPrompt(state.mode === 'practice' ? 'Your turn. Name each shape; a correction is just another repetition.' : 'Your turn. The ink will not wait.');
    renderStaff();
    if (state.mode === 'campaign' && state.settings.visibility !== 'always') {
      window.setTimeout(() => { if (token === state.playToken && state.phase === 'sing') renderStaff(); }, visibilityWindow + 40);
    }
  }, tune.harmony ? 450 + harmonyDuration : 450 + notes.length * step);
}

function beginLesson() {
  initAudio();
  state.cursor = 0; state.phase = 'listen'; state.mistakes = 0; state.wrongHere = 0; state.playToken++;
  [...currentTune().notes, ...(currentTune().realNotes || [])].forEach(note => { delete note.revealed; });
  showScreen('game'); renderStaff(); window.setTimeout(playPhrase, 350);
}

function loseBench() {
  const voices = harmonyParts(currentTune()).map(part => part.name);
  const next = (voices.length ? voices : ['treble', 'alto', 'bass', 'tenor']).find(part => !state.lost.includes(part));
  if (!next) return;
  state.lost.push(next); renderBenches();
  state.harmonyUnlocked = true;
  playBenchLossSound();
  $('#game').classList.add('bench-loss');
  window.setTimeout(() => $('#game').classList.remove('bench-loss'), 750);
  setPrompt(`<em>The ${next} bench goes quiet. The class keeps time.</em>`, true);
  if (voices.length && state.lost.length >= voices.length) finishGame(false);
}

function finishTune() {
  state.phase = 'done'; setKeysEnabled(false); state.playToken++;
  playCompletionChord(currentTune());
  if (state.mode === 'practice') {
    setPrompt(`<em>Phrase complete. ${state.mistakes} correction${state.mistakes === 1 ? '' : 's'}; nothing was lost.</em>`);
    $('#replay-button').textContent = 'repeat the phrase';
    return;
  }
  if (state.songIndex === TUNES.length - 1) { finishGame(true); return; }
  setPrompt('<em>The class holds the chord, then turns the page.</em>');
  window.setTimeout(() => showStory(state.songIndex + 1), 1800);
}

function finishGame(won) {
  state.phase = 'done'; state.playToken++;
  $('#end-mark').textContent = won ? '✦' : '◼';
  $('#end-kicker').textContent = won ? 'parting hand · closing' : 'the square is broken';
  $('#end-heading').textContent = won ? 'The class sings on.' : 'There is room for another voice.';
  $('#end-text').innerHTML = won ? '<p>You reach the last cadence. The benches fill themselves, one by one, but the middle remains open.</p><p>When you look down, the book is ordinary again. On the flyleaf, in a hand you do not recognize: <em>come back next all-day.</em></p>' : '<p>The last shape goes wrong. The sound returns from underneath the floor, and the four benches fall silent around you.</p><p>When the candle comes back, the book is open to a page you have not yet learned.</p>';
  $('#end-text').style.color = won ? '' : 'var(--oxblood)';
  showScreen('end');
}

function resetCampaign() { state.mode = 'campaign'; state.songIndex = 0; state.lost = []; state.mistakes = 0; state.totalMistakes = 0; state.referenceUnlocked = false; state.harmonyUnlocked = false; showStory(0); }

function handleSing(input) {
  if (state.phase !== 'sing') return;
  const tune = currentTune(); const notes = notesFor(tune); const note = notes[state.cursor];
  if (!note) return;
  playPressedNote(note, tune);
  const expected = note.silent ? 'rest' : noteSyllable(note);
  if (input === expected) {
    state.cursor++; state.wrongHere = 0;
    setPrompt(note.silent ? '<em>You keep silent. Something keeps silent with you.</em>' : `<span>${expected}</span>`);
    if (state.cursor >= notes.length) finishTune(); else renderStaff();
    return;
  }
  state.mistakes++; state.totalMistakes++; state.wrongHere++;
  if (state.mode === 'campaign') {
    state.referenceUnlocked = true;
    if (state.wrongHere >= 2) state.harmonyUnlocked = true;
  }
  if (state.mode === 'practice') {
    note.revealed = true;
    setPrompt(`<em>That shape was <strong>${expected}</strong>. Hear it once more and try again.</em>`, true);
    organTone(125, .3, 0, .02); renderStaff(); return;
  }
  organTone(115, .4, 0, .03);
  if (state.settings.hints && state.wrongHere >= 2 && !note.silent) {
    note.revealed = true;
    setPrompt(`<em>A voice close to your ear says <strong>${expected}</strong>. You did not feel breath.</em>`, true);
  } else if (note.silent && input !== 'rest') {
    setPrompt('<em>You sang the unwritten note. Something beneath the floor sang it back.</em>', true);
  } else {
    setPrompt('<em>The chord goes sour. The chairman’s hand does not stop beating.</em>', true);
  }
  if (state.wrongHere >= Number(state.settings.mercy)) { state.wrongHere = 0; loseBench(); }
  renderStaff();
}

function startPractice(index) { state.mode = 'practice'; state.songIndex = index; state.lost = []; state.mistakes = 0; state.referenceUnlocked = true; state.harmonyUnlocked = true; beginLesson(); }

document.addEventListener('click', event => {
  const actionTarget = event.target.closest('[data-action]');
  if (actionTarget) {
    const action = actionTarget.dataset.action;
    if (action === 'home') { state.playToken++; state.mode = 'campaign'; showScreen('title'); }
    if (action === 'open-book') { initAudio(); state.referenceUnlocked = false; state.harmonyUnlocked = false; showStory(0); }
    if (action === 'open-school') { state.playToken++; populatePractice(); showScreen('practice'); }
    if (action === 'begin-lesson') beginLesson();
    if (action === 'open-settings') openDrawer('#settings-drawer');
    if (action === 'close-drawer') closeDrawer('#settings-drawer');
    if (action === 'open-reference') openReference();
    if (action === 'close-reference') closeDrawer('#reference-card');
    if (action === 'play-harmony') playHarmonyPreview();
    if (action === 'toggle-harmony') {
      const plate = $('#harmony-plate');
      plate.hidden = !plate.hidden;
      if (!plate.hidden) plate.innerHTML = `${renderHarmonyPlate(currentTune())}<p class="harmony-scroll-note">on a small screen, swipe across the plate</p>`;
      event.target.textContent = plate.hidden ? 'show the parts' : 'hide the parts';
    }
    if (action === 'replay') { if (state.phase === 'sing' || state.phase === 'done') { state.playToken++; playPhrase(); } }
    if (action === 'restart') resetCampaign();
  }
  const practice = event.target.closest('[data-practice-index]');
  if (practice) startPractice(Number(practice.dataset.practiceIndex));
  const shape = event.target.closest('[data-shape]');
  if (shape) handleSing(shape.dataset.shape);
});

document.addEventListener('keydown', event => {
  if (activeDialog) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDrawer(activeDialog);
      return;
    }
    if (event.key === 'Tab') {
      const dialog = $(activeDialog);
      const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter(node => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  if (event.repeat) return;
  if (state.screen !== 'game') return;
  const key = event.key.toLowerCase();
  const input = { f: 'fa', s: 'sol', l: 'la', m: 'mi', ' ': 'rest' }[key];
  if (input) { event.preventDefault(); handleSing(input); }
});

$('#settings-form').addEventListener('change', saveSettings);
$('#replay-button').addEventListener('click', () => { if (state.phase === 'sing' || state.phase === 'done') { state.playToken++; playPhrase(); } });

buildShapeKeys(); populatePractice(); updateSettingsForm(); showScreen('title');
