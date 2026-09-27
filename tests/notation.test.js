'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('bar-spanning notes have forward start/stop ties, never ties on rests', () => {
  const context = vm.createContext({
    HARMONY_DATA: {}, window: {},
    localStorage: { getItem: () => null, setItem: () => {} },
    document: { querySelector: () => ({}) }
  });
  const load = file => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  load('harmony-data.js');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8')
    .split("document.addEventListener('click'")[0] +
    '\nglobalThis.fixture = { musicXmlSegmentsForMeasure, musicXmlSegmentNote };' +
    '\nglobalThis.davidBassEvents = HARMONY_DATA["268d"].parts.find(part => part.name === "bass").events;';
  vm.runInContext(app, context);
  const parts = context.fixture;
  const source = { events: [[3, 2, 60, 'fa']] };
  const first = parts.musicXmlSegmentsForMeasure(source, 0, 4, 5).find(segment => segment.midi !== null);
  const second = parts.musicXmlSegmentsForMeasure(source, 1, 4, 5).find(segment => segment.midi !== null);
  expect(first.tieStart).toBe(true);
  expect(first.tieStop).toBe(false);
  expect(second.tieStart).toBe(false);
  expect(second.tieStop).toBe(true);
  expect(parts.musicXmlSegmentNote(first)).toContain('<tie type="start"/>');
  expect(parts.musicXmlSegmentNote(second)).toContain('<tie type="stop"/>');
  const rest = parts.musicXmlSegmentsForMeasure({ events: [[3, 2, null, 'rest']] }, 0, 4, 5).find(segment => segment.midi === null && segment.duration === 1);
  expect(parts.musicXmlSegmentNote(rest)).not.toContain('<tie');
  const davidEvent = context.davidBassEvents.find(([beat, duration, midi]) => beat === 3.5 && duration === 1.5 && midi === 57);
  const davidFirst = parts.musicXmlSegmentsForMeasure({ events: [davidEvent] }, 1, 2, 5).find(segment => segment.midi !== null);
  const davidLast = parts.musicXmlSegmentsForMeasure({ events: [davidEvent] }, 2, 2, 5).find(segment => segment.midi !== null);
  expect(davidFirst.tieStart).toBe(true);
  expect(davidFirst.tieStop).toBe(false);
  expect(davidLast.tieStart).toBe(false);
  expect(davidLast.tieStop).toBe(true);
});
