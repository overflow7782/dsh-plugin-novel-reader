import test from 'node:test';
import assert from 'node:assert/strict';
import { fracAt, scrollTopFor, PARA_PAD } from '../src/core/scroll-frac.js';

test('段首的滚动位置折算成 0', () => {
  assert.equal(fracAt(100, 50, 100 - PARA_PAD), 0);
});

test('段中间折算成比例', () => {
  assert.equal(fracAt(100, 50, 119), 0.5);
  assert.equal(fracAt(100, 40, 114), 0.5);
});

test('超出段落范围会被夹住', () => {
  assert.equal(fracAt(100, 50, 500), 1);
  assert.equal(fracAt(100, 50, 0), 0);
  assert.equal(fracAt(100, 50, 100), 0.12);
});

test('段落高度为 0 或非法值时不炸', () => {
  assert.equal(fracAt(100, 0, 120), 0);
  assert.equal(fracAt(100, -3, 120), 0);
  assert.equal(fracAt(100, 50, Number.NaN), 0);
});

test('比例换回 scrollTop', () => {
  assert.equal(scrollTopFor(100, 50, 0), 100 - PARA_PAD);
  assert.equal(scrollTopFor(100, 50, 0.5), 119);
  assert.equal(scrollTopFor(100, 50, 1), 144);
});

test('接近容器顶部时不会给出负数', () => {
  assert.equal(scrollTopFor(2, 50, 0), 0);
  assert.equal(scrollTopFor(0, 50, 0.05), 0);
});

test('比例越界与缺省都按 0..1 处理', () => {
  assert.equal(scrollTopFor(100, 50, 2), 144);
  assert.equal(scrollTopFor(100, 50, undefined), 100 - PARA_PAD);
  assert.equal(scrollTopFor(100, 0, 1), 100 - PARA_PAD);
});

test('在段落范围内来回换算能还原原位置', () => {
  const top = 320;
  const height = 180;
  for (const scrollTop of [314, 320, 380, 460, 494]) {
    const back = scrollTopFor(top, height, fracAt(top, height, scrollTop));
    assert.ok(Math.abs(back - scrollTop) < 1e-9, `${scrollTop} -> ${back}`);
  }
});
