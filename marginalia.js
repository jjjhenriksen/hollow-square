'use strict';

(() => {
  // These annotations are a reader's pencil voice, not additional controls.
  // The lookup never includes caller-provided content in the returned markup.
  const notes = Object.freeze({
    meetinghouse: 'Sing the shapes before the words.',
    pencilNote: 'Keep the first line in mind.',
    emptyChair: 'Was that chair always so close?',
    threeBenches: 'Count the benches again.',
    placeInSquare: 'Leave a little room.'
  });

  function note(text, kind) {
    return `<aside class="margin-note margin-note--${kind}" aria-label="Handwritten margin note"><svg class="margin-note-arrow" viewBox="0 0 45 27" aria-hidden="true" focusable="false"><path d="M42 23Q19 24 6 6m-1 8L5 5l10 2"/></svg><p>${text}</p></aside>`;
  }

  window.HollowMarginalia = Object.freeze({
    story(scene) {
      return Object.hasOwn(notes, scene) ? note(notes[scene], 'story') : '';
    },
    practice() {
      return note('No benches are lost in singing school.', 'practice');
    }
  });
})();
