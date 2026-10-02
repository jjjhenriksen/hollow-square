'use strict';
const { test, expect } = require('@playwright/test');

async function trackAudio(page) {
  await page.addInitScript(() => {
    window.createdOscillators = [];
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) throw new Error('Native Web Audio is required by this fixture');
    const create = AudioCtor.prototype.createOscillator;
    AudioCtor.prototype.createOscillator = function () {
      const oscillator = create.call(this);
      window.createdOscillators.push(oscillator);
      return oscillator;
    };
  });
}

test('a saved mute preference creates no audio sources and permits completing a lesson', async ({ page }, testInfo) => {
  await trackAudio(page);
  await page.addInitScript(() => localStorage.setItem('hollow-square-muted', 'true'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Unmute sound', exact: true })).toBeVisible({ timeout: 1000 });
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /WINDHAM/ }).click();
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#audio-status')).toHaveText('sound muted · use the on-screen cues');
  const notes = page.locator('#staff .staff-accessibility span');
  const count = await notes.count();
  for (let index = 0; index < count; index++) {
    const label = await notes.nth(index).getAttribute('aria-label');
    const shape = label.startsWith('unwritten note') ? 'rest' : label.split(',')[0].trim().toLowerCase();
    await page.locator(`#shape-keys [data-shape="${shape}"]`).click();
  }
  await expect(page.locator('#prompt')).toContainText('Phrase complete');
  expect(await page.evaluate(() => window.createdOscillators.length)).toBe(0);
  expect(await page.evaluate(() => state.scheduledAudio.size)).toBe(0);
  await page.screenshot({ path: testInfo.outputPath('muted-lesson-complete.png') });
});

test('mute stops active and future preview tones without cancelling visual gameplay, and can be toggled with Space', async ({ page }) => {
  await trackAudio(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /WINDHAM/ }).click();
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20000 });
  await page.locator('#harmony-play-button').click();
  const tracked = await page.evaluate(() => {
    window.previewNodes = [...state.scheduledAudio];
    window.stoppedNodes = new Set();
    window.endedNodes = new Set();
    window.beforeMute = { cursor: state.cursor, mistakes: state.mistakes, token: state.playToken, phrase: state.activePhrase };
    for (const node of window.previewNodes) {
      node.addEventListener('ended', () => window.endedNodes.add(node), { once: true });
      const stop = node.stop.bind(node);
      node.stop = (...args) => { if (args.length === 0) window.stoppedNodes.add(node); return stop(...args); };
    }
    return window.previewNodes.length;
  });
  expect(tracked).toBeGreaterThan(0);
  const mute = page.getByRole('button', { name: 'Mute sound', exact: true });
  await expect(mute).toBeVisible({ timeout: 1000 });
  await mute.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Unmute sound', exact: true })).toBeVisible();
  const muted = await page.evaluate(() => {
    const count = window.createdOscillators.length;
    organTone(220, .2);
    playPressedNote(notesFor(currentTune())[0], currentTune());
    playCompletionChord(currentTune());
    return {
      allStopped: window.previewNodes.every(node => window.stoppedNodes.has(node) || window.endedNodes.has(node)),
      stopped: window.stoppedNodes.size, pending: state.scheduledAudio.size,
      preventedNewSources: window.createdOscillators.length === count,
      samePhrase: state.activePhrase === window.beforeMute.phrase, cursor: state.cursor, mistakes: state.mistakes,
      sameToken: state.playToken === window.beforeMute.token, previousCursor: window.beforeMute.cursor, previousMistakes: window.beforeMute.mistakes,
    };
  });
  expect(muted.allStopped).toBe(true);
  expect(muted.stopped).toBeGreaterThan(0);
  expect(muted.pending).toBe(0);
  expect(muted.preventedNewSources).toBe(true);
  expect(muted.samePhrase && muted.sameToken).toBe(true);
  expect(muted.cursor).toBe(muted.previousCursor);
  expect(muted.mistakes).toBe(muted.previousMistakes);
  await page.getByRole('button', { name: 'Unmute sound', exact: true }).click();
  await expect(page.locator('#audio-status')).toHaveText('sound ready · optional');
  expect(await page.evaluate(() => { const count = window.createdOscillators.length; organTone(220, .2); return window.createdOscillators.length > count; })).toBe(true);
});

test('mute chosen on the title page persists across reloads', async ({ page }) => {
  await page.goto('/');
  const mute = page.getByRole('button', { name: 'Mute sound', exact: true });
  await expect(mute).toBeVisible({ timeout: 1000 });
  await mute.click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Unmute sound', exact: true })).toBeVisible();
});
