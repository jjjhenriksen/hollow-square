'use strict';

/* Deterministic ink drawings for the title and story. Adjust the paper/ink
   palette here; each scene is a small set of explicit SVG drawing commands. */
(() => {
  const room = `<g class="architecture"><path d="M38 236V92l162-58 162 58v144"/><path d="M58 105 200 55l142 50M58 126l142-49 142 49M58 147l142-49 142 49"/><path d="M68 236v-72l86-28v100m178 0v-72l-86-28v100"/><path d="M100 236v-40l32-10 32 10v40m70 0v-40l32-10 32 10v40"/></g>`;
  const bench = (x, y, angle = 0) => `<g class="furniture" transform="translate(${x} ${y}) rotate(${angle})"><path d="M-58 0h116v13h-116zM-47 13v28m94-28v28"/><path d="M-49 -6h98v7h-98z"/></g>`;
  const book = (x, y, scale = 1, closed = false) => `<g class="book" transform="translate(${x} ${y}) scale(${scale})"><path d="M-66 0q33-15 66 0v76q-33-15-66 0z"/><path d="M66 0Q33-15 0 0v76q33-15 66 0zM0 0v76"/>${closed ? '<path d="M-70 77q70-13 140 0l-8 10q-62-12-124 0z"/>' : '<path class="fine" d="M-52 19h39m-39 12h39m27-12h39m-39 12h39"/>'}</g>`;
  const candle = `<g class="candle"><circle cx="325" cy="183" r="32" fill="#d6a34d" fill-opacity=".16" stroke="none"/><path d="M315 191v42h20v-42zM325 182c-13-13-2-24 1-32 14 16 15 25 1 32zM315 234h20"/></g>`;
  const wrap = (body, label, viewBox = '0 0 400 260') => `<svg class="programmatic-art" viewBox="${viewBox}" role="img" aria-label="${escapeAttribute(label)}" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="paper-fiber" width="19" height="17" patternUnits="userSpaceOnUse"><path d="M2 4h5m6 9h4M10 2v2" stroke="#533d25" stroke-opacity=".2" stroke-width=".7"/></pattern><linearGradient id="paper" x2="0" y2="1"><stop stop-color="#f0e3c2"/><stop offset=".62" stop-color="#ddc99d"/><stop offset="1" stop-color="#bda77d"/></linearGradient><radialGradient id="candle-wash"><stop stop-color="#f2c568" stop-opacity=".2"/><stop offset="1" stop-color="#f2c568" stop-opacity="0"/></radialGradient><radialGradient id="edge-vignette"><stop offset=".62" stop-color="#1e2923" stop-opacity="0"/><stop offset="1" stop-color="#1e2923" stop-opacity=".18"/></radialGradient></defs><style>.architecture{stroke:#304b42;stroke-width:1.55}.furniture{stroke:#63442e;stroke-width:2.8}.furniture path:first-child{fill:#987348;fill-opacity:.13}.book{stroke:#783a32;stroke-width:2.15}.book path:first-child,.book path:nth-child(2){fill:#b08b50;fill-opacity:.14}.candle{stroke:#a56f29;stroke-width:1.8}.gold-line{stroke:#a56f29;stroke-width:1.15}.fine{stroke-width:.72;opacity:.8}.accent-red{stroke:#8e4238;stroke-width:2.7}</style><rect width="100%" height="100%" fill="url(#paper)"/><rect width="100%" height="100%" fill="url(#candle-wash)"/><rect width="100%" height="100%" fill="url(#paper-fiber)"/><rect width="100%" height="100%" fill="url(#edge-vignette)"/><rect x="7" y="7" width="386" height="246" fill="none" stroke="#8d6936" stroke-opacity=".75" stroke-width=".8"/><g fill="none" stroke="#38291b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  const escapeAttribute = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function title() {
    return wrap(`${room}${bench(200,202)}${book(197,137,.8)}${candle}<path class="gold-line" d="M174 228h52M190 222v17m20-17v17"/><path class="fine" d="M192 126h16"/>`, 'An ink drawing of a rural singing-school room with a songbook, a candle, and four benches around an empty square.');
  }

  const scenes = {
    meetinghouse: `${room}${bench(200,205)}<path d="M200 12v20m-6-10h12"/>`,
    wrongPages: `${room}${bench(200,206)}${book(126,151,.48)}${book(271,151,.48)}<path d="M185 111q15-12 30 0v38q-15-12-30 0z"/>`,
    thumbprint: `${room}${book(200,139,.8)}<path d="M204 177c-12-17 7-30 17-18 6 8-3 19-12 23m-11-4c-15-11-4-29 8-28m-18 15c-8-11 1-23 10-22"/>`,
    emptyChair: `${room}${bench(200,210)}<path d="M175 140v52m50-52v52m-50-43h50m-59 43h68m-61 8v28m54-28v28"/>`,
    pencilNote: `${room}${book(200,140,.8)}<path d="m224 162 53-33 7 10-53 33-12 3zM265 133l7-5 7 10-7 4"/><path d="M163 183h25m-25 9h28"/>`,
    floorboards: `${room}<path d="M0 211h400M0 230h400M40 211l-12 49m87-49-11 49m112-49-3 49m89-49 8 49m64-49 20 49"/><path d="M140 206q30-19 60 0m-53-5q24-12 45 0"/>`,
    heavyBook: `${room}<path d="M114 211q86-16 172 0l-15 16q-70-12-142 0z"/>${book(200,132,1.05,true)}<path d="M150 231h100"/>`,
    threeBenches: `${room}${bench(200,204)}${bench(111,165,-28)}${bench(289,165,28)}<path d="M181 158h38m-19-19v38" stroke-dasharray="3 7"/>`,
    closedBook: `${room}${book(201,150,.95,true)}<path d="M285 158v71m-10-3h20"/>`,
    wrongShadow: `${room}${candle}<path d="M145 233q7-64 55-87 45 28 54 87zM192 176l8-22 9 22"/><path d="M200 202h1"/>`,
    placeInSquare: `${room}${bench(200,203)}<path d="M200 143v45m-14-31 14-14 14 14m-31 28 17 8 17-8"/>${candle}`
  };

  window.HollowArt = {
    title,
    story(scene, label) { return wrap(scenes[scene] || scenes.meetinghouse, label); }
  };
})();
