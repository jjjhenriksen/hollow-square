'use strict';
const { test, expect } = require('@playwright/test');
const pageErrors = new WeakMap();
test.afterEach(async ({ page }) => { expect(pageErrors.get(page) || []).toEqual([]); });

async function notationFixture(page) {
  const errors = []; pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-02T06:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-10-02T06:10:00Z'));
  await page.evaluate(async () => {
    await loadOsmd();
    window.notationLoads = []; window.notationRenders = 0;
    const prototype = window.opensheetmusicdisplay.OpenSheetMusicDisplay.prototype;
    const load = prototype.load; const render = prototype.render;
    prototype.load = function (xml) {
      window.notationLoads.push(xml);
      if (window.failNextNotation) {
        window.failNextNotation = false;
        return Promise.reject(new Error('Isolated notation parse failure'));
      }
      const parsed = load.call(this, xml);
      if (!window.holdNextNotation) return parsed;
      window.holdNextNotation = false;
      const gate = new Promise(resolve => { window.releaseNotation = resolve; });
      return Promise.all([parsed, gate]).then(([result]) => result);
    };
    prototype.render = function (...args) { window.notationRenders++; return render.apply(this, args); };
  });
}
async function startLesson(page, index = 6) {
  await page.evaluate(index => { state.mode = 'campaign'; state.songIndex = index; beginLesson(); }, index);
  await expect(page.locator('#staff svg')).toBeVisible();
}
const counts = page => page.evaluate(() => ({ loads: window.notationLoads.length, renders: window.notationRenders }));

test('one score layout survives playback, masking, answers and responsive resize', async ({ page }, testInfo) => {
  await notationFixture(page);
  await startLesson(page);
  await page.evaluate(() => { window.originalStaffSvg = document.querySelector('#staff svg'); });
  await page.clock.runFor(350);
  const timing = await page.evaluate(() => {
    const tune = currentTune(); const notes = notesFor(tune);
    const eyeIndex = notes.findIndex(note => note.silent && note.midi !== null);
    return { eyeIndex, eyeAt: 360 + (notes[eyeIndex].beat ?? eyeIndex) * 360, end: 450 + tune.harmony.beats * 360 };
  });
  expect(timing.eyeIndex).toBeGreaterThanOrEqual(0);
  await page.clock.runFor(timing.eyeAt);
  await expect(page.locator('#staff .note-eye.is-open')).toHaveCount(1);
  await expect(page.locator('#staff [aria-label="unwritten note — keep silent"]')).not.toHaveCount(0);
  await page.clock.runFor(timing.end - timing.eyeAt + 950);
  expect(await page.evaluate(() => state.phase)).toBe('sing');
  const masked = await page.locator('#staff .note-blot').count();
  expect(masked).toBeGreaterThan(0);
  await expect(page.locator('#staff [aria-label="obscured note"]')).not.toHaveCount(0);
  expect(await counts(page)).toEqual({ loads: 1, renders: 1 });
  const answer = await page.evaluate(() => noteSyllable(notesFor(currentTune())[state.cursor]));
  const cursor = await page.evaluate(() => state.cursor);
  await page.locator(`#shape-keys [data-shape="${answer}"]`).click({ force: true });
  expect(await page.evaluate(() => state.cursor)).toBe(cursor + 1);
  // Repeated visual refreshes must replace overlays rather than accumulate them.
  await page.evaluate(() => { for (let i = 0; i < 5; i++) renderStaff(); });
  await expect(page.locator('#staff .note-blot')).toHaveCount(masked);
  expect(await page.evaluate(() => window.originalStaffSvg === document.querySelector('#staff svg'))).toBe(true);
  expect(await counts(page)).toEqual({ loads: 1, renders: 1 });
  await page.screenshot({ path: testInfo.outputPath('cached-masking.png') });
  await page.setViewportSize({ width: 850, height: 900 });
  await page.clock.runFor(100);
  await expect.poll(async () => (await counts(page)).renders).toBeGreaterThan(1);
  expect((await counts(page)).loads).toBe(1);
  await expect(page.locator('#staff .note-blot')).toHaveCount(masked);
  await page.evaluate(() => { state.mode = 'practice'; renderStaff(); });
  await expect(page.locator('#staff .note-blot, #staff .note-eye')).toHaveCount(0);
  await expect(page.locator('#staff [aria-label="obscured note"]')).toHaveCount(0);
  expect((await counts(page)).loads).toBe(1);
  await testInfo.attach('notation-counts', { body: JSON.stringify({ afterPlaybackAndAnswers: { loads: 1, renders: 1 }, afterResize: await counts(page), maskedNotes: masked, pageErrors: pageErrors.get(page) }), contentType: 'application/json' });
});

test('visual updates share an in-flight parse and show current accessible labels', async ({ page }) => {
  await notationFixture(page);
  await page.evaluate(() => {
    window.holdNextNotation = true;
    state.mode = 'campaign'; state.songIndex = 6; beginLesson();
  });
  await page.waitForFunction(() => Boolean(window.releaseNotation));
  await page.evaluate(() => {
    state.phase = 'sing'; state.hideAt = 0;
    for (let i = 0; i < 5; i++) { state.cursor = i; renderStaff(); }
  });
  expect((await counts(page)).loads).toBe(1);
  await expect(page.locator('#staff [aria-label="obscured note"]')).not.toHaveCount(0);
  await page.evaluate(() => window.releaseNotation());
  await expect(page.locator('#staff svg')).toBeVisible();
  expect(await counts(page)).toEqual({ loads: 1, renders: 1 });
  await expect(page.locator('#staff .note-blot')).not.toHaveCount(0);
});

test('a new score replaces the cache and an older pending parse cannot redraw it', async ({ page }) => {
  await notationFixture(page);
  await page.evaluate(() => { window.holdNextNotation = true; state.songIndex = 6; beginLesson(); });
  await page.waitForFunction(() => Boolean(window.releaseNotation));
  await startLesson(page, 2);
  const svg = await page.evaluate(() => {
    window.newStaffSvg = document.querySelector('#staff svg');
    return { loads: window.notationLoads.length, renders: window.notationRenders };
  });
  expect(svg).toEqual({ loads: 2, renders: 1 });
  await page.evaluate(() => window.releaseNotation());
  await expect(page.locator('#game-heading')).toHaveText('WINDHAM.');
  expect(await page.evaluate(() => window.newStaffSvg === document.querySelector('#staff svg'))).toBe(true);
  expect(await counts(page)).toEqual(svg);
});

test('a failed parse keeps accessible notes and permits a fresh retry', async ({ page }) => {
  await notationFixture(page);
  await page.evaluate(() => { window.failNextNotation = true; state.songIndex = 2; beginLesson(); });
  await expect(page.locator('#staff')).toContainText('The notation plate could not be set.');
  await expect(page.locator('#staff .staff-accessibility span')).not.toHaveCount(0);
  await page.evaluate(() => renderStaff());
  await expect(page.locator('#staff svg')).toBeVisible();
  expect(await counts(page)).toEqual({ loads: 2, renders: 1 });
});
