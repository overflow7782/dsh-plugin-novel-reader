// 状态栏 dock 的排位。`.dock` 是 flex 容器，位置由每个 flex 项自己的 CSS `order` 决定；
// 槽位锚点（`[data-slot="conversation.composer.dock"]`）是 `display:contents`，它的子元素
// 直接参与 dock 布局，所以真正的「格子」= 锚点展开后 dock 的全部 flex 项。
// 换位时按当前真实位置（getBoundingClientRect）排序，写内联 order，再用 FLIP 补过渡。
/* global requestAnimationFrame, document */
import { moveTo } from '../core/peek-geom.js';

const DOCK_SELECTOR = '[data-composer-dock]';
const DOCK_SLOT = 'conversation.composer.dock';
const FLIP_MS = 160;

/** 图标所在的 dock 容器。 */
export function dockOf(el) {
  if (el === null || el === undefined) return null;
  return el.closest(DOCK_SELECTOR);
}

function laysOutChildren(node) {
  if (node.getAttribute('data-slot') === DOCK_SLOT) return true;
  return node.hasAttribute('data-slot') && (node.getAttribute('style') ?? '').includes('contents');
}

/** dock 里真正的 flex 项：`display:contents` 的槽位锚点展开成它的子元素。 */
export function itemsOf(dock) {
  if (dock === null) return [];
  const items = [];
  for (const node of Array.from(dock.children)) {
    if (laysOutChildren(node)) items.push(...Array.from(node.children));
    else items.push(node);
  }
  seenCount = items.length;
  return items;
}

/** el 落在哪一个格子里。 */
export function itemOf(el, items) {
  if (el === null || el === undefined) return null;
  for (const item of items) if (item === el || item.contains(el)) return item;
  return null;
}

/** 各格当前的真实先后（按左边缘排，零宽的先按 DOM 序靠前）。 */
function visualOrder(items) {
  return items
    .map((node, i) => {
      const box = node.getBoundingClientRect();
      return { node, at: box.width > 0 ? box.left : Number.MAX_SAFE_INTEGER - 1e6 + i };
    })
    .sort((a, b) => a.at - b.at)
    .map((entry) => entry.node);
}

// 我们改过谁的内联 order、改之前是什么值 —— 点回「自动」时原样还回去，
// 不覆盖别的插件自己写的 order。
const savedOrder = new WeakMap();
let seenCount = 0;

/** 当前 dock 里有几格：设置面板按它给「第 N 位」选项。dock 没挂载时用上次探到的值。 */
export const dockItemCount = () => {
  const dock = document.querySelector(DOCK_SELECTOR);
  if (dock !== null) seenCount = itemsOf(dock).length;
  return seenCount;
};

/** 撤掉我们写过的 order，把别人的原值还回去。 */
export function clearCellOrder(items) {
  for (const node of items) {
    if (!savedOrder.has(node)) continue;
    node.style.order = savedOrder.get(node);
    savedOrder.delete(node);
  }
}

function flip(node, dx) {
  node.style.transition = 'none';
  node.style.transform = `translateX(${dx}px)`;
  requestAnimationFrame(() => {
    node.style.transition = `transform ${FLIP_MS}ms ease`;
    node.style.transform = '';
    window.setTimeout(() => {
      if (node.style.transform === '') node.style.transition = '';
    }, FLIP_MS + 60);
  });
}

function writeOrder(node, want) {
  if (node.style.order === want) return;
  if (!savedOrder.has(node)) savedOrder.set(node, node.style.order);
  node.style.order = want;
}

/**
 * 把 cell 挪到第 rank 格。只写三个值：我们前面的一组 -1、自己 0、后面的一组 1 ——
 * 这样别人的相对次序原样不动（同组靠 DOM 序），新插件插进来也只会贴着我们，不会乱窜。
 * animate 为真时做一次 FLIP。返回实际落点（越界会被夹住），找不到格子时返回 -1。
 */
export function placeCell(items, cell, rank, animate) {
  if (cell === null || !items.includes(cell)) return -1;
  seenCount = items.length;
  const seq = moveTo(visualOrder(items), cell, rank);
  const at = seq.indexOf(cell);
  const before = animate ? new Map(seq.map((node) => [node, node.getBoundingClientRect().left])) : null;
  seq.forEach((node, i) => writeOrder(node, i < at ? '-1' : i === at ? '0' : '1'));
  if (before !== null) {
    for (const node of seq) {
      const dx = before.get(node) - node.getBoundingClientRect().left;
      if (Math.abs(dx) >= 0.5) flip(node, dx);
    }
  }
  return at;
}
