// 速览窗几何：贴着状态栏图标上方摆放，以及拖拽改尺寸。纯函数，node --test 直接可测。

export const MIN_PEEK_WIDTH = 240;
export const MIN_PEEK_HEIGHT = 80;

/** 状态栏图标能落到的最后一位（0 = 最左）。只用来给设置值兜底，实际落点由拖动决定。 */
export const DOCK_RANK_MAX = 24;
/** 设置项取这个值表示「不插手」：保持插件注册顺序，也就是排在最后。 */
export const DOCK_RANK_AUTO = -1;

/**
 * 速览窗的缩放把手：四边 + 四角。
 * w / h 是指针位移（dx / dy）到宽高的乘数，b 是纵向位移到「底边间距」的乘数。
 * 窗口水平居中，所以左右两侧按两倍位移算，边缘才会跟着指针走。
 */
export const RESIZE_GRIPS = [
  { edge: 'top', w: 0, h: -1, b: 0 },
  { edge: 'bottom', w: 0, h: 1, b: -1 },
  { edge: 'left', w: -2, h: 0, b: 0 },
  { edge: 'right', w: 2, h: 0, b: 0 },
  { edge: 'top-left', w: -2, h: -1, b: 0 },
  { edge: 'top-right', w: 2, h: -1, b: 0 },
  { edge: 'bottom-left', w: -2, h: 1, b: -1 },
  { edge: 'bottom-right', w: 2, h: 1, b: -1 },
];

/**
 * 把「想要的尺寸」换算成实际渲染用的框。
 * @param {object} anchor 图标的 getBoundingClientRect()（只用 left / width / top）
 * @param {{width:number, height:number, bottom:number}} size bottom = 浮窗底边距图标上方的像素
 * @param {{width:number, height:number}} viewport 视口尺寸
 * @returns {{left:number, width:number, height:number, bottom:number}} bottom 是距视口底边的距离
 */
export function placePeek(anchor, size, viewport) {
  const width = Math.max(MIN_PEEK_WIDTH, Math.min(size.width, viewport.width - 16));
  const left = Math.min(Math.max(8, anchor.left + anchor.width / 2 - width / 2), Math.max(8, viewport.width - width - 8));
  const bottom = Math.max(0, Math.round(viewport.height - anchor.top + size.bottom));
  const height = Math.max(MIN_PEEK_HEIGHT, Math.min(size.height, viewport.height - bottom - 8));
  return { left, width, height, bottom };
}

/** 拖动把手时的目标尺寸。dx / dy 是指针位移，from 是按下时的 {width, height, bottom}。 */
export function applyGrip(grip, from, dx, dy) {
  return {
    width: Math.round(from.width + dx * grip.w),
    height: Math.round(from.height + dy * grip.h),
    bottom: Math.round(from.bottom + dy * grip.b),
  };
}

/** 拖到某个横坐标时，图标该插到第几格：数一数有多少格的中线在指针左边。cells 不含自己。 */
export function dockRankFor(pointerX, cells) {
  let rank = 0;
  for (const cell of cells) if (pointerX > cell.left + cell.width / 2) rank += 1;
  return rank;
}

/** 把 items 里的 item 挪到第 rank 格，返回新数组；rank 越界就夹到两端。 */
export function moveTo(items, item, rank) {
  const rest = items.filter((other) => other !== item);
  const at = Math.max(0, Math.min(rank, rest.length));
  return [...rest.slice(0, at), item, ...rest.slice(at)];
}

/** 设置项里的取值：取整并夹在 [DOCK_RANK_AUTO, DOCK_RANK_MAX] 内。 */
export function clampDockRank(rank) {
  return Math.min(DOCK_RANK_MAX, Math.max(DOCK_RANK_AUTO, Math.round(rank)));
}
