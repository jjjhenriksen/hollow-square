'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadNotes() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'marginalia.js'), 'utf8'), context);
  return context.window.HollowMarginalia;
}

test('unannotated, inherited, and markup scene names cannot insert a note', () => {
  const notes = loadNotes();
  for (const scene of ['wrongPages', 'constructor', '__proto__', 'toString', '<img src=x onerror=alert(1)>', null, undefined]) {
    expect(notes.story(scene)).toBe('');
  }
  expect(notes.story('meetinghouse')).toContain('They knew my name.');
  expect(notes.practice()).toContain('Rain all morning.');
});

test('story navigation replaces margin writing and clears pages without notes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the Book' }).click();
  const slot = page.locator('#story-margin-note');
  await expect(slot.getByRole('complementary', { name: 'Handwritten margin note' })).toBeVisible();
  await expect(slot).toContainText('They knew my name.');
  for (const [index, text] of [[3, 'Was that chair always so close?'], [4, 'I don’t remember writing this.'], [7, 'Count the benches again.'], [11, 'Leave a little room.']]) {
    await page.evaluate(index => showStory(index), index);
    await expect(slot.locator('.margin-note')).toHaveCount(1);
    await expect(slot.locator('p')).toHaveText(text);
  }
  await page.evaluate(() => showStory(1));
  await expect(slot).toBeEmpty();
  await expect(slot).toBeHidden();
  await page.evaluate(() => showStory(0));
  await expect(slot.locator('p')).toHaveText('They knew my name.');
  await expect(slot.locator('svg')).toHaveCount(0);
  await expect(slot.locator('button, a, input')).toHaveCount(0);
});

test('singing school has useful accessible margin writing and a local loaded font', async ({ page }) => {
  const fontResponses = [];
  page.on('response', response => {
    if (response.url().includes('/assets/fonts/LaBelleAurore-notes.ttf')) fontResponses.push({ url: response.url(), status: response.status() });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  const note = page.locator('#practice-margin-note .margin-note');
  await expect(note).toBeVisible();
  await expect(note.getByRole('paragraph')).toHaveText('Rain all morning.');
  await expect(note).toHaveAttribute('aria-label', 'Handwritten margin note');
  const font = await note.evaluate(async node => {
    const loaded = await document.fonts.load('400 15px La Belle Aurore', node.textContent);
    return { loaded: loaded.length, status: loaded[0]?.status, family: getComputedStyle(node).fontFamily };
  });
  expect(font.loaded).toBeGreaterThan(0);
  expect(font.status).toBe('loaded');
  expect(font.family).toContain('La Belle Aurore');
  expect(fontResponses.length).toBeGreaterThan(0);
  expect(fontResponses.every(response => response.status === 200 && new URL(response.url).origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('margin writing stays readable and within 320px pages', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the Book' }).click();
  const fit = async selector => {
    const note = page.locator(selector);
    await expect(note).toBeVisible();
    const bounds = await note.evaluate(node => {
      const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
      return { left: rect.left, right: rect.right, font: parseFloat(style.fontSize), viewport: innerWidth, document: document.documentElement.scrollWidth };
    });
    expect(bounds.font).toBeGreaterThanOrEqual(14);
    expect(bounds.font).toBeLessThanOrEqual(15);
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(bounds.viewport);
    expect(bounds.document).toBeLessThanOrEqual(bounds.viewport);
  };
  await fit('#story-margin-note .margin-note');
  await page.locator('header [data-action="home"]').click();
  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await fit('#practice-margin-note .margin-note');
});
