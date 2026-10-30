// 段落内的相对位置：把滚动位置折算成段落高度的 0..1 比例。
// 只存段落下标的话，同段内滚动的位置会丢——关掉再打开就跳回段首；
// 存比例而不是像素，是为了换字号 / 换窗口宽度后仍能落回原来那句话附近。

/** 定位段落时在段首上方预留的像素，避免文字贴着容器顶边。 */
export const PARA_PAD = 6;

/** 滚动位置在段落内所占的比例，夹在 0..1。 */
export function fracAt(top, height, scrollTop, pad = PARA_PAD) {
  if (!(height > 0)) return 0;
  const frac = (scrollTop + pad - top) / height;
  if (!Number.isFinite(frac)) return 0;
  if (frac < 0) return 0;
  if (frac > 1) return 1;
  return frac;
}

/** 段落顶部 + 段内比例 → 该设成多少 scrollTop。 */
export function scrollTopFor(top, height, frac, pad = PARA_PAD) {
  const ratio = frac > 0 ? (frac > 1 ? 1 : frac) : 0;
  const value = top - pad + ratio * (height > 0 ? height : 0);
  return value < 0 ? 0 : value;
}
