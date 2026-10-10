'use strict';
const { test, expect } = require('@playwright/test');

test('a story-page checkpoint survives reload and practice without saving a partial phrase', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#continue-book')).toBeHidden();
  await page.getByRole('button', { name: 'Open the Book', exact: true }).click();
  await page.evaluate(() => { state.lost = ['treble']; state.totalMistakes = 3; showStory(2); });
  const saved = await page.evaluate(() => localStorage.getItem(CAMPAIGN_KEY));
  await page.getByRole('button', { name: 'Take your place' }).click();
  await page.evaluate(() => { state.cursor = 5; state.totalMistakes = 6; state.lost.push('alto'); });
  await page.reload();
  await expect(page.locator('#continue-book')).toContainText('Return to page');
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.locator('[data-practice-index="0"]').click();
  await page.locator('[data-action="home"]').first().click();
  expect(await page.evaluate(() => localStorage.getItem(CAMPAIGN_KEY))).toBe(saved);
  await page.locator('#continue-book').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#story')).toBeVisible();
  expect(await page.evaluate(() => ({ songIndex: state.songIndex, lost: state.lost, mistakes: state.totalMistakes, cursor: state.cursor })))
    .toEqual({ songIndex: 2, lost: ['treble'], mistakes: 3, cursor: 0 });
  await expect(page.locator('#story-heading')).toBeFocused();
  expect(errors).toEqual([]);
});

test('beginning again replaces a checkpoint and both endings clear it', async ({ page }) => {
  await page.goto('/');
  for (const won of [false, true]) {
    await page.evaluate(() => { state.mode = 'campaign'; state.lost = ['treble']; state.totalMistakes = 3; showStory(2); showScreen('title'); });
    await page.getByRole('button', { name: 'Begin again', exact: true }).click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem(CAMPAIGN_KEY))))
      .toEqual({ version: 1, songId: '45t', lost: [], totalMistakes: 0 });
    await page.evaluate(won => finishGame(won), won);
    await page.locator('[data-action="home"]').first().click();
    await expect(page.locator('#continue-book')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem(CAMPAIGN_KEY))).toBeNull();
  }
});

test('malformed, unsupported, and impossible checkpoints leave a playable title screen', async ({ page }) => {
  await page.goto('/');
  const valid = { version: 1, songId: '45t', lost: [], totalMistakes: 0 };
  for (const value of ['{broken', 'null', JSON.stringify({ ...valid, version: 2 }), JSON.stringify({ ...valid, songId: 'missing' }), JSON.stringify({ ...valid, lost: ['bass', 'bass'] }), JSON.stringify({ ...valid, lost: ['other'] }), JSON.stringify({ ...valid, totalMistakes: -1 })]) {
    await page.evaluate(value => localStorage.setItem(CAMPAIGN_KEY, value), value);
    await page.reload();
    await expect(page.locator('#continue-book')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open the Book', exact: true })).toBeVisible();
  }
});

test('blocked storage still supports a checkpoint during this visit', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the Book', exact: true }).click();
  await page.locator('[data-action="home"]').first().click();
  await expect(page.locator('#checkpoint-note')).toContainText('cannot save your place after a reload');
  await page.locator('#continue-book').click();
  await expect(page.locator('#story')).toBeVisible();
});
