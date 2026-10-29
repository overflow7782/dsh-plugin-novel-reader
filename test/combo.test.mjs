import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comboOf, isUsableCombo, DEFAULT_SETTINGS } from '../src/client/settings.js';

const key = (code, mods = {}) => ({ code, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...mods });

test('comboOf builds a layout-independent combo string', () => {
  assert.equal(comboOf(key('F1', { shiftKey: true })), 'Shift+F1');
  assert.equal(comboOf(key('KeyB', { ctrlKey: true, altKey: true })), 'Ctrl+Alt+B');
  assert.equal(comboOf(key('Digit3', { metaKey: true, shiftKey: true })), 'Shift+Meta+3');
  assert.equal(comboOf(key('ShiftLeft', { shiftKey: true })), '');
});

test('isUsableCombo needs a modifier or a function key', () => {
  assert.ok(isUsableCombo('Shift+F1'));
  assert.ok(isUsableCombo('F9'));
  assert.ok(!isUsableCombo('A'));
  assert.ok(!isUsableCombo(''));
});

test('default boss key is Shift+F1', () => {
  assert.equal(DEFAULT_SETTINGS.bossKey, 'Shift+F1');
});
