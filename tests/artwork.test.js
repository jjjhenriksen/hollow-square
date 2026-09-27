'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('all story scenes are deterministic, labeled SVG drawings', () => {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'artwork.js'), 'utf8'), context);
  const scenes = ['meetinghouse', 'wrongPages', 'thumbprint', 'emptyChair', 'pencilNote', 'floorboards', 'heavyBook', 'threeBenches', 'closedBook', 'wrongShadow', 'placeInSquare'];
  for (const scene of scenes) {
    const first = context.window.HollowArt.story(scene, `Scene: ${scene}`);
    expect(first).toContain('<svg');
    expect(first).toContain(`aria-label="Scene: ${scene}"`);
    expect(first).toBe(context.window.HollowArt.story(scene, `Scene: ${scene}`));
  }
  expect(context.window.HollowArt.title()).toContain('aria-label="An ink drawing');
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
