'use strict';

(() => {
  // These annotations are a reader's pencil voice, not additional controls.
  // The lookup never includes caller-provided content in the returned markup.
  const notes = Object.freeze({
    meetinghouse: 'They knew my name.',
    pencilNote: 'I don’t remember writing this.',
    emptyChair: 'Was that chair always so close?',
    threeBenches: 'Count the benches again.',
    placeInSquare: 'Leave a little room.'
  });

  function note(text, kind) {
    return `<aside class="margin-note margin-note--${kind}" aria-label="Handwritten margin note"><p>${text}</p></aside>`;
  }

  window.HollowMarginalia = Object.freeze({
    story(scene) {
      return Object.hasOwn(notes, scene) ? note(notes[scene], 'story') : '';
    },
    practice() {
      return note('Rain all morning.', 'practice');
    }
  });
})();
