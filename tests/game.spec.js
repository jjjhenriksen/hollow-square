'use strict';

const { test, expect } = require('@playwright/test');

async function startFirstTune(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the Book' }).click();
  await page.getByRole('button', { name: 'Take your place' }).click();
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20_000 });
}

async function finishVisiblePhrase(page) {
  const notes = page.locator('#staff .staff-accessibility span');
  const count = await notes.count();
  for (let index = 0; index < count; index++) {
    const label = (await notes.nth(index).getAttribute('aria-label')) || '';
    const shape = label.startsWith('unwritten note') ? 'rest' : label.split(',')[0].trim().toLowerCase();
    await page.locator(`#shape-keys [data-shape="${shape}"]`).click();
  }
}

test('dialogs have names and isolate all game shortcuts', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /WINDHAM/ }).click();
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20_000 });
  const benches = await page.locator('#bench-dots').getAttribute('aria-label');
  await page.locator('#game [data-action="open-settings"]').click();
  const dialog = page.getByRole('dialog', { name: 'Keep your place.' });
  await expect(dialog).toBeVisible();
  const prompt = await page.locator('#prompt').textContent();
  await page.locator('#settings-form input[name="hints"]').focus();
  for (const key of ['f', 's', 'l', 'm', ' ']) await page.keyboard.press(key);
  await expect(page.locator('#prompt')).toHaveText(prompt);
  await expect(page.locator('#bench-dots')).toHaveAttribute('aria-label', await benches);
  await page.getByRole('button', { name: 'Close assistance' }).click();
  await page.getByRole('button', { name: 'reference' }).click();
  await expect(page.getByRole('dialog', { name: 'The real book' })).toBeVisible();
});

test('opening a fresh campaign restores all benches and the first-play cue', async ({ page }) => {
  await startFirstTune(page);
  const expected = await page.locator('#staff .staff-accessibility span').first().getAttribute('aria-label');
  const wrongShape = expected.startsWith('fa') ? 'sol' : 'fa';
  for (let miss = 0; miss < 3; miss++) await page.locator(`#shape-keys [data-shape="${wrongShape}"]`).click();
  await expect(page.locator('#bench-dots .lost')).toHaveCount(1);
  await page.locator('header [data-action="home"]').click();
  await page.getByRole('button', { name: 'Open the Book' }).click();
  await page.getByRole('button', { name: 'Take your place' }).click();
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#first-play-cue')).toBeVisible();
  await expect(page.locator('#bench-dots .lost')).toHaveCount(0);
});

test('changing reduced memory keeps the active phrase and cursor valid', async ({ page }) => {
  await startFirstTune(page);
  await finishVisiblePhrase(page);
  await expect(page.locator('#story')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole('button', { name: /Take your place/ })).toBeVisible({ timeout: 4_000 });
  await page.getByRole('button', { name: /Take your place/ }).click();
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20_000 });
  const initialCount = await page.locator('#staff .staff-accessibility span').count();
  expect(initialCount).toBeGreaterThan(10);
  await page.locator('#game [data-action="open-settings"]').click();
  await page.getByLabel('Use a shorter memory phrase').check();
  await page.getByRole('button', { name: 'Close assistance' }).click();
  await expect(page.locator('#staff .staff-accessibility span')).toHaveCount(initialCount);
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible();
});

test('320px practice controls fit without page-level horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /WINDHAM/ }).click();
  await expect(page.locator('#shape-keys button').first()).toBeVisible();
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  const keyBounds = await page.locator('#shape-keys').evaluate(node => node.getBoundingClientRect().right);
  expect(keyBounds).toBeLessThanOrEqual(320);
  await page.setViewportSize({ width: 375, height: 812 });
  const wider = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(wider.document).toBeLessThanOrEqual(wider.viewport);
});

test('280px practice controls fit while notation scrolls inside its panel', async ({ page }) => {
  await page.setViewportSize({ width: 280, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /WINDHAM/ }).click();
  await expect(page.locator('#shape-keys button').first()).toBeVisible();
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  const harmonyRight = await page.locator('#harmony-play-button').evaluate(node => node.getBoundingClientRect().right);
  expect(harmonyRight).toBeLessThanOrEqual(280);
  const notation = await page.locator('#staff').evaluate(node => {
    const panel = node.closest('.staff-wrap');
    return { scrollWidth: panel.scrollWidth, clientWidth: panel.clientWidth };
  });
  expect(notation.scrollWidth).toBeGreaterThan(notation.clientWidth);
});

test('a failed notation download can retry on a later phrase', async ({ page }) => {
  let fail = true;
  await page.route('**/vendor/opensheetmusicdisplay.min.js', route => fail ? route.abort() : route.continue());
  await page.goto('/');
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /WINDHAM/ }).click();
  await expect(page.locator('#staff .quiet-note')).toContainText('notation plate could not be set', { timeout: 20_000 });
  fail = false;
  await page.locator('header [data-action="home"]').click();
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /WINDHAM/ }).click();
  await expect(page.locator('#staff svg')).toBeVisible({ timeout: 20_000 });
});

test('audio status stays visible on a phrase without a rest', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /WINDHAM/ }).click();
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#silence-hint')).toBeHidden();
  await expect(page.locator('#audio-status')).toBeVisible();
  await expect(page.locator('#audio-guidance')).toBeVisible();
});

test('audio status updates when a suspended context resumes asynchronously', async ({ page }) => {
  await page.addInitScript(() => {
    window.AudioContext = class {
      constructor() {
        this.state = 'suspended';
        this.resumePromise = new Promise(resolve => {
          window.completeAudioResume = () => {
            this.state = 'running';
            resolve();
          };
        });
      }
      resume() { return this.resumePromise; }
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the Book' }).click();
  await page.getByRole('button', { name: 'Take your place' }).click();
  const status = page.locator('#audio-status');
  await expect(status).toHaveAttribute('data-state', 'starting');
  await page.evaluate(() => window.completeAudioResume());
  await expect(status).toHaveAttribute('data-state', 'ready');
  await expect(status).toHaveText('sound ready · optional');
  await page.locator('header [data-action="home"]').click();
});

test('audio status retains the fallback when asynchronous resume is rejected', async ({ page }) => {
  await page.addInitScript(() => {
    window.AudioContext = class {
      constructor() {
        this.state = 'suspended';
        this.resumePromise = new Promise((resolve, reject) => {
          window.rejectAudioResume = () => reject(new Error('audio remains unavailable'));
        });
      }
      resume() { return this.resumePromise; }
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the Book' }).click();
  await page.getByRole('button', { name: 'Take your place' }).click();
  const status = page.locator('#audio-status');
  await expect(status).toHaveAttribute('data-state', 'starting');
  await page.evaluate(() => window.rejectAudioResume());
  await expect(status).toHaveAttribute('data-state', 'blocked');
  await expect(status).toContainText('use the on-screen cues');
  await page.locator('header [data-action="home"]').click();
});

test('the harmony plate renders the source four-part notation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /WINDHAM/ }).click();
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'show the parts' }).click();
  await expect(page.locator('#harmony-plate svg')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#harmony-plate')).toContainText('Treble');
  await expect(page.locator('#harmony-plate')).toContainText('Alto');
  await expect(page.locator('#harmony-plate')).toContainText('Tenor');
  await expect(page.locator('#harmony-plate')).toContainText('Bass');
});

test('David’s Lamentation tied opening renders through the notation engine', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /DAVID’S LAMENTATION/ }).click();
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'show the parts' }).click();
  await expect(page.locator('#harmony-plate svg')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#harmony-plate')).toContainText('Bass');
});

test('leaving during the opening delay cancels the old lesson start', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the Book' }).click();
  await page.getByRole('button', { name: 'Take your place' }).click();
  await page.locator('header [data-action="home"]').click();
  await page.waitForTimeout(500);
  await expect(page.locator('#title')).toBeVisible();
  await expect(page.locator('#game')).toBeHidden();
});

test('leaving during class playback stops later note updates and scheduled audio', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the Book' }).click();
  await page.getByRole('button', { name: 'Take your place' }).click();
  await page.waitForTimeout(700);
  await page.locator('header [data-action="home"]').click();
  await page.waitForTimeout(1_500);
  await expect(page.locator('#title')).toBeVisible();
  await expect(page.locator('#story')).toBeHidden();
});

test('leaving during the held completion chord cancels the next-page callback', async ({ page }) => {
  await startFirstTune(page);
  await finishVisiblePhrase(page);
  await expect(page.locator('#prompt')).toContainText('holds the chord');
  await page.locator('header [data-action="home"]').click();
  await page.waitForTimeout(2_000);
  await expect(page.locator('#title')).toBeVisible();
  await expect(page.locator('#story')).toBeHidden();
});

test('harmony preview unlocks again after a completed practice phrase', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /WINDHAM/ }).click();
  await expect(page.locator('#shape-keys button:not(:disabled)').first()).toBeVisible({ timeout: 20_000 });
  await finishVisiblePhrase(page);
  await expect(page.locator('#prompt')).toContainText('Phrase complete');
  const preview = page.locator('#harmony-play-button');
  await preview.click();
  await expect(preview).toBeEnabled({ timeout: 20_000 });
  await preview.click();
  await expect(preview).toBeEnabled({ timeout: 20_000 });
});
