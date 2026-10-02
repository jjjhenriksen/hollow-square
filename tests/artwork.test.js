'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scenes = ['meetinghouse', 'wrongPages', 'thumbprint', 'emptyChair', 'pencilNote', 'floorboards', 'heavyBook', 'threeBenches', 'closedBook', 'wrongShadow', 'placeInSquare'];

function loadArt() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'artwork.js'), 'utf8'), context);
  return context.window.HollowArt;
}

test('all story scenes are deterministic, labeled SVG drawings', () => {
  const art = loadArt();
  const freshArt = loadArt();
  const drawings = [];
  for (const scene of scenes) {
    const first = art.story(scene, `Scene: ${scene}`);
    expect(first).toContain('<svg');
    expect(first).toContain(`aria-label="Scene: ${scene}"`);
    expect(first).toBe(art.story(scene, `Scene: ${scene}`));
    expect(first).toBe(freshArt.story(scene, `Scene: ${scene}`));
    drawings.push(art.story(scene, 'Same label'));
  }
  expect(new Set(drawings).size).toBe(scenes.length);
  expect(art.title()).toBe(freshArt.title());
  expect(art.title()).toContain('aria-label="An ink drawing');
});

test('unknown and inherited scene names safely use the first story plate', () => {
  const art = loadArt();
  const fallback = art.story('meetinghouse', 'Fallback label');
  for (const scene of ['missing-scene', 'constructor', '__proto__', 'toString', 'hasOwnProperty', 'title', undefined, null]) {
    expect(art.story(scene, 'Fallback label')).toBe(fallback);
  }
});

test('all plates are self-contained vector artwork', () => {
  const art = loadArt();
  for (const drawing of [art.title(), ...scenes.map(scene => art.story(scene, scene))]) {
    expect(drawing).not.toMatch(/<(?:image|feImage|foreignObject)\b/i);
    expect(drawing).not.toMatch(/(?:href\s*=|url\(\s*["']?)(?:https?:|data:|\/\/)/i);
    expect(drawing).not.toMatch(/data:image\//i);
  }
});

test('every plate renders on a transparent canvas without a full-bleed background', async ({ page }) => {
  const art = loadArt();
  const drawings = [{ scene: 'title', drawing: art.title() }, ...scenes.map(scene => ({ scene, drawing: art.story(scene, scene) }))];
  const results = await page.evaluate(async drawings => {
    const results = [];
    for (const { scene, drawing } of drawings) {
      const document = new DOMParser().parseFromString(drawing, 'image/svg+xml');
      const svg = document.documentElement;
      const [x, y, width, height] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
      const dimension = (value, extent) => value?.endsWith('%') ? parseFloat(value) / 100 * extent : Number(value || 0);
      const backgrounds = [...svg.querySelectorAll('rect')].filter(rect =>
        Number(rect.getAttribute('x') || 0) <= x && Number(rect.getAttribute('y') || 0) <= y &&
        dimension(rect.getAttribute('width'), width) >= width && dimension(rect.getAttribute('height'), height) >= height
      ).length;
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
      await image.decode();
      const canvas = window.document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, width, height).data;
      let edgeAlpha = 0;
      let paintedPixels = 0;
      for (let row = 0; row < height; row++) {
        for (let column = 0; column < width; column++) {
          const alpha = pixels[(row * width + column) * 4 + 3];
          if (alpha) paintedPixels++;
          if (row === 0 || row === height - 1 || column === 0 || column === width - 1) edgeAlpha = Math.max(edgeAlpha, alpha);
        }
      }
      results.push({ scene, backgrounds, edgeAlpha, paintedPixels });
    }
    return results;
  }, drawings);
  for (const result of results) {
    expect(result.backgrounds, `${result.scene}: full-bleed backgrounds`).toBe(0);
    expect(result.edgeAlpha, `${result.scene}: canvas edge opacity`).toBe(0);
    expect(result.paintedPixels, `${result.scene}: visible illustration`).toBeGreaterThan(0);
  }
});

test('labels survive SVG parsing without becoming markup or attributes', async ({ page }) => {
  const label = 'Song " onload="unexpected & <ink> \' watercolor';
  const drawings = scenes.map(scene => loadArt().story(scene, label));
  const parsed = await page.evaluate(({ drawings, label }) => drawings.map(drawing => {
    const document = new DOMParser().parseFromString(drawing, 'image/svg+xml');
    const svg = document.documentElement;
    return {
      valid: document.querySelector('parsererror') === null && svg.localName === 'svg',
      label: svg.getAttribute('aria-label'),
      unexpectedAttribute: svg.hasAttribute('onload'),
      unexpectedElement: document.querySelector('ink') !== null
    };
  }), { drawings, label });
  for (const drawing of parsed) {
    expect(drawing).toEqual({ valid: true, label, unexpectedAttribute: false, unexpectedElement: false });
  }
});

test('title and every story coexist with unique, locally resolved paint servers', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the Book' }).click();
  await expect(page.locator('#story-illustration > svg')).toBeVisible();
  await expect(page.locator('#title-art > svg')).toHaveCount(1);

  for (let index = 0; index < 12; index++) {
    await page.evaluate(index => showStory(index), index);
    const result = await page.evaluate(() => {
      const svgs = [...document.querySelectorAll('#title-art > svg, #story-illustration > svg')];
      const ids = svgs.flatMap(svg => [...svg.querySelectorAll('[id]')].map(node => node.id));
      const unresolved = [];
      for (const svg of svgs) {
        const localIds = new Set([...svg.querySelectorAll('[id]')].map(node => node.id));
        for (const node of svg.querySelectorAll('[filter], [fill], [stroke]')) {
          for (const attribute of ['filter', 'fill', 'stroke']) {
            const value = node.getAttribute(attribute) || '';
            for (const match of value.matchAll(/url\(\s*["']?#([^\s)"']+)["']?\s*\)/g)) {
              if (!localIds.has(match[1])) unresolved.push(match[1]);
            }
          }
        }
      }
      const bounds = svgs[1].getBoundingClientRect();
      return { count: svgs.length, duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index), unresolved, width: bounds.width, height: bounds.height };
    });
    expect(result.count).toBe(2);
    expect(result.duplicateIds).toEqual([]);
    expect(result.unresolved).toEqual([]);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
  await testInfo.attach('rendered-final-story', { body: await page.locator('#story-illustration').screenshot(), contentType: 'image/png' });
});

test('visible candle art moves and hidden title art pauses', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const flame = page.locator('#title-art .art-flame');
  await expect(flame).toHaveCount(1);
  expect(await flame.evaluate(node => getComputedStyle(node).animationName)).not.toBe('none');
  const transforms = await flame.evaluate(async node => {
    const initial = getComputedStyle(node).transform;
    await new Promise(resolve => setTimeout(resolve, 300));
    return { initial, later: getComputedStyle(node).transform };
  });
  expect(transforms.later).not.toBe(transforms.initial);

  await page.getByRole('button', { name: 'Open the Book' }).click();
  await expect(page.locator('#title')).toBeHidden();
  const states = await page.locator('#title-art .art-flame, #title-art .art-glow, #title-art .art-smoke, #title-art .art-shadow')
    .evaluateAll(nodes => nodes.flatMap(node => getComputedStyle(node).animationPlayState.split(',').map(state => state.trim())));
  expect(states.length).toBeGreaterThan(0);
  expect(states.every(state => state === 'paused')).toBe(true);
});

test('reduced motion removes every illustration animation, including after a live preference change', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Open the Book' }).click();
  const seenClasses = new Set();
  for (let index = 0; index < 12; index++) {
    await page.evaluate(index => showStory(index), index);
    const animations = await page.locator('.programmatic-art .art-flame, .programmatic-art .art-glow, .programmatic-art .art-smoke, .programmatic-art .art-shadow')
      .evaluateAll(nodes => nodes.map(node => ({ classes: [...node.classList], name: getComputedStyle(node).animationName, running: node.getAnimations().length })));
    for (const animation of animations) {
      animation.classes.forEach(name => seenClasses.add(name));
      expect(animation.name).toBe('none');
      expect(animation.running).toBe(0);
    }
  }
  for (const name of ['art-flame', 'art-glow', 'art-smoke', 'art-shadow']) expect(seenClasses.has(name), name).toBe(true);
});

test('the twelve tune entries map to eleven scenes with the heavy book reused', () => {
  const context = vm.createContext({
    window: {}, document: { querySelector: () => ({}) },
    localStorage: { getItem: () => null, setItem: () => {} }
  });
  const root = path.join(__dirname, '..');
  vm.runInContext(fs.readFileSync(path.join(root, 'harmony-data.js'), 'utf8'), context);
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8').split("document.addEventListener('click'")[0] +
    '\nglobalThis.tuneScenes = TUNES.map(tune => tune.artScene);';
  vm.runInContext(app, context);
  expect(context.tuneScenes).toHaveLength(12);
  expect(new Set(context.tuneScenes).size).toBe(11);
  expect(context.tuneScenes.filter(scene => scene === 'heavyBook')).toHaveLength(2);
});
