'use strict';
const { test, expect } = require('@playwright/test');

async function startSmudgedLesson(page) {
  await page.clock.install({ time: new Date('2026-10-02T06:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-10-02T06:10:00Z'));
  // Isolated third campaign lesson exercises real ink masking without completing earlier songs.
  await page.evaluate(() => { state.mode = 'campaign'; state.songIndex = 2; beginLesson(); });
  await page.clock.runFor(350);
}
async function finishListening(page) {
  const duration = await page.evaluate(() => {
    const tune = currentTune();
    return 450 + (tune.harmony ? tune.harmony.beats : notesFor(tune).length) * 360;
  });
  await page.clock.runFor(duration);
  expect(await page.evaluate(() => state.phase)).toBe('sing');
  await expect(page.locator('#staff .staff-accessibility span')).not.toHaveCount(0);
}

for (const drawer of ['assistance', 'reference']) {
  test(`${drawer} preserves the last part of the recall window across a long modal visit`, async ({ page }, testInfo) => {
    await startSmudgedLesson(page);
    await finishListening(page);
    await page.clock.runFor(800);
    const remaining = await page.evaluate(() => state.hideAt - Date.now());
    expect(remaining).toBe(100);
    const button = drawer === 'assistance' ? page.locator('#game [data-action="open-settings"]') : page.locator('#game-reference-button');
    await button.click({ force: true });
    await page.clock.runFor(10000);
    await page.getByRole('button', { name: `Close ${drawer}` }).click({ force: true });
    expect(await page.evaluate(() => state.hideAt - Date.now())).toBe(remaining);
    await expect(page.locator('#app')).toHaveAttribute('aria-hidden', 'false');
    await expect(button).toBeFocused();
    await expect(page.locator('#staff [aria-label="obscured note"]')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('recall-resumed.png') });
    await page.clock.runFor(150);
    await expect(page.locator('#staff [aria-label="obscured note"]')).not.toHaveCount(0);
  });
}

test('recall starting while assistance is open gets its full visible window after close', async ({ page }) => {
  await startSmudgedLesson(page);
  await page.locator('#game [data-action="open-settings"]').click({ force: true });
  await finishListening(page);
  await page.clock.runFor(10000);
  await page.getByRole('button', { name: 'Close assistance' }).click({ force: true });
  expect(await page.evaluate(() => state.hideAt - Date.now())).toBe(900);
  await expect(page.locator('#staff [aria-label="obscured note"]')).toHaveCount(0);
  await page.clock.runFor(950);
  await expect(page.locator('#staff [aria-label="obscured note"]')).not.toHaveCount(0);
});
