'use strict';

const { test, expect } = require('@playwright/test');

for (const completed of [false, true]) {
  test(`replay cancels harmony preview ${completed ? 'after completion' : 'during recall'} and allows another preview`, async ({ page }, testInfo) => {
    test.setTimeout(45_000);
    await page.goto('/');
    await page.getByRole('button', { name: 'Attend Singing School' }).click();
    await page.getByRole('button', { name: /WINDHAM/ }).click();
    await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20_000 });
    if (completed) {
      const notes = page.locator('#staff .staff-accessibility span');
      const count = await notes.count();
      for (let index = 0; index < count; index++) {
        const label = await notes.nth(index).getAttribute('aria-label');
        const shape = label.startsWith('unwritten note') ? 'rest' : label.split(',')[0].trim().toLowerCase();
        await page.locator(`#shape-keys [data-shape="${shape}"]`).click();
      }
      await expect(page.locator('#prompt')).toContainText('Phrase complete');
    }
    const preview = page.locator('#harmony-play-button');
    await page.evaluate(() => { window.priorAudio = new Set(state.scheduledAudio); });
    await preview.click();
    await expect(preview).toBeDisabled();
    const previous = await page.evaluate(() => {
      window.previewStopped = new Set();
      window.previewEnded = new Set();
      window.previewNodes = [...state.scheduledAudio].filter(node => !window.priorAudio.has(node));
      window.previousPhrase = state.activePhrase;
      window.replayStarts = 0;
      const originalPlayPhrase = playPhrase;
      playPhrase = () => { window.replayStarts++; return originalPlayPhrase(); };
      for (const node of window.previewNodes) {
        node.addEventListener('ended', () => window.previewEnded.add(node), { once: true });
        const stop = node.stop.bind(node);
        node.stop = (...args) => { window.previewStopped.add(node); return stop(...args); };
      }
      return { audio: window.previewNodes.length, notes: state.activePhrase.length };
    });
    expect(previous.audio).toBeGreaterThan(0);
    await page.locator('#replay-button').click();
    const replay = await page.evaluate(() => ({
      stopped: window.previewNodes.every(node => window.previewStopped.has(node) || window.previewEnded.has(node)),
      stoppedCount: window.previewStopped.size,
      samePhrase: state.activePhrase === window.previousPhrase,
      playbackStarts: window.replayStarts,
      phase: state.phase
    }));
    expect(replay.stopped).toBe(true);
    expect(replay.stoppedCount).toBeGreaterThan(0);
    expect(replay.samePhrase).toBe(true);
    expect(replay.playbackStarts).toBe(1);
    expect(replay.phase).toBe('listen');
    await expect(preview).toBeEnabled();
    await expect(preview).not.toHaveText('the class is singing…');
    await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20_000 });
    await preview.click();
    await expect(preview).toBeDisabled();
    await expect(preview).toBeEnabled({ timeout: 20_000 });
    await page.screenshot({ path: testInfo.outputPath('replay-recovered.png') });
  });
}

test('replaying immediately after a bench loss clears its cancelled visual effect', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the Book' }).click();
  await page.getByRole('button', { name: 'Take your place' }).click();
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20_000 });
  const firstNote = await page.locator('#staff .staff-accessibility span').first().getAttribute('aria-label');
  const wrong = firstNote.startsWith('fa') ? 'sol' : 'fa';
  for (let i = 0; i < 3; i++) await page.locator(`#shape-keys [data-shape="${wrong}"]`).click();
  await expect(page.locator('#game')).toHaveClass(/bench-loss/);
  await page.locator('#replay-button').click();
  await expect(page.locator('#game')).not.toHaveClass(/bench-loss/);
  await expect(page.locator('#bench-dots .lost')).toHaveCount(1);
});
