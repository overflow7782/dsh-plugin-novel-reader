import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOCK_RANK_AUTO, DOCK_RANK_MAX, MIN_PEEK_HEIGHT, MIN_PEEK_WIDTH, RESIZE_GRIPS, applyGrip, clampDockRank, dockRankFor, moveTo, placePeek } from '../src/core/peek-geom.js';

// 图标贴在视口底部状态栏里：宽 24、top 700，视口 1200×800。
const ANCHOR = { left: 500, width: 24, top: 700 };
const VIEWPORT = { width: 1200, height: 800 };
const size = (patch) => ({ width: 420, height: 168, bottom: 8, ...patch });

test('placePeek centres the window on the icon and lifts it by the gap', () => {
  assert.deepEqual(placePeek(ANCHOR, size(), VIEWPORT), { left: 500 + 12 - 210, width: 420, height: 168, bottom: 800 - 700 + 8 });
});

test('placePeek treats bottom as distance from the icon, so a bigger gap lifts the window', () => {
  const low = placePeek(ANCHOR, size({ bottom: 8 }), VIEWPORT);
  const high = placePeek(ANCHOR, size({ bottom: 108 }), VIEWPORT);
  assert.equal(high.bottom - low.bottom, 100);
  // 底边抬高 100px，窗口本身高度不变（视口上方还有空间）。
  assert.equal(high.height, low.height);
});

test('placePeek shrinks the height instead of overflowing the top of the viewport', () => {
  const viewport = { width: 1200, height: 300 };
  const anchor = { left: 500, width: 24, top: 200 };
  const box = placePeek(anchor, size({ height: 400 }), viewport);
  assert.equal(box.bottom, 300 - 200 + 8);
  // 只剩 300 - 108 - 8 = 184px 可用，超出部分被压掉。
  assert.equal(box.height, 184);
  assert.ok(box.bottom + box.height <= viewport.height - 8);
});

test('placePeek never leaves the viewport horizontally', () => {
  const right = placePeek({ left: 1190, width: 24, top: 700 }, size(), VIEWPORT);
  assert.equal(right.left, VIEWPORT.width - right.width - 8);
  const left = placePeek({ left: 0, width: 24, top: 700 }, size(), VIEWPORT);
  assert.equal(left.left, 8);
  const narrow = placePeek(ANCHOR, size({ width: 2000 }), VIEWPORT);
  assert.equal(narrow.width, VIEWPORT.width - 16);
});

test('placePeek honours the minimum size', () => {
  const tiny = placePeek(ANCHOR, size({ width: 10, height: 10 }), VIEWPORT);
  assert.equal(tiny.width, MIN_PEEK_WIDTH);
  assert.equal(tiny.height, MIN_PEEK_HEIGHT);
});

test('side grips move the edge under the pointer because the window is centred', () => {
  const right = RESIZE_GRIPS.find((g) => g.edge === 'right');
  const left = RESIZE_GRIPS.find((g) => g.edge === 'left');
  const from = { width: 420, height: 168, bottom: 8 };
  assert.equal(applyGrip(right, from, 30, 0).width, 480);
  assert.equal(applyGrip(left, from, -30, 0).width, 480);
  assert.equal(applyGrip(right, from, 30, 0).bottom, 8);
});

test('vertical grips: top moves the top edge, bottom moves the bottom edge', () => {
  const top = RESIZE_GRIPS.find((g) => g.edge === 'top');
  const bottom = RESIZE_GRIPS.find((g) => g.edge === 'bottom');
  const from = { width: 420, height: 168, bottom: 8 };
  // 往上拖 40px 顶边抬高，底边间距不动。
  assert.deepEqual(applyGrip(top, from, 0, -40), { width: 420, height: 208, bottom: 8 });
  // 往下拖 20px 底边下移：高度变高、间距变小。
  assert.deepEqual(applyGrip(bottom, from, 0, 20), { width: 420, height: 188, bottom: -12 });
});

test('corner grips change both axes at once', () => {
  const corner = RESIZE_GRIPS.find((g) => g.edge === 'bottom-left');
  assert.deepEqual(applyGrip(corner, { width: 420, height: 168, bottom: 8 }, 10, 10), { width: 400, height: 178, bottom: -2 });
});

test('every grip has a w/h/b multiplier and a unique edge name', () => {
  const edges = new Set();
  for (const grip of RESIZE_GRIPS) {
    assert.equal(edges.has(grip.edge), false, `duplicate edge ${grip.edge}`);
    edges.add(grip.edge);
    assert.equal([grip.w, grip.h, grip.b].some((n) => n !== 0), true, `${grip.edge} does nothing`);
  }
  assert.equal(edges.size, 8);
});

test('dockRankFor counts the cells whose centre sits left of the pointer', () => {
  const cells = [
    { left: 0, width: 24 },
    { left: 40, width: 60 },
  ];
  assert.equal(dockRankFor(-10, cells), 0);
  assert.equal(dockRankFor(5, cells), 0, 'still left of the first centre');
  assert.equal(dockRankFor(20, cells), 1, 'past the first centre');
  assert.equal(dockRankFor(500, cells), 2, 'past every cell drops at the end');
  assert.equal(dockRankFor(0, []), 0);
});

test('moveTo drops the item in the wanted slot and clamps both ends', () => {
  const cells = ['a', 'b', 'c'];
  assert.deepEqual(moveTo(cells, 'a', 2), ['b', 'c', 'a']);
  assert.deepEqual(moveTo(cells, 'c', 0), ['c', 'a', 'b']);
  assert.deepEqual(moveTo(cells, 'a', 99), ['b', 'c', 'a']);
  assert.deepEqual(moveTo(cells, 'c', -5), ['c', 'a', 'b']);
  assert.deepEqual(moveTo(cells, 'b', 1), ['a', 'b', 'c']);
  assert.deepEqual(cells, ['a', 'b', 'c'], 'the input array is left alone');
});

test('clampDockRank rounds and stays inside the shared range', () => {
  assert.equal(clampDockRank(2.4), 2);
  assert.equal(clampDockRank(DOCK_RANK_MAX + 5000), DOCK_RANK_MAX);
  assert.equal(clampDockRank(-5000), DOCK_RANK_AUTO);
});
