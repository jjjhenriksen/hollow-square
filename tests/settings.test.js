'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function settingsFixture(stored = {}) {
  const context = vm.createContext({
    window: {}, document: { querySelector: () => ({}) },
    localStorage: { getItem: key => stored[key] ?? null }
  });
  const root = path.join(__dirname, '..');
  vm.runInContext(fs.readFileSync(path.join(root, 'harmony-data.js'), 'utf8'), context);
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8').split("document.addEventListener('click'")[0];
  vm.runInContext(app + '\nglobalThis.settings = state.settings;', context);
  return context;
}

for (const [name, stored, expected] of [
  ['missing', {}, { visibility: 'standard', mercy: '3' }],
  ['malformed', { visibility: '<invalid>', mercy: 'NaN' }, { visibility: 'standard', mercy: '3' }],
  ['removed', { visibility: 'brief', mercy: '5' }, { visibility: 'standard', mercy: '3' }],
  ['strict enum', { visibility: 'Always', mercy: ' 4 ' }, { visibility: 'standard', mercy: '3' }],
  ['valid standard', { visibility: 'standard', mercy: '3' }, { visibility: 'standard', mercy: '3' }],
  ['valid longer', { visibility: 'longer', mercy: '4' }, { visibility: 'longer', mercy: '4' }],
  ['valid always', { visibility: 'always', mercy: '4' }, { visibility: 'always', mercy: '4' }],
  ['invalid mercy only', { visibility: 'longer', mercy: 'Infinity' }, { visibility: 'longer', mercy: '3' }],
  ['invalid visibility only', { visibility: 'old', mercy: '4' }, { visibility: 'standard', mercy: '4' }]
]) {
  test(`saved assistance settings: ${name}`, () => {
    const values = Object.fromEntries(Object.entries(stored).map(([key, value]) => ['hollow-square-' + key, value]));
    values['hollow-square-hints'] = 'true';
    values['hollow-square-reduced-memory'] = 'true';
    const context = settingsFixture(values);
    expect({ ...context.settings }).toEqual({ ...expected, hints: true, reducedMemory: true });
  });
}

for (const [storedMercy, threshold] of [['invalid', 3], ['5', 3], ['Infinity', 3], ['4', 4]]) {
  test(`saved mercy ${storedMercy} still loses a bench after ${threshold} wrong answers`, () => {
    const context = settingsFixture({ 'hollow-square-mercy': storedMercy });
    vm.runInContext(`
      state.screen = 'game'; state.mode = 'campaign'; state.phase = 'sing';
      state.activePhrase = [{ syllable: 'fa', degree: 0 }];
      playPressedNote = () => {}; organTone = () => {}; renderStaff = () => {}; setPrompt = () => {};
      loseBench = () => state.lost.push('treble');
    `, context);
    for (let i = 1; i < threshold; i++) vm.runInContext("handleSing('mi')", context);
    expect(vm.runInContext('state.lost.length', context)).toBe(0);
    vm.runInContext("handleSing('mi')", context);
    expect(vm.runInContext('state.lost.length', context)).toBe(1);
    expect(vm.runInContext('state.wrongHere', context)).toBe(0);
  });
}

test('malformed saved mercy keeps the campaign penalty and valid recall setting in the browser', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hollow-square-mercy', 'invalid');
    localStorage.setItem('hollow-square-visibility', 'longer');
  });
  await page.goto('/');
  await page.locator('[data-action="open-book"]').click();
  await page.locator('[data-action="begin-lesson"]').click();
  await page.locator('#game [data-action="open-settings"]').click();
  await expect(page.locator('[name="mercy"]')).toHaveValue('3');
  await expect(page.locator('[name="visibility"]')).toHaveValue('longer');
  await page.getByRole('button', { name: 'Close assistance' }).click();
  await page.evaluate(() => {
    cancelRunWork(); state.phase = 'sing'; state.cursor = 0;
    state.activePhrase = [{ syllable: 'fa', degree: 0 }]; setKeysEnabled(true);
  });
  for (let i = 0; i < 3; i++) await page.keyboard.press('m');
  expect(await page.evaluate(() => state.lost.length)).toBe(1);
  expect(await page.evaluate(() => state.wrongHere)).toBe(0);
  await expect(page.locator('#prompt')).toContainText('bench goes quiet');
});
