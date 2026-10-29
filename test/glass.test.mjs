import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampSurfaceColor, glassAlphaOf } from '../src/core/glass.js';

// 期望值取自 dsh-plugin-wallpaper-engine 1.4.0 打包里的 weClampSurfaceColor 实算结果。
const WE_REFERENCE = [
  ['#ffffff', 'light', 1, '#ffffff'],
  ['#ffffff', 'dark', 1, '#1c1c1c'],
  ['#0d1524', 'light', 1, '#e8e9ea'],
  ['#67dce7', 'dark', 1, '#0e1f20'],
  ['#dd8fac', 'light', 0.75, '#f0cfdb'],
  ['#f1717f', 'dark', 0.5, '#90434c'],
  ['#f3b75f', 'light', 0, '#f3b75f'],
];

test('clampSurfaceColor matches wallpaper-engine', () => {
  for (const [hex, theme, fidelity, expected] of WE_REFERENCE) assert.equal(clampSurfaceColor(hex, theme, fidelity), expected, `${hex} ${theme} ${fidelity}`);
});

test('clampSurfaceColor falls back per theme on invalid input', () => {
  assert.equal(clampSurfaceColor('', 'light'), '#ffffff');
  assert.equal(clampSurfaceColor('nope', 'dark'), '#0d1524');
});

test('glassAlphaOf follows the transparency curve', () => {
  assert.equal(glassAlphaOf(0), 0.25);
  assert.equal(glassAlphaOf(20), 0.22);
  assert.equal(glassAlphaOf(100), 0.1);
});
